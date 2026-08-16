import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  limit as fsLimit,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { logAuditEvent } from '../../../services/auditService';
import type { StaffUser } from '../../../types/auth';
import type {
  FleetAsset,
  FleetAssetFilters,
  FleetAssetStatus,
  FleetDashboardSummary,
  FleetZoneAvailability,
} from '../types/fleet';
import { isIssuable, isServiceDue } from '../constants/fleetVocabulary';
import {
  CANONICAL_ZONE_IDS,
  isCanonicalZoneId,
  type CanonicalZoneId,
} from '../../investment-map/constants/canonicalZones';

/**
 * Reads and writes for the fleet register.
 *
 * Every mutation goes through a transaction that re-reads the document and
 * checks `version`. Two clerks at two desks issuing the same tractor is the
 * realistic collision here, not a theoretical one, and last-write-wins would
 * silently lose one of the two sign-outs — exactly the failure the paper book
 * already has.
 */

export const FLEET_ASSETS_COLLECTION = 'fleetAssets';

export class FleetVersionConflictError extends Error {
  constructor(public readonly expected: number, public readonly actual: number) {
    super(
      `This asset was changed by someone else (expected version ${expected}, found ${actual}). Reload and try again.`
    );
    this.name = 'FleetVersionConflictError';
  }
}

export class FleetNotFoundError extends Error {
  constructor(assetId: string) {
    super(`Asset ${assetId} was not found.`);
    this.name = 'FleetNotFoundError';
  }
}

/** Firestore rejects undefined; optional fields must be dropped, not passed through. */
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

function requireDb() {
  if (!db) {
    throw new Error(
      'Firestore is not configured. Set the VITE_FIREBASE_* values to use the fleet register.'
    );
  }
  return db;
}

function mapAsset(id: string, data: any): FleetAsset {
  return {
    ...(data as FleetAsset),
    assetId: data.assetId ?? id,
  };
}

/* ------------------------------------------------------------------ reads */

export async function getAssetById(assetId: string): Promise<FleetAsset | null> {
  const database = requireDb();
  const snap = await getDoc(doc(database, FLEET_ASSETS_COLLECTION, assetId));
  return snap.exists() ? mapAsset(snap.id, snap.data()) : null;
}

/**
 * List assets.
 *
 * Search and the service-due filter are applied in memory on purpose. Firestore
 * cannot do substring matching at all, and service-due is derived arithmetic
 * rather than a stored field. A regional bureau's fleet is in the hundreds, so
 * fetching a zone's worth and filtering locally is cheaper than the composite
 * indexes and the denormalised `isServiceDue` flag that would otherwise be
 * needed — and a stored flag would go stale the moment a meter moved.
 */
export async function listAssets(filters: FleetAssetFilters = {}): Promise<FleetAsset[]> {
  const database = requireDb();

  const constraints: QueryConstraint[] = [];
  if (filters.zoneId && filters.zoneId !== 'all') {
    constraints.push(where('zoneId', '==', filters.zoneId));
  }
  if (filters.status && filters.status !== 'all') {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters.assetType && filters.assetType !== 'all') {
    constraints.push(where('assetType', '==', filters.assetType));
  }
  constraints.push(orderBy('assetId'));
  constraints.push(fsLimit(1000));

  const snap = await getDocs(query(collection(database, FLEET_ASSETS_COLLECTION), ...constraints));
  let assets = snap.docs.map((d) => mapAsset(d.id, d.data()));

  if (filters.serviceDueOnly) {
    assets = assets.filter(isServiceDue);
  }

  const term = filters.search?.trim().toLowerCase();
  if (term) {
    assets = assets.filter((a) =>
      [a.assetId, a.make, a.model, a.plateNumber, a.stationedAt]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    );
  }

  return assets;
}

/* ----------------------------------------------------------------- writes */

export interface CreateAssetInput {
  assetId: string;
  assetType: FleetAsset['assetType'];
  make: string;
  model: string;
  year?: number;
  plateNumber?: string;
  chassisNumber?: string;
  meterType: FleetAsset['meterType'];
  currentMeter: number;
  zoneId: CanonicalZoneId;
  stationedAt: string;
  serviceIntervalMeter?: number;
  lastServiceMeter?: number;
  insuranceExpiry?: Timestamp | null;
  inspectionExpiry?: Timestamp | null;
  acquiredAt?: Timestamp | null;
  notes?: FleetAsset['notes'];
}

export async function createAsset(
  input: CreateAssetInput,
  actor: StaffUser
): Promise<FleetAsset> {
  const database = requireDb();

  const assetId = input.assetId.trim().toUpperCase();
  if (!assetId) throw new Error('An asset identifier is required.');
  if (!isCanonicalZoneId(input.zoneId)) {
    throw new Error(`Unknown zone '${input.zoneId}'.`);
  }
  if (input.currentMeter < 0) throw new Error('Meter reading cannot be negative.');

  const ref = doc(database, FLEET_ASSETS_COLLECTION, assetId);

  const created = await runTransaction(database, async (tx) => {
    const existing = await tx.get(ref);
    // The identifier is painted on the machine, so a clash means two records
    // for one physical asset — the ambiguity this register exists to remove.
    if (existing.exists()) {
      throw new Error(`Asset ${assetId} already exists in the register.`);
    }

    const payload = stripUndefined({
      ...input,
      assetId,
      status: 'available' as FleetAssetStatus,
      version: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdByUid: actor.uid,
      updatedByUid: actor.uid,
    });

    tx.set(ref, payload);
    return payload as unknown as FleetAsset;
  });

  await logAuditEvent({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorDisplayName: actor.displayName,
    actorRole: actor.role,
    module: 'fleet',
    action: 'asset_created',
    targetType: 'fleetAsset',
    targetId: assetId,
    targetLabel: `${input.make} ${input.model} (${assetId})`,
    newStatus: 'available',
  } as any);

  return created;
}

