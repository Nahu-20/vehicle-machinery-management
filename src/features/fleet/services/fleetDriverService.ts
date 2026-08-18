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
  FleetAssignment,
  FleetDriver,
  FleetDriverEmployment,
  FleetDriverStatus,
} from '../types/fleet';
import { humanise } from '../constants/fleetVocabulary';
import { isDemoFleet, FleetVersionConflictError } from './fleetService';
import { listActiveAssignments } from './fleetAssignmentService';
import { FLEET_ASSIGNMENTS_COLLECTION, FLEET_DRIVERS_COLLECTION } from './fleetCollections';
import {
  demoCreateDriver,
  demoGetDriver,
  demoListAssignments,
  demoListDrivers,
  demoSetDriverStatus,
  demoUpdateDriver,
} from '../data/demoStore';
import { isCanonicalZoneId, type CanonicalZoneId } from '../../investment-map/constants/canonicalZones';

/**
 * The driver directory.
 *
 * Records of people, not accounts. Nothing here is ever tied to request.auth,
 * because the drivers this describes will never sign in — a zone operator has a
 * licence and a phone number, not a portal login. That is also why this is a
 * separate collection from staffUsers rather than extra columns on it: those two
 * documents answer different questions, and merging them would have forced an
 * account into existence for every seasonal driver the Bureau takes on.
 *
 * Follows the same shape as the rest of the module: a transaction that re-reads
 * and checks `version`, the same guards duplicated on the demo path so the demo
 * cannot accept what the real register would refuse, and an audit entry after
 * the write rather than inside it.
 */

export { FLEET_DRIVERS_COLLECTION } from './fleetCollections';

export class FleetDriverNotFoundError extends Error {
  constructor(driverId: string) {
    super(`Driver ${driverId} was not found.`);
    this.name = 'FleetDriverNotFoundError';
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
      'Firestore is not configured. Set the VITE_FIREBASE_* values to use the driver directory.'
    );
  }
  return db;
}

/* ------------------------------------------------------------------ reads */

export interface FleetDriverFilters {
  zoneId?: CanonicalZoneId | 'all';
  status?: FleetDriverStatus | 'all';
  search?: string;
}

export async function getDriverById(driverId: string): Promise<FleetDriver | null> {
  if (isDemoFleet()) return demoGetDriver(driverId);

  const database = requireDb();
  const snap = await getDoc(doc(database, FLEET_DRIVERS_COLLECTION, driverId));
  if (!snap.exists()) return null;
  const data = snap.data() as FleetDriver;
  return { ...data, driverId: data.driverId ?? snap.id };
}

/**
 * Name, phone, employee number and licence number are all searched client-side.
 *
 * Firestore cannot do a substring match, and the directory is a few hundred rows
 * at most — a bureau has fewer drivers than machines. Pushing this to the server
 * would mean a second search index for a list that fits in memory.
 */
