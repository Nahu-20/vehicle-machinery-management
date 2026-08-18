import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import {
  CANONICAL_ZONE_IDS,
  isCanonicalZoneId,
  CanonicalZoneId,
} from '../features/investment-map/constants/canonicalZones';
import { StaffRole, Permission } from '../types/auth';
import {
  InfrastructureCategory,
  FacilityOperationalStatus,
  FacilityOwnership,
  InfrastructureUnit,
  FacilityCapacity,
  LocationPrecision,
  InvestmentFacility,
  normalizeInfrastructureCategory,
} from '../types/investment';
import {
  userTokenDeleteDoc,
  userTokenGetDoc,
  userTokenSetDoc,
} from './firestoreUserTokenTransport';

/** Client → server action aliases (legacy UI names). */
const ACTION_ALIASES: Record<string, string> = {
  save_dataset_draft: 'save_dataset',
  update_dataset_values: 'set_dataset_values',
  submit_dataset_review: 'submit_dataset_for_review',
  return_dataset_draft: 'return_dataset_to_draft',
  verify_dataset: 'mark_dataset_verified',
  reject_dataset: 'mark_dataset_rejected',
  return_facility_draft: 'return_facility_to_draft',
  delete_source: 'delete_entity',
  delete_methodology: 'delete_entity',
  delete_opportunity: 'delete_entity',
  delete_facility: 'delete_entity',
  delete_infrastructure: 'delete_entity',
};

type RequestStoreContext = {
  idToken: string | null;
  allowMemory: boolean;
};

let requestStore: RequestStoreContext = { idToken: null, allowMemory: false };
let investmentApiTestMode = false;

export function enableInvestmentApiTestMode(enabled = true) {
  investmentApiTestMode = enabled;
}

function isTestAuthEnabled() {
  return investmentApiTestMode || process.env.INVESTMENT_ALLOW_TEST_AUTH === 'true';
}

class FirestoreUnavailableError extends Error {
  code = 'FIRESTORE_UNAVAILABLE';
  constructor(message: string) {
    super(message);
    this.name = 'FirestoreUnavailableError';
  }
}

/** Verify Firebase ID token via Identity Toolkit when Admin Auth/ADC is unavailable. */
async function verifyIdTokenFlexible(idToken: string): Promise<string | null> {
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return decoded.uid;
  } catch (adminErr) {
    const apiKey = process.env.VITE_FIREBASE_API_KEY;
    if (!apiKey) {
      console.warn('[InvestmentApi] Admin token verify failed and VITE_FIREBASE_API_KEY is unset:', adminErr);
      return null;
    }
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }
      );
      if (!res.ok) {
        console.warn('[InvestmentApi] Identity Toolkit token lookup failed:', res.status);
        return null;
      }
      const data = (await res.json()) as { users?: Array<{ localId?: string }> };
      return data.users?.[0]?.localId || null;
    } catch (lookupErr) {
      console.warn('[InvestmentApi] Token lookup error:', lookupErr);
      return null;
    }
  }
}

const ROLE_PERMISSIONS_MAP: Record<StaffRole, Permission[]> = {
  superAdmin: [
    'dashboard.view', 'content.view', 'content.create', 'content.edit', 'content.publish',
    'alerts.manage', 'market.manage', 'resources.manage', 'staff.manage', 'settings.manage',
    'audit.view', 'audit.export', 'media.view', 'media.upload', 'media.delete', 'media.manage',
    'achievement.view', 'achievement.create', 'achievement.edit', 'achievement.review', 'achievement.publish', 'achievement.trash', 'achievement.restore', 'achievement.delete',
    'alert.view', 'alert.create', 'alert.edit', 'alert.review', 'alert.publish', 'alert.trash', 'alert.restore', 'alert.delete',
    'investment.view', 'investment.edit', 'investment.publish', 'investment.verify', 'investment.sources.manage', 'investment.datasets.manage', 'investment.opportunities.manage', 'investment.config.manage',
    'gis.manage',
  ],
  contentAdmin: [
    'dashboard.view', 'content.view', 'content.create', 'content.edit', 'content.publish',
    'resources.manage', 'audit.view', 'media.view', 'media.upload', 'media.delete', 'media.manage',
    'achievement.view', 'achievement.create', 'achievement.edit', 'achievement.review', 'achievement.publish', 'achievement.trash', 'achievement.restore',
    'alert.view', 'alert.create', 'alert.edit', 'alert.review', 'alert.publish', 'alert.trash', 'alert.restore',
    'investment.view', 'investment.edit', 'investment.publish', 'investment.verify', 'investment.sources.manage', 'investment.datasets.manage', 'investment.opportunities.manage', 'investment.config.manage',
  ],
  editor: [
    'dashboard.view', 'content.view', 'content.create', 'content.edit', 'media.view', 'media.upload',
    'achievement.view', 'achievement.create', 'achievement.edit', 'achievement.review',
    'alert.view', 'alert.create', 'alert.edit', 'alert.review',
    'investment.view', 'investment.edit', 'investment.sources.manage', 'investment.datasets.manage', 'investment.opportunities.manage',
  ],
  marketOfficer: [
    'dashboard.view', 'market.manage', 'investment.view', 'investment.datasets.manage', 'investment.sources.manage',
  ],
  advisoryOfficer: [
    'dashboard.view', 'alerts.manage', 'alert.view', 'alert.create', 'alert.edit', 'alert.review', 'investment.view',
  ],
  fleetOfficer: [
    'dashboard.view',
    'fleet.view',
    'fleet.asset.manage',
    'fleet.assign',
    'fleet.maintenance.manage',
    'fleet.reports.view',
  ],
};

function checkStaffPermission(staffData: any, requiredPermission: Permission): boolean {
  if (!staffData || staffData.active !== true) return false;
  const role = staffData.role as StaffRole;
  const permissions = ROLE_PERMISSIONS_MAP[role] || [];
  return permissions.includes(requiredPermission);
}

// In-Memory Storage Adapter — test / explicit fallback only
const memDb = new Map<string, Map<string, any>>();

export function resetInvestmentDbForTesting() {
  memDb.clear();
  investmentApiTestMode = true;
}

function getMemCol(collection: string) {
  if (!memDb.has(collection)) {
    memDb.set(collection, new Map<string, any>());
  }
  return memDb.get(collection)!;
}

function isCredentialError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || '');
  return /Could not load the default credentials|Unable to detect a Project Id|UNAUTHENTICATED|invalid_grant|permission-denied|PERMISSION_DENIED/i.test(
    msg
  );
}

function adminDocRef(collection: string, docId: string) {
  const path = `${collection}/${docId}`.replace(/\/{2,}/g, '/');
  return getFirestore().doc(path);
}

async function safeGetDoc(collection: string, docId: string): Promise<{ exists: boolean; data: () => any }> {
  try {
    const snap = await adminDocRef(collection, docId).get();
    if (snap.exists) {
      return { exists: true, data: () => snap.data() };
    }
    if (requestStore.allowMemory) {
      const mem = getMemCol(collection).get(docId);
      if (mem !== undefined) {
        return { exists: true, data: () => JSON.parse(JSON.stringify(mem)) };
      }
    }
    return { exists: false, data: () => null };
  } catch (err) {
    if (requestStore.idToken) {
      try {
        return await userTokenGetDoc(collection, docId, requestStore.idToken);
      } catch (tokenErr) {
        console.warn('[InvestmentApi] User-token get failed:', tokenErr);
      }
    }
    if (requestStore.allowMemory) {
      const mem = getMemCol(collection).get(docId);
      return {
        exists: mem !== undefined,
        data: () => (mem ? JSON.parse(JSON.stringify(mem)) : null),
      };
    }
    throw new FirestoreUnavailableError(
      `Firestore read unavailable for ${collection}/${docId}. Configure Admin SDK credentials or ensure the caller ID token can read this document.`
    );
  }
}

async function safeSetDoc(collection: string, docId: string, data: any): Promise<void> {
  if (requestStore.allowMemory) {
    getMemCol(collection).set(docId, JSON.parse(JSON.stringify(data)));
  }

  try {
    await adminDocRef(collection, docId).set(data);
    return;
  } catch (err) {
    if (requestStore.idToken) {
      try {
        await userTokenSetDoc(collection, docId, data, requestStore.idToken);
        return;
      } catch (tokenErr) {
        console.warn('[InvestmentApi] User-token set failed:', tokenErr);
        if (!requestStore.allowMemory) {
          throw new FirestoreUnavailableError(
            `Firestore write failed via Admin SDK and user token for ${collection}/${docId}. ${(tokenErr as Error)?.message || err}`
          );
        }
        return;
      }
    }
    if (requestStore.allowMemory) {
      return;
    }
    throw new FirestoreUnavailableError(
      `Firestore write unavailable for ${collection}/${docId}. Configure Google Application Default Credentials, or sign in so mutations can use your ID token. ${isCredentialError(err) ? '(ADC missing)' : ''}`
    );
  }
}

async function safeDeleteDoc(collection: string, docId: string): Promise<void> {
  if (requestStore.allowMemory) {
    getMemCol(collection).delete(docId);
  }

  try {
    await adminDocRef(collection, docId).delete();
    return;
  } catch (err) {
    if (requestStore.idToken) {
      try {
        await userTokenDeleteDoc(collection, docId, requestStore.idToken);
        return;
      } catch (tokenErr) {
        if (!requestStore.allowMemory) {
          throw new FirestoreUnavailableError(
            `Firestore delete failed for ${collection}/${docId}. ${(tokenErr as Error)?.message || err}`
          );
        }
        return;
      }
    }
    if (requestStore.allowMemory) {
      return;
    }
    throw new FirestoreUnavailableError(
      `Firestore delete unavailable for ${collection}/${docId}. Configure Admin SDK credentials or use a signed-in staff token.`
    );
  }
}

