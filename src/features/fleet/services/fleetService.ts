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
  setDoc,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db, isFirebaseDemoMode } from '../../../lib/firebase';
import { logAuditEvent } from '../../../services/auditService';
import type { StaffUser } from '../../../types/auth';
import type {
  FleetAsset,
  FleetAssetFilters,
  FleetAssetStatus,
  FleetDashboardSummary,
  FleetServiceRecord,
  FleetStatusEvent,
  FleetZoneAvailability,
} from '../types/fleet';
import { isIssuable, isServiceDue } from '../constants/fleetVocabulary';
import {
  demoListAssets,
  demoGetAsset,
  demoCreateAsset,
  demoUpdateAsset,
  demoSetStatus,
  demoRecordStatusEvent,
  demoListStatusEvents,
  demoRecordService,
  demoListServiceRecords,
} from '../data/demoStore';
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

/**
 * Whether the module is serving the demonstration register.
 *
 * True only when Firebase is unconfigured. Exported so the UI can say so out
 * loud rather than letting anyone mistake sample figures for the real fleet.
 */
export const isDemoFleet = (): boolean => isFirebaseDemoMode || !db;

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
  if (isDemoFleet()) {
    return demoGetAsset(assetId);
  }
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
  if (isDemoFleet()) {
    return applyClientFilters(
      demoListAssets().filter(
        (a) =>
          (!filters.zoneId || filters.zoneId === 'all' || a.zoneId === filters.zoneId) &&
          (!filters.status || filters.status === 'all' || a.status === filters.status) &&
          (!filters.assetType || filters.assetType === 'all' || a.assetType === filters.assetType)
      ),
      filters
    );
  }

  const database = requireDb();

  /*
   * Fetched whole, filtered here.
   *
   * The three filters used to be `where` clauses. Combined with orderBy(assetId)
   * that needs a composite index per combination — seven of them — and none were
   * declared, so picking any dropdown on the register threw failed-precondition.
   * Adding seven indexes to filter a list this size is the wrong trade: a bureau
   * register is tens to low hundreds of rows, and listDrivers already made the
   * same call deliberately for the same reason.
   *
   * applyClientFilters below was already doing exactly this for search and
   * service-due, which Firestore cannot express at all. The zone, status and
   * type filters simply join them.
   */
  const snap = await getDocs(
    query(collection(database, FLEET_ASSETS_COLLECTION), orderBy('assetId'), fsLimit(1000))
  );

  return applyClientFilters(
    snap.docs
      .map((d) => mapAsset(d.id, d.data()))
      .filter(
        (a) =>
          (!filters.zoneId || filters.zoneId === 'all' || a.zoneId === filters.zoneId) &&
          (!filters.status || filters.status === 'all' || a.status === filters.status) &&
          (!filters.assetType || filters.assetType === 'all' || a.assetType === filters.assetType)
      ),
    filters
  );
}

/** Filters Firestore cannot express: substring search and derived service-due. */
function applyClientFilters(input: FleetAsset[], filters: FleetAssetFilters): FleetAsset[] {
  let assets = input;

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

  return [...assets].sort((a, b) => a.assetId.localeCompare(b.assetId));
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
  insurancePolicyNumber?: string;
  insurer?: string;
  insuranceCost?: number;
  inspectionExpiry?: Timestamp | null;
  inspectionCertificateNumber?: string;
  libreNumber?: string;
  acquiredAt?: Timestamp | null;
  imageUrl?: string;
  notes?: FleetAsset['notes'];
}

export async function createAsset(
  input: CreateAssetInput,
  actor: StaffUser
): Promise<FleetAsset> {
  const assetId = input.assetId.trim().toUpperCase();
  if (!assetId) throw new Error('An asset identifier is required.');
  if (!isCanonicalZoneId(input.zoneId)) {
    throw new Error(`Unknown zone '${input.zoneId}'.`);
  }
  if (input.currentMeter < 0) throw new Error('Meter reading cannot be negative.');

  // Validation above runs in both modes, so the demo rejects the same input the
  // live register would rather than being quietly more permissive.
  if (isDemoFleet()) {
    return demoCreateAsset({
      ...(input as unknown as FleetAsset),
      assetId,
      status: 'available',
      version: 1,
      createdByUid: actor.uid,
      updatedByUid: actor.uid,
    });
  }

  const database = requireDb();

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
  if (isDemoFleet()) {
    demoUpdateAsset(assetId, changes as Partial<FleetAsset>);
    return;
  }

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
  extra: Partial<Pick<FleetAsset, 'custodianUid' | 'custodianName'>> & { reason?: string } = {}
): Promise<void> {
  if (isDemoFleet()) {
    demoSetStatus(assetId, next, actor.uid, actor.displayName, extra.reason);
    return;
  }

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
        //
        // custodianDriverId was missing from this list. The demo store cleared
        // it (demoStore.demoSetStatus) and the live path did not, so a released
        // machine kept a driver id pointing at whoever last had it — invisible
        // on screen, because the name beside it was correctly blank, and
        // invisible in demo mode, because demo mode does not run this code.
        custodianUid: next === 'assigned' ? extra.custodianUid : null,
        custodianName: next === 'assigned' ? extra.custodianName : null,
        custodianDriverId: next === 'assigned' ? current.custodianDriverId ?? null : null,
        version: current.version + 1,
        updatedAt: serverTimestamp(),
        updatedByUid: actor.uid,
      })
    );
  });

  // The audit log answers 'who changed what'; the status event answers 'what has
  // this machine been doing'. Both are written, because the timeline should not
  // depend on parsing audit records.
  if (previous) {
    await appendStatusEvent({
      assetId,
      from: previous,
      to: next,
      at: Timestamp.now(),
      actorUid: actor.uid,
      actorName: actor.displayName,
      reason: extra.reason,
    });
  }

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
  await setAssetStatus(assetId, 'disposed', expectedVersion, actor, {
    reason: 'Retired from the register',
  });
}

