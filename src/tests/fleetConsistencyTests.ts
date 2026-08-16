import type { FleetAssetStatus } from '../features/fleet/types/fleet';
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
  category: 'Status' | 'Assignment' | 'Garage' | 'Vocabulary' | 'Permissions' | 'Service';
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

  return results;
}
