import type { Timestamp } from 'firebase/firestore';
import type { LocalizedText } from '../../../types/index.js';
import type { CanonicalZoneId } from '../../investment-map/constants/canonicalZones';

/**
 * Fleet and machinery register.
 *
 * Replaces a paper register whose central failing is that it goes stale: the
 * book lives at one desk, changes happen in the field, and nobody can answer
 * "how many tractors are working, and where" without ringing round the zones.
 * Every decision below is aimed at that — a small vocabulary a clerk can apply
 * without judgement calls, and a meter reading captured at the moment a machine
 * physically changes hands.
 */

/**
 * What kind of asset this is.
 *
 * Split by how the thing is serviced and licensed rather than by department,
 * because that is what changes the paperwork: a tractor is serviced on engine
 * hours and carries no plate, a pickup is serviced on kilometres and carries
 * insurance and road-worthiness expiry.
 */
export type FleetAssetType =
  | 'tractor'
  | 'harvester'
  | 'implement'
  | 'pickup'
  | 'truck'
  | 'motorcycle'
  | 'bus'
  | 'pump'
  | 'generator'
  | 'other';

/**
 * How usage is counted.
 *
 * Farm machinery runs stationary for hours at a time, so distance says nothing
 * about wear; road vehicles are the opposite. Implements (a plough, a harrow)
 * have no meter at all and are serviced on inspection, so 'none' is a real
 * case rather than missing data.
 */
export type FleetMeterType = 'hours' | 'kilometres' | 'none';

/**
 * Operational status.
 *
 * Deliberately short. Every value has to be something a storekeeper can decide
 * without interpretation — ambiguity is precisely what leaves a paper register
 * out of date, because an unsure clerk writes nothing at all.
 *
 * `awaiting_parts` is separated from `in_maintenance` because it is the status
 * that explains a long downtime to an auditor, and it is actionable by a
 * different person: procurement rather than a mechanic.
 */
export type FleetAssetStatus =
  | 'available'
  | 'assigned'
  | 'in_maintenance'
  | 'awaiting_parts'
  | 'out_of_service'
  | 'disposed';

/** Statuses in which an asset may not be issued to anyone. */
export const NON_ISSUABLE_STATUSES: readonly FleetAssetStatus[] = [
  'assigned',
  'in_maintenance',
  'awaiting_parts',
  'out_of_service',
  'disposed',
];

export interface FleetAsset {
  /** Human-facing identifier used on physical paperwork, e.g. 'TR-014'. */
  assetId: string;
  assetType: FleetAssetType;

  make: string;
  model: string;
  year?: number;

  /** Road vehicles only. */
  plateNumber?: string;
  chassisNumber?: string;

  meterType: FleetMeterType;
  currentMeter: number;

  /** Where the asset belongs. Reuses the frozen 22-zone GIS inventory. */
  zoneId: CanonicalZoneId;
  /** Office or depot within the zone, free text because depots are not codified. */
  stationedAt: string;

  status: FleetAssetStatus;
  /** StaffUser.uid of whoever currently holds it, set while status is 'assigned'. */
  custodianUid?: string;
  custodianName?: string;

  /**
   * Servicing is expressed as an interval in the asset's own meter unit, so a
   * tractor on 250 hours and a pickup on 5,000 km use the same two fields and
   * the same arithmetic. Due-ness is derived, never stored — see isServiceDue.
   */
  serviceIntervalMeter?: number;
  lastServiceMeter?: number;

  /** Road vehicles only; drive the compliance warnings. */
  insuranceExpiry?: Timestamp | null;
  inspectionExpiry?: Timestamp | null;

  /**
   * Photograph of this machine.
   *
   * Optional, and a URL rather than an upload: a register is far more useful
   * with a picture of the actual machine than a generic icon, but nobody should
   * be blocked from recording an asset because they have not got a photo yet.
   * Absent, the UI draws a placeholder from the asset type.
   */
  imageUrl?: string;

  acquiredAt?: Timestamp | null;
  notes?: LocalizedText;