export const FLEET_SERVICE_RECORDS_COLLECTION = 'fleetServiceRecords';

export interface RecordServiceInput {
  assetId: string;
  /** Defaults to the asset's current reading in the UI, but typed in, so it can be corrected. */
  meterAtService: number;
  servicedAt: Date;
  note?: string;
  cost?: number;
}

/**
 * Record a completed service.
 *
 * Writes the record and moves `lastServiceMeter` in one transaction, because the
 * two disagreeing is the whole failure mode: a service logged that does not
 * clear the due flag trains staff to ignore the flag, and a flag cleared with no
 * record behind it cannot be defended to an auditor.
 *
 * The due state itself is never stored — `isServiceDue` derives it from the
 * meter — so there is nothing here that can go stale against the reading.
 */
export async function recordService(
  input: RecordServiceInput,
  actor: StaffUser
): Promise<string> {
  const check = (asset: FleetAsset) => {
    if (asset.meterType === 'none') {
      throw new Error(
        `${asset.assetId} has no meter, so there is no reading to service it against.`
      );
    }
    if (asset.status === 'disposed') {
      throw new Error('A retired asset cannot be serviced.');
    }
    if (input.meterAtService < (asset.lastServiceMeter ?? 0)) {
      throw new Error(
        `Reading ${input.meterAtService} is below the last service at ${asset.lastServiceMeter}. Check the meter.`
      );
    }
    if (input.meterAtService > asset.currentMeter) {
      throw new Error(
        `Reading ${input.meterAtService} is above the current ${asset.currentMeter}. Record the running hours first.`
      );
    }
  };

  let recordId: string;

  if (isDemoFleet()) {
    const asset = demoGetAsset(input.assetId);
    if (!asset) throw new FleetNotFoundError(input.assetId);
    check(asset);
    recordId = demoRecordService({
      assetId: input.assetId,
      zoneId: asset.zoneId,
      meterAtService: input.meterAtService,
      servicedAt: Timestamp.fromDate(input.servicedAt),
      note: input.note,
      cost: input.cost,
      recordedByUid: actor.uid,
      recordedByName: actor.displayName,
    });
  } else {
    const database = requireDb();
    const assetRef = doc(database, FLEET_ASSETS_COLLECTION, input.assetId);
    const recordRef = doc(collection(database, FLEET_SERVICE_RECORDS_COLLECTION));

    await runTransaction(database, async (tx) => {
      const snap = await tx.get(assetRef);
      if (!snap.exists()) throw new FleetNotFoundError(input.assetId);
      const asset = snap.data() as FleetAsset;
      check(asset);

      tx.set(
        recordRef,
        stripUndefined({
          serviceRecordId: recordRef.id,
          assetId: input.assetId,
          zoneId: asset.zoneId,
          meterAtService: input.meterAtService,
          servicedAt: Timestamp.fromDate(input.servicedAt),
          note: input.note,
          cost: input.cost,
          recordedByUid: actor.uid,
          recordedByName: actor.displayName,
          createdAt: serverTimestamp(),
        })
      );

      tx.update(assetRef, {
        lastServiceMeter: input.meterAtService,
        version: asset.version + 1,
        updatedAt: serverTimestamp(),
        updatedByUid: actor.uid,
      });
    });

    recordId = recordRef.id;
  }

  await logAuditEvent({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorDisplayName: actor.displayName,
    actorRole: actor.role,
    module: 'fleet',
    action: 'asset_serviced',
    targetType: 'fleetAsset',
    targetId: input.assetId,
    targetLabel: `${input.assetId} at ${input.meterAtService}`,
  } as any);

  return recordId;
}

/** Services for one vehicle, newest first. */
export async function listServiceRecords(assetId?: string): Promise<FleetServiceRecord[]> {
  if (isDemoFleet()) {
    return demoListServiceRecords()
      .filter((r) => !assetId || r.assetId === assetId)
      .sort((a, b) => b.servicedAt.toMillis() - a.servicedAt.toMillis());
  }
  const database = requireDb();
  const constraints: QueryConstraint[] = [];
  if (assetId) constraints.push(where('assetId', '==', assetId));
  constraints.push(orderBy('servicedAt', 'desc'), fsLimit(200));
  const snap = await getDocs(query(collection(database, FLEET_SERVICE_RECORDS_COLLECTION), ...constraints));
  return snap.docs.map((d) => d.data() as FleetServiceRecord);
}

export const FLEET_STATUS_EVENTS_COLLECTION = 'fleetStatusEvents';

async function appendStatusEvent(event: Omit<FleetStatusEvent, 'eventId'>): Promise<void> {
  if (isDemoFleet()) {
    demoRecordStatusEvent(event);
    return;
  }
  const database = requireDb();
  const ref = doc(collection(database, FLEET_STATUS_EVENTS_COLLECTION));
  await setDoc(ref, stripUndefined({ ...event, eventId: ref.id }));
}

/** Status history for one vehicle, oldest first so it reads as a timeline. */
export async function listStatusEvents(assetId: string): Promise<FleetStatusEvent[]> {
  if (isDemoFleet()) {
    return demoListStatusEvents()
      .filter((e) => e.assetId === assetId)
      .sort((a, b) => a.at.toMillis() - b.at.toMillis());
  }
  const database = requireDb();
  const snap = await getDocs(
    query(
      collection(database, FLEET_STATUS_EVENTS_COLLECTION),
      where('assetId', '==', assetId),
      orderBy('at', 'asc'),
      fsLimit(200)
    )
  );
  return snap.docs.map((d) => d.data() as FleetStatusEvent);
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
