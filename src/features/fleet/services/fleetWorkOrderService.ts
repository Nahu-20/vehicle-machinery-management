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
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { logAuditEvent } from '../../../services/auditService';
import type { StaffUser } from '../../../types/auth';
import type {
  FleetAsset,
  FleetAssetStatus,
  FleetFaultSeverity,
  FleetWorkOrder,
  FleetWorkOrderPart,
  FleetWorkOrderStatus,
} from '../types/fleet';
import { canTransitionWorkOrder, OPEN_WORK_ORDER_STATUSES } from '../constants/fleetVocabulary';
import { FLEET_ASSETS_COLLECTION, FleetNotFoundError, isDemoFleet } from './fleetService';
import {
  demoListWorkOrders,
  demoReportFault,
  demoAdvanceWorkOrder,
  demoGetAsset,
} from '../data/demoStore';
import { Timestamp } from 'firebase/firestore';

/**
 * Fault reports and garage work.
 *
 * A work order and the asset's status move together, because the point of
 * recording a fault is that the machine stops being offered to the next person.
 * Leaving those two to drift is how a register ends up telling somebody a
 * grounded tractor is available.
 */

export const FLEET_WORK_ORDERS_COLLECTION = 'fleetWorkOrders';

function requireDb() {
  if (!db) {
    throw new Error('Firestore is not configured. Set the VITE_FIREBASE_* values to log faults.');
  }
  return db;
}

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out as T;
}

export interface ReportFaultInput {
  assetId: string;
  faultDescription: string;
  severity: FleetFaultSeverity;
}

/**
 * Report a fault.
 *
 * Open to anyone signed in, not just the garage: the driver who finds the
 * problem is rarely the mechanic who fixes it, and a report that requires a
 * mechanic to file it is a report that never gets filed.
 *
 * A `grounded` fault takes the asset out of service immediately. Lesser
 * severities leave it usable, because a cracked mirror should not idle a
 * tractor for a week.
 */
