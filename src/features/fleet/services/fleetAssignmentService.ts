import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  where,
  limit as fsLimit,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { logAuditEvent } from '../../../services/auditService';
import type { StaffUser } from '../../../types/auth';
import type { FleetAsset, FleetAssignment, FleetDriver } from '../types/fleet';
import { assessDriverForAsset, humanise, isIssuable } from '../constants/fleetVocabulary';
import { FLEET_DRIVERS_COLLECTION } from './fleetCollections';
import {
  FLEET_ASSETS_COLLECTION,
  FleetNotFoundError,
  FleetVersionConflictError,
  isDemoFleet,
} from './fleetService';
import {
  demoListAssignments,
  demoIssueAsset,
  demoReturnAsset,
  demoGetAsset,
  demoGetDriver,
} from '../data/demoStore';

/**
 * Issuing and returning assets — the sign-out book.
 *
 * The asset row and the assignment row are written in one transaction. Written
 * separately, a failure between them leaves a tractor marked as issued to
 * nobody, or held by someone with no record of it. That inconsistency is
 * exactly what makes a paper book untrustworthy, so it must not be reproducible
 * here.
 */

export { FLEET_ASSIGNMENTS_COLLECTION } from './fleetCollections';
import { FLEET_ASSIGNMENTS_COLLECTION } from './fleetCollections';

function requireDb() {
  if (!db) {
    throw new Error('Firestore is not configured. Set the VITE_FIREBASE_* values to issue assets.');
  }
  return db;
}

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out as T;
}

export interface IssueAssetInput {
  assetId: string;
  expectedVersion: number;
  assignedToUid: string;
  assignedToName: string;
  /**
   * The driver record, when the holder is one.
   *
   * Optional, and deliberately so. A machine handed to a labourer taken on for
   * the week still has to be recordable, and a register that refuses the awkward
   * case is one people keep a second book alongside. When it is present the
   * licence is checked; when it is absent nothing is claimed about a licence,
   * which is the honest position rather than a silent pass.
   */
  driverId?: string | null;
  purpose: string;
  /** Meter read at the counter as the machine goes out. */
  meterOut: number;
  dueAt?: Date | null;
}

/**
 * Refuse the issue if the driver may not take this machine.
 *
 * Enforced here rather than only in the form, because a disabled button is a
 * suggestion. The check needs the driver record, which is why the collection
 * name comes from the leaf module — reaching for the driver service from here
 * would close an import cycle, since that service reads assignments.
 */
function guardDriver(driver: FleetDriver | null, asset: FleetAsset, driverId: string): void {
  if (!driver) {
    throw new Error(`Driver ${driverId} was not found in the directory.`);
  }
  const verdict = assessDriverForAsset(driver, asset);
  if (!verdict.allowed) throw new Error(verdict.reason ?? 'This driver may not take this machine.');
}

/**
 * Issue an asset to a person.
 *
 * The meter is captured here rather than inferred, because handing over is the
 * one moment somebody reliably looks at the dial. Everything downstream —
 * service due, utilisation, the hours a machine actually worked — rests on
 * these two numbers being real.
 */
