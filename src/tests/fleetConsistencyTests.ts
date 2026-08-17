import { Timestamp } from 'firebase/firestore';
import type {
  FleetAsset,
  FleetAssetStatus,
  FleetAssetType,
  FleetDriver,
  FleetDriverStatus,
} from '../features/fleet/types/fleet';
import type { Permission } from '../types/auth';
import { ALL_PERMISSIONS as LIB_PERMISSIONS, ROLE_PERMISSIONS_MAP } from '../lib/permissions';
import { ALL_PERMISSIONS as AUTH_PERMISSIONS } from '../auth/permissions';
import {
  isServiceDue,
  meterUntilService,
  planStatusChange,
  MANUAL_ASSET_STATUSES,
  GARAGE_STATUSES,
  IN_GARAGE_WORK_ORDER_STATUSES,
  OPEN_WORK_ORDER_STATUSES,
  isGarageStatus,
  assessDriverForAsset,
  licenceState,
  isRoadVehicle,
  ROAD_VEHICLE_TYPES,
  assessAssetCompliance,
  assessDriverCompliance,
  worstSeverity,
  isExpired,
  isExpiringSoon,
} from '../features/fleet/constants/fleetVocabulary';

/**
 * Fleet Consistency Tests
 * -----------------------
 * Follows the hand-rolled TestResult[] convention used by the other suites in
 * this directory — this repo has no test runner.
 *
 * These cover one class of defect rather than one bug: an asset status that is
 * only meaningful because of a record in another collection. `assigned` means
 * nothing without an active assignment; `in_maintenance` means nothing without
 * an open work order. Writing the field on its own produced a machine that
 * claimed to be in the garage while the garage queue had no job for it — it
 * read as "In garage" everywhere and appeared under Garage & Repairs nowhere.
 *
 * The planner is pure and Firebase-free on purpose, so these invariants can be
 * asserted without a project, an emulator or a network.
 */

export interface TestResult {
  id: number;
  name: string;
  category:
    | 'Status'
    | 'Assignment'
    | 'Garage'
    | 'Vocabulary'
    | 'Permissions'
    | 'Service'
    | 'Drivers'
    | 'Compliance';
  passed: boolean;
  message: string;
  details?: any;
}

