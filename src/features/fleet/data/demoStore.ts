import { Timestamp } from 'firebase/firestore';
import type {
  FleetAsset,
  FleetAssetStatus,
  FleetAssignment,
  FleetStatusEvent,
  FleetWorkOrder,
} from '../types/fleet';
import { DEMO_ASSETS, DEMO_ASSIGNMENTS, DEMO_WORK_ORDERS } from './demoFleet';

/**
 * Writable in-memory register, used only when Firebase is unconfigured.
 *
 * Reads alone were not enough: with a read-only demo every button on the page is
 * a dead end, and the first thing anyone tries is changing a status. This holds
 * mutable copies of the demo records so the whole workflow — issue, return,
 * report a fault, move it through the garage, change a status — can be exercised
 * before any Firebase project exists.
 *
 * Changes live in memory for the session and vanish on reload. That is stated in
 * the UI rather than hidden, because a demo that looks like it saved and did not
 * is worse than one that never pretended.
 */

let assets: FleetAsset[] = DEMO_ASSETS.map((a) => ({ ...a }));
let assignments: FleetAssignment[] = DEMO_ASSIGNMENTS.map((a) => ({ ...a }));
let workOrders: FleetWorkOrder[] = DEMO_WORK_ORDERS.map((w) => ({ ...w }));
let statusEvents: FleetStatusEvent[] = [];

/**
 * Subscribers are notified after every mutation.
 *
 * Firestore pushes changes to every open view; without an equivalent here the
 * demo would need manual refreshes that the live version does not, and the two
 * would behave differently in exactly the way a reviewer notices.
 */
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeToDemoFleet(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((l) => l());
}

