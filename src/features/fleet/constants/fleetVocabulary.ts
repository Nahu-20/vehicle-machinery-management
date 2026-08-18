import type {
  FleetAsset,
  FleetAssetStatus,
  FleetAssetType,
  FleetDriver,
  FleetDriverStatus,
  FleetFaultSeverity,
  FleetFuelLog,
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

/**
 * The types that go on a public road.
 *
 * Lived as a literal array inside the asset form, where it decided whether to
 * show the plate and insurance fields. It now also decides whether an expired
 * licence stops an issue, so it belongs here with the other rules rather than
 * being written out a second time and drifting.
 */
export const ROAD_VEHICLE_TYPES: readonly FleetAssetType[] = [
  'pickup',
  'truck',
  'motorcycle',
  'bus',
];

export function isRoadVehicle(assetType: FleetAssetType): boolean {
  return ROAD_VEHICLE_TYPES.includes(assetType);
}

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

/**
 * Work-order statuses where the work itself is unfinished.
 *
 * Narrower than 'the garage still has it' — see IN_GARAGE_WORK_ORDER_STATUSES
 * below. This is the list that answers 'is there still something to do', and
 * it is the one used when a job has to be abandoned, because a finished repair
 * must never be cancelled out from under its own cost record.
 */
export const OPEN_WORK_ORDER_STATUSES: readonly FleetWorkOrderStatus[] = [
  'reported',
  'triaged',
  'in_progress',
  'awaiting_parts',
];

/**
 * Work-order statuses where the garage still holds the machine.
 *
 * Includes 'completed', which the open list above deliberately does not: the
 * repair is done but nobody has signed it back onto the road, so the machine is
 * still in the yard and the job is still the garage's to answer for.
 *
 * Conflating the two put a completed job under 'Show closed' while the asset
 * stayed in_maintenance — the queue showed nothing, the register showed a
 * machine in the garage, and the two had to be reconciled by hand.
 */
export const IN_GARAGE_WORK_ORDER_STATUSES: readonly FleetWorkOrderStatus[] = [
  ...OPEN_WORK_ORDER_STATUSES,
  'completed',
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
  // A retired machine is out of the register. Listing one as due for service
  // put work on a maintenance schedule for a vehicle the Bureau no longer has.
  if (asset.status === 'disposed') return false;
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
  /** Abandon unfinished jobs: the machine has left the garage without them. */
  cancelWorkOrders: boolean;
  /** Sign off finished jobs: the repair was done, the release confirms it. */
  verifyWorkOrders: boolean;
}

export interface StatusChangeContext {
  hasActiveAssignment: boolean;
  /** Jobs with work still to do. */
  openWorkOrderCount: number;
  /** Jobs repaired but not yet signed back into service. */
  completedWorkOrderCount: number;
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
  /*
   * Retiring, which the dropdown cannot reach but the retire action can.
   *
   * This case was missing entirely, and because `disposed` is not in
   * MANUAL_ASSET_STATUSES the planner refused it — so retireAsset went straight
   * to setAssetStatus and skipped all of this. The machine was retired and its
   * paperwork was not: open jobs stayed open in the garage against a machine
   * the Bureau no longer owns, and an active sign-out stayed open forever,
   * because nothing else will ever close it.
   *
   * Unlike leaving the garage, this cancels regardless of where it is coming
   * from. A job against a disposed machine is moot whether it was in for
   * repair or grounded in a field.
   *
   * Completed jobs are left alone rather than auto-verified: signing off a
   * repair means confirming the machine works, and nobody is confirming
   * anything about a machine that has just been sold.
   */
  if (to === 'disposed') {
    return {
      closeAssignment: ctx.hasActiveAssignment,
      raiseWorkOrder: false,
      cancelWorkOrders: ctx.openWorkOrderCount > 0,
      verifyWorkOrders: false,
    };
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
  const held = ctx.openWorkOrderCount + ctx.completedWorkOrderCount;

  return {
    closeAssignment: from === 'assigned' && ctx.hasActiveAssignment,
    // Only when the garage holds nothing already: a machine moved from repair to
    // awaiting parts is the same job continuing, not a second fault, and one
    // waiting on sign-off does not need a fresh job raised against it either.
    raiseWorkOrder: inGarage && held === 0,
    cancelWorkOrders: leavingGarage && ctx.openWorkOrderCount > 0,
    // Finished work is signed off, never cancelled. Cancelling would throw away
    // the record of a repair that happened and the money it cost.
    verifyWorkOrders: leavingGarage && ctx.completedWorkOrderCount > 0,
  };
}

/* ------------------------------------------------------------- drivers */

export const DRIVER_STATUS_PILL_CLASSES: Record<FleetDriverStatus, string> = {
  active: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  suspended: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30',
  inactive: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

export const DRIVER_STATUS_LABELS: Record<FleetDriverStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  inactive: 'Left',
};

/**
 * Where a licence stands.
 *
 * `none` is a state, not an absence. A driver with no licence recorded is not
 * the same as a driver whose licence is valid, and the existing expiry helpers
 * cannot tell them apart — both isExpired and isExpiringSoon return false for a
 * missing date, so an unrecorded licence reads as fine. Naming the case is what
 * lets the register say 'nobody typed this in' out loud.
 */
export type LicenceState = 'valid' | 'expiring' | 'lapsed' | 'none';

export const LICENCE_LABELS: Record<LicenceState, string> = {
  valid: 'Licence valid',
  expiring: 'Licence expiring',
  lapsed: 'Licence lapsed',
  none: 'No licence recorded',
};

export const LICENCE_PILL_CLASSES: Record<LicenceState, string> = {
  valid: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  expiring: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
  lapsed: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30',
  none: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

/** Whole days until an expiry. Negative means past, null means no date held. */
export function daysUntil(expiry: { toDate?: () => Date } | null | undefined): number | null {
  if (!expiry?.toDate) return null;
  const ms = expiry.toDate().getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function licenceState(
  driver: Pick<FleetDriver, 'licenceNumber' | 'licenceExpiry'>,
  days = 30
): LicenceState {
  // Both halves are required. A number with no expiry cannot be checked, and an
  // expiry with no number is not a licence anybody can produce at a roadblock.
  if (!driver.licenceNumber?.trim() || !driver.licenceExpiry) return 'none';
  if (isExpired(driver.licenceExpiry)) return 'lapsed';
  if (isExpiringSoon(driver.licenceExpiry, days)) return 'expiring';
  return 'valid';
}

/** Whether this driver may be given this machine, and what the issuer should know. */
export interface DriverEligibility {
  allowed: boolean;
  /** Why not. Present only when allowed is false. */
  reason?: string;
  /** Worth saying, but not worth stopping the work for. */
  warning?: string;
}

/**
 * Decide whether a driver may take a machine.
 *
 * The asymmetry here is deliberate and is the whole point of the function.
 *
 * A road vehicle with a lapsed or unrecorded licence is refused outright, at the
 * service layer rather than by greying a button, because that is the one case
 * with consequences outside this system: if a Bureau pickup is stopped or is in
 * a collision, the register is the evidence, and 'the software let me' is not a
 * defence anyone wants to be making.
 *
 * Farm machinery only warns. A tractor working a field needs no road licence,
 * and a system that refuses to record real work is a system people stop using —
 * which costs the register far more than the warning was worth. The warning
 * still appears, because the same tractor driven down a road does need one.
 */
export function assessDriverForAsset(
  driver: Pick<FleetDriver, 'fullName' | 'status' | 'licenceNumber' | 'licenceExpiry'>,
  asset: Pick<FleetAsset, 'assetId' | 'assetType'>
): DriverEligibility {
  if (driver.status === 'suspended') {
    return {
      allowed: false,
      reason: `${driver.fullName} is suspended and may not be issued a machine.`,
    };
  }
  if (driver.status === 'inactive') {
    return {
      allowed: false,
      reason: `${driver.fullName} has left the register and may not be issued a machine.`,
    };
  }

  const state = licenceState(driver);
  const road = isRoadVehicle(asset.assetType);
  const days = daysUntil(driver.licenceExpiry);

  if (road) {
    if (state === 'none') {
      return {
        allowed: false,
        reason: `${asset.assetId} goes on the road and no licence is recorded for ${driver.fullName}.`,
      };
    }
    if (state === 'lapsed') {
      return {
        allowed: false,
        reason: `${driver.fullName}'s licence lapsed ${Math.abs(days ?? 0)} day(s) ago, and ${asset.assetId} goes on the road.`,
      };
    }
    if (state === 'expiring') {
      return {
        allowed: true,
        warning: `${driver.fullName}'s licence expires in ${days} day(s). Renew it before this machine is due back.`,
      };
    }
    return { allowed: true };
  }

  if (state === 'none') {
    return {
      allowed: true,
      warning: `No licence is recorded for ${driver.fullName}. ${asset.assetId} does not need one in the field, but moving it by road does.`,
    };
  }
  if (state === 'lapsed') {
    return {
      allowed: true,
      warning: `${driver.fullName}'s licence lapsed ${Math.abs(days ?? 0)} day(s) ago. ${asset.assetId} may still be worked, but not driven on a road.`,
    };
  }
  if (state === 'expiring') {
    return {
      allowed: true,
      warning: `${driver.fullName}'s licence expires in ${days} day(s).`,
    };
  }
  return { allowed: true };
}

/* ---------------------------------------------------------- compliance */

/**
 * Where a document stands.
 *
 * `unknown` is the value this whole section exists for. isExpired and
 * isExpiringSoon both return false for a missing date, which is correct for
 * each of them on its own and disastrous when they are the only two questions
 * asked: a pickup with no insurance date ever typed in passes both and reads
 * exactly like a pickup insured until next year. The register was reporting
 * "nothing lapsing" over vehicles nobody had checked.
 *
 * So absent is a state, not a silence. `unknown` says the Bureau does not know,
 * which is a different problem from `lapsed` and needs a different person to
 * fix it — a clerk with a filing cabinet rather than a broker with an invoice.
 */
export type ComplianceSeverity = 'ok' | 'due_soon' | 'lapsed' | 'unknown';

export type ComplianceKind = 'insurance' | 'inspection' | 'licence';

export interface ComplianceItem {
  kind: ComplianceKind;
  label: string;
  expiry: Timestampish | null;
  severity: ComplianceSeverity;
  /** Days until expiry; negative is overdue, null when no date is held. */
  days: number | null;
}

/** The shape both Firestore Timestamps and the test fixtures satisfy. */
type Timestampish = { toDate?: () => Date };

export const COMPLIANCE_LABELS: Record<ComplianceSeverity, string> = {
  ok: 'Valid',
  due_soon: 'Expiring',
  lapsed: 'Lapsed',
  unknown: 'Not recorded',
};

export const COMPLIANCE_PILL_CLASSES: Record<ComplianceSeverity, string> = {
  ok: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  due_soon: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
  lapsed: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30',
  unknown: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

/** Worst first, so a list can be sorted by how much it matters. */
export const COMPLIANCE_ORDER: Record<ComplianceSeverity, number> = {
  lapsed: 0,
  unknown: 1,
  due_soon: 2,
  ok: 3,
};

function gradeExpiry(expiry: Timestampish | null | undefined, days: number): ComplianceSeverity {
  if (!expiry?.toDate) return 'unknown';
  if (isExpired(expiry)) return 'lapsed';
  if (isExpiringSoon(expiry, days)) return 'due_soon';
  return 'ok';
}

/**
 * The documents this machine is expected to carry, and where each one stands.
 *
 * Farm machinery returns an empty list rather than a row of `unknown`. A plough
 * has no insurance to lapse, and reporting one as missing paperwork would bury
 * the pickups that genuinely are missing it — which is how a warning list stops
 * being read at all.
 */
export function assessAssetCompliance(
  asset: Pick<FleetAsset, 'assetType' | 'status' | 'insuranceExpiry' | 'inspectionExpiry'>,
  days = 30
): ComplianceItem[] {
  // A retired machine is out of the register and needs no cover.
  if (asset.status === 'disposed') return [];
  if (!isRoadVehicle(asset.assetType)) return [];

  return [
    {
      kind: 'insurance' as const,
      label: 'Insurance',
      expiry: asset.insuranceExpiry ?? null,
      severity: gradeExpiry(asset.insuranceExpiry, days),
      days: daysUntil(asset.insuranceExpiry),
    },
    {
      kind: 'inspection' as const,
      label: 'Roadworthiness',
      expiry: asset.inspectionExpiry ?? null,
      severity: gradeExpiry(asset.inspectionExpiry, days),
      days: daysUntil(asset.inspectionExpiry),
    },
  ];
}

/**
 * A driver's licence, in the same shape as a vehicle's documents.
 *
 * Same shape on purpose: an office chasing renewals is doing one job, and
 * splitting it across two screens because one document happens to belong to a
 * person is an accident of the data model rather than anything the work needs.
 */
export function assessDriverCompliance(
  driver: Pick<FleetDriver, 'status' | 'licenceNumber' | 'licenceExpiry'>,
  days = 30
): ComplianceItem[] {
  // Someone who has left holds nothing and drives nothing.
  if (driver.status === 'inactive') return [];

  const state = licenceState(driver, days);
  return [
    {
      kind: 'licence',
      label: 'Driving licence',
      expiry: driver.licenceExpiry ?? null,
      severity:
        state === 'none'
          ? 'unknown'
          : state === 'lapsed'
          ? 'lapsed'
          : state === 'expiring'
          ? 'due_soon'
          : 'ok',
      days: daysUntil(driver.licenceExpiry),
    },
  ];
}

/** The worst of a set, for a single badge on a row. Nothing at all reads as ok. */
export function worstSeverity(items: ComplianceItem[]): ComplianceSeverity {
  return items.reduce<ComplianceSeverity>(
    (worst, item) => (COMPLIANCE_ORDER[item.severity] < COMPLIANCE_ORDER[worst] ? item.severity : worst),
    'ok'
  );
}

/** Whether this needs somebody to do something about it. */
export function needsAttention(severity: ComplianceSeverity): boolean {
  return severity !== 'ok';
}

/* --------------------------------------------------------------- fuel */

/**
 * How the fuel figures are worked out, and where they cannot be.
 *
 * The method is tank-to-tank: fill the tank, drive, fill it again, and the
 * litres it took the second time are the litres the machine used over that
 * distance. It is the only method available without hardware, and it is only
 * valid between two *full* tanks — which is why every gap below has to be named
 * rather than quietly averaged over.
 *
 * The alternative, dividing every fill by the distance since the fill before it,
 * looks the same on a tidy dataset and is wrong the moment anyone puts in
 * 20 litres to get home. It would report that machine as extraordinarily
 * economical, and the more part-fills a yard does the better its fleet would
 * look on paper.
 */
export type FuelGapReason = 'ok' | 'first-fill' | 'partial' | 'no-meter' | 'meter-backwards';

export const FUEL_GAP_EXPLANATIONS: Record<FuelGapReason, string> = {
  ok: 'Measured between two full tanks.',
  'first-fill': 'The first fill on record — nothing before it to measure against.',
  partial: 'Part-fill. Its litres count towards the next full tank.',
  'no-meter': 'No usable reading, so nothing can be worked out from it.',
  'meter-backwards': 'The reading is not above the last one. Check the slip.',
};

export interface FuelConsumptionPoint {
  fuelLogId: string;
  at: { toDate?: () => Date };
  /** Litres on this slip. */
  litres: number;
  /** Distance or hours since the last full tank. */
  meterDelta: number | null;
  /** Litres attributed to that interval, including any part-fills carried in. */
  litresUsed: number | null;
  /** km/L on kilometres, L/hr on hours. Null whenever the interval is not measurable. */
  consumption: number | null;
  reason: FuelGapReason;
}

/**
 * Work out what each fill tells us, in order.
 *
 * Ascending by date, because the arithmetic is between neighbours and a list
 * sorted for display is the wrong way round.
 */
export function computeConsumption(
  asset: Pick<FleetAsset, 'meterType'>,
  logs: FleetFuelLog[]
): FuelConsumptionPoint[] {
  // Voided slips are excluded outright rather than zeroed: a mistyped fill did
  // not happen, and leaving it in with zero litres would still break the
  // interval either side of it.
  const ordered = [...logs]
    .filter((l) => !l.voidedAt)
    .sort((a, b) => a.filledAt.toMillis() - b.filledAt.toMillis());

  const noMeter = asset.meterType === 'none';

  let lastFullMeter: number | null = null;
  /** Litres put in since the last full tank, from part-fills. */
  let carried = 0;

  return ordered.map((log) => {
    const base = {
      fuelLogId: log.fuelLogId,
      at: log.filledAt,
      litres: log.litres,
      meterDelta: null as number | null,
      litresUsed: null as number | null,
      consumption: null as number | null,
    };

    // A generator with no hour meter can be costed but never rated. Saying so
    // is better than showing a figure derived from a reading nobody took.
    if (noMeter || log.meterAtFill == null) {
      return { ...base, reason: 'no-meter' as const };
    }

    if (!log.fullTank) {
      // Not measurable on its own, but the fuel went in and has to be counted
      // somewhere. Dropping it is what makes a fleet look better than it is.
      carried += log.litres;
      return { ...base, reason: 'partial' as const };
    }

    if (lastFullMeter === null) {
      lastFullMeter = log.meterAtFill;
      carried = 0;
      return { ...base, reason: 'first-fill' as const };
    }

    const delta = log.meterAtFill - lastFullMeter;
    if (delta <= 0) {
      // A meter that did not move, or moved backwards: a mistyped slip, or a
      // replaced instrument. Either way this interval means nothing — but the
      // baseline resets to the new reading so one bad row does not poison every
      // fill after it.
      lastFullMeter = log.meterAtFill;
      carried = 0;
      return { ...base, reason: 'meter-backwards' as const };
    }

    const litresUsed = carried + log.litres;
    lastFullMeter = log.meterAtFill;
    carried = 0;

    return {
      ...base,
      meterDelta: delta,
      litresUsed,
      // Inverses of each other, and never interchangeable — see FUEL_UNIT_LABEL.
      consumption:
        asset.meterType === 'kilometres' ? delta / litresUsed : litresUsed / delta,
      reason: 'ok' as const,
    };
  });
}

/**
 * The unit, and which direction is good.
 *
 * A pickup doing 8 km/L and a tractor burning 8 L/hr are not comparable and must
 * never share an axis: on one of them a bigger number is better and on the other
 * it is worse. Charts read this rather than assuming.
 */
export const FUEL_UNIT_LABEL: Record<FleetMeterType, string> = {
  kilometres: 'km/L',
  hours: 'L/hr',
  none: '',
};

export function higherIsBetter(meterType: FleetMeterType): boolean {
  return meterType === 'kilometres';
}

/**
 * The machine's overall figure.
 *
 * Total distance over total litres, NOT the mean of the per-fill ratios. Those
 * two differ whenever the intervals are unequal, and the mean-of-ratios quietly
 * gives a short hop the same weight as a week of ploughing.
 */
export function averageConsumption(
  points: FuelConsumptionPoint[],
  meterType: FleetMeterType
): number | null {
  const usable = points.filter((p) => p.reason === 'ok' && p.meterDelta && p.litresUsed);
  if (usable.length === 0) return null;

  const meter = usable.reduce((t, p) => t + (p.meterDelta ?? 0), 0);
  const litres = usable.reduce((t, p) => t + (p.litresUsed ?? 0), 0);
  if (meter <= 0 || litres <= 0) return null;

  return meterType === 'kilometres' ? meter / litres : litres / meter;
}

/** Whether a machine is running worse than it used to. */
export interface FuelTrend {
  /** Every measurable interval on record. */
  average: number | null;
  /** The most recent few, on their own. */
  recent: number | null;
  /** How much worse recent is than average, as a percentage. Negative is better. */
  worseByPct: number | null;
  measurableFills: number;
}

/**
 * Compare a machine against its own past.
 *
 * The comparison that matters. Ranking a tractor against a pickup says nothing —
 * they do different work and the units are inverted — but a machine that has
 * quietly got 20% thirstier than it used to be is either developing a fault or
 * losing fuel to somebody, and both are worth a phone call.
 *
 * Needs enough history to mean anything: with two measurable fills, "recent"
 * and "average" are nearly the same number and the comparison is noise.
 */
export function compareToOwnAverage(
  points: FuelConsumptionPoint[],
  meterType: FleetMeterType,
  recentCount = 3,
  minimumFills = 4
): FuelTrend {
  const usable = points.filter((p) => p.reason === 'ok');
  const average = averageConsumption(usable, meterType);

  if (usable.length < minimumFills || average === null) {
    return { average, recent: null, worseByPct: null, measurableFills: usable.length };
  }

  const recent = averageConsumption(usable.slice(-recentCount), meterType);
  if (recent === null) {
    return { average, recent: null, worseByPct: null, measurableFills: usable.length };
  }

  // On kilometres a fall in km/L is worse; on hours a rise in L/hr is worse.
  const worseByPct = higherIsBetter(meterType)
    ? ((average - recent) / average) * 100
    : ((recent - average) / average) * 100;

  return { average, recent, worseByPct, measurableFills: usable.length };
}

/** Total spend across a set of slips, voided ones excluded. */
export function totalFuelSpend(logs: FleetFuelLog[]): number {
  return logs.filter((l) => !l.voidedAt).reduce((t, l) => t + (l.totalCost || 0), 0);
}

export function totalFuelLitres(logs: FleetFuelLog[]): number {
  return logs.filter((l) => !l.voidedAt).reduce((t, l) => t + (l.litres || 0), 0);
}