function normalizeMutationBody(raw: any): {
  action: string;
  actorUid?: string;
  expectedVersion?: number;
  payload?: any;
  idToken?: string;
} {
  const envelope = raw?.data && typeof raw.data === 'object' ? { ...raw, ...raw.data } : raw || {};
  let action = typeof envelope.action === 'string' ? envelope.action : '';
  if (ACTION_ALIASES[action]) {
    action = ACTION_ALIASES[action];
  }

  let payload = envelope.payload;
  // Map legacy delete_* actions onto delete_entity payload shape
  if (envelope.action === 'delete_source' && payload?.sourceId) {
    payload = { entityType: 'source', entityId: payload.sourceId };
  } else if (envelope.action === 'delete_methodology' && payload?.methodologyId) {
    payload = { entityType: 'methodology', entityId: payload.methodologyId };
  } else if (envelope.action === 'delete_opportunity' && payload?.opportunityId) {
    payload = { entityType: 'opportunity', entityId: payload.opportunityId };
  } else if (
    (envelope.action === 'delete_facility' || envelope.action === 'delete_infrastructure') &&
    (payload?.facilityId || payload?.recordId || payload?.entityId)
  ) {
    payload = {
      entityType: 'facility',
      entityId: payload.facilityId || payload.recordId || payload.entityId,
    };
  }

  return {
    action,
    actorUid: envelope.actorUid,
    expectedVersion: envelope.expectedVersion,
    payload,
    idToken: envelope.idToken,
  };
}