export function runFleetConsistencyTests(): TestResult[] {
  const results: TestResult[] = [];
  let id = 0;

  const check = (
    name: string,
    category: TestResult['category'],
    fn: () => { passed: boolean; message: string; details?: any }
  ) => {
    id += 1;
    try {
      results.push({ id, name, category, ...fn() });
    } catch (err) {
      results.push({
        id,
        name,
        category,
        passed: false,
        message: `Threw: ${(err as Error)?.message ?? String(err)}`,
      });
    }
  };

  const ctx = (hasActiveAssignment = false, openWorkOrderCount = 0, completedWorkOrderCount = 0) => ({
    hasActiveAssignment,
    openWorkOrderCount,
    completedWorkOrderCount,
  });

  /* ------------------------------------------------- the reported defect */

  check('Moving an asset into the garage with no open job raises one', 'Garage', () => {
    const plan = planStatusChange('available', 'in_maintenance', ctx());
    return {
      passed: plan.raiseWorkOrder === true,
      message: plan.raiseWorkOrder
        ? 'A work order is raised, so the machine appears in the garage queue.'
        : 'No work order raised — the asset would read "In garage" and be invisible to the garage.',
      details: plan,
    };
  });

  check('Awaiting parts is a garage status and behaves the same', 'Garage', () => {
    const plan = planStatusChange('available', 'awaiting_parts', ctx());
    return {
      passed: plan.raiseWorkOrder === true && isGarageStatus('awaiting_parts'),
      message: 'Awaiting parts also needs a job on the queue to be actionable.',
      details: plan,
    };
  });

  check('An existing open job is not duplicated', 'Garage', () => {
    const plan = planStatusChange('available', 'in_maintenance', ctx(false, 1));
    return {
      passed: plan.raiseWorkOrder === false,
      message: plan.raiseWorkOrder
        ? 'A second work order would be opened for the same fault.'
        : 'The open job is reused rather than duplicated.',
      details: plan,
    };
  });

  /* ------------------------------------------------------------ the reverse */

  check('Releasing from the garage closes the open jobs', 'Garage', () => {
    const plan = planStatusChange('in_maintenance', 'available', ctx(false, 2));
    return {
      passed: plan.cancelWorkOrders === true,
      message: plan.cancelWorkOrders
        ? 'Open jobs are closed, so the queue does not keep a machine already back in service.'
        : 'The work order stays open forever on a machine already back in service.',
      details: plan,
    };
  });

  check('Releasing with nothing open cancels nothing', 'Garage', () => {
    const plan = planStatusChange('in_maintenance', 'available', ctx());
    return {
      passed: plan.cancelWorkOrders === false,
      message: 'No open jobs, nothing to close.',
      details: plan,
    };
  });

  check('Moving between the two garage statuses leaves the job alone', 'Garage', () => {
    const plan = planStatusChange('in_maintenance', 'awaiting_parts', ctx(false, 1));
    return {
      passed: plan.cancelWorkOrders === false && plan.raiseWorkOrder === false,
      message: 'Still in the garage — the same job continues.',
      details: plan,
    };
  });

  /* ---------------------------------------------------------- assignments */

  check('Taking an issued machine out of service closes the assignment', 'Assignment', () => {
    const plan = planStatusChange('assigned', 'out_of_service', ctx(true));
    return {
      passed: plan.closeAssignment === true,
      message: plan.closeAssignment
        ? 'The sign-out is closed, so nobody is still recorded as holding it.'
        : 'The assignment stays active — the machine reads out of service and out on loan at once.',
      details: plan,
    };
  });

  check('Grounding an issued machine closes the assignment and raises a job', 'Assignment', () => {
    const plan = planStatusChange('assigned', 'in_maintenance', ctx(true));
    return {
      passed: plan.closeAssignment === true && plan.raiseWorkOrder === true,
      message: 'Both records are reconciled in one action.',
      details: plan,
    };
  });

  check('Nothing to close when no assignment is active', 'Assignment', () => {
    const plan = planStatusChange('assigned', 'available', ctx(false));
    return {
      passed: plan.closeAssignment === false,
      message: 'A stale assigned status with no assignment simply clears.',
      details: plan,
    };
  });

  /* --------------------------------------------------------- what may be set */

  check('Assigned cannot be set by hand', 'Status', () => {
    const offered = MANUAL_ASSET_STATUSES.includes('assigned');
    return {
      passed: offered === false,
      message: offered
        ? 'Assigned is offered, but issuing needs a holder, a purpose and a meter reading.'
        : 'Assigned is reached by issuing the machine, which captures who has it.',
      details: { MANUAL_ASSET_STATUSES },
    };
  });

  check('Disposed cannot be set by hand', 'Status', () => {
    const offered = MANUAL_ASSET_STATUSES.includes('disposed');
    return {
      passed: offered === false,
      message: 'Retiring is irreversible and belongs to the retire action.',
      details: { MANUAL_ASSET_STATUSES },
    };
  });

  check('A disposed asset cannot be revived by a status change', 'Status', () => {
    let threw = false;
    try {
      planStatusChange('disposed', 'available', ctx());
    } catch {
      threw = true;
    }
    return {
      passed: threw,
      message: threw
        ? 'Rejected — a retired asset is out of the register.'
        : 'A retired asset was quietly returned to service.',
    };
  });

  check('Setting the status it already has is rejected', 'Status', () => {
    let threw = false;
    try {
      planStatusChange('available', 'available', ctx());
    } catch {
      threw = true;
    }
    return { passed: threw, message: 'A no-op change would write a meaningless timeline entry.' };
  });

  check('Every garage status is a real asset status', 'Vocabulary', () => {
    const all: FleetAssetStatus[] = [
      'available',
      'assigned',
      'in_maintenance',
      'awaiting_parts',
      'out_of_service',
      'disposed',
    ];
    const stray = GARAGE_STATUSES.filter((s) => !all.includes(s));
    return {
      passed: stray.length === 0,
      message: stray.length ? `Unknown statuses: ${stray.join(', ')}` : 'All accounted for.',
    };
  });

  /* ------------------------------------------- finished but not signed off */

  /*
   * A completed repair is not a closed one. The machine sits in the yard until
   * somebody signs it back onto the road, so the garage still holds it — which
   * is why 'completed' belongs in the in-garage list and not the open one.
   * Conflating them filed the job under "Show closed" while the asset stayed in
   * maintenance, and the reconcile panel then flagged the pair as contradictory.
   */

  check('A finished repair still counts as in the garage', 'Garage', () => {
    const inGarage = IN_GARAGE_WORK_ORDER_STATUSES.includes('completed');
    const open = OPEN_WORK_ORDER_STATUSES.includes('completed');
    return {
      passed: inGarage && !open,
      message:
        inGarage && !open
          ? 'Held by the garage, but with no work left to do — which is exactly what it is.'
          : 'A completed job is misfiled; the queue and the register will disagree.',
      details: { inGarage, open },
    };
  });

  check('A machine awaiting sign-off gets no second job raised', 'Garage', () => {
    const plan = planStatusChange('available', 'in_maintenance', ctx(false, 0, 1));
    return {
      passed: plan.raiseWorkOrder === false,
      message: plan.raiseWorkOrder
        ? 'A fresh job would be opened against a machine the garage already holds.'
        : 'The finished job stands; nothing new is raised.',
      details: plan,
    };
  });

  check('Releasing a machine signs off its finished repair', 'Garage', () => {
    const plan = planStatusChange('in_maintenance', 'available', ctx(false, 0, 1));
    return {
      passed: plan.verifyWorkOrders === true && plan.cancelWorkOrders === false,
      message: plan.cancelWorkOrders
        ? 'The repair would be cancelled, erasing work that was done and paid for.'
        : 'Signed off, so the repair and its cost stay in the machine history.',
      details: plan,
    };
  });

  check('Unfinished and finished jobs are handled differently at release', 'Garage', () => {
    const plan = planStatusChange('in_maintenance', 'available', ctx(false, 2, 1));
    return {
      passed: plan.cancelWorkOrders === true && plan.verifyWorkOrders === true,
      message: 'The two unfinished jobs are abandoned; the finished one is signed off.',
      details: plan,
    };
  });

  /* ---------------------------------------------------------------- service */

  /*
   * Service-due is derived from the meter, never stored, so recording a service
   * clears it by moving lastServiceMeter and nothing else. These pin the derivation
   * rather than the write, which is the half that can silently go wrong.
   */

  const machine = (over: Partial<any> = {}) =>
    ({
      assetId: 'TR-999',
      meterType: 'hours',
      currentMeter: 4102,
      serviceIntervalMeter: 250,
      lastServiceMeter: 3780,
      status: 'available',
      ...over,
    }) as any;

  check('A machine past its interval is due', 'Service', () => {
    const a = machine();
    return {
      passed: isServiceDue(a),
      message: '4,102 − 3,780 = 322 hrs against a 250-hr interval.',
      details: { since: a.currentMeter - a.lastServiceMeter },
    };
  });

  check('Recording the service at the current reading clears it', 'Service', () => {
    const a = machine({ lastServiceMeter: 4102 });
    return {
      passed: !isServiceDue(a),
      message: isServiceDue(a)
        ? 'Still due after being serviced — the reports page would keep asking.'
        : 'No longer due, and the next one falls at 4,352 hrs.',
      details: { until: meterUntilService(a) },
    };
  });

  check('A machine with no meter is never due', 'Service', () => {
    const a = machine({ meterType: 'none', serviceIntervalMeter: undefined });
    return {
      passed: !isServiceDue(a),
      message: 'An implement accumulates no hours; flagging it would train people to ignore the list.',
    };
  });

  check('A machine with no interval set is never due', 'Service', () => {
    const a = machine({ serviceIntervalMeter: undefined });
    return {
      passed: !isServiceDue(a),
      message: 'A missing interval is unknown, not zero — treating it as zero flags the whole register on day one.',
    };
  });

  check('A retired machine is never due for service', 'Service', () => {
    const a = machine({ status: 'disposed' });
    return {
      passed: !isServiceDue(a),
      message: isServiceDue(a)
        ? 'The reports page would schedule work on a vehicle the Bureau no longer owns.'
        : 'Out of the register, so out of the maintenance schedule.',
    };
  });

  /* ------------------------------------------------------------ permissions */

  /*
   * This repo carries two permission tables — lib/permissions.ts, which every
   * fleet page reads, and auth/permissions.ts, which the admin nav and the
   * staff context read. They drifted: the fleet permissions reached one and
   * not the other, so a super admin saw Fleet in the sidebar, opened it, and
   * found every action button gone. Nothing typechecks the two against each
   * other, so it is asserted here instead.
   */

  check('The two permission tables hold the same permissions', 'Permissions', () => {
    const lib = new Set<string>(LIB_PERMISSIONS);
    const auth = new Set<string>(AUTH_PERMISSIONS);
    const libOnly = [...lib].filter((p) => !auth.has(p));
    const authOnly = [...auth].filter((p) => !lib.has(p));
    return {
      passed: libOnly.length === 0 && authOnly.length === 0,
      message:
        libOnly.length || authOnly.length
          ? 'The tables disagree, so the same user has different rights on different screens.'
          : 'Both tables agree.',
      details: { libOnly, authOnly },
    };
  });

  check('A super admin can work the fleet, not just see it', 'Permissions', () => {
    const needed: Permission[] = [
      'fleet.view',
      'fleet.asset.manage',
      'fleet.assign',
      'fleet.maintenance.manage',
      'fleet.reports.view',
      'fleet.driver.manage',
      'fleet.asset.retire',
    ];
    const granted = ROLE_PERMISSIONS_MAP.superAdmin;
    const missing = needed.filter((p) => !granted.includes(p));
    return {
      passed: missing.length === 0,
      message: missing.length
        ? 'The nav offers Fleet and the pages then refuse every action.'
        : 'Every fleet action is available to a super admin.',
      details: { missing },
    };
  });

  /* ---------------------------------------------------------------- drivers */

  /*
   * The rule under test is asymmetric on purpose, and the asymmetry is the
   * point: a lapsed licence stops a pickup outright and only warns on a
   * tractor. Blocking both would refuse to record work that legitimately
   * happens in a field, and blocking neither would let the register be the
   * thing that says an unlicensed driver was sent onto a public road.
   */

  const DAY = 24 * 60 * 60 * 1000;
  const at = (days: number) => Timestamp.fromDate(new Date(Date.now() + days * DAY));

  const driver = (over: Partial<FleetDriver> = {}): FleetDriver =>
    ({
      driverId: 'DR-TEST',
      fullName: 'Obbo Test Driver',
      employment: 'permanent',
      licenceNumber: 'ET-3-000001',
      licenceGrade: '3',
      licenceExpiry: at(200),
      zoneId: 'arsi',
      status: 'active' as FleetDriverStatus,
      version: 1,
      ...over,
    }) as FleetDriver;

  const vehicle = (assetType: FleetAssetType) =>
    ({ assetId: assetType === 'pickup' ? 'PK-TEST' : 'TR-TEST', assetType }) as FleetAsset;

  check('A valid licence may take a road vehicle', 'Drivers', () => {
    const r = assessDriverForAsset(driver(), vehicle('pickup'));
    return {
      passed: r.allowed && !r.warning,
      message: 'Nothing to flag on a licence with 200 days left.',
      details: r,
    };
  });

  check('A lapsed licence is refused a road vehicle', 'Drivers', () => {
    const r = assessDriverForAsset(driver({ licenceExpiry: at(-9) }), vehicle('pickup'));
    return {
      passed: !r.allowed && Boolean(r.reason),
      message: !r.allowed
        ? 'Refused, with a reason the issuer can read.'
        : 'A lapsed licence was allowed onto a public road.',
      details: r,
    };
  });

  check('A lapsed licence only warns on farm machinery', 'Drivers', () => {
    const r = assessDriverForAsset(driver({ licenceExpiry: at(-9) }), vehicle('tractor'));
    return {
      passed: r.allowed && Boolean(r.warning),
      message: r.allowed
        ? 'Allowed with a warning — a tractor in a field needs no road licence.'
        : 'Refused, which would push real fieldwork back to paper.',
      details: r,
    };
  });

  check('No licence at all is refused a road vehicle', 'Drivers', () => {
    const r = assessDriverForAsset(
      driver({ licenceNumber: undefined, licenceExpiry: null }),
      vehicle('pickup')
    );
    return {
      passed: !r.allowed,
      message: !r.allowed
        ? 'Absent is not the same as valid.'
        : 'An unrecorded licence read as a valid one.',
      details: r,
    };
  });

  check('No licence at all still warns on farm machinery', 'Drivers', () => {
    const r = assessDriverForAsset(
      driver({ licenceNumber: undefined, licenceExpiry: null }),
      vehicle('tractor')
    );
    return {
      passed: r.allowed && Boolean(r.warning),
      message: 'Allowed, but the road-move caveat is said out loud.',
      details: r,
    };
  });

  check('A suspended driver is refused everything', 'Drivers', () => {
    const d = driver({ status: 'suspended' });
    const road = assessDriverForAsset(d, vehicle('pickup'));
    const farm = assessDriverForAsset(d, vehicle('tractor'));
    return {
      passed: !road.allowed && !farm.allowed,
      message: 'Suspension is about the person, not the machine, so it applies to both.',
      details: { road, farm },
    };
  });

  check('A driver who has left is refused everything', 'Drivers', () => {
    const d = driver({ status: 'inactive' });
    return {
      passed:
        !assessDriverForAsset(d, vehicle('pickup')).allowed &&
        !assessDriverForAsset(d, vehicle('tractor')).allowed,
      message: 'Left the register, so holds nothing.',
    };
  });

  check('An expiring licence warns without blocking', 'Drivers', () => {
    const r = assessDriverForAsset(driver({ licenceExpiry: at(12) }), vehicle('pickup'));
    return {
      passed: r.allowed && Boolean(r.warning),
      message: 'Twelve days left: the work goes ahead and somebody is told to renew it.',
      details: r,
    };
  });

  check('A half-recorded licence counts as none', 'Drivers', () => {
    const numberOnly = licenceState({ licenceNumber: 'ET-3-000001', licenceExpiry: null });
    const expiryOnly = licenceState({ licenceNumber: undefined, licenceExpiry: at(300) });
    return {
      passed: numberOnly === 'none' && expiryOnly === 'none',
      message: 'A number with no expiry cannot be checked, and an expiry with no number is not a licence.',
      details: { numberOnly, expiryOnly },
    };
  });

  check('Road vehicles are the ones that carry documents', 'Drivers', () => {
    const road = ROAD_VEHICLE_TYPES.filter((t) => isRoadVehicle(t));
    const farm: FleetAssetType[] = ['tractor', 'harvester', 'implement', 'pump', 'generator'];
    return {
      passed: road.length === ROAD_VEHICLE_TYPES.length && farm.every((t) => !isRoadVehicle(t)),
      message: 'The list that shows the plate and insurance fields is the same one that gates licences.',
      details: { road: [...ROAD_VEHICLE_TYPES] },
    };
  });

  /* ------------------------------------------------------------- compliance */

  /*
   * The case worth guarding is the quiet one. isExpired and isExpiringSoon both
   * return false for a missing date — correct in isolation, and together they
   * made a pickup nobody had ever insured indistinguishable from one insured
   * until next year. The Reports page counted zero and said 'nothing lapsing'.
   */

  const roadAsset = (over: Partial<FleetAsset> = {}): FleetAsset =>
    ({
      assetId: 'PK-TEST',
      assetType: 'pickup',
      status: 'available',
      insuranceExpiry: at(200),
      inspectionExpiry: at(200),
      ...over,
    }) as FleetAsset;

  check('A road vehicle with no insurance date is unknown, not ok', 'Compliance', () => {
    const items = assessAssetCompliance(roadAsset({ insuranceExpiry: null }));
    const insurance = items.find((i) => i.kind === 'insurance');
    return {
      passed: insurance?.severity === 'unknown',
      message:
        insurance?.severity === 'unknown'
          ? 'Absent is reported as absent rather than as valid.'
          : 'A vehicle nobody has insured reads as compliant.',
      details: { severity: insurance?.severity },
    };
  });

  check('The old helpers cannot tell absent from valid', 'Compliance', () => {
    // Not a criticism of them — it is why the severity exists.
    const missing = null;
    return {
      passed: isExpired(missing) === false && isExpiringSoon(missing) === false,
      message: 'Both return false for a missing date, so neither can raise the alarm on its own.',
      details: { isExpired: isExpired(missing), isExpiringSoon: isExpiringSoon(missing) },
    };
  });

  check('Farm machinery carries no documents at all', 'Compliance', () => {
    const items = assessAssetCompliance(roadAsset({ assetType: 'tractor', insuranceExpiry: null }));
    return {
      passed: items.length === 0,
      message:
        items.length === 0
          ? 'A plough has no insurance to lapse, so it is not listed as missing any.'
          : 'Farm machinery was flagged, which would bury the vehicles that matter.',
      details: { count: items.length },
    };
  });

  check('A retired vehicle needs no cover', 'Compliance', () => {
    const items = assessAssetCompliance(roadAsset({ status: 'disposed', insuranceExpiry: null }));
    return {
      passed: items.length === 0,
      message: 'Out of the register, so out of the renewal list.',
    };
  });

  check('An expired document beats one merely expiring', 'Compliance', () => {
    const items = assessAssetCompliance(
      roadAsset({ insuranceExpiry: at(-3), inspectionExpiry: at(10) })
    );
    return {
      passed: worstSeverity(items) === 'lapsed',
      message: 'The row badge shows the worst of what the vehicle has.',
      details: { worst: worstSeverity(items), items: items.map((i) => i.severity) },
    };
  });

  check('Unknown outranks expiring but not lapsed', 'Compliance', () => {
    const unknownVsSoon = worstSeverity(
      assessAssetCompliance(roadAsset({ insuranceExpiry: null, inspectionExpiry: at(10) }))
    );
    const unknownVsLapsed = worstSeverity(
      assessAssetCompliance(roadAsset({ insuranceExpiry: null, inspectionExpiry: at(-5) }))
    );
    return {
      passed: unknownVsSoon === 'unknown' && unknownVsLapsed === 'lapsed',
      message:
        'A document nobody has recorded is worse than one with days left, and better than one known to have run out.',
      details: { unknownVsSoon, unknownVsLapsed },
    };
  });

  check('Nothing to assess reads as ok, not as a problem', 'Compliance', () => {
    return {
      passed: worstSeverity([]) === 'ok',
      message: 'A tractor with no documents is not a tractor in trouble.',
    };
  });

  check("A driver's licence folds into the same shape", 'Compliance', () => {
    const lapsed = assessDriverCompliance(driver({ licenceExpiry: at(-2) }));
    const none = assessDriverCompliance(
      driver({ licenceNumber: undefined, licenceExpiry: null })
    );
    return {
      passed: lapsed[0]?.severity === 'lapsed' && none[0]?.severity === 'unknown',
      message: 'One renewal list can hold vehicles and people, because the office chasing them is one office.',
      details: { lapsed: lapsed[0]?.severity, none: none[0]?.severity },
    };
  });

  check('A driver who has left is off the renewal list', 'Compliance', () => {
    const items = assessDriverCompliance(driver({ status: 'inactive', licenceExpiry: at(-40) }));
    return {
      passed: items.length === 0,
      message: 'Chasing the licence of somebody who no longer works here is noise.',
    };
  });

  return results;
}
