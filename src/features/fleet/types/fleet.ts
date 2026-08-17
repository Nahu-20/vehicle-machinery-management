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
   * The driver record holding it, when the holder is one.
   *
   * Additive alongside custodianUid rather than replacing it: operators taken on
   * for a season are issued machines too, and refusing to record that until
   * somebody creates a driver record would send the work back to paper. Absent
   * means the holder is a one-off name, which is exactly what the register said
   * before drivers existed.
   */
  custodianDriverId?: string | null;

  /**
   * Servicing is expressed as an interval in the asset's own meter unit, so a
   * tractor on 250 hours and a pickup on 5,000 km use the same two fields and
   * the same arithmetic. Due-ness is derived, never stored — see isServiceDue.
   */
  serviceIntervalMeter?: number;
  lastServiceMeter?: number;

  /**
   * Road vehicles only; drive the compliance warnings.
   *
   * An expiry on its own answers "is it still valid" and nothing else. When a
   * vehicle is stopped, or a claim is made, the question is which policy and
   * with whom — so the number and the insurer are held beside the date rather
   * than living in somebody's filing cabinet.
   *
   * Note that absent is NOT the same as valid. See assessAssetCompliance.
   */
  insuranceExpiry?: Timestamp | null;
  insurancePolicyNumber?: string;
  insurer?: string;
  /** What the last renewal cost. Annual, so it is the figure a budget needs. */
  insuranceCost?: number;

  inspectionExpiry?: Timestamp | null;
  inspectionCertificateNumber?: string;

  /**
   * The ownership booklet — the libre.
   *
   * Never expires, so it takes no part in the compliance checks, but it is the
   * document asked for when a vehicle is transferred or disposed of, and the
   * register is where anyone would look for it.
   */
  libreNumber?: string;

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
 * A person who drives or operates the Bureau's machines.
 *
 * A record, not an account. Zone operators and seasonal drivers do not have
 * portal logins and never will, so requiring one would leave the register
 * describing only the handful of drivers who happen to work at a desk. What the
 * Bureau actually needs held against a person is narrow: how to reach them, what
 * they are licensed to drive, and when that licence stops being valid.
 *
 * Deliberately not merged into StaffUser. That type carries a role and a set of
 * permissions — it answers "what may this account do in the system", which is a
 * different question from "may this person take that pickup out on the road".
 */
export type FleetDriverStatus = 'active' | 'suspended' | 'inactive';

/**
 * How the driver is engaged.
 *
 * Kept because it changes who is answerable when something goes wrong, and
 * because daily and contract drivers are the ones whose licences nobody checks.
 */
export type FleetDriverEmployment = 'permanent' | 'contract' | 'seconded' | 'daily';

export interface FleetDriver {
  /** Human id painted on nothing, but written on forms: DR-001. */
  driverId: string;
  fullName: string;
  phone?: string;
  /** Absent for contract and daily labour, who have no employee number. */
  employeeNumber?: string;
  employment: FleetDriverEmployment;

  licenceNumber?: string;
  /**
   * Ethiopian licences are graded 1-5 by what they permit. Held as a string
   * rather than a union until the Bureau confirms which grades it recognises —
   * guessing the enum would either reject valid licences or silently accept
   * anything, and the second is worse.
   */
  licenceGrade?: string;
  licenceExpiry?: Timestamp | null;

  zoneId: CanonicalZoneId;
  /** Depot or office, free text, matching the asset's stationedAt. */
  stationedAt?: string;
  photoUrl?: string;

  /**
   * suspended and inactive are separate on purpose. Suspended is a decision
   * about this person that someone made and may reverse; inactive is that they
   * have left. Both stop machines being issued, but only one of them is news.
   */
  status: FleetDriverStatus;
  notes?: LocalizedText;

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
  /**
   * The name is stored, not looked up.
   *
   * A sign-out from two seasons ago has to keep reading correctly after the
   * driver is renamed, moved to another zone or deactivated. Joining to the
   * driver record at read time would let a change today rewrite what the book
   * says about last year, which is the one thing a sign-out book must not do.
   */
  assignedToName: string;
  /** The driver record, when the holder is one. Absent for one-off names. */
  driverId?: string | null;
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
  /** Named, not just referenced: the timeline has to show who released the machine. */
  verifiedByName?: string;

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

/**
 * A recorded change of operational status.
 *
 * Status alone says where a machine is now; this says how it got there. Without
 * it a register cannot answer the questions that actually matter about a
 * vehicle - how long it sat in the garage, how often it goes back, whether it
 * was working at all last season.
 *
 * Written for every transition regardless of cause, so issuing, returning,
 * grounding and a manual correction all appear on one timeline rather than
 * being scattered across three collections a reader has to join by hand.
 */
export interface FleetStatusEvent {
  eventId: string;
  assetId: string;
  from: FleetAssetStatus;
  to: FleetAssetStatus;
  at: Timestamp;
  actorUid: string;
  actorName: string;
  /** Why, in the actor's words. Free text because the reasons do not enumerate. */
  reason?: string;
}

/**
 * A completed service.
 *
 * Kept apart from fleetWorkOrders on purpose. A work order is something that
 * broke; a service is something planned that stops things breaking. Folding
 * routine servicing into the repair collection would make "repair spend by
 * machine" read as though the well-maintained machines were the expensive ones,
 * which is the opposite of what the figure is for.
 *
 * Recording one moves the asset's lastServiceMeter, which is what clears it from
 * the service-due list. That list is derived, never stored, so it cannot drift.
 */
export interface FleetServiceRecord {
  serviceRecordId: string;
  assetId: string;
  zoneId: CanonicalZoneId;
  /** The reading the work was done at, which becomes the asset's lastServiceMeter. */
  meterAtService: number;
  servicedAt: Timestamp;
  /** What was done. Free text: a 250-hour service is not the same job everywhere. */
  note?: string;
  cost?: number;
  recordedByUid: string;
  recordedByName: string;
}

/** One entry on a vehicle's combined history. */
export type FleetTimelineKind = 'status' | 'assignment' | 'work_order' | 'service';

export interface FleetTimelineEntry {
  id: string;
  kind: FleetTimelineKind;
  at: Timestamp;
  title: string;
  detail?: string;
  actorName?: string;
  statusTo?: FleetAssetStatus;
  severity?: FleetFaultSeverity;
  meter?: number;
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