export async function reportFault(
  input: ReportFaultInput,
  actor: StaffUser
): Promise<string> {
  if (isDemoFleet()) {
    const asset = demoGetAsset(input.assetId);
    if (!asset) throw new FleetNotFoundError(input.assetId);
    return demoReportFault({
      assetId: input.assetId,
      zoneId: asset.zoneId,
      reportedByUid: actor.uid,
      reportedByName: actor.displayName,
      reportedAt: Timestamp.now(),
      faultDescription: { en: input.faultDescription },
      severity: input.severity,
      status: 'reported',
      meterAtReport: asset.currentMeter,
      version: 1,
    });
  }

  const database = requireDb();
  const assetRef = doc(database, FLEET_ASSETS_COLLECTION, input.assetId);
  const woRef = doc(collection(database, FLEET_WORK_ORDERS_COLLECTION));

  await runTransaction(database, async (tx) => {
    const snap = await tx.get(assetRef);
    if (!snap.exists()) throw new FleetNotFoundError(input.assetId);
    const asset = snap.data() as FleetAsset;

    tx.set(
      woRef,
      stripUndefined({
        workOrderId: woRef.id,
        assetId: input.assetId,
        zoneId: asset.zoneId,
        reportedByUid: actor.uid,
        reportedByName: actor.displayName,
        reportedAt: serverTimestamp(),
        faultDescription: { en: input.faultDescription },
        severity: input.severity,
        status: 'reported' as FleetWorkOrderStatus,
        meterAtReport: asset.currentMeter,
        version: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    if (input.severity === 'grounded' && asset.status !== 'disposed') {
      tx.update(assetRef, {
        status: 'in_maintenance',
        custodianUid: null,
        custodianName: null,
        version: asset.version + 1,
        updatedAt: serverTimestamp(),
        updatedByUid: actor.uid,
      });
    }
  });

  await logAuditEvent({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorDisplayName: actor.displayName,
    actorRole: actor.role,
    module: 'fleet',
    action: 'fault_reported',
    targetType: 'fleetWorkOrder',
    targetId: woRef.id,
    targetLabel: `${input.assetId} — ${input.severity}`,
    newStatus: 'reported',
  } as any);

  return woRef.id;
}

export interface AdvanceWorkOrderInput {
  workOrderId: string;
  next: FleetWorkOrderStatus;
  expectedVersion: number;
  assignedGarage?: string;
  assignedTechnician?: string;
  partsUsed?: FleetWorkOrderPart[];
  labourCost?: number;
}

/**
 * Move a work order through its lifecycle.
 *
 * Transitions are checked against the table in fleetVocabulary rather than
 * trusted from the caller, so a stale tab or a double submit cannot walk a job
 * backwards through the garage.
 *
 * Verification is what returns the asset to service, not completion. A mechanic
 * marking their own work as finished should not put the machine back on the
 * road — that separation is the control an auditor looks for, and it is the
 * reason those are two statuses rather than one.
 */
export async function advanceWorkOrder(
  input: AdvanceWorkOrderInput,
  actor: StaffUser
): Promise<void> {
  if (isDemoFleet()) {
    const wo = demoListWorkOrders().find((w) => w.workOrderId === input.workOrderId);
    if (!wo) throw new Error('That work order no longer exists.');
    if (!canTransitionWorkOrder(wo.status, input.next)) {
      throw new Error(
        `A ${wo.status.replace('_', ' ')} job cannot move to ${input.next.replace('_', ' ')}.`
      );
    }

    // Same release rules as the live path: only verification returns a machine,
    // and only from the garage.
    const asset = demoGetAsset(wo.assetId);
    let assetStatus: FleetAssetStatus | null = null;
    if (asset) {
      if (input.next === 'verified' && asset.status === 'in_maintenance') {
        assetStatus = 'available';
      } else if (input.next === 'awaiting_parts' && asset.status === 'in_maintenance') {
        assetStatus = 'awaiting_parts';
      } else if (input.next === 'in_progress' && asset.status === 'awaiting_parts') {
        assetStatus = 'in_maintenance';
      }
    }

    const parts = input.partsUsed ?? wo.partsUsed;
    const partsTotal = (parts ?? []).reduce((sum, p) => sum + p.cost * p.quantity, 0);
    const labour = input.labourCost ?? wo.labourCost ?? 0;

    demoAdvanceWorkOrder(
      input.workOrderId,
      {
        status: input.next,
        partsUsed: parts,
        labourCost: labour,
        totalCost: partsTotal + labour,
        startedAt: input.next === 'in_progress' && !wo.startedAt ? Timestamp.now() : wo.startedAt,
        completedAt: input.next === 'completed' ? Timestamp.now() : wo.completedAt,
        verifiedAt: input.next === 'verified' ? Timestamp.now() : wo.verifiedAt,
        verifiedByUid: input.next === 'verified' ? actor.uid : wo.verifiedByUid,
      },
      assetStatus,
      actor.uid,
      actor.displayName
    );
    return;
  }

  const database = requireDb();
  const woRef = doc(database, FLEET_WORK_ORDERS_COLLECTION, input.workOrderId);

  let assetId = '';
  let previous: FleetWorkOrderStatus | undefined;

  await runTransaction(database, async (tx) => {
    const woSnap = await tx.get(woRef);
    if (!woSnap.exists()) throw new Error('That work order no longer exists.');

    const wo = woSnap.data() as FleetWorkOrder;
    assetId = wo.assetId;
    previous = wo.status;

    if (wo.version !== input.expectedVersion) {
      throw new Error('This work order was changed by someone else. Reload and try again.');
    }
    if (!canTransitionWorkOrder(wo.status, input.next)) {
      throw new Error(`A ${wo.status.replace('_', ' ')} job cannot move to ${input.next.replace('_', ' ')}.`);
    }

    const parts = input.partsUsed ?? wo.partsUsed;
    const partsTotal = (parts ?? []).reduce((sum, p) => sum + p.cost * p.quantity, 0);
    const labour = input.labourCost ?? wo.labourCost ?? 0;

    tx.update(
      woRef,
      stripUndefined({
        status: input.next,
        assignedGarage: input.assignedGarage ?? wo.assignedGarage,
        assignedTechnician: input.assignedTechnician ?? wo.assignedTechnician,
        partsUsed: parts,
        labourCost: labour,
        totalCost: partsTotal + labour,
        startedAt: input.next === 'in_progress' && !wo.startedAt ? serverTimestamp() : wo.startedAt,
        completedAt: input.next === 'completed' ? serverTimestamp() : wo.completedAt,
        verifiedAt: input.next === 'verified' ? serverTimestamp() : wo.verifiedAt,
        verifiedByUid: input.next === 'verified' ? actor.uid : wo.verifiedByUid,
        version: wo.version + 1,
        updatedAt: serverTimestamp(),
      })
    );

    const assetRef = doc(database, FLEET_ASSETS_COLLECTION, wo.assetId);
    const assetSnap = await tx.get(assetRef);
    if (assetSnap.exists()) {
      const asset = assetSnap.data() as FleetAsset;

      // Only verification returns a machine to the yard, and only if it was in
      // the garage — an asset withdrawn for another reason stays withdrawn.
      if (input.next === 'verified' && asset.status === 'in_maintenance') {
        tx.update(assetRef, {
          status: 'available',
          version: asset.version + 1,
          updatedAt: serverTimestamp(),
          updatedByUid: actor.uid,
        });
      }
      // Waiting on a part is a distinct, reportable reason for downtime.
      if (input.next === 'awaiting_parts' && asset.status === 'in_maintenance') {
        tx.update(assetRef, {
          status: 'awaiting_parts',
          version: asset.version + 1,
          updatedAt: serverTimestamp(),
          updatedByUid: actor.uid,
        });
      }
      if (input.next === 'in_progress' && asset.status === 'awaiting_parts') {
        tx.update(assetRef, {
          status: 'in_maintenance',
          version: asset.version + 1,
          updatedAt: serverTimestamp(),
          updatedByUid: actor.uid,
        });
      }
    }
  });

  await logAuditEvent({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorDisplayName: actor.displayName,
    actorRole: actor.role,
    module: 'fleet',
    action: 'work_order_advanced',
    targetType: 'fleetWorkOrder',
    targetId: input.workOrderId,
    targetLabel: `${assetId} → ${input.next}`,
    previousStatus: previous ?? null,
    newStatus: input.next,
  } as any);
}

export async function listWorkOrders(openOnly = false): Promise<FleetWorkOrder[]> {
  if (isDemoFleet()) {
    const sorted = demoListWorkOrders().sort(
      (a, b) => b.reportedAt.toMillis() - a.reportedAt.toMillis()
    );
    return openOnly ? sorted.filter((w) => OPEN_WORK_ORDER_STATUSES.includes(w.status)) : sorted;
  }
  const database = requireDb();
  const snap = await getDocs(
    query(
      collection(database, FLEET_WORK_ORDERS_COLLECTION),
      orderBy('reportedAt', 'desc'),
      fsLimit(300)
    )
  );
  const all = snap.docs.map((d) => d.data() as FleetWorkOrder);
  return openOnly ? all.filter((w) => OPEN_WORK_ORDER_STATUSES.includes(w.status)) : all;
}

export async function listWorkOrdersForAsset(assetId: string): Promise<FleetWorkOrder[]> {
  if (isDemoFleet()) {
    return demoListWorkOrders().filter((w) => w.assetId === assetId).sort(
      (a, b) => b.reportedAt.toMillis() - a.reportedAt.toMillis()
    );
  }
  const database = requireDb();
  const snap = await getDocs(
    query(
      collection(database, FLEET_WORK_ORDERS_COLLECTION),
      where('assetId', '==', assetId),
      orderBy('reportedAt', 'desc'),
      fsLimit(50)
    )
  );
  return snap.docs.map((d) => d.data() as FleetWorkOrder);
}

/** Machines that cannot work, counted apart from routine faults. */
export function countGrounded(workOrders: FleetWorkOrder[]): number {
  const grounded = new Set(
    workOrders
      .filter((w) => w.severity === 'grounded' && OPEN_WORK_ORDER_STATUSES.includes(w.status))
      .map((w) => w.assetId)
  );
  return grounded.size;
}
