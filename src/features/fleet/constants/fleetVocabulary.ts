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