export async function issueAsset(
  input: IssueAssetInput,
  actor: StaffUser
): Promise<string> {
  if (isDemoFleet()) {
    const asset = demoGetAsset(input.assetId);
    if (!asset) throw new FleetNotFoundError(input.assetId);
    // The same guards as the live path, so the demo cannot do what the real
    // register would refuse.
    if (!isIssuable(asset)) {
      throw new Error(
        `${input.assetId} is currently ${humanise(asset.status)} and cannot be issued.`
      );
    }
    if (asset.meterType !== 'none' && input.meterOut < asset.currentMeter) {
      throw new Error(
        `Reading ${input.meterOut} is below the recorded ${asset.currentMeter}. Check the meter.`
      );
    }
    if (input.driverId) guardDriver(demoGetDriver(input.driverId), asset, input.driverId);

    return demoIssueAsset({
      assetId: input.assetId,
      zoneId: asset.zoneId,
      assignedToUid: input.assignedToUid,
      assignedToName: input.assignedToName,
      driverId: input.driverId ?? null,
      purpose: { en: input.purpose },
      issuedAt: Timestamp.now(),
      dueAt: input.dueAt ? Timestamp.fromDate(input.dueAt) : null,
      returnedAt: null,
      meterOut: input.meterOut,
      meterIn: null,
      status: 'active',
      issuedByUid: actor.uid,
    });
  }

  const database = requireDb();
  const assetRef = doc(database, FLEET_ASSETS_COLLECTION, input.assetId);
  const assignmentRef = doc(collection(database, FLEET_ASSIGNMENTS_COLLECTION));
  const driverRef = input.driverId
    ? doc(database, FLEET_DRIVERS_COLLECTION, input.driverId)
    : null;

  await runTransaction(database, async (tx) => {
    const snap = await tx.get(assetRef);
    if (!snap.exists()) throw new FleetNotFoundError(input.assetId);

    const asset = snap.data() as FleetAsset;
    if (asset.version !== input.expectedVersion) {
      throw new FleetVersionConflictError(input.expectedVersion, asset.version);
    }
    if (!isIssuable(asset)) {
      throw new Error(
        `${input.assetId} is currently ${humanise(asset.status)} and cannot be issued.`
      );
    }
    // A meter that goes backwards means somebody mistyped, or the wrong machine
    // is in front of them. Either way it must not be recorded silently.
    if (asset.meterType !== 'none' && input.meterOut < asset.currentMeter) {
      throw new Error(
        `Reading ${input.meterOut} is below the recorded ${asset.currentMeter}. Check the meter.`
      );
    }

    // Read inside the transaction so a licence that lapses, or a driver
    // suspended, between the form opening and this write is caught rather than
    // waved through on stale data. A document get is allowed here; a query is
    // not, which is why the driver is addressed by id.
    if (driverRef && input.driverId) {
      const driverSnap = await tx.get(driverRef);
      guardDriver(
        driverSnap.exists() ? (driverSnap.data() as FleetDriver) : null,
        asset,
        input.driverId
      );
    }

    tx.set(
      assignmentRef,
      stripUndefined({
        assignmentId: assignmentRef.id,
        assetId: input.assetId,
        zoneId: asset.zoneId,
        assignedToUid: input.assignedToUid,
        assignedToName: input.assignedToName,
        driverId: input.driverId ?? null,
        purpose: { en: input.purpose },
        issuedAt: serverTimestamp(),
        dueAt: input.dueAt ? Timestamp.fromDate(input.dueAt) : null,
        returnedAt: null,
        meterOut: input.meterOut,
        meterIn: null,
        status: 'active',
        issuedByUid: actor.uid,
      })
    );

    tx.update(assetRef, {
      status: 'assigned',
      custodianUid: input.assignedToUid,
      custodianName: input.assignedToName,
      custodianDriverId: input.driverId ?? null,
      currentMeter: asset.meterType === 'none' ? asset.currentMeter : input.meterOut,
      version: asset.version + 1,
      updatedAt: serverTimestamp(),
      updatedByUid: actor.uid,
    });
  });

  await logAuditEvent({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorDisplayName: actor.displayName,
    actorRole: actor.role,
    module: 'fleet',
    action: 'asset_issued',
    targetType: 'fleetAsset',
    targetId: input.assetId,
    targetLabel: `${input.assetId} → ${input.assignedToName}`,
    previousStatus: 'available',
    newStatus: 'assigned',
  } as any);

  return assignmentRef.id;
}

export interface ReturnAssetInput {
  assetId: string;
  assignmentId: string;
  expectedVersion: number;
  meterIn: number;
  /** Set when the machine comes back faulty; routes it to the garage instead of the yard. */
  returnToMaintenance?: boolean;
}

/**
 * Receive an asset back.
 *
 * Closes the assignment, advances the meter, and clears the custodian. An asset
 * returned with a fault goes to 'in_maintenance' rather than 'available', so a
 * broken machine is never offered to the next person — the failure mode that
 * makes an operational register worse than useless.
 */