export async function updateAsset(
  assetId: string,
  changes: Partial<CreateAssetInput>,
  expectedVersion: number,
  actor: StaffUser
): Promise<void> {
  const database = requireDb();
  const ref = doc(database, FLEET_ASSETS_COLLECTION, assetId);

  await runTransaction(database, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new FleetNotFoundError(assetId);

    const current = snap.data() as FleetAsset;
    if (current.version !== expectedVersion) {
      throw new FleetVersionConflictError(expectedVersion, current.version);
    }

    tx.update(
      ref,
      stripUndefined({
        ...changes,
        version: current.version + 1,
        updatedAt: serverTimestamp(),
        updatedByUid: actor.uid,
      })
    );
  });

  await logAuditEvent({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorDisplayName: actor.displayName,
    actorRole: actor.role,
    module: 'fleet',
    action: 'asset_updated',
    targetType: 'fleetAsset',
    targetId: assetId,
    targetLabel: assetId,
  } as any);
}

/**
 * Move an asset between operational statuses.
 *
 * Kept as one guarded entry point rather than letting callers write `status`
 * directly, so the rules about what may follow what live in a single place.
 * Assignment and maintenance both route through here.
 */
export async function setAssetStatus(
  assetId: string,
  next: FleetAssetStatus,
  expectedVersion: number,
  actor: StaffUser,
  extra: Partial<Pick<FleetAsset, 'custodianUid' | 'custodianName'>> = {}
): Promise<void> {
  const database = requireDb();
  const ref = doc(database, FLEET_ASSETS_COLLECTION, assetId);

  let previous: FleetAssetStatus | undefined;

  await runTransaction(database, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new FleetNotFoundError(assetId);

    const current = snap.data() as FleetAsset;
    if (current.version !== expectedVersion) {
      throw new FleetVersionConflictError(expectedVersion, current.version);
    }
    previous = current.status;

    if (current.status === 'disposed') {
      throw new Error('A disposed asset cannot be returned to service.');
    }
    if (next === 'assigned' && !isIssuable(current)) {
      throw new Error(`Asset ${assetId} is ${current.status} and cannot be issued.`);
    }

    tx.update(
      ref,
      stripUndefined({
        status: next,
        // Clearing rather than leaving stale: a returned asset showing its last
        // holder reads as still being out.
        custodianUid: next === 'assigned' ? extra.custodianUid : null,
        custodianName: next === 'assigned' ? extra.custodianName : null,
        version: current.version + 1,
        updatedAt: serverTimestamp(),
        updatedByUid: actor.uid,
      })
    );
  });

  await logAuditEvent({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorDisplayName: actor.displayName,
    actorRole: actor.role,
    module: 'fleet',
    action: 'asset_status_changed',
    targetType: 'fleetAsset',
    targetId: assetId,
    targetLabel: assetId,
    previousStatus: previous ?? null,
    newStatus: next,
  } as any);
}

/**
 * Retire an asset.
 *
 * Sets `disposed` rather than deleting. The register's worth is its history —
 * which machine broke, how often, what it cost — and deleting the row destroys
 * that along with the audit trail pointing at it.
 */
export async function retireAsset(
  assetId: string,
  expectedVersion: number,
  actor: StaffUser
): Promise<void> {
  await setAssetStatus(assetId, 'disposed', expectedVersion, actor);
}

/* ------------------------------------------------------------- dashboard */

const EMPTY_STATUS_COUNTS: Record<FleetAssetStatus, number> = {
  available: 0,
  assigned: 0,
  in_maintenance: 0,
  awaiting_parts: 0,
  out_of_service: 0,
  disposed: 0,
};

/**
 * Roll the register up into the headline view.
 *
 * Computed from the asset list in one pass rather than by counting queries, so
 * the figures are internally consistent — separate count queries can disagree
 * with each other if a write lands between them.
 */
export function summariseFleet(
  assets: FleetAsset[],
  overdueReturnCount = 0,
  groundedCount = 0
): FleetDashboardSummary {
  const byStatus = { ...EMPTY_STATUS_COUNTS };
  const zoneMap = new Map<CanonicalZoneId, FleetZoneAvailability>();

  for (const zoneId of CANONICAL_ZONE_IDS) {
    zoneMap.set(zoneId, { zoneId, total: 0, available: 0, assigned: 0, down: 0 });
  }

  let serviceDueCount = 0;

  for (const asset of assets) {
    byStatus[asset.status] = (byStatus[asset.status] ?? 0) + 1;
    if (isServiceDue(asset)) serviceDueCount += 1;

    // Disposed assets are excluded from the zone view: they are history, and
    // counting them makes a zone look better resourced than it is.
    if (asset.status === 'disposed') continue;

    const row = zoneMap.get(asset.zoneId);
    if (!row) continue;

    row.total += 1;
    if (asset.status === 'available') row.available += 1;
    else if (asset.status === 'assigned') row.assigned += 1;
    else row.down += 1;
  }

  return {
    totalAssets: assets.length,
    byStatus,
    groundedCount,
    serviceDueCount,
    overdueReturnCount,
    byZone: [...zoneMap.values()].filter((z) => z.total > 0),
  };
}