function applyDriverFilters(rows: FleetDriver[], filters?: FleetDriverFilters): FleetDriver[] {
  let out = rows;
  if (filters?.zoneId && filters.zoneId !== 'all') {
    out = out.filter((d) => d.zoneId === filters.zoneId);
  }
  if (filters?.status && filters.status !== 'all') {
    out = out.filter((d) => d.status === filters.status);
  }
  const term = filters?.search?.trim().toLowerCase();
  if (term) {
    out = out.filter((d) =>
      [d.driverId, d.fullName, d.phone, d.employeeNumber, d.licenceNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }
  return [...out].sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export async function listDrivers(filters?: FleetDriverFilters): Promise<FleetDriver[]> {
  if (isDemoFleet()) return applyDriverFilters(demoListDrivers(), filters);

  const database = requireDb();
  const constraints: QueryConstraint[] = [];
  if (filters?.zoneId && filters.zoneId !== 'all') {
    constraints.push(where('zoneId', '==', filters.zoneId));
  }
  constraints.push(orderBy('fullName', 'asc'), fsLimit(500));

  const snap = await getDocs(query(collection(database, FLEET_DRIVERS_COLLECTION), ...constraints));
  const rows = snap.docs.map((d) => ({ ...(d.data() as FleetDriver), driverId: d.data().driverId ?? d.id }));
  // Status and search are applied here rather than in the query: adding either
  // to the constraints above needs another composite index for a list this small.
  return applyDriverFilters(rows, { status: filters?.status, search: filters?.search });
}

/**
 * Every sign-out this driver has ever had.
 *
 * Matched on driverId, which means sign-outs recorded before the directory
 * existed do not appear — those rows only ever held a typed name, and guessing
 * that two identical strings are the same person is how a register starts
 * telling people things that are not true.
 */
export async function listAssignmentsForDriver(driverId: string): Promise<FleetAssignment[]> {
  if (isDemoFleet()) {
    return demoListAssignments()
      .filter((a) => a.driverId === driverId)
      .sort((x, y) => y.issuedAt.toMillis() - x.issuedAt.toMillis());
  }

  const database = requireDb();
  const snap = await getDocs(
    query(
      collection(database, FLEET_ASSIGNMENTS_COLLECTION),
      where('driverId', '==', driverId),
      orderBy('issuedAt', 'desc'),
      fsLimit(50)
    )
  );
  return snap.docs.map((d) => d.data() as FleetAssignment);
}

/** What this driver is holding right now, if anything. */
export async function listOpenAssignmentsByDriver(): Promise<Map<string, FleetAssignment>> {
  const active = await listActiveAssignments();
  const byDriver = new Map<string, FleetAssignment>();
  for (const a of active) {
    if (a.driverId) byDriver.set(a.driverId, a);
  }
  return byDriver;
}

/* ----------------------------------------------------------------- writes */

export interface DriverInput {
  driverId: string;
  fullName: string;
  phone?: string;
  employeeNumber?: string;
  employment: FleetDriverEmployment;
  licenceNumber?: string;
  licenceGrade?: string;
  licenceExpiry?: Timestamp | null;
  zoneId: CanonicalZoneId;
  stationedAt?: string;
  photoUrl?: string;
  notes?: FleetDriver['notes'];
}

/** Shared by both write paths, so the demo refuses exactly what the register does. */
function validateDriverInput(input: DriverInput): string {
  const driverId = input.driverId.trim().toUpperCase();
  if (!driverId) throw new Error('A driver identifier is required.');
  if (!input.fullName.trim()) throw new Error("The driver's name is required.");
  if (!isCanonicalZoneId(input.zoneId)) throw new Error(`Unknown zone '${input.zoneId}'.`);
  // A licence number with no expiry cannot be checked against anything, and an
  // expiry with no number is not a document anyone can produce. Half a licence
  // is worse than none, because it reads as recorded.
  if (input.licenceNumber?.trim() && !input.licenceExpiry) {
    throw new Error('A licence number needs its expiry date, or the licence cannot be checked.');
  }
  if (input.licenceExpiry && !input.licenceNumber?.trim()) {
    throw new Error('An expiry date needs the licence number it belongs to.');
  }
  return driverId;
}

export async function createDriver(input: DriverInput, actor: StaffUser): Promise<FleetDriver> {
  const driverId = validateDriverInput(input);

  if (isDemoFleet()) {
    return demoCreateDriver({
      ...(input as unknown as FleetDriver),
      driverId,
      fullName: input.fullName.trim(),
      status: 'active',
      version: 1,
      createdByUid: actor.uid,
      updatedByUid: actor.uid,
    });
  }

  const database = requireDb();
  const ref = doc(database, FLEET_DRIVERS_COLLECTION, driverId);

  const created = await runTransaction(database, async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists()) {
      throw new Error(`Driver ${driverId} already exists in the directory.`);
    }
    const payload = stripUndefined({
      ...input,
      driverId,
      fullName: input.fullName.trim(),
      status: 'active' as FleetDriverStatus,
      version: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdByUid: actor.uid,
      updatedByUid: actor.uid,
    });
    tx.set(ref, payload);
    return payload as unknown as FleetDriver;
  });

  await logAuditEvent({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorDisplayName: actor.displayName,
    actorRole: actor.role,
    module: 'fleet',
    action: 'driver_created',
    targetType: 'fleetDriver',
    targetId: driverId,
    targetLabel: `${input.fullName.trim()} (${driverId})`,
    newStatus: 'active',
  } as any);

  return created;
}

export async function updateDriver(
  input: DriverInput & { expectedVersion: number },
  actor: StaffUser
): Promise<void> {
  const driverId = validateDriverInput(input);

  if (isDemoFleet()) {
    const current = demoGetDriver(driverId);
    if (!current) throw new FleetDriverNotFoundError(driverId);
    if (current.version !== input.expectedVersion) {
      throw new FleetVersionConflictError(input.expectedVersion, current.version);
    }
    demoUpdateDriver(driverId, {
      ...(input as unknown as Partial<FleetDriver>),
      fullName: input.fullName.trim(),
    });
    return;
  }

  const database = requireDb();
  const ref = doc(database, FLEET_DRIVERS_COLLECTION, driverId);

  await runTransaction(database, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new FleetDriverNotFoundError(driverId);
    const current = snap.data() as FleetDriver;
    if (current.version !== input.expectedVersion) {
      throw new FleetVersionConflictError(input.expectedVersion, current.version);
    }

    const { expectedVersion: _ignored, ...rest } = input;
    tx.update(
      ref,
      stripUndefined({
        ...rest,
        driverId,
        fullName: input.fullName.trim(),
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
    action: 'driver_updated',
    targetType: 'fleetDriver',
    targetId: driverId,
    targetLabel: `${input.fullName.trim()} (${driverId})`,
  } as any);
}

/**
 * Suspend, reinstate, or record that a driver has left.
 *
 * This deliberately does not touch open sign-outs. A machine is physically with
 * that person; marking them suspended at a desk does not put the tractor back in
 * the yard, and closing the sign-out here would record a return that never
 * happened, on a meter reading nobody took. Recalling the machine is a return,
 * done by whoever receives it — the driver page says as much when they are
 * holding something.
 */
export async function setDriverStatus(
  driverId: string,
  next: FleetDriverStatus,
  expectedVersion: number,
  actor: StaffUser,
  reason?: string
): Promise<void> {
  if (isDemoFleet()) {
    const current = demoGetDriver(driverId);
    if (!current) throw new FleetDriverNotFoundError(driverId);
    if (current.version !== expectedVersion) {
      throw new FleetVersionConflictError(expectedVersion, current.version);
    }
    if (current.status === next) throw new Error('That is already the current status.');
    demoSetDriverStatus(driverId, next);
    return;
  }

  const database = requireDb();
  const ref = doc(database, FLEET_DRIVERS_COLLECTION, driverId);

  let previous: FleetDriverStatus = 'active';
  await runTransaction(database, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new FleetDriverNotFoundError(driverId);
    const current = snap.data() as FleetDriver;
    if (current.version !== expectedVersion) {
      throw new FleetVersionConflictError(expectedVersion, current.version);
    }
    if (current.status === next) throw new Error('That is already the current status.');
    previous = current.status;

    tx.update(
      ref,
      stripUndefined({
        status: next,
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
    action: 'driver_status_changed',
    targetType: 'fleetDriver',
    targetId: driverId,
    targetLabel: reason ? `${driverId} — ${reason}` : `${driverId} → ${humanise(next)}`,
    previousStatus: previous,
    newStatus: next,
  } as any);
}