  /** Optimistic concurrency, matching the pattern used by alerts and news. */
  version: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdByUid?: string;
  updatedByUid?: string;
}

/**
 * A single issue of an asset to a person, and its return.
 *
 * This is the sign-out book. Rows are never deleted or edited after return,
 * because the value of the register is that it can be read backwards: who had
 * the tractor when the gearbox went.
 */
export type FleetAssignmentStatus = 'active' | 'returned' | 'overdue';

export interface FleetAssignment {
  assignmentId: string;
  assetId: string;
  /** Denormalised from the asset so zone reports need no join. */
  zoneId: CanonicalZoneId;

  assignedToUid: string;
  assignedToName: string;
  purpose: LocalizedText;

  issuedAt: Timestamp;
  dueAt?: Timestamp | null;
  returnedAt?: Timestamp | null;

  /**
   * Meter at issue and at return. Captured at the counter, which is the only
   * moment anyone reliably reads the dial, and the reason currentMeter on the
   * asset can be trusted at all.
   */
  meterOut: number;
  meterIn?: number | null;

  status: FleetAssignmentStatus;

  issuedByUid: string;
  returnedByUid?: string;
}

/**
 * A reported fault and the garage work that follows it.
 */
export type FleetFaultSeverity = 'low' | 'medium' | 'high' | 'grounded';

/**
 * `grounded` is the operationally significant one: the machine cannot work.
 * It is a separate value rather than a flag on 'high' because it drives two
 * automatic consequences — the asset stops being issuable, and it is counted
 * apart from routine faults on the dashboard.
 */
export type FleetWorkOrderStatus =
  | 'reported'
  | 'triaged'
  | 'in_progress'
  | 'awaiting_parts'
  | 'completed'
  | 'verified'
  | 'cancelled';

export interface FleetWorkOrderPart {
  name: string;
  quantity: number;
  cost: number;
}

export interface FleetWorkOrder {
  workOrderId: string;
  assetId: string;
  zoneId: CanonicalZoneId;

  reportedByUid: string;
  reportedByName?: string;
  reportedAt: Timestamp;
  faultDescription: LocalizedText;
  severity: FleetFaultSeverity;

  status: FleetWorkOrderStatus;

  assignedGarage?: string;
  assignedTechnician?: string;

  partsUsed?: FleetWorkOrderPart[];
  labourCost?: number;
  totalCost?: number;

  /** Meter at which the fault was recorded, for service-history reconstruction. */
  meterAtReport?: number;

  startedAt?: Timestamp | null;
  completedAt?: Timestamp | null;
  /**
   * Verification is a second pair of eyes before the asset returns to service.
   * Kept distinct from completion so a mechanic cannot both do the work and
   * certify it, which is the control an auditor will look for.
   */
  verifiedAt?: Timestamp | null;
  verifiedByUid?: string;

  version: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * An appended meter reading.
 *
 * Readings accumulate rather than overwrite so a mistyped figure can be seen
 * and corrected in context instead of silently becoming the new truth.
 */
export interface FleetMeterReading {
  readingId: string;
  assetId: string;
  value: number;
  recordedAt: Timestamp;
  recordedByUid: string;
  source: 'issue' | 'return' | 'service' | 'manual';
}

/** Filters backing the register list page. */
export interface FleetAssetFilters {
  zoneId?: CanonicalZoneId | 'all';
  assetType?: FleetAssetType | 'all';
  status?: FleetAssetStatus | 'all';
  serviceDueOnly?: boolean;
  search?: string;
}

/** Dashboard rollup: the question the paper register cannot answer. */
export interface FleetZoneAvailability {
  zoneId: CanonicalZoneId;
  total: number;
  available: number;
  assigned: number;
  down: number;
}

export interface FleetDashboardSummary {
  totalAssets: number;
  byStatus: Record<FleetAssetStatus, number>;
  groundedCount: number;
  serviceDueCount: number;
  overdueReturnCount: number;
  byZone: FleetZoneAvailability[];
}
