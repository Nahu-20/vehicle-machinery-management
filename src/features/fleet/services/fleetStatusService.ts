import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { StaffUser } from '../../../types/auth';
import type { FleetAssetStatus, FleetWorkOrder } from '../types/fleet';
import {
  OPEN_WORK_ORDER_STATUSES,
  humanise,
  isGarageStatus,
  planStatusChange,
} from '../constants/fleetVocabulary';
import {
  FleetNotFoundError,
  getAssetById,
  isDemoFleet,
  setAssetStatus,
} from './fleetService';
import { FLEET_ASSIGNMENTS_COLLECTION, listAssignmentsForAsset } from './fleetAssignmentService';
import { FLEET_WORK_ORDERS_COLLECTION, listWorkOrdersForAsset } from './fleetWorkOrderService';
import {
  demoAppendWorkOrder,
  demoCancelOpenWorkOrders,
  demoCloseAssignment,
} from '../data/demoStore';

/**
 * Changing an asset's status, and everything that has to change with it.
 *
 * Three collections describe one machine, and two of the six statuses are true
 * only because of a record in another of them. `assigned` is a claim about an
 * open sign-out; `in_maintenance` and `awaiting_parts` are claims about an open
 * job. Writing the field alone made those claims without the records behind
 * them — an asset that read "In garage" on the register, the map and the
 * dashboard while Garage & Repairs, which lists jobs rather than assets, had
 * nothing to show. Visible to everyone, actionable by nobody, and with no way
 * back out through the normal workflow.
 *
 * So the status change is not a field write. It closes the sign-out the machine
 * is leaving, raises the job the garage needs to see, and closes the jobs a
 * released machine no longer has.
 *
 * This lives in its own module rather than in fleetService because both of the
 * other services already import that one, and reaching back into them from
 * there would close an import cycle.
 */

export interface ChangeAssetStatusInput {
  assetId: string;
  next: FleetAssetStatus;
  expectedVersion: number;
  /** Recorded on the timeline and used as the fault description when a job is raised. */
  reason?: string;
}

export interface ChangeAssetStatusResult {
  closedAssignmentId: string | null;
  raisedWorkOrderId: string | null;
  cancelledWorkOrders: number;
}

