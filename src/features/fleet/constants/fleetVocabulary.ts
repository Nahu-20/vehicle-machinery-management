import type {
  FleetAsset,
  FleetAssetStatus,
  FleetAssetType,
  FleetFaultSeverity,
  FleetMeterType,
  FleetWorkOrderStatus,
} from '../types/fleet';
import { NON_ISSUABLE_STATUSES } from '../types/fleet';

/**
 * Display vocabulary and derived rules for the fleet register.
 *
 * Kept apart from the service layer so the same rules drive the UI badges and
 * the write-time guards, rather than each re-deciding what "due" or "issuable"
 * means and drifting apart.
 */

export const FLEET_ASSET_TYPES: readonly FleetAssetType[] = [
  'tractor',
  'harvester',
  'implement',
  'pickup',
  'truck',
  'motorcycle',
  'bus',
  'pump',
  'generator',
  'other',
];

export const FLEET_ASSET_STATUSES: readonly FleetAssetStatus[] = [
  'available',
  'assigned',
  'in_maintenance',
  'awaiting_parts',
  'out_of_service',
  'disposed',
];

/**
 * The meter a given asset type is serviced on.
 *
 * Used to default the field when staff add an asset. It is a default and not a
 * constraint: a bureau may well own a tractor fitted with an odometer, and
 * refusing to record that would push the user back to paper.
 */
export const DEFAULT_METER_BY_TYPE: Record<FleetAssetType, FleetMeterType> = {
  tractor: 'hours',
  harvester: 'hours',
  implement: 'none',
  pickup: 'kilometres',
  truck: 'kilometres',
  motorcycle: 'kilometres',
  bus: 'kilometres',
  pump: 'hours',
  generator: 'hours',
  other: 'none',
};

/** Unit suffix for display. Deliberately short — these appear inside table cells. */
export const METER_UNIT_LABEL: Record<FleetMeterType, string> = {
  hours: 'hrs',
  kilometres: 'km',
  none: '',
};

/**
 * Status colour, expressed in the admin area's slate/emerald vocabulary.
 *
 * The dashboard is read at a glance and often across a room, so hue carries the
 * meaning and the text repeats it for anyone who cannot rely on colour.
 */