let counter = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${(counter += 1)}`;

/* --------------------------------------------------------------- reads */

export const demoListAssets = (): FleetAsset[] => assets.map((a) => ({ ...a }));
export const demoGetAsset = (assetId: string): FleetAsset | null => {
  const found = assets.find((a) => a.assetId === assetId);
  return found ? { ...found } : null;
};
export const demoListAssignments = (): FleetAssignment[] => assignments.map((a) => ({ ...a }));
export const demoListWorkOrders = (): FleetWorkOrder[] => workOrders.map((w) => ({ ...w }));
export const demoListStatusEvents = (): FleetStatusEvent[] => statusEvents.map((e) => ({ ...e }));

/* -------------------------------------------------------------- writes */

function mutateAsset(assetId: string, changes: Partial<FleetAsset>) {
  const i = assets.findIndex((a) => a.assetId === assetId);
  if (i === -1) throw new Error(`Asset ${assetId} was not found.`);
  assets[i] = { ...assets[i], ...changes, version: assets[i].version + 1 };
  return assets[i];
}

export function demoCreateAsset(asset: FleetAsset): FleetAsset {
  if (assets.some((a) => a.assetId === asset.assetId)) {
    throw new Error(`Asset ${asset.assetId} already exists in the register.`);
  }
  assets = [...assets, { ...asset }];
  notify();
  return asset;
}

export function demoUpdateAsset(assetId: string, changes: Partial<FleetAsset>): void {
  mutateAsset(assetId, changes);
  notify();
}

export function demoRecordStatusEvent(event: Omit<FleetStatusEvent, 'eventId'>): FleetStatusEvent {
  const record: FleetStatusEvent = { ...event, eventId: nextId('evt') };
  statusEvents = [...statusEvents, record];
  return record;
}

export function demoSetStatus(
  assetId: string,
  next: FleetAssetStatus,
  actorUid: string,
  actorName: string,
  reason?: string
): void {
  const current = assets.find((a) => a.assetId === assetId);
  if (!current) throw new Error(`Asset ${assetId} was not found.`);

  demoRecordStatusEvent({
    assetId,
    from: current.status,
    to: next,
    at: Timestamp.now(),
    actorUid,
    actorName,
    reason,
  });

  mutateAsset(assetId, {
    status: next,
    // A machine that is no longer assigned must not keep showing a holder, or
    // the register reads as though somebody still has it.
    custodianUid: next === 'assigned' ? current.custodianUid : undefined,
    custodianName: next === 'assigned' ? current.custodianName : undefined,
  });
  notify();
}

export function demoIssueAsset(assignment: Omit<FleetAssignment, 'assignmentId'>): string {
  const id = nextId('as');
  assignments = [...assignments, { ...assignment, assignmentId: id }];

  const asset = assets.find((a) => a.assetId === assignment.assetId);
  if (asset) {
    demoRecordStatusEvent({
      assetId: assignment.assetId,
      from: asset.status,
      to: 'assigned',
      at: Timestamp.now(),
      actorUid: assignment.issuedByUid,
      actorName: assignment.assignedToName,
      reason: `Issued to ${assignment.assignedToName}`,
    });
    mutateAsset(assignment.assetId, {
      status: 'assigned',
      custodianUid: assignment.assignedToUid,
      custodianName: assignment.assignedToName,
      currentMeter: asset.meterType === 'none' ? asset.currentMeter : assignment.meterOut,
    });
  }
  notify();
  return id;
}

export function demoReturnAsset(
  assignmentId: string,
  meterIn: number,
  toMaintenance: boolean,
  actorUid: string
): void {
  const i = assignments.findIndex((a) => a.assignmentId === assignmentId);
  if (i === -1) throw new Error('That assignment no longer exists.');

  const assignment = assignments[i];
  assignments[i] = {
    ...assignment,
    returnedAt: Timestamp.now(),
    meterIn,
    status: 'returned',
    returnedByUid: actorUid,
  };

  const asset = assets.find((a) => a.assetId === assignment.assetId);
  if (asset) {
    const next: FleetAssetStatus = toMaintenance ? 'in_maintenance' : 'available';
    demoRecordStatusEvent({
      assetId: assignment.assetId,
      from: asset.status,
      to: next,
      at: Timestamp.now(),
      actorUid,
      actorName: assignment.assignedToName,
      reason: toMaintenance ? 'Returned with a fault' : 'Returned to the yard',
    });
    mutateAsset(assignment.assetId, {
      status: next,
      custodianUid: undefined,
      custodianName: undefined,
      currentMeter: asset.meterType === 'none' ? asset.currentMeter : meterIn,
    });
  }
  notify();
}

export function demoReportFault(workOrder: Omit<FleetWorkOrder, 'workOrderId'>): string {
  const id = nextId('wo');
  workOrders = [...workOrders, { ...workOrder, workOrderId: id }];

  if (workOrder.severity === 'grounded') {
    const asset = assets.find((a) => a.assetId === workOrder.assetId);
    if (asset && asset.status !== 'disposed') {
      demoRecordStatusEvent({
        assetId: workOrder.assetId,
        from: asset.status,
        to: 'in_maintenance',
        at: Timestamp.now(),
        actorUid: workOrder.reportedByUid,
        actorName: workOrder.reportedByName ?? 'Staff',
        reason: 'Grounded by a reported fault',
      });
      mutateAsset(workOrder.assetId, {
        status: 'in_maintenance',
        custodianUid: undefined,
        custodianName: undefined,
      });
    }
  }
  notify();
  return id;
}

export function demoAdvanceWorkOrder(
  workOrderId: string,
  changes: Partial<FleetWorkOrder>,
  assetStatus: FleetAssetStatus | null,
  actorUid: string,
  actorName: string
): void {
  const i = workOrders.findIndex((w) => w.workOrderId === workOrderId);
  if (i === -1) throw new Error('That work order no longer exists.');

  const wo = workOrders[i];
  workOrders[i] = { ...wo, ...changes, version: wo.version + 1 };

  if (assetStatus) {
    const asset = assets.find((a) => a.assetId === wo.assetId);
    if (asset) {
      demoRecordStatusEvent({
        assetId: wo.assetId,
        from: asset.status,
        to: assetStatus,
        at: Timestamp.now(),
        actorUid,
        actorName,
        reason: `Work order ${changes.status ?? wo.status}`,
      });
      mutateAsset(wo.assetId, { status: assetStatus });
    }
  }
  notify();
}

/** Restore the register to its opening state. */
export function demoReset(): void {
  assets = DEMO_ASSETS.map((a) => ({ ...a }));
  assignments = DEMO_ASSIGNMENTS.map((a) => ({ ...a }));
  workOrders = DEMO_WORK_ORDERS.map((w) => ({ ...w }));
  statusEvents = [];
  notify();
}

/* --------------------------------------- single-collection reconciliation */

/*
 * The three below touch one collection each and never the asset row.
 *
 * Deliberate: when a status change has to close a sign-out and open a job as
 * well, exactly one writer may own the asset's status, or the reconciliation
 * ends up fighting the change that triggered it. That writer is demoSetStatus.
 */

/** Close a sign-out without moving the asset. */
export function demoCloseAssignment(assignmentId: string, meterIn: number, actorUid: string): void {
  const i = assignments.findIndex((a) => a.assignmentId === assignmentId);
  if (i === -1) return;
  assignments[i] = {
    ...assignments[i],
    returnedAt: Timestamp.now(),
    meterIn,
    status: 'returned',
    returnedByUid: actorUid,
  };
  notify();
}

/** Append a job without moving the asset. */
export function demoAppendWorkOrder(workOrder: Omit<FleetWorkOrder, 'workOrderId'>): string {
  const id = nextId('wo');
  workOrders = [...workOrders, { ...workOrder, workOrderId: id }];
  notify();
  return id;
}

/** Close every open job on an asset without moving the asset. */
export function demoCancelOpenWorkOrders(assetId: string, openStatuses: readonly string[]): number {
  let closed = 0;
  workOrders = workOrders.map((w) => {
    if (w.assetId !== assetId || !openStatuses.includes(w.status)) return w;
    closed += 1;
    return { ...w, status: 'cancelled' as FleetWorkOrder['status'], version: w.version + 1 };
  });
  if (closed) notify();
  return closed;
}