export async function returnAsset(
  input: ReturnAssetInput,
  actor: StaffUser
): Promise<void> {
  if (isDemoFleet()) {
    const asset = demoGetAsset(input.assetId);
    const open = demoListAssignments().find((a) => a.assignmentId === input.assignmentId);
    if (!asset) throw new FleetNotFoundError(input.assetId);
    if (!open) throw new Error('That assignment no longer exists.');
    if (open.status === 'returned') throw new Error('This assignment has already been closed.');
    if (asset.meterType !== 'none' && input.meterIn < open.meterOut) {
      throw new Error(
        `Return reading ${input.meterIn} is below the issue reading ${open.meterOut}. Check the meter.`
      );
    }
    demoReturnAsset(
      input.assignmentId,
      input.meterIn,
      Boolean(input.returnToMaintenance),
      actor.uid
    );
    return;
  }

  const database = requireDb();
  const assetRef = doc(database, FLEET_ASSETS_COLLECTION, input.assetId);
  const assignmentRef = doc(database, FLEET_ASSIGNMENTS_COLLECTION, input.assignmentId);

  await runTransaction(database, async (tx) => {
    const [assetSnap, assignmentSnap] = await Promise.all([
      tx.get(assetRef),
      tx.get(assignmentRef),
    ]);
    if (!assetSnap.exists()) throw new FleetNotFoundError(input.assetId);
    if (!assignmentSnap.exists()) throw new Error('That assignment no longer exists.');

    const asset = assetSnap.data() as FleetAsset;
    const assignment = assignmentSnap.data() as FleetAssignment;

    if (asset.version !== input.expectedVersion) {
      throw new FleetVersionConflictError(input.expectedVersion, asset.version);
    }
    if (assignment.status === 'returned') {
      throw new Error('This assignment has already been closed.');
    }
    if (asset.meterType !== 'none' && input.meterIn < assignment.meterOut) {
      throw new Error(
        `Return reading ${input.meterIn} is below the issue reading ${assignment.meterOut}. Check the meter.`
      );
    }

    tx.update(assignmentRef, {
      returnedAt: serverTimestamp(),
      meterIn: input.meterIn,
      status: 'returned',
      returnedByUid: actor.uid,
    });

    tx.update(assetRef, {
      status: input.returnToMaintenance ? 'in_maintenance' : 'available',
      custodianUid: null,
      custodianName: null,
      custodianDriverId: null,
      currentMeter: asset.meterType === 'none' ? asset.currentMeter : input.meterIn,
      version: asset.version + 1,
      updatedAt: serverTimestamp(),
      updatedByUid: actor.uid,
    });
  });

  await logAuditEvent({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorDisplayName: actor.displayName,
    actorRole: actor.role,
    module: 'fleet',
    action: 'asset_returned',
    targetType: 'fleetAsset',
    targetId: input.assetId,
    targetLabel: input.assetId,
    previousStatus: 'assigned',
    newStatus: input.returnToMaintenance ? 'in_maintenance' : 'available',
  } as any);
}

/** Assignment history for one asset, newest first. */
export async function listAssignmentsForAsset(assetId: string): Promise<FleetAssignment[]> {
  if (isDemoFleet()) {
    return demoListAssignments().filter((a) => a.assetId === assetId).sort(
      (x, y) => y.issuedAt.toMillis() - x.issuedAt.toMillis()
    );
  }
  const database = requireDb();
  const snap = await getDocs(
    query(
      collection(database, FLEET_ASSIGNMENTS_COLLECTION),
      where('assetId', '==', assetId),
      orderBy('issuedAt', 'desc'),
      fsLimit(50)
    )
  );
  return snap.docs.map((d) => d.data() as FleetAssignment);
}

/** Every assignment still open, used for the overdue count on the dashboard. */
export async function listActiveAssignments(): Promise<FleetAssignment[]> {
  if (isDemoFleet()) {
    return demoListAssignments().filter((a) => a.status === 'active');
  }
  const database = requireDb();
  const snap = await getDocs(
    query(
      collection(database, FLEET_ASSIGNMENTS_COLLECTION),
      where('status', '==', 'active'),
      fsLimit(500)
    )
  );
  return snap.docs.map((d) => d.data() as FleetAssignment);
}

/**
 * Whether an open assignment is past its due date.
 *
 * Derived rather than stored: a scheduled job to flip rows to 'overdue' would be
 * one more thing to run and to get wrong, and the answer is a date comparison.
 */
export function isOverdue(assignment: FleetAssignment, now = Date.now()): boolean {
  if (assignment.status !== 'active') return false;
  if (!assignment.dueAt?.toDate) return false;
  return assignment.dueAt.toDate().getTime() < now;
}

export function countOverdue(assignments: FleetAssignment[]): number {
  return assignments.filter((a) => isOverdue(a)).length;
}