export const STATUS_PILL_CLASSES: Record<FleetAssetStatus, string> = {
  available:
    'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  assigned: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
  in_maintenance:
    'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
  awaiting_parts:
    'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30',
  out_of_service: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30',
  disposed: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

export const SEVERITY_PILL_CLASSES: Record<FleetFaultSeverity, string> = {
  low: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
  medium: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
  high: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30',
  grounded: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30',
};

/**
 * Which work-order statuses may follow which.
 *
 * Encoded rather than left to the UI so an out-of-order write — a stale tab, a
 * double submit — is rejected at the service layer instead of quietly moving a
 * job backwards through the garage.
 */
export const WORK_ORDER_TRANSITIONS: Record<
  FleetWorkOrderStatus,
  readonly FleetWorkOrderStatus[]
> = {
  reported: ['triaged', 'cancelled'],
  triaged: ['in_progress', 'awaiting_parts', 'cancelled'],
  in_progress: ['awaiting_parts', 'completed', 'cancelled'],
  awaiting_parts: ['in_progress', 'cancelled'],
  completed: ['verified', 'in_progress'],
  verified: [],
  cancelled: [],
};

export function canTransitionWorkOrder(
  from: FleetWorkOrderStatus,
  to: FleetWorkOrderStatus
): boolean {
  return WORK_ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Work-order statuses that mean the asset is still in the garage's hands. */
export const OPEN_WORK_ORDER_STATUSES: readonly FleetWorkOrderStatus[] = [
  'reported',
  'triaged',
  'in_progress',
  'awaiting_parts',
];

/**
 * Whether an asset may be issued.
 *
 * A single predicate used by both the issue form and the service write, so the
 * button being disabled and the write being refused can never disagree.
 */
export function isIssuable(asset: Pick<FleetAsset, 'status'>): boolean {
  return !NON_ISSUABLE_STATUSES.includes(asset.status);
}

/**
 * Whether an asset is due for service.
 *
 * Derived on read rather than stored, so it cannot go stale against a meter
 * that moved. Assets with no interval or no meter are never due — an implement
 * has no hours to accumulate, and treating a missing interval as zero would
 * flag the entire register on day one and train staff to ignore the warning.
 */
export function isServiceDue(asset: FleetAsset): boolean {
  if (asset.meterType === 'none') return false;
  if (!asset.serviceIntervalMeter || asset.serviceIntervalMeter <= 0) return false;

  const since = asset.currentMeter - (asset.lastServiceMeter ?? 0);
  return since >= asset.serviceIntervalMeter;
}

/** How far past due, in the asset's own unit. Negative means not yet due. */
export function meterUntilService(asset: FleetAsset): number | null {
  if (asset.meterType === 'none') return null;
  if (!asset.serviceIntervalMeter || asset.serviceIntervalMeter <= 0) return null;

  const since = asset.currentMeter - (asset.lastServiceMeter ?? 0);
  return asset.serviceIntervalMeter - since;
}

/**
 * Compliance expiry within `days`.
 *
 * Road vehicles only in practice, since farm machinery carries neither. Returns
 * false for missing dates rather than treating absent as expired, for the same
 * reason as above: a register full of false warnings gets ignored wholesale.
 */
export function isExpiringSoon(
  expiry: { toDate?: () => Date } | null | undefined,
  days = 30
): boolean {
  if (!expiry?.toDate) return false;
  const ms = expiry.toDate().getTime() - Date.now();
  return ms > 0 && ms <= days * 24 * 60 * 60 * 1000;
}

export function isExpired(expiry: { toDate?: () => Date } | null | undefined): boolean {
  if (!expiry?.toDate) return false;
  return expiry.toDate().getTime() < Date.now();
}

/**
 * Format a meter value with its unit, e.g. "1,258 hrs".
 *
 * Thousands separators matter here: a five-digit odometer reading is easy to
 * misread by an order of magnitude on a dense table row.
 */
export function formatMeter(value: number, meterType: FleetMeterType): string {
  if (meterType === 'none') return '—';
  return `${value.toLocaleString()} ${METER_UNIT_LABEL[meterType]}`.trim();
}

/**
 * A status or work-order value written for a person.
 *
 * Every underscore, not the first: `.replace('_', ' ')` turns out_of_service
 * into 'out of_service', which is how it reached the timeline and the status
 * dropdown.
 */
export function humanise(value: string): string {
  return value.replace(/_/g, ' ');
}

/* ------------------------------------------------- status consistency */

/**
 * Statuses that only mean something because a work order says so.
 *
 * A machine is not "in the garage" because a field says it is; it is in the
 * garage because there is a job on it. Keeping the two apart is what let an
 * asset read "In garage" on every screen while the garage queue had no job for
 * it — visible to everyone, actionable by nobody.
 */
export const GARAGE_STATUSES: readonly FleetAssetStatus[] = ['in_maintenance', 'awaiting_parts'];

export function isGarageStatus(status: FleetAssetStatus): boolean {
  return GARAGE_STATUSES.includes(status);
}

/**
 * Statuses an administrator may set by hand.
 *
 * `assigned` is absent because issuing needs a holder, a purpose and a meter
 * reading, none of which a status dropdown collects — setting it directly
 * produced a machine recorded as out on loan to nobody. `disposed` is absent
 * because retiring is irreversible and belongs to the retire action.
 */
export const MANUAL_ASSET_STATUSES: readonly FleetAssetStatus[] = [
  'available',
  'in_maintenance',
  'awaiting_parts',
  'out_of_service',
];

/** What else has to change so the register still agrees with itself. */
export interface StatusChangePlan {
  /** Close the open sign-out: the holder no longer has it. */
  closeAssignment: boolean;
  /** Raise a job, so the garage can see what it has been given. */
  raiseWorkOrder: boolean;
  /** Close the open jobs: the machine has left the garage. */
  cancelWorkOrders: boolean;
}

export interface StatusChangeContext {
  hasActiveAssignment: boolean;
  openWorkOrderCount: number;
}

/**
 * Work out what a status change implies for the other two collections.
 *
 * Pure and separate from the writes so both the demo store and Firestore reach
 * the same conclusion, and so the invariants can be tested without a project or
 * a network. See `fleetStatusService.ts` for the half that executes it.
 */
export function planStatusChange(
  from: FleetAssetStatus,
  to: FleetAssetStatus,
  ctx: StatusChangeContext
): StatusChangePlan {
  if (from === 'disposed') {
    throw new Error('A retired asset cannot be returned to service.');
  }
  if (from === to) {
    throw new Error('That is already the current status.');
  }
  if (!MANUAL_ASSET_STATUSES.includes(to)) {
    throw new Error(
      to === 'assigned'
        ? 'Issue the machine instead — that records who has it and on what reading.'
        : `${humanise(to)} cannot be set from here.`
    );
  }

  const leavingGarage = isGarageStatus(from) && !isGarageStatus(to);
  const inGarage = isGarageStatus(to);

  return {
    closeAssignment: from === 'assigned' && ctx.hasActiveAssignment,
    // Only when nothing is open: a machine moved from repair to awaiting parts
    // is the same job continuing, not a second fault.
    raiseWorkOrder: inGarage && ctx.openWorkOrderCount === 0,
    cancelWorkOrders: leavingGarage && ctx.openWorkOrderCount > 0,
  };
}