export async function handleInvestmentMutation(req: Request, res: Response) {
  try {
    const normalized = normalizeMutationBody(req.body);
    const { action, actorUid: bodyActorUid, expectedVersion, payload } = normalized;
    if (!action || typeof action !== 'string') {
      return res.status(400).json({ success: false, code: 'INVALID_ACTION', error: 'Missing or invalid mutation action' });
    }

    // 1. Authenticate caller
    let actorUid: string | null = null;
    const authHeader = req.headers?.authorization;
    const customTokenHeader = req.headers?.['x-firebase-id-token'] as string | undefined;
    const idToken = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.split('Bearer ')[1]
      : (customTokenHeader || normalized.idToken || null);

    if (idToken) {
      actorUid = await verifyIdTokenFlexible(idToken);
    }

    // Body actorUid is only accepted for explicit test harnesses (test_* UIDs).
    if (
      !actorUid &&
      bodyActorUid &&
      typeof bodyActorUid === 'string' &&
      bodyActorUid.startsWith('test_') &&
      isTestAuthEnabled()
    ) {
      actorUid = bodyActorUid;
    }

    requestStore = {
      idToken: idToken && actorUid ? idToken : null,
      allowMemory: isTestAuthEnabled(),
    };

    if (!actorUid) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHENTICATED',
        error: 'Authentication required. Sign in and retry; bare actorUid spoofing is not allowed.',
      });
    }

    const testStaffDocs: Record<string, any> = {
      test_super_01: { uid: 'test_super_01', email: 'superadmin@oromiaagri.gov.et', role: 'superAdmin', active: true },
      test_admin_01: { uid: 'test_admin_01', email: 'contentadmin@oromiaagri.gov.et', role: 'contentAdmin', active: true },
      test_editor_01: { uid: 'test_editor_01', email: 'editor@oromiaagri.gov.et', role: 'editor', active: true },
      test_market_01: { uid: 'test_market_01', email: 'market@oromiaagri.gov.et', role: 'marketOfficer', active: true },
      test_advisory_01: { uid: 'test_advisory_01', email: 'advisory@oromiaagri.gov.et', role: 'advisoryOfficer', active: true },
      test_inactive_01: { uid: 'test_inactive_01', email: 'inactive@oromiaagri.gov.et', role: 'editor', active: false },
    };

    if (actorUid.startsWith('test_') && testStaffDocs[actorUid] && isTestAuthEnabled()) {
      await safeSetDoc('staffUsers', actorUid, testStaffDocs[actorUid]);
    }

    const staffSnap = await safeGetDoc('staffUsers', actorUid);
    if (!staffSnap.exists) {
      return res.status(403).json({ success: false, code: 'STAFF_NOT_FOUND', error: 'Staff user profile not found' });
    }

    const staffData = staffSnap.data() || {};
    if (staffData.active !== true) {
      return res.status(403).json({ success: false, code: 'STAFF_INACTIVE', error: 'Staff account is inactive' });
    }

    const nowIso = new Date().toISOString();

    // Helper: write authoritative audit log
    const writeAuditLog = async (
      entityType: string,
      entityId: string,
      auditAction: string,
      summary: string,
      previousVer?: number,
      newVer?: number
    ) => {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await safeSetDoc('investmentAuditLogs', logId, {
        id: logId,
        actorUid,
        actorRole: staffData.role || 'editor',
        actorEmail: staffData.email || 'staff@oromiaagri.gov.et',
        entityType,
        entityId,
        action: auditAction,
        previousVersion: previousVer,
        newVersion: newVer,
        summary,
        timestamp: nowIso,
      });
    };

    // Dispatch Actions
    switch (action) {
      case 'save_zone_profile': {
        if (!checkStaffPermission(staffData, 'investment.edit')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment.edit permission' });
        }

        const { zoneId, overview, featuredCommodities, infrastructureSummary, opportunitySummary, responsibleOffice, verificationStatus } = payload || {};
        if (!isCanonicalZoneId(zoneId)) {
          return res.status(400).json({ success: false, code: 'INVALID_ZONE_ID', error: `Invalid canonical zoneId: "${zoneId}"` });
        }

        const docSnap = await safeGetDoc('investmentZoneProfiles', zoneId);
        const existing = docSnap.exists ? docSnap.data() : null;

        if (existing) {
          if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
            return res.status(409).json({
              success: false,
              code: 'VERSION_CONFLICT',
              error: `Version conflict: Expected version ${expectedVersion}, but current database version is ${existing.version}.`,
            });
          }

          const newVersion = (existing.version || 0) + 1;
          const updatedDoc = {
            ...existing,
            overview: overview || existing.overview,
            featuredCommodities: featuredCommodities || existing.featuredCommodities,
            infrastructureSummary: infrastructureSummary !== undefined ? infrastructureSummary : existing.infrastructureSummary,
            opportunitySummary: opportunitySummary !== undefined ? opportunitySummary : existing.opportunitySummary,
            responsibleOffice: responsibleOffice || existing.responsibleOffice,
            verificationStatus: verificationStatus || existing.verificationStatus,
            version: newVersion,
            updatedAt: nowIso,
            updatedBy: actorUid,
          };

          await safeSetDoc('investmentZoneProfiles', zoneId, updatedDoc);
          await writeAuditLog('zoneProfile', zoneId, 'update', `Updated zone profile for ${zoneId} (v${newVersion})`, existing.version, newVersion);
          return res.json({ success: true, data: updatedDoc });
        } else {
          const newDoc = {
            zoneId,
            overview: overview || { en: '' },
            featuredCommodities: featuredCommodities || [],
            infrastructureSummary,
            opportunitySummary,
            responsibleOffice: responsibleOffice || 'Oromia Agriculture Bureau',
            verificationStatus: verificationStatus || 'unverified',
            status: 'draft',
            version: 1,
            createdAt: nowIso,
            createdBy: actorUid,
            updatedAt: nowIso,
            updatedBy: actorUid,
          };

          await safeSetDoc('investmentZoneProfiles', zoneId, newDoc);
          await writeAuditLog('zoneProfile', zoneId, 'create', `Created zone profile draft for ${zoneId}`, 0, 1);
          return res.json({ success: true, data: newDoc });
        }
      }

      case 'publish_zone_profile': {
        if (!checkStaffPermission(staffData, 'investment.publish')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment.publish permission' });
        }

        const { zoneId } = payload || {};
        if (!isCanonicalZoneId(zoneId)) {
          return res.status(400).json({ success: false, code: 'INVALID_ZONE_ID', error: `Invalid canonical zoneId: "${zoneId}"` });
        }

        const docSnap = await safeGetDoc('investmentZoneProfiles', zoneId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Zone profile for "${zoneId}" not found` });
        }

        const existing = docSnap.data() || {};
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({
            success: false,
            code: 'VERSION_CONFLICT',
            error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}`,
          });
        }

        const newVersion = (existing.version || 0) + 1;
        const publishedDoc = {
          ...existing,
          status: 'published',
          verificationStatus: 'verified',
          version: newVersion,
          publishedAt: nowIso,
          publishedBy: actorUid,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentZoneProfiles', zoneId, publishedDoc);
        await writeAuditLog('zoneProfile', zoneId, 'publish', `Published zone profile for ${zoneId} (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: publishedDoc });
      }

      case 'save_dataset': {
        if (!checkStaffPermission(staffData, 'investment.datasets.manage') && !checkStaffPermission(staffData, 'investment.edit')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment.datasets.manage or investment.edit permission' });
        }

        const ds = payload || {};
        if (!ds.datasetId || typeof ds.datasetId !== 'string') {
          return res.status(400).json({ success: false, code: 'INVALID_DATASET_ID', error: 'Missing or invalid datasetId' });
        }

        const docSnap = await safeGetDoc('investmentDatasets', ds.datasetId);
        const existing = docSnap.exists ? docSnap.data() : null;

        if (existing) {
          if (existing.lifecycleStatus === 'review' || existing.lifecycleStatus === 'published' || existing.lifecycleStatus === 'archived') {
            return res.status(400).json({
              success: false,
              code: 'DATASET_LIFECYCLE_LOCKED',
              error: `Dataset "${ds.datasetId}" is ${existing.lifecycleStatus} and locked from direct metadata editing. Return to draft before modifying dataset.`,
            });
          }

          if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
            return res.status(409).json({
              success: false,
              code: 'VERSION_CONFLICT',
              error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}`,
            });
          }

          const newVersion = (existing.version || 0) + 1;
          const updatedDs = {
            ...existing,
            ...ds,
            verificationStatus: 'pending', // Content changes invalidate stale verification
            version: newVersion,
            updatedAt: nowIso,
            updatedBy: actorUid,
          };

          await safeSetDoc('investmentDatasets', ds.datasetId, updatedDs);
          await writeAuditLog('dataset', ds.datasetId, 'update', `Updated dataset ${ds.datasetId} (v${newVersion})`, existing.version, newVersion);
          return res.json({ success: true, data: updatedDs });
        } else {
          const newDs = {
            ...ds,
            sourceIds: Array.isArray(ds.sourceIds) ? ds.sourceIds : [],
            methodologyId: ds.methodologyId || null,
            verificationStatus: ds.verificationStatus || 'unverified',
            lifecycleStatus: ds.lifecycleStatus || 'draft',
            version: 1,
            createdAt: nowIso,
            createdBy: actorUid,
            updatedAt: nowIso,
            updatedBy: actorUid,
          };

          await safeSetDoc('investmentDatasets', ds.datasetId, newDs);
          await writeAuditLog('dataset', ds.datasetId, 'create', `Created dataset ${ds.datasetId}`, 0, 1);
          return res.json({ success: true, data: newDs });
        }
      }

      case 'mark_dataset_verified': {
        if (!checkStaffPermission(staffData, 'investment.verify')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment.verify permission' });
        }

        const { datasetId } = payload || {};
        if (!datasetId) {
          return res.status(400).json({ success: false, code: 'INVALID_DATASET_ID', error: 'Missing datasetId' });
        }

        const docSnap = await safeGetDoc('investmentDatasets', datasetId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Dataset "${datasetId}" not found` });
        }

        const existing = docSnap.data() || {};
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({
            success: false,
            code: 'VERSION_CONFLICT',
            error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}`,
          });
        }

        if (existing.lifecycleStatus !== 'review') {
          return res.status(400).json({
            success: false,
            code: 'INVALID_LIFECYCLE_TRANSITION',
            error: `Verification may only occur when dataset is in review state (current state: ${existing.lifecycleStatus}).`,
          });
        }

        if (!existing.sourceIds || !Array.isArray(existing.sourceIds) || existing.sourceIds.length === 0) {
          return res.status(400).json({
            success: false,
            code: 'MISSING_SOURCE',
            error: 'Dataset cannot be verified without at least one valid sourceId.',
          });
        }

        for (const sId of existing.sourceIds) {
          const sSnap = await safeGetDoc('investmentSources', sId);
          if (!sSnap.exists) {
            return res.status(400).json({
              success: false,
              code: 'INVALID_SOURCE',
              error: `Attached source "${sId}" does not exist.`,
            });
          }
          const sData = sSnap.data() || {};
          if (sData.verificationStatus !== 'verified') {
            return res.status(400).json({
              success: false,
              code: 'UNVERIFIED_SOURCE',
              error: `Attached source "${sId}" must be verified before dataset verification.`,
            });
          }
        }

        if (existing.metric === 'suitability' || existing.metric === 'investment_potential') {
          if (!existing.methodologyId || typeof existing.methodologyId !== 'string' || !existing.methodologyId.trim()) {
            return res.status(400).json({
              success: false,
              code: 'MISSING_METHODOLOGY',
              error: `Datasets with metric "${existing.metric}" require a valid methodologyId before verification.`,
            });
          }

          const methSnap = await safeGetDoc('investmentMethodologies', existing.methodologyId);
          if (!methSnap.exists) {
            return res.status(400).json({
              success: false,
              code: 'INVALID_METHODOLOGY',
              error: `Referenced methodology "${existing.methodologyId}" does not exist.`,
            });
          }

          const methData = methSnap.data() || {};
          if (methData.verificationStatus !== 'verified') {
            return res.status(400).json({
              success: false,
              code: 'UNVERIFIED_METHODOLOGY',
              error: `Associated methodology "${existing.methodologyId}" must be verified before dataset verification.`,
            });
          }
        }

        const newVersion = (existing.version || 0) + 1;
        const verifiedDs = {
          ...existing,
          verificationStatus: 'verified',
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentDatasets', datasetId, verifiedDs);
        await writeAuditLog('dataset', datasetId, 'verify', `Verified dataset ${datasetId} (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: verifiedDs });
      }

      case 'mark_dataset_rejected': {
        if (!checkStaffPermission(staffData, 'investment.verify')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment.verify permission' });
        }

        const { datasetId, notes } = payload || {};
        if (!datasetId) {
          return res.status(400).json({ success: false, code: 'INVALID_DATASET_ID', error: 'Missing datasetId' });
        }

        const docSnap = await safeGetDoc('investmentDatasets', datasetId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Dataset "${datasetId}" not found` });
        }

        const existing = docSnap.data() || {};
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({
            success: false,
            code: 'VERSION_CONFLICT',
            error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}`,
          });
        }

        if (existing.lifecycleStatus !== 'review') {
          return res.status(400).json({
            success: false,
            code: 'INVALID_LIFECYCLE_TRANSITION',
            error: `Rejection may only occur when dataset is in review state (current state: ${existing.lifecycleStatus}).`,
          });
        }

        const newVersion = (existing.version || 0) + 1;
        const rejectedDs = {
          ...existing,
          verificationStatus: 'rejected',
          notes: notes ? String(notes).slice(0, 1000) : existing.notes,
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentDatasets', datasetId, rejectedDs);
        await writeAuditLog('dataset', datasetId, 'reject', `Rejected dataset ${datasetId}${notes ? ': ' + notes : ''} (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: rejectedDs });
      }

      case 'attach_source': {
        if (!checkStaffPermission(staffData, 'investment.datasets.manage') && !checkStaffPermission(staffData, 'investment.edit')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires dataset management permission' });
        }

        const { datasetId, sourceId } = payload || {};
        if (!datasetId || !sourceId) {
          return res.status(400).json({ success: false, code: 'INVALID_PAYLOAD', error: 'Missing datasetId or sourceId' });
        }

        const docSnap = await safeGetDoc('investmentDatasets', datasetId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Dataset "${datasetId}" not found` });
        }

        const existing = docSnap.data() || {};
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', error: `Version conflict: Expected ${expectedVersion}, got ${existing.version}` });
        }

        if (existing.lifecycleStatus === 'review' || existing.lifecycleStatus === 'published' || existing.lifecycleStatus === 'archived') {
          return res.status(400).json({
            success: false,
            code: 'DATASET_LIFECYCLE_LOCKED',
            error: `Cannot modify sources for dataset "${datasetId}" in state "${existing.lifecycleStatus}".`,
          });
        }

        const sSnap = await safeGetDoc('investmentSources', sourceId);
        if (!sSnap.exists) {
          return res.status(400).json({
            success: false,
            code: 'INVALID_SOURCE_ID',
            error: `Source "${sourceId}" does not exist in investmentSources collection.`,
          });
        }

        const currentSources: string[] = Array.isArray(existing.sourceIds) ? existing.sourceIds : [];
        if (currentSources.includes(sourceId)) {
          return res.json({ success: true, data: existing });
        }

        const newVersion = (existing.version || 0) + 1;
        const updatedDs = {
          ...existing,
          sourceIds: [...currentSources, sourceId],
          verificationStatus: 'pending',
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentDatasets', datasetId, updatedDs);
        await writeAuditLog('dataset', datasetId, 'update', `Attached source ${sourceId} to dataset ${datasetId} (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: updatedDs });
      }

      case 'remove_source': {
        if (!checkStaffPermission(staffData, 'investment.datasets.manage') && !checkStaffPermission(staffData, 'investment.edit')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires dataset management permission' });
        }

        const { datasetId, sourceId } = payload || {};
        if (!datasetId || !sourceId) {
          return res.status(400).json({ success: false, code: 'INVALID_PAYLOAD', error: 'Missing datasetId or sourceId' });
        }

        const docSnap = await safeGetDoc('investmentDatasets', datasetId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Dataset "${datasetId}" not found` });
        }

        const existing = docSnap.data() || {};
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', error: `Version conflict: Expected ${expectedVersion}, got ${existing.version}` });
        }

        if (existing.lifecycleStatus === 'review' || existing.lifecycleStatus === 'published' || existing.lifecycleStatus === 'archived') {
          return res.status(400).json({
            success: false,
            code: 'DATASET_LIFECYCLE_LOCKED',
            error: `Cannot modify sources for dataset "${datasetId}" in state "${existing.lifecycleStatus}".`,
          });
        }

        const currentSources: string[] = Array.isArray(existing.sourceIds) ? existing.sourceIds : [];
        const newSources = currentSources.filter((id) => id !== sourceId);

        const newVersion = (existing.version || 0) + 1;
        const updatedDs = {
          ...existing,
          sourceIds: newSources,
          verificationStatus: 'pending',
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentDatasets', datasetId, updatedDs);
        await writeAuditLog('dataset', datasetId, 'update', `Removed source ${sourceId} from dataset ${datasetId} (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: updatedDs });
      }

      case 'attach_methodology': {
        if (!checkStaffPermission(staffData, 'investment.datasets.manage') && !checkStaffPermission(staffData, 'investment.edit')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires dataset management permission' });
        }

        const { datasetId, methodologyId } = payload || {};
        if (!datasetId || !methodologyId) {
          return res.status(400).json({ success: false, code: 'INVALID_PAYLOAD', error: 'Missing datasetId or methodologyId' });
        }

        const docSnap = await safeGetDoc('investmentDatasets', datasetId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Dataset "${datasetId}" not found` });
        }

        const existing = docSnap.data() || {};
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', error: `Version conflict: Expected ${expectedVersion}, got ${existing.version}` });
        }

        if (existing.lifecycleStatus === 'review' || existing.lifecycleStatus === 'published' || existing.lifecycleStatus === 'archived') {
          return res.status(400).json({
            success: false,
            code: 'DATASET_LIFECYCLE_LOCKED',
            error: `Cannot modify methodology for dataset "${datasetId}" in state "${existing.lifecycleStatus}".`,
          });
        }

        const mSnap = await safeGetDoc('investmentMethodologies', methodologyId);
        if (!mSnap.exists) {
          return res.status(400).json({
            success: false,
            code: 'INVALID_METHODOLOGY_ID',
            error: `Methodology "${methodologyId}" does not exist in investmentMethodologies collection.`,
          });
        }

        const newVersion = (existing.version || 0) + 1;
        const updatedDs = {
          ...existing,
          methodologyId,
          verificationStatus: 'pending',
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentDatasets', datasetId, updatedDs);
        await writeAuditLog('dataset', datasetId, 'update', `Attached methodology ${methodologyId} to dataset ${datasetId} (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: updatedDs });
      }

      case 'remove_methodology': {
        if (!checkStaffPermission(staffData, 'investment.datasets.manage') && !checkStaffPermission(staffData, 'investment.edit')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires dataset management permission' });
        }

        const { datasetId } = payload || {};
        if (!datasetId) {
          return res.status(400).json({ success: false, code: 'INVALID_PAYLOAD', error: 'Missing datasetId' });
        }

        const docSnap = await safeGetDoc('investmentDatasets', datasetId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Dataset "${datasetId}" not found` });
        }

        const existing = docSnap.data() || {};
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', error: `Version conflict: Expected ${expectedVersion}, got ${existing.version}` });
        }

        if (existing.lifecycleStatus === 'review' || existing.lifecycleStatus === 'published' || existing.lifecycleStatus === 'archived') {
          return res.status(400).json({
            success: false,
            code: 'DATASET_LIFECYCLE_LOCKED',
            error: `Cannot modify methodology for dataset "${datasetId}" in state "${existing.lifecycleStatus}".`,
          });
        }

        const newVersion = (existing.version || 0) + 1;
        const updatedDs = {
          ...existing,
          methodologyId: null,
          verificationStatus: 'pending',
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentDatasets', datasetId, updatedDs);
        await writeAuditLog('dataset', datasetId, 'update', `Removed methodology from dataset ${datasetId} (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: updatedDs });
      }

      case 'publish_dataset': {
        if (!checkStaffPermission(staffData, 'investment.publish')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment.publish permission' });
        }

        const { datasetId } = payload || {};
        if (!datasetId) {
          return res.status(400).json({ success: false, code: 'INVALID_DATASET_ID', error: 'Missing datasetId' });
        }

        const docSnap = await safeGetDoc('investmentDatasets', datasetId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Dataset "${datasetId}" not found` });
        }

        const existing = docSnap.data() || {};
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({
            success: false,
            code: 'VERSION_CONFLICT',
            error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}`,
          });
        }

        // Hard gate: Dataset must be in 'review' state
        if (existing.lifecycleStatus !== 'review') {
          return res.status(400).json({
            success: false,
            code: 'INVALID_LIFECYCLE_TRANSITION',
            error: `Dataset "${datasetId}" must be in "review" status before publication (current status: ${existing.lifecycleStatus}).`,
          });
        }

        // Hard gate: Dataset must be verified
        if (existing.verificationStatus !== 'verified') {
          return res.status(400).json({
            success: false,
            code: 'UNVERIFIED_DATASET',
            error: `Dataset "${datasetId}" must have verificationStatus === "verified" before publication (current status: ${existing.verificationStatus}).`,
          });
        }

        // Validate source requirement & verified sources
        if (!existing.sourceIds || !Array.isArray(existing.sourceIds) || existing.sourceIds.length === 0) {
          return res.status(400).json({
            success: false,
            code: 'MISSING_SOURCE',
            error: 'Dataset cannot be published without at least one valid sourceId.',
          });
        }

        for (const sId of existing.sourceIds) {
          const sSnap = await safeGetDoc('investmentSources', sId);
          if (!sSnap.exists) {
            return res.status(400).json({
              success: false,
              code: 'INVALID_SOURCE',
              error: `Attached source "${sId}" does not exist.`,
            });
          }
          const sData = sSnap.data() || {};
          if (sData.verificationStatus !== 'verified') {
            return res.status(400).json({
              success: false,
              code: 'UNVERIFIED_SOURCE',
              error: `Attached source "${sId}" must be verified before dataset publication.`,
            });
          }
        }

        // Validate methodology requirement for suitability / investment_potential
        if (existing.metric === 'suitability' || existing.metric === 'investment_potential') {
          if (!existing.methodologyId || typeof existing.methodologyId !== 'string' || existing.methodologyId.trim() === '') {
            return res.status(400).json({
              success: false,
              code: 'MISSING_METHODOLOGY',
              error: `Datasets with metric "${existing.metric}" require a valid methodologyId before publication.`,
            });
          }

          const methSnap = await safeGetDoc('investmentMethodologies', existing.methodologyId);
          if (!methSnap.exists) {
            return res.status(400).json({
              success: false,
              code: 'INVALID_METHODOLOGY',
              error: `Referenced methodology "${existing.methodologyId}" does not exist.`,
            });
          }

          const methData = methSnap.data() || {};
          if (methData.verificationStatus !== 'verified') {
            return res.status(400).json({
              success: false,
              code: 'UNVERIFIED_METHODOLOGY',
              error: `Associated methodology "${existing.methodologyId}" must be verified before dataset publication.`,
            });
          }
        }

        const newVersion = (existing.version || 0) + 1;
        const publishedDs = {
          ...existing,
          lifecycleStatus: 'published',
          verificationStatus: 'verified',
          version: newVersion,
          publishedAt: nowIso,
          publishedBy: actorUid,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentDatasets', datasetId, publishedDs);
        await writeAuditLog('dataset', datasetId, 'dataset_published', `Published dataset ${datasetId} (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: publishedDs });
      }

      case 'submit_dataset_for_review': {
        if (!checkStaffPermission(staffData, 'investment.datasets.manage') && !checkStaffPermission(staffData, 'investment.edit')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires dataset editing permission' });
        }

        const { datasetId } = payload || {};
        if (!datasetId) {
          return res.status(400).json({ success: false, code: 'INVALID_DATASET_ID', error: 'Missing datasetId' });
        }

        const docSnap = await safeGetDoc('investmentDatasets', datasetId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Dataset "${datasetId}" not found` });
        }

        const existing = docSnap.data() || {};
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({
            success: false,
            code: 'VERSION_CONFLICT',
            error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}`,
          });
        }

        if (existing.lifecycleStatus === 'published' || existing.lifecycleStatus === 'archived') {
          return res.status(400).json({
            success: false,
            code: 'DATASET_LIFECYCLE_LOCKED',
            error: `Cannot submit dataset "${datasetId}" for review because it is ${existing.lifecycleStatus}.`,
          });
        }

        // Readiness checks before entering review
        if (!existing.sourceIds || !Array.isArray(existing.sourceIds) || existing.sourceIds.length === 0) {
          return res.status(400).json({
            success: false,
            code: 'MISSING_SOURCE',
            error: 'At least one source must be attached before submitting dataset for review.',
          });
        }

        if (existing.metric === 'suitability' || existing.metric === 'investment_potential') {
          if (!existing.methodologyId || typeof existing.methodologyId !== 'string' || !existing.methodologyId.trim()) {
            return res.status(400).json({
              success: false,
              code: 'MISSING_METHODOLOGY',
              error: `Datasets with metric "${existing.metric}" require an attached methodology before review submission.`,
            });
          }
        }

        const newVersion = (existing.version || 0) + 1;
        const reviewDs = {
          ...existing,
          lifecycleStatus: 'review',
          verificationStatus: 'pending',
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentDatasets', datasetId, reviewDs);
        await writeAuditLog('dataset', datasetId, 'dataset_submitted_for_review', `Submitted dataset ${datasetId} for review (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: reviewDs });
      }

      case 'return_dataset_to_draft': {
        if (!checkStaffPermission(staffData, 'investment.datasets.manage') && !checkStaffPermission(staffData, 'investment.edit')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires dataset editing permission' });
        }

        const { datasetId } = payload || {};
        if (!datasetId) {
          return res.status(400).json({ success: false, code: 'INVALID_DATASET_ID', error: 'Missing datasetId' });
        }

        const docSnap = await safeGetDoc('investmentDatasets', datasetId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Dataset "${datasetId}" not found` });
        }

        const existing = docSnap.data() || {};
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({
            success: false,
            code: 'VERSION_CONFLICT',
            error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}`,
          });
        }

        if (existing.lifecycleStatus !== 'review') {
          return res.status(400).json({
            success: false,
            code: 'INVALID_LIFECYCLE_TRANSITION',
            error: `Dataset "${datasetId}" is in state "${existing.lifecycleStatus}". Only datasets in "review" status can be returned to draft.`,
          });
        }

        const newVersion = (existing.version || 0) + 1;
        const draftDs = {
          ...existing,
          lifecycleStatus: 'draft',
          verificationStatus: 'pending',
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentDatasets', datasetId, draftDs);
        await writeAuditLog('dataset', datasetId, 'dataset_returned_to_draft', `Returned dataset ${datasetId} to draft (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: draftDs });
      }

      case 'unpublish_dataset': {
        if (!checkStaffPermission(staffData, 'investment.publish') && !checkStaffPermission(staffData, 'investment.datasets.manage')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires dataset management permission' });
        }

        const { datasetId } = payload || {};
        if (!datasetId) {
          return res.status(400).json({ success: false, code: 'INVALID_DATASET_ID', error: 'Missing datasetId' });
        }

        const docSnap = await safeGetDoc('investmentDatasets', datasetId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Dataset "${datasetId}" not found` });
        }

        const existing = docSnap.data() || {};
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({
            success: false,
            code: 'VERSION_CONFLICT',
            error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}`,
          });
        }

        const newVersion = (existing.version || 0) + 1;
        const unpublishedDs = {
          ...existing,
          lifecycleStatus: 'unpublished',
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentDatasets', datasetId, unpublishedDs);
        await writeAuditLog('dataset', datasetId, 'dataset_unpublished', `Unpublished dataset ${datasetId} (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: unpublishedDs });
      }

      case 'set_dataset_values': {
        if (!checkStaffPermission(staffData, 'investment.datasets.manage') && !checkStaffPermission(staffData, 'investment.edit')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires dataset editing permission' });
        }

        const { datasetId, metric, values } = payload || {};
        if (!datasetId || !Array.isArray(values)) {
          return res.status(400).json({ success: false, code: 'INVALID_PAYLOAD', error: 'Missing datasetId or values array' });
        }

        // 1. Fetch parent dataset & enforce lifecycle restrictions
        const dsSnap = await safeGetDoc('investmentDatasets', datasetId);
        if (!dsSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Dataset "${datasetId}" not found` });
        }

        const dsData = dsSnap.data() || {};
        const lifecycleStatus = dsData.lifecycleStatus || 'draft';

        // Hard gate: review, published, and archived datasets CANNOT be directly modified
        if (lifecycleStatus === 'review' || lifecycleStatus === 'published' || lifecycleStatus === 'archived') {
          return res.status(400).json({
            success: false,
            code: 'DATASET_LIFECYCLE_LOCKED',
            error: `Dataset "${datasetId}" is ${lifecycleStatus} and locked from direct value editing. Return to draft before modifying zone values.`,
          });
        }

        // 2. Optimistic Concurrency Control on parent dataset version
        const currentVersion = typeof dsData.version === 'number' ? dsData.version : 0;
        if (typeof expectedVersion === 'number' && currentVersion !== expectedVersion) {
          return res.status(409).json({
            success: false,
            code: 'VERSION_CONFLICT',
            error: `Version conflict: Expected dataset version ${expectedVersion}, but database is at version ${currentVersion}. Reload the latest values before saving.`,
          });
        }

        const newVersion = currentVersion + 1;
        const allowedQualityFlags = ['measured', 'estimated', 'projected', 'unverified'];
        const effectiveMetric = metric || dsData.metric || 'production';

        // 3. Strict Server-Side Validation for each zone value row
        for (const val of values) {
          if (!isCanonicalZoneId(val.zoneId)) {
            return res.status(400).json({ success: false, code: 'INVALID_ZONE_ID', error: `Invalid canonical zoneId: "${val.zoneId}"` });
          }

          if (val.qualityFlag && !allowedQualityFlags.includes(val.qualityFlag)) {
            return res.status(400).json({ success: false, code: 'INVALID_QUALITY_FLAG', error: `Invalid qualityFlag "${val.qualityFlag}". Allowed: ${allowedQualityFlags.join(', ')}` });
          }

          if (val.notes && typeof val.notes === 'string' && val.notes.length > 1000) {
            return res.status(400).json({ success: false, code: 'NOTES_TOO_LONG', error: `Notes for zone ${val.zoneId} exceed maximum length of 1000 characters.` });
          }

          const numFields = ['value', 'productionVolume', 'harvestedAreaHa', 'yieldValue', 'trendPercent'];
          for (const f of numFields) {
            const raw = val[f];
            if (raw !== null && raw !== undefined) {
              if (typeof raw !== 'number' || !Number.isFinite(raw)) {
                return res.status(400).json({ success: false, code: 'INVALID_NUMERIC', error: `Field "${f}" in zone ${val.zoneId} must be a finite number or null.` });
              }
            }
          }

          if (effectiveMetric === 'production') {
            if (val.productionVolume !== null && val.productionVolume !== undefined && val.productionVolume < 0) {
              return res.status(400).json({ success: false, code: 'VALUE_OUT_OF_RANGE', error: `productionVolume in zone ${val.zoneId} cannot be negative.` });
            }
            if (val.harvestedAreaHa !== null && val.harvestedAreaHa !== undefined && val.harvestedAreaHa < 0) {
              return res.status(400).json({ success: false, code: 'VALUE_OUT_OF_RANGE', error: `harvestedAreaHa in zone ${val.zoneId} cannot be negative.` });
            }
            if (val.yieldValue !== null && val.yieldValue !== undefined && val.yieldValue < 0) {
              return res.status(400).json({ success: false, code: 'VALUE_OUT_OF_RANGE', error: `yieldValue in zone ${val.zoneId} cannot be negative.` });
            }
            if (val.trendPercent !== null && val.trendPercent !== undefined && (val.trendPercent < -100 || val.trendPercent > 1000)) {
              return res.status(400).json({ success: false, code: 'VALUE_OUT_OF_RANGE', error: `trendPercent in zone ${val.zoneId} must be between -100% and +1000%.` });
            }
            if (val.productionVolume !== null && val.productionVolume !== undefined) {
              val.value = val.productionVolume;
            } else if (val.value !== null && val.value !== undefined) {
              val.productionVolume = val.value;
            }
          } else if (effectiveMetric === 'suitability' || effectiveMetric === 'investment_potential') {
            if (val.value !== null && val.value !== undefined && (val.value < 0 || val.value > 100)) {
              return res.status(400).json({ success: false, code: 'VALUE_OUT_OF_RANGE', error: `${effectiveMetric} score in zone ${val.zoneId} must be between 0 and 100 (got ${val.value}).` });
            }
          } else {
            if (val.value !== null && val.value !== undefined && val.value < 0) {
              return res.status(400).json({ success: false, code: 'VALUE_OUT_OF_RANGE', error: `Metric value in zone ${val.zoneId} cannot be negative.` });
            }
          }
        }

        // 4. Save parent dataset version, verification reset, and values
        const updatedDs = {
          ...dsData,
          verificationStatus: 'pending',
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentDatasets', datasetId, updatedDs);

        // Nested values writes may fail when Admin ADC is missing and REST path
        // encoding/rules fall through. Prefer completing the parent version bump;
        // the browser client persists values via the Firestore SDK under isEditor().
        let valuesPersisted = 0;
        let valuesWriteError: string | undefined;
        for (const val of values) {
          try {
            await safeSetDoc(`investmentDatasets/${datasetId}/values`, val.zoneId, {
              ...val,
              zoneId: val.zoneId,
              version: newVersion,
              updatedAt: nowIso,
              updatedBy: actorUid,
            });
            valuesPersisted += 1;
          } catch (err) {
            valuesWriteError = (err as Error)?.message || String(err);
            console.warn(
              '[InvestmentApi] Nested dataset values write failed; deferring to client SDK:',
              valuesWriteError
            );
            break;
          }
        }

        await writeAuditLog(
          'datasetValue',
          datasetId,
          'dataset_values_updated',
          `Updated ${values.length} zone values for dataset ${datasetId} (v${newVersion})`,
          currentVersion,
          newVersion
        );

        return res.json({
          success: true,
          count: valuesPersisted,
          newVersion,
          clientMustPersistValues: valuesPersisted < values.length,
          valuesWriteError,
        });
      }

      case 'save_source': {
        if (!checkStaffPermission(staffData, 'investment.sources.manage') && !checkStaffPermission(staffData, 'investment.edit')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment.sources.manage or investment.edit' });
        }

        const source = payload || {};
        if (!source.sourceId) {
          return res.status(400).json({ success: false, code: 'INVALID_SOURCE_ID', error: 'Missing sourceId' });
        }

        const docSnap = await safeGetDoc('investmentSources', source.sourceId);
        const existing = docSnap.exists ? docSnap.data() : null;

        if (existing && typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}` });
        }

        const newVersion = (existing?.version || 0) + 1;
        const updatedSource = {
          ...existing,
          ...source,
          // Default new sources to public-eligible provenance; edits preserve explicit status/verification
          status: source.status || existing?.status || 'published',
          verificationStatus: source.verificationStatus || existing?.verificationStatus || 'verified',
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
          createdAt: existing?.createdAt || nowIso,
          createdBy: existing?.createdBy || actorUid,
        };

        await safeSetDoc('investmentSources', source.sourceId, updatedSource);
        await writeAuditLog('source', source.sourceId, existing ? 'update' : 'create', `Saved source ${source.sourceId}`, existing?.version, newVersion);
        return res.json({ success: true, data: updatedSource });
      }

      case 'save_methodology': {
        if (!checkStaffPermission(staffData, 'investment.datasets.manage') && !checkStaffPermission(staffData, 'investment.edit')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires methodology management permission' });
        }

        const meth = payload || {};
        if (!meth.methodologyId) {
          return res.status(400).json({ success: false, code: 'INVALID_METHODOLOGY_ID', error: 'Missing methodologyId' });
        }

        const docSnap = await safeGetDoc('investmentMethodologies', meth.methodologyId);
        const existing = docSnap.exists ? docSnap.data() : null;

        if (existing && typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}` });
        }

        const newVersion = (existing?.version || 0) + 1;
        const updatedMeth = {
          ...existing,
          ...meth,
          components: Array.isArray(meth.components) ? meth.components : (existing?.components || []),
          sourceIds: Array.isArray(meth.sourceIds) ? meth.sourceIds : (existing?.sourceIds || []),
          status: meth.status || existing?.status || 'published',
          verificationStatus: meth.verificationStatus || existing?.verificationStatus || 'verified',
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
          createdAt: existing?.createdAt || nowIso,
          createdBy: existing?.createdBy || actorUid,
        };

        await safeSetDoc('investmentMethodologies', meth.methodologyId, updatedMeth);
        await writeAuditLog('methodology', meth.methodologyId, existing ? 'update' : 'create', `Saved methodology ${meth.methodologyId}`, existing?.version, newVersion);
        return res.json({ success: true, data: updatedMeth });
      }

      case 'save_opportunity': {
        if (!checkStaffPermission(staffData, 'investment.opportunities.manage') && !checkStaffPermission(staffData, 'investment.edit')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment.opportunities.manage or investment.edit' });
        }

        const opp = payload || {};
        if (!opp.opportunityId) {
          return res.status(400).json({ success: false, code: 'INVALID_OPPORTUNITY_ID', error: 'Missing opportunityId' });
        }
        if (!opp.title || typeof opp.title !== 'string') {
          return res.status(400).json({ success: false, code: 'INVALID_TITLE', error: 'Opportunity title is required' });
        }

        if (Array.isArray(opp.zoneIds)) {
          for (const z of opp.zoneIds) {
            if (!isCanonicalZoneId(z)) {
              return res.status(400).json({ success: false, code: 'INVALID_ZONE_ID', error: `Invalid canonical zoneId in opportunity: "${z}"` });
            }
          }
        }

        const docSnap = await safeGetDoc('investmentOpportunities', opp.opportunityId);
        const existing = docSnap.exists ? docSnap.data() : null;

        if (existing && typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}` });
        }

        const newVersion = (existing?.version || 0) + 1;
        const lifecycleStatus = opp.lifecycleStatus || existing?.lifecycleStatus || 'published';
        const verificationStatus = opp.verificationStatus || existing?.verificationStatus || 'verified';
        const updatedOpp = {
          ...existing,
          ...opp,
          slug: opp.slug || existing?.slug || String(opp.opportunityId),
          zoneIds: Array.isArray(opp.zoneIds) ? opp.zoneIds : existing?.zoneIds || [],
          commodityKeys: Array.isArray(opp.commodityKeys) ? opp.commodityKeys : existing?.commodityKeys || [],
          sourceIds: Array.isArray(opp.sourceIds) ? opp.sourceIds : existing?.sourceIds || [],
          opportunityType: opp.opportunityType || existing?.opportunityType || 'general',
          summary: opp.summary ?? existing?.summary ?? '',
          description: opp.description ?? existing?.description ?? '',
          responsibleOffice: opp.responsibleOffice || existing?.responsibleOffice || 'Oromia Bureau of Agriculture',
          lifecycleStatus,
          verificationStatus,
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
          createdAt: existing?.createdAt || nowIso,
          createdBy: existing?.createdBy || actorUid,
          publishedAt:
            lifecycleStatus === 'published'
              ? existing?.publishedAt || nowIso
              : existing?.publishedAt || null,
          publishedBy:
            lifecycleStatus === 'published'
              ? existing?.publishedBy || actorUid
              : existing?.publishedBy || null,
        };

        await safeSetDoc('investmentOpportunities', opp.opportunityId, updatedOpp);
        await writeAuditLog('opportunity', opp.opportunityId, existing ? 'update' : 'create', `Saved opportunity ${opp.opportunityId}`, existing?.version, newVersion);
        return res.json({ success: true, data: updatedOpp });
      }

      case 'save_map_config': {
        if (!checkStaffPermission(staffData, 'investment.config.manage') && staffData.role !== 'contentAdmin' && staffData.role !== 'superAdmin') {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment.config.manage permission' });
        }

        const cfg = payload || {};
        const forbiddenKeys = ['geometry', 'coordinates', 'geojson', 'polygon', 'rings'];
        for (const k of forbiddenKeys) {
          if (k in cfg) {
            return res.status(400).json({ success: false, code: 'GEOMETRY_FORBIDDEN', error: `Map config payload must not contain geometry key "${k}"` });
          }
        }

        const docSnap = await safeGetDoc('investmentMapConfig', 'default');
        const existing = docSnap.exists ? docSnap.data() : null;

        if (existing && typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}` });
        }

        const newVersion = (existing?.version || 0) + 1;
        const updatedConfig = {
          ...existing,
          ...cfg,
          id: 'default',
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentMapConfig', 'default', updatedConfig);
        await writeAuditLog('mapConfig', 'default', 'update', `Updated default map config (v${newVersion})`, existing?.version, newVersion);
        return res.json({ success: true, data: updatedConfig });
      }

      case 'save_facility':
      case 'save_infrastructure': {
        if (!checkStaffPermission(staffData, 'investment.edit')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment.edit permission' });
        }

        const facilityInput = payload || {};
        const facilityId = facilityInput.facilityId || facilityInput.recordId;
        if (!facilityId || typeof facilityId !== 'string' || facilityId.trim() === '') {
          return res.status(400).json({ success: false, code: 'INVALID_FACILITY_ID', error: 'Missing or invalid facilityId' });
        }

        if (!isCanonicalZoneId(facilityInput.zoneId)) {
          return res.status(400).json({ success: false, code: 'INVALID_ZONE_ID', error: `Invalid canonical zoneId: "${facilityInput.zoneId}"` });
        }

        // Validate Category
        const rawCategory = facilityInput.category;
        const validCategories: InfrastructureCategory[] = [
          'road', 'electricity', 'irrigation', 'warehouse', 'cold_storage', 'processing',
          'collection_center', 'market', 'livestock_market', 'laboratory', 'veterinary',
          'input_distribution', 'logistics', 'other'
        ];
        const normalizedCategory = normalizeInfrastructureCategory(rawCategory);
        if (!rawCategory || (!validCategories.includes(rawCategory) && rawCategory !== 'cold-storage')) {
          return res.status(400).json({ success: false, code: 'INVALID_INFRASTRUCTURE_CATEGORY', error: `Invalid infrastructure category: "${rawCategory}"` });
        }

        // Validate Coordinates if provided
        if (facilityInput.coordinates !== null && facilityInput.coordinates !== undefined) {
          const { lat, lng } = facilityInput.coordinates;
          if (
            typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90 ||
            typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180
          ) {
            return res.status(400).json({ success: false, code: 'INVALID_COORDINATES', error: 'Coordinates must have finite numbers with -90 <= lat <= 90 and -180 <= lng <= 180' });
          }
        }

        // Validate Location Precision
        const validPrecisions: LocationPrecision[] = ['exact', 'approximate', 'zone_centroid'];
        const locationPrecision: LocationPrecision = facilityInput.locationPrecision && validPrecisions.includes(facilityInput.locationPrecision)
          ? facilityInput.locationPrecision
          : 'exact';

        // Validate Operational Status
        const validOperationalStatuses: FacilityOperationalStatus[] = [
          'operational', 'under_construction', 'planned', 'temporarily_closed', 'inactive'
        ];
        const operationalStatus: FacilityOperationalStatus = validOperationalStatuses.includes(facilityInput.operationalStatus)
          ? facilityInput.operationalStatus
          : validOperationalStatuses.includes(facilityInput.status)
            ? facilityInput.status
            : 'operational';

        // Validate Ownership
        const validOwnerships: FacilityOwnership[] = [
          'government', 'cooperative', 'private' ,'ppp', 'ngo_development_partner', 'other'
        ];
        const ownership: FacilityOwnership | undefined = facilityInput.ownership && validOwnerships.includes(facilityInput.ownership)
          ? facilityInput.ownership
          : undefined;

        // Validate Capacities
        const validUnits: InfrastructureUnit[] = [
          'MT', 'tonnes', 'tonnes_per_day', 'm3', 'hectares', 'MW', 'kW', 'km', 'count', 'percent'
        ];
        const parsedCapacities: FacilityCapacity[] = [];
        if (facilityInput.capacities !== undefined && facilityInput.capacities !== null) {
          if (!Array.isArray(facilityInput.capacities)) {
            return res.status(400).json({ success: false, code: 'INVALID_CAPACITY', error: 'capacities must be an array' });
          }
          for (const cap of facilityInput.capacities) {
            if (!cap.metricKey || typeof cap.metricKey !== 'string' || cap.metricKey.trim() === '') {
              return res.status(400).json({ success: false, code: 'INVALID_CAPACITY', error: 'Capacity entry must have a non-empty metricKey' });
            }
            if (cap.numericValue !== null && cap.numericValue !== undefined) {
              if (typeof cap.numericValue !== 'number' || !Number.isFinite(cap.numericValue)) {
                return res.status(400).json({ success: false, code: 'INVALID_CAPACITY', error: `Capacity metric "${cap.metricKey}" numericValue must be a finite number or null` });
              }
              if (cap.numericValue < 0) {
                return res.status(400).json({ success: false, code: 'INVALID_CAPACITY', error: `Capacity metric "${cap.metricKey}" cannot have a negative numericValue` });
              }
            }
            if (cap.unit !== null && cap.unit !== undefined && !validUnits.includes(cap.unit)) {
              return res.status(400).json({ success: false, code: 'INVALID_CAPACITY', error: `Invalid capacity unit: "${cap.unit}"` });
            }
            parsedCapacities.push({
              metricKey: cap.metricKey.trim(),
              label: cap.label,
              numericValue: cap.numericValue !== undefined && cap.numericValue !== null ? cap.numericValue : null,
              unit: cap.unit || null,
              referencePeriod: cap.referencePeriod || null,
            });
          }
        }

        // Validate Sources if supplied
        const sourceIds: string[] = Array.isArray(facilityInput.sourceIds) ? facilityInput.sourceIds : [];

        // Title validation
        const title = typeof facilityInput.title === 'string'
          ? { en: facilityInput.title }
          : facilityInput.title || { en: '' };

        const docSnap = await safeGetDoc('investmentInfrastructure', facilityId);
        const existing = docSnap.exists ? docSnap.data() : null;

        if (existing) {
          if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
            return res.status(409).json({
              success: false,
              code: 'VERSION_CONFLICT',
              error: `Version conflict: Expected version ${expectedVersion}, but document is at version ${existing.version}`,
            });
          }

          // Locked States Check: Only draft and unpublished can be directly edited
          if (existing.lifecycleStatus === 'review' || existing.lifecycleStatus === 'published' || existing.lifecycleStatus === 'archived') {
            return res.status(400).json({
              success: false,
              code: 'FACILITY_LIFECYCLE_LOCKED',
              error: `Cannot edit facility "${facilityId}" in state "${existing.lifecycleStatus}". It must be returned to draft or unpublished first.`,
            });
          }

          const newVersion = (existing.version || 0) + 1;
          const updatedFacility: InvestmentFacility = {
            facilityId,
            zoneId: facilityInput.zoneId,
            category: normalizedCategory,
            title,
            description: facilityInput.description,
            locationDescription: facilityInput.locationDescription,
            coordinates: facilityInput.coordinates ? { lat: facilityInput.coordinates.lat, lng: facilityInput.coordinates.lng } : null,
            locationPrecision,
            operationalStatus,
            ownership,
            operatorName: facilityInput.operatorName,
            capacities: parsedCapacities,
            commodityKeys: Array.isArray(facilityInput.commodityKeys) ? facilityInput.commodityKeys : existing.commodityKeys || [],
            commissioningYear: facilityInput.commissioningYear ?? existing.commissioningYear ?? null,
            assessmentDate: facilityInput.assessmentDate ?? existing.assessmentDate ?? null,
            referencePeriod: facilityInput.referencePeriod ?? existing.referencePeriod ?? null,
            sourceIds,
            lifecycleStatus: existing.lifecycleStatus || 'draft',
            // HARD RULE: Content mutation in draft/unpublished always forces verificationStatus = 'pending'
            verificationStatus: 'pending',
            internalNotes: facilityInput.internalNotes !== undefined ? facilityInput.internalNotes : existing.internalNotes,
            rejectionReason: existing.rejectionReason,
            version: newVersion,
            createdAt: existing.createdAt || nowIso,
            createdBy: existing.createdBy || actorUid,
            updatedAt: nowIso,
            updatedBy: actorUid,
            submittedForReviewAt: existing.submittedForReviewAt,
            submittedForReviewBy: existing.submittedForReviewBy,
            verifiedAt: existing.verifiedAt,
            verifiedBy: existing.verifiedBy,
            publishedAt: existing.publishedAt,
            publishedBy: existing.publishedBy,
          };

          await safeSetDoc('investmentInfrastructure', facilityId, updatedFacility);
          await writeAuditLog('infrastructure', facilityId, 'infrastructure_updated', `Updated facility ${facilityId} (v${newVersion})`, existing.version, newVersion);
          return res.json({ success: true, data: updatedFacility });
        } else {
          // New Facility Creation: Always defaults to draft + pending + version 1
          const newFacility: InvestmentFacility = {
            facilityId,
            zoneId: facilityInput.zoneId,
            category: normalizedCategory,
            title,
            description: facilityInput.description,
            locationDescription: facilityInput.locationDescription,
            coordinates: facilityInput.coordinates ? { lat: facilityInput.coordinates.lat, lng: facilityInput.coordinates.lng } : null,
            locationPrecision,
            operationalStatus,
            ownership,
            operatorName: facilityInput.operatorName,
            capacities: parsedCapacities,
            commodityKeys: Array.isArray(facilityInput.commodityKeys) ? facilityInput.commodityKeys : [],
            commissioningYear: facilityInput.commissioningYear ?? null,
            assessmentDate: facilityInput.assessmentDate ?? null,
            referencePeriod: facilityInput.referencePeriod ?? null,
            sourceIds,
            lifecycleStatus: 'draft',
            verificationStatus: 'pending',
            internalNotes: facilityInput.internalNotes,
            version: 1,
            createdAt: nowIso,
            createdBy: actorUid,
            updatedAt: nowIso,
            updatedBy: actorUid,
          };

          await safeSetDoc('investmentInfrastructure', facilityId, newFacility);
          await writeAuditLog('infrastructure', facilityId, 'infrastructure_created', `Created facility draft ${facilityId}`, 0, 1);
          return res.json({ success: true, data: newFacility });
        }
      }

      case 'submit_facility_review': {
        if (!checkStaffPermission(staffData, 'investment.edit')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment.edit permission' });
        }

        const { facilityId } = payload || {};
        if (!facilityId) {
          return res.status(400).json({ success: false, code: 'INVALID_FACILITY_ID', error: 'Missing facilityId' });
        }

        const docSnap = await safeGetDoc('investmentInfrastructure', facilityId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Facility "${facilityId}" not found` });
        }

        const existing = docSnap.data() as InvestmentFacility;
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}` });
        }

        if (existing.lifecycleStatus !== 'draft' && existing.lifecycleStatus !== 'unpublished') {
          return res.status(400).json({
            success: false,
            code: 'INVALID_LIFECYCLE_TRANSITION',
            error: `Cannot submit facility "${facilityId}" for review from state "${existing.lifecycleStatus}". Must be "draft" or "unpublished".`,
          });
        }

        // Must have at least one source
        if (!existing.sourceIds || !Array.isArray(existing.sourceIds) || existing.sourceIds.length === 0) {
          return res.status(400).json({
            success: false,
            code: 'MISSING_SOURCE',
            error: 'Facility cannot be submitted for review without at least one valid sourceId.',
          });
        }

        // Validate all referenced sources exist
        for (const sId of existing.sourceIds) {
          const sSnap = await safeGetDoc('investmentSources', sId);
          if (!sSnap.exists) {
            return res.status(400).json({
              success: false,
              code: 'SOURCE_NOT_FOUND',
              error: `Referenced source "${sId}" does not exist in investmentSources.`,
            });
          }
        }

        // Minimum multilingual title check: Afaan Oromoo or English must exist
        if (!existing.title || (!existing.title.en && !existing.title.om && !existing.title.am)) {
          return res.status(400).json({
            success: false,
            code: 'INVALID_TITLE',
            error: 'Facility must have a valid title before submitting for review.',
          });
        }

        const newVersion = (existing.version || 0) + 1;
        const updatedFacility = {
          ...existing,
          lifecycleStatus: 'review',
          verificationStatus: 'pending',
          submittedForReviewAt: nowIso,
          submittedForReviewBy: actorUid,
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentInfrastructure', facilityId, updatedFacility);
        await writeAuditLog('infrastructure', facilityId, 'infrastructure_submitted_for_review', `Submitted facility ${facilityId} for review (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: updatedFacility });
      }

      case 'return_facility_to_draft': {
        if (!checkStaffPermission(staffData, 'investment.edit') && !checkStaffPermission(staffData, 'investment.verify')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment.edit or investment.verify permission' });
        }

        const { facilityId } = payload || {};
        if (!facilityId) {
          return res.status(400).json({ success: false, code: 'INVALID_FACILITY_ID', error: 'Missing facilityId' });
        }

        const docSnap = await safeGetDoc('investmentInfrastructure', facilityId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Facility "${facilityId}" not found` });
        }

        const existing = docSnap.data() as InvestmentFacility;
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}` });
        }

        if (existing.lifecycleStatus !== 'review') {
          return res.status(400).json({
            success: false,
            code: 'INVALID_LIFECYCLE_TRANSITION',
            error: `Cannot return facility "${facilityId}" to draft from state "${existing.lifecycleStatus}". Must be in "review".`,
          });
        }

        const newVersion = (existing.version || 0) + 1;
        const updatedFacility = {
          ...existing,
          lifecycleStatus: 'draft',
          verificationStatus: 'pending',
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentInfrastructure', facilityId, updatedFacility);
        await writeAuditLog('infrastructure', facilityId, 'infrastructure_returned_to_draft', `Returned facility ${facilityId} to draft for editing (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: updatedFacility });
      }

      case 'verify_facility': {
        if (!checkStaffPermission(staffData, 'investment.verify')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment.verify permission' });
        }

        const { facilityId } = payload || {};
        if (!facilityId) {
          return res.status(400).json({ success: false, code: 'INVALID_FACILITY_ID', error: 'Missing facilityId' });
        }

        const docSnap = await safeGetDoc('investmentInfrastructure', facilityId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Facility "${facilityId}" not found` });
        }

        const existing = docSnap.data() as InvestmentFacility;
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}` });
        }

        if (existing.lifecycleStatus !== 'review') {
          return res.status(400).json({
            success: false,
            code: 'INVALID_LIFECYCLE_TRANSITION',
            error: `Facility "${facilityId}" must be in "review" status before verification (current: ${existing.lifecycleStatus}).`,
          });
        }

        // Verify source dependencies
        if (!existing.sourceIds || !Array.isArray(existing.sourceIds) || existing.sourceIds.length === 0) {
          return res.status(400).json({
            success: false,
            code: 'MISSING_SOURCE',
            error: 'Facility cannot be verified without at least one valid sourceId.',
          });
        }

        for (const sId of existing.sourceIds) {
          const sSnap = await safeGetDoc('investmentSources', sId);
          if (!sSnap.exists) {
            return res.status(400).json({
              success: false,
              code: 'SOURCE_NOT_FOUND',
              error: `Attached source "${sId}" does not exist.`,
            });
          }
          const sData = sSnap.data() || {};
          if (sData.verificationStatus !== 'verified') {
            return res.status(400).json({
              success: false,
              code: 'SOURCE_NOT_VERIFIED',
              error: `Attached source "${sId}" must be verified before facility verification.`,
            });
          }
        }

        const newVersion = (existing.version || 0) + 1;
        const updatedFacility = {
          ...existing,
          lifecycleStatus: 'review', // Verification does NOT publish automatically
          verificationStatus: 'verified',
          verifiedAt: nowIso,
          verifiedBy: actorUid,
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentInfrastructure', facilityId, updatedFacility);
        await writeAuditLog('infrastructure', facilityId, 'infrastructure_verified', `Verified facility ${facilityId} (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: updatedFacility });
      }

      case 'reject_facility': {
        if (!checkStaffPermission(staffData, 'investment.verify')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment.verify permission' });
        }

        const { facilityId, reason } = payload || {};
        if (!facilityId) {
          return res.status(400).json({ success: false, code: 'INVALID_FACILITY_ID', error: 'Missing facilityId' });
        }

        if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
          return res.status(400).json({ success: false, code: 'INVALID_REJECTION_REASON', error: 'A meaningful rejection reason (at least 5 characters) is required.' });
        }

        const docSnap = await safeGetDoc('investmentInfrastructure', facilityId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Facility "${facilityId}" not found` });
        }

        const existing = docSnap.data() as InvestmentFacility;
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}` });
        }

        if (existing.lifecycleStatus !== 'review') {
          return res.status(400).json({
            success: false,
            code: 'INVALID_LIFECYCLE_TRANSITION',
            error: `Facility "${facilityId}" must be in "review" status before rejection (current: ${existing.lifecycleStatus}).`,
          });
        }

        const newVersion = (existing.version || 0) + 1;
        const updatedFacility = {
          ...existing,
          lifecycleStatus: 'review',
          verificationStatus: 'rejected',
          rejectionReason: reason.trim(),
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentInfrastructure', facilityId, updatedFacility);
        await writeAuditLog('infrastructure', facilityId, 'infrastructure_rejected', `Rejected facility ${facilityId}: ${reason.trim()} (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: updatedFacility });
      }

      case 'publish_facility': {
        if (!checkStaffPermission(staffData, 'investment.publish')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment.publish permission' });
        }

        const { facilityId } = payload || {};
        if (!facilityId) {
          return res.status(400).json({ success: false, code: 'INVALID_FACILITY_ID', error: 'Missing facilityId' });
        }

        const docSnap = await safeGetDoc('investmentInfrastructure', facilityId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Facility "${facilityId}" not found` });
        }

        const existing = docSnap.data() as InvestmentFacility;
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({
            success: false,
            code: 'VERSION_CONFLICT',
            error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}`,
          });
        }

        // Hard gate: Facility must be in 'review' state
        if (existing.lifecycleStatus !== 'review') {
          return res.status(400).json({
            success: false,
            code: 'INVALID_LIFECYCLE_TRANSITION',
            error: `Facility "${facilityId}" must be in "review" status before publication (current: ${existing.lifecycleStatus}).`,
          });
        }

        // Hard gate: Facility must be verified
        if (existing.verificationStatus !== 'verified') {
          return res.status(400).json({
            success: false,
            code: 'UNVERIFIED_FACILITY',
            error: `Facility "${facilityId}" must have verificationStatus === "verified" before publication (current: ${existing.verificationStatus}).`,
          });
        }

        // Recheck all sources server-side
        if (!existing.sourceIds || !Array.isArray(existing.sourceIds) || existing.sourceIds.length === 0) {
          return res.status(400).json({
            success: false,
            code: 'MISSING_SOURCE',
            error: 'Facility cannot be published without at least one valid sourceId.',
          });
        }

        for (const sId of existing.sourceIds) {
          const sSnap = await safeGetDoc('investmentSources', sId);
          if (!sSnap.exists) {
            return res.status(400).json({
              success: false,
              code: 'INVALID_SOURCE',
              error: `Attached source "${sId}" does not exist.`,
            });
          }
          const sData = sSnap.data() || {};
          if (sData.verificationStatus !== 'verified') {
            return res.status(400).json({
              success: false,
              code: 'UNVERIFIED_SOURCE',
              error: `Attached source "${sId}" must be verified before facility publication.`,
            });
          }
        }

        const newVersion = (existing.version || 0) + 1;
        const updatedFacility = {
          ...existing,
          lifecycleStatus: 'published',
          verificationStatus: 'verified',
          publishedAt: nowIso,
          publishedBy: actorUid,
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentInfrastructure', facilityId, updatedFacility);
        await writeAuditLog('infrastructure', facilityId, 'infrastructure_published', `Published facility ${facilityId} (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: updatedFacility });
      }

      case 'unpublish_facility': {
        if (!checkStaffPermission(staffData, 'investment.publish')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment.publish permission' });
        }

        const { facilityId } = payload || {};
        if (!facilityId) {
          return res.status(400).json({ success: false, code: 'INVALID_FACILITY_ID', error: 'Missing facilityId' });
        }

        const docSnap = await safeGetDoc('investmentInfrastructure', facilityId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Facility "${facilityId}" not found` });
        }

        const existing = docSnap.data() as InvestmentFacility;
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}` });
        }

        if (existing.lifecycleStatus !== 'published') {
          return res.status(400).json({
            success: false,
            code: 'INVALID_LIFECYCLE_TRANSITION',
            error: `Cannot unpublish facility "${facilityId}" with status "${existing.lifecycleStatus}". Must be "published".`,
          });
        }

        const newVersion = (existing.version || 0) + 1;
        const updatedFacility = {
          ...existing,
          lifecycleStatus: 'unpublished',
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentInfrastructure', facilityId, updatedFacility);
        await writeAuditLog('infrastructure', facilityId, 'infrastructure_unpublished', `Unpublished facility ${facilityId} (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: updatedFacility });
      }

      case 'archive_facility': {
        if (!checkStaffPermission(staffData, 'investment.publish') && !checkStaffPermission(staffData, 'investment.edit')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment editing or publishing permission to archive' });
        }

        const { facilityId } = payload || {};
        if (!facilityId) {
          return res.status(400).json({ success: false, code: 'INVALID_FACILITY_ID', error: 'Missing facilityId' });
        }

        const docSnap = await safeGetDoc('investmentInfrastructure', facilityId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Facility "${facilityId}" not found` });
        }

        const existing = docSnap.data() as InvestmentFacility;
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}` });
        }

        // Hard Rule: Published records must be explicitly unpublished before archiving
        if (existing.lifecycleStatus === 'published') {
          return res.status(400).json({
            success: false,
            code: 'MUST_UNPUBLISH_FIRST',
            error: `Facility "${facilityId}" is currently published. It must be unpublished before archiving.`,
          });
        }

        if (existing.lifecycleStatus === 'archived') {
          return res.json({ success: true, data: existing, message: 'Facility already archived' });
        }

        const newVersion = (existing.version || 0) + 1;
        const updatedFacility = {
          ...existing,
          lifecycleStatus: 'archived',
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentInfrastructure', facilityId, updatedFacility);
        await writeAuditLog('infrastructure', facilityId, 'infrastructure_archived', `Archived facility ${facilityId} (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: updatedFacility });
      }

      case 'restore_facility': {
        if (!checkStaffPermission(staffData, 'investment.publish') && !checkStaffPermission(staffData, 'investment.edit')) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Requires investment editing or publishing permission to restore' });
        }

        const { facilityId } = payload || {};
        if (!facilityId) {
          return res.status(400).json({ success: false, code: 'INVALID_FACILITY_ID', error: 'Missing facilityId' });
        }

        const docSnap = await safeGetDoc('investmentInfrastructure', facilityId);
        if (!docSnap.exists) {
          return res.status(404).json({ success: false, code: 'NOT_FOUND', error: `Facility "${facilityId}" not found` });
        }

        const existing = docSnap.data() as InvestmentFacility;
        if (typeof expectedVersion === 'number' && existing.version !== expectedVersion) {
          return res.status(409).json({ success: false, code: 'VERSION_CONFLICT', error: `Version conflict: Expected version ${expectedVersion}, got ${existing.version}` });
        }

        if (existing.lifecycleStatus !== 'archived') {
          return res.status(400).json({
            success: false,
            code: 'NOT_ARCHIVED',
            error: `Facility "${facilityId}" is in state "${existing.lifecycleStatus}". Only archived facilities can be restored.`,
          });
        }

        const newVersion = (existing.version || 0) + 1;
        const updatedFacility = {
          ...existing,
          lifecycleStatus: 'draft',
          verificationStatus: 'pending', // Restored records return to draft with pending verification
          version: newVersion,
          updatedAt: nowIso,
          updatedBy: actorUid,
        };

        await safeSetDoc('investmentInfrastructure', facilityId, updatedFacility);
        await writeAuditLog('infrastructure', facilityId, 'infrastructure_restored', `Restored facility ${facilityId} from archive to draft (v${newVersion})`, existing.version, newVersion);
        return res.json({ success: true, data: updatedFacility });
      }

      case 'delete_entity': {
        const { entityType, entityId } = payload || {};
        if (!entityType || !entityId) {
          return res.status(400).json({ success: false, code: 'INVALID_PAYLOAD', error: 'Missing entityType or entityId' });
        }

        const isSuperAdmin = staffData.role === 'superAdmin';

        // HARD REQUIREMENT: Permanent deletion is STRICTLY restricted to SuperAdmin
        if (!isSuperAdmin) {
          return res.status(403).json({ success: false, code: 'PERMISSION_DENIED', error: 'Permanent deletion is strictly restricted to Super Administrators' });
        }

        const collectionNameMap: Record<string, string> = {
          zoneProfile: 'investmentZoneProfiles',
          dataset: 'investmentDatasets',
          source: 'investmentSources',
          methodology: 'investmentMethodologies',
          opportunity: 'investmentOpportunities',
          infrastructure: 'investmentInfrastructure',
          facility: 'investmentInfrastructure',
        };

        const targetCollection = collectionNameMap[entityType];
        if (!targetCollection) {
          return res.status(400).json({ success: false, code: 'INVALID_ENTITY_TYPE', error: `Unsupported entity type "${entityType}" for deletion` });
        }

        const docSnap = await safeGetDoc(targetCollection, entityId);

        if (!docSnap.exists) {
          return res.json({ success: true, message: `${entityType} already deleted`, code: 'IDEMPOTENT_SUCCESS' });
        }

        const existing = docSnap.data() || {};
        if (typeof expectedVersion === 'number' && existing.version !== undefined && existing.version !== expectedVersion) {
          return res.status(409).json({
            success: false,
            code: 'VERSION_CONFLICT',
            error: `Version conflict: Expected version ${expectedVersion}, but document is at version ${existing.version}`,
          });
        }

        await safeDeleteDoc(targetCollection, entityId);
        await writeAuditLog(
          entityType === 'facility' ? 'infrastructure' : entityType,
          entityId,
          entityType === 'infrastructure' || entityType === 'facility' ? 'infrastructure_deleted' : 'delete',
          `Permanently deleted ${entityType} "${entityId}"`,
          existing.version,
          0
        );
        return res.json({ success: true, deletedId: entityId });
      }

      default:
        return res.status(400).json({ success: false, code: 'UNKNOWN_ACTION', error: `Unknown mutation action: "${action}"` });
    }
  } catch (err: any) {
    console.error('[InvestmentApi] Unhandled error during mutation:', err);
    if (err?.code === 'FIRESTORE_UNAVAILABLE' || err?.name === 'FirestoreUnavailableError') {
      return res.status(503).json({
        success: false,
        code: 'FIRESTORE_UNAVAILABLE',
        error: err?.message || 'Firestore is unavailable for this mutation',
      });
    }
    return res.status(500).json({ success: false, code: 'SERVER_ERROR', error: err?.message || 'Internal server error during investment mutation' });
  }
}