export async function changeAssetStatus(
  input: ChangeAssetStatusInput,
  actor: StaffUser
): Promise<ChangeAssetStatusResult> {
  const asset = await getAssetById(input.assetId);
  if (!asset) throw new FleetNotFoundError(input.assetId);

  // Read the neighbouring records before planning. Firestore's client SDK
  // cannot run a query inside a transaction, so this cannot be one atomic
  // operation; it is an occasional administrative correction rather than a hot
  // path, and the reconciliation below is idempotent enough that a partial
  // failure leaves the next attempt able to finish the job.
  const [assignments, workOrders] = await Promise.all([
    listAssignmentsForAsset(input.assetId).catch(() => []),
    listWorkOrdersForAsset(input.assetId).catch(() => [] as FleetWorkOrder[]),
  ]);

  const activeAssignment = assignments.find((a) => a.status !== 'returned') ?? null;
  const openWorkOrders = workOrders.filter((w) => OPEN_WORK_ORDER_STATUSES.includes(w.status));

  // Throws on a change that must not happen at all — reviving a retired asset,
  // a no-op, or a status that only another workflow may set.
  const plan = planStatusChange(asset.status, input.next, {
    hasActiveAssignment: Boolean(activeAssignment),
    openWorkOrderCount: openWorkOrders.length,
  });

  const reason = input.reason?.trim() || undefined;
  const result: ChangeAssetStatusResult = {
    closedAssignmentId: null,
    raisedWorkOrderId: null,
    cancelledWorkOrders: 0,
  };

  const database = db;

  /* ---- the sign-out the machine is leaving */

  if (plan.closeAssignment && activeAssignment) {
    // Closed at the current reading rather than asking for one. A machine
    // pulled out of service by an administrator is not standing at a return
    // desk with someone reading its meter, and inventing a number would be
    // worse than carrying the last one forward.
    if (isDemoFleet()) {
      demoCloseAssignment(activeAssignment.assignmentId, asset.currentMeter, actor.uid);
    } else if (database) {
      await updateDoc(doc(database, FLEET_ASSIGNMENTS_COLLECTION, activeAssignment.assignmentId), {
        returnedAt: serverTimestamp(),
        meterIn: asset.currentMeter,
        status: 'returned',
        returnedByUid: actor.uid,
        updatedAt: serverTimestamp(),
      });
    }
    result.closedAssignmentId = activeAssignment.assignmentId;
  }

  /* ---- the job the garage needs to see */

  if (plan.raiseWorkOrder) {
    const description = reason
      ? reason
      : `Moved to ${humanise(input.next)} by ${actor.displayName}`;
    // 'high' rather than 'grounded': grounded is what the dashboard counts as a
    // machine that cannot work, and it is reportFault's word for a fault severe
    // enough to stop the job. An administrator parking a machine in the garage
    // has not made that judgement, and borrowing the word would inflate the
    // count that the whole dashboard is read for.
    const base: Omit<FleetWorkOrder, 'workOrderId'> = {
      assetId: asset.assetId,
      zoneId: asset.zoneId,
      reportedByUid: actor.uid,
      reportedByName: actor.displayName,
      reportedAt: Timestamp.now(),
      faultDescription: { en: description },
      severity: 'high',
      status: 'reported',
      meterAtReport: asset.currentMeter,
      version: 1,
    } as Omit<FleetWorkOrder, 'workOrderId'>;

    if (isDemoFleet()) {
      result.raisedWorkOrderId = demoAppendWorkOrder(base);
    } else if (database) {
      const ref = doc(collection(database, FLEET_WORK_ORDERS_COLLECTION));
      await setDoc(ref, {
        ...base,
        workOrderId: ref.id,
        reportedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      result.raisedWorkOrderId = ref.id;
    }
  }

  /* ---- the jobs a released machine no longer has */

  if (plan.cancelWorkOrders) {
    // Cancelled, not verified. Verification is a mechanic signing off a repair,
    // and a machine released by an administrator has not been signed off by
    // anyone — recording it as verified would put work in the history that
    // nobody did.
    if (isDemoFleet()) {
      result.cancelledWorkOrders = demoCancelOpenWorkOrders(
        asset.assetId,
        OPEN_WORK_ORDER_STATUSES
      );
    } else if (database) {
      await Promise.all(
        openWorkOrders.map((w) =>
          updateDoc(doc(database, FLEET_WORK_ORDERS_COLLECTION, w.workOrderId), {
            status: 'cancelled',
            version: w.version + 1,
            updatedAt: serverTimestamp(),
            updatedByUid: actor.uid,
          })
        )
      );
      result.cancelledWorkOrders = openWorkOrders.length;
    }
  }

  /* ---- and the status itself, last, as the only writer of that field */

  await setAssetStatus(asset.assetId, input.next, input.expectedVersion, actor, {
    reason: describe(reason, result, input.next),
  });

  return result;
}

/** What the timeline should say happened, including the knock-on effects. */
function describe(
  reason: string | undefined,
  result: ChangeAssetStatusResult,
  next: FleetAssetStatus
): string | undefined {
  const parts: string[] = [];
  if (reason) parts.push(reason);
  if (result.closedAssignmentId) parts.push('sign-out closed');
  if (result.raisedWorkOrderId) parts.push('job raised for the garage');
  if (result.cancelledWorkOrders > 0) {
    parts.push(
      `${result.cancelledWorkOrders} open job${result.cancelledWorkOrders === 1 ? '' : 's'} cancelled`
    );
  }
  if (parts.length === 0) return isGarageStatus(next) ? 'Moved to the garage' : undefined;
  return parts.join(' · ');
}
