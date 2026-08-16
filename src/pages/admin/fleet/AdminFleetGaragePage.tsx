import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, AlertTriangle, RefreshCw, CheckCircle2, ChevronRight } from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  listWorkOrders,
  advanceWorkOrder,
} from '../../../features/fleet/services/fleetWorkOrderService';
import { listAssets } from '../../../features/fleet/services/fleetService';
import type {
  FleetAsset,
  FleetWorkOrder,
  FleetWorkOrderStatus,
} from '../../../features/fleet/types/fleet';
import {
  WORK_ORDER_TRANSITIONS,
  IN_GARAGE_WORK_ORDER_STATUSES,
  humanise,
  isGarageStatus,
} from '../../../features/fleet/constants/fleetVocabulary';
import {
  SeverityPill,
  WorkOrderPill,
  FleetPanel,
  FleetEmptyState,
  FleetButton,
  StatCard,
} from '../../../features/fleet/components/FleetUI';
import { CANONICAL_ZONE_METADATA } from '../../../features/investment-map/constants/canonicalZones';

const NEXT_LABELS: Record<FleetWorkOrderStatus, string> = {
  reported: 'Reopen',
  triaged: 'Triage',
  in_progress: 'Start work',
  awaiting_parts: 'Awaiting parts',
  completed: 'Mark complete',
  verified: 'Verify & release',
  cancelled: 'Cancel',
};

function fmtDate(ts?: { toDate?: () => Date } | null): string {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * The garage queue.
 *
 * Grouped by status rather than listed flat, because a mechanic's question is
 * "what is waiting on me" and a storekeeper's is "what is waiting on a part" —
 * both are answered by position in the queue, not by scanning dates.
 */
export function AdminFleetGaragePage() {
  const { staffUser } = useStaffAuthorizationContext();
  const canMaintain = hasPermission(staffUser, 'fleet.maintenance.manage');

  const [orders, setOrders] = useState<FleetWorkOrder[]>([]);
  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  // Which job has its completion panel open, and what it holds. Scoped to one
  // job at a time: two half-filled forms on one queue is how the wrong cost ends
  // up against the wrong machine.
  const [completing, setCompleting] = useState<string | null>(null);
  const [labourCost, setLabourCost] = useState('');
  const [releaseOnComplete, setReleaseOnComplete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wos, all] = await Promise.all([
        listWorkOrders(),
        listAssets().catch(() => [] as FleetAsset[]),
      ]);
      setOrders(wos);
      setAssets(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the garage queue.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Everything the garage still owes, a repair awaiting sign-off included.
  const open = useMemo(
    () => orders.filter((o) => IN_GARAGE_WORK_ORDER_STATUSES.includes(o.status)),
    [orders]
  );
  const closed = useMemo(
    () => orders.filter((o) => !IN_GARAGE_WORK_ORDER_STATUSES.includes(o.status)),
    [orders]
  );
  const grounded = useMemo(() => open.filter((o) => o.severity === 'grounded'), [open]);
  const awaitingParts = useMemo(() => open.filter((o) => o.status === 'awaiting_parts'), [open]);

  /**
   * Machines whose status and whose paperwork disagree.
   *
   * Two contradictions, not every difference. A machine marked as being in the
   * garage with no job against it is invisible on this page, which lists jobs
   * rather than assets — it reads as in the garage everywhere else and nobody
   * is ever asked to fix it. A machine with a grounded fault still showing as
   * available is the dangerous one: it will be offered to the next person.
   *
   * Out of service alongside an open job is left alone. A machine withdrawn
   * pending a decision is genuinely both, and flagging it would train people to
   * scroll past this panel.
   *
   * The status change now keeps these in step by itself. This catches records
   * written before it did, or edited straight in the database.
   */
  const mismatched = useMemo(() => {
    const withOpenJob = new Set(open.map((o) => o.assetId));
    const withGroundedJob = new Set(grounded.map((o) => o.assetId));
    return assets.flatMap((a) => {
      if (a.status === 'disposed') return [];
      if (isGarageStatus(a.status) && !withOpenJob.has(a.assetId)) {
        return [{ asset: a, problem: 'no_job' as const }];
      }
      if ((a.status === 'available' || a.status === 'assigned') && withGroundedJob.has(a.assetId)) {
        return [{ asset: a, problem: 'still_offered' as const }];
      }
      return [];
    });
  }, [assets, open, grounded]);

  const advance = async (
    wo: FleetWorkOrder,
    next: FleetWorkOrderStatus,
    extra: { labourCost?: number } = {}
  ) => {
    if (!staffUser || busyId) return;
    setBusyId(wo.workOrderId);
    setError(null);
    try {
      await advanceWorkOrder(
        { workOrderId: wo.workOrderId, next, expectedVersion: wo.version, ...extra },
        staffUser
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the work order.');
    } finally {
      setBusyId(null);
    }
  };

  const openCompletion = (wo: FleetWorkOrder) => {
    setCompleting(wo.workOrderId);
    setLabourCost(wo.labourCost ? String(wo.labourCost) : '');
    setReleaseOnComplete(false);
    setError(null);
  };

  /**
   * Finish a repair, and optionally put the machine back to work.
   *
   * Two writes rather than one, because completion and verification are separate
   * states and collapsing them in the data would lose the distinction for every
   * job, not just this one. Releasing here is a choice made per repair: leave the
   * box unticked and the job waits in the queue for someone else to sign off.
   */
  const completeJob = async (wo: FleetWorkOrder) => {
    if (!staffUser || busyId) return;
    const cost = labourCost.trim() ? Number(labourCost) : undefined;
    if (cost !== undefined && !Number.isFinite(cost)) {
      return setError('Labour cost must be a number, or left blank.');
    }

    setBusyId(wo.workOrderId);
    setError(null);
    try {
      await advanceWorkOrder(
        {
          workOrderId: wo.workOrderId,
          next: 'completed',
          expectedVersion: wo.version,
          labourCost: cost,
        },
        staffUser
      );

      if (releaseOnComplete) {
        // The version moved with the write above, so this one has to expect the
        // next number rather than the one loaded with the page.
        await advanceWorkOrder(
          {
            workOrderId: wo.workOrderId,
            next: 'verified',
            expectedVersion: wo.version + 1,
          },
          staffUser
        );
      }

      setCompleting(null);
      setLabourCost('');
      setReleaseOnComplete(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete the job.');
    } finally {
      setBusyId(null);
    }
  };

  const rows = showClosed ? closed : open;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          label="Open jobs"
          value={open.length}
          icon={Wrench}
          tone={open.length > 0 ? 'warn' : 'good'}
          hint="Reported, in progress, or awaiting sign-off"
        />
        <StatCard
          label="Machines grounded"
          value={new Set(grounded.map((g) => g.assetId)).size}
          icon={AlertTriangle}
          tone={grounded.length > 0 ? 'bad' : 'neutral'}
          hint="Cannot work until repaired"
        />
        <StatCard
          label="Awaiting parts"
          value={awaitingParts.length}
          icon={ChevronRight}
          tone={awaitingParts.length > 0 ? 'warn' : 'neutral'}
          hint="Blocked on procurement, not the garage"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!loading && mismatched.length > 0 && (
        <FleetPanel
          title={`Needs reconciling — ${mismatched.length}`}
          description="The machine's status and the garage queue disagree. Open the record and set the status; that now moves both together."
        >
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {mismatched.map(({ asset, problem }) => (
              <div
                key={asset.assetId}
                className="p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <Link
                    to={`/admin/fleet/register/${encodeURIComponent(asset.assetId)}`}
                    className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    {asset.assetId}
                  </Link>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {asset.make} {asset.model} · {CANONICAL_ZONE_METADATA[asset.zoneId]?.displayName ?? asset.zoneId}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  {problem === 'no_job'
                    ? `Marked ${humanise(asset.status)} with no job on the queue`
                    : `Grounded by an open fault but still marked ${humanise(asset.status)}`}
                </span>
              </div>
            ))}
          </div>
        </FleetPanel>
      )}
      <FleetPanel
        title={showClosed ? `Closed jobs — ${closed.length}` : `Open jobs — ${open.length}`}
        description={
          showClosed
            ? 'Verified and cancelled work, kept for service history.'
            : 'Everything the garage still owes. Grounded machines are listed first.'
        }
        action={
          <div className="flex items-center gap-2">
            <FleetButton variant="secondary" onClick={() => setShowClosed((v) => !v)}>
              {showClosed ? 'Show open' : 'Show closed'}
            </FleetButton>
            <FleetButton variant="secondary" icon={RefreshCw} onClick={() => void load()}>
              Refresh
            </FleetButton>
          </div>
        }
      >
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading…</div>
        ) : rows.length === 0 ? (
          <FleetEmptyState
            icon={showClosed ? Wrench : CheckCircle2}
            title={showClosed ? 'No closed jobs yet' : 'Nothing in the garage'}
            message={
              showClosed
                ? 'Completed and verified repairs will be listed here.'
                : 'No open faults. Report one from an asset page when a machine needs attention.'
            }
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[...rows]
              .sort((a, b) => (a.severity === 'grounded' ? -1 : 0) - (b.severity === 'grounded' ? -1 : 0))
              .map((wo) => {
                const nexts = WORK_ORDER_TRANSITIONS[wo.status] ?? [];
                return (
                  <div key={wo.workOrderId} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/admin/fleet/register/${encodeURIComponent(wo.assetId)}`}
                            className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                          >
                            {wo.assetId}
                          </Link>
                          <SeverityPill severity={wo.severity} />
                          <WorkOrderPill status={wo.status} />
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {CANONICAL_ZONE_METADATA[wo.zoneId]?.displayName ?? wo.zoneId}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-700 dark:text-slate-200">
                          {typeof wo.faultDescription === 'string'
                            ? wo.faultDescription
                            : wo.faultDescription?.en ?? '—'}
                        </p>

                        <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          Reported {fmtDate(wo.reportedAt)}
                          {wo.reportedByName ? ` by ${wo.reportedByName}` : ''}
                          {wo.totalCost ? ` · ${wo.totalCost.toLocaleString()} ETB` : ''}
                        </div>
                      </div>

                      {canMaintain && nexts.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {nexts
                            .filter((n) => n !== 'cancelled')
                            .map((n) => (
                              <FleetButton
                                key={n}
                                variant={n === 'verified' ? 'primary' : 'secondary'}
                                disabled={busyId === wo.workOrderId}
                                onClick={() =>
                                  n === 'completed'
                                    ? openCompletion(wo)
                                    : void advance(wo, n)
                                }
                              >
                                {NEXT_LABELS[n]}
                              </FleetButton>
                            ))}
                        </div>
                      )}
                    </div>

                    {completing === wo.workOrderId && (
                      <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Repair complete — {wo.assetId}
                        </div>

                        <div className="mt-3 flex flex-wrap items-end gap-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Labour cost
                            </label>
                            <input
                              type="number"
                              value={labourCost}
                              onChange={(e) => setLabourCost(e.target.value)}
                              placeholder="ETB — optional"
                              className="mt-1 w-40 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
                            />
                          </div>

                          <label className="flex items-center gap-2 pb-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={releaseOnComplete}
                              onChange={(e) => setReleaseOnComplete(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 accent-emerald-600"
                            />
                            <span className="text-xs text-slate-700 dark:text-slate-200">
                              Return this machine to service now
                            </span>
                          </label>
                        </div>

                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                          {releaseOnComplete
                            ? 'You are finishing the repair and signing it back onto the road in one step. The history will record both as yours.'
                            : 'Left unticked, the job stays in this queue until somebody signs it off with Verify & release.'}
                        </p>

                        <div className="mt-3 flex justify-end gap-2">
                          <FleetButton
                            variant="secondary"
                            onClick={() => setCompleting(null)}
                            disabled={busyId === wo.workOrderId}
                          >
                            Cancel
                          </FleetButton>
                          <FleetButton
                            icon={CheckCircle2}
                            onClick={() => void completeJob(wo)}
                            disabled={busyId === wo.workOrderId}
                          >
                            {busyId === wo.workOrderId ? 'Saving…' : 'Confirm'}
                          </FleetButton>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </FleetPanel>

      {!canMaintain && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          You can see the queue but not move jobs through it — that needs the{' '}
          <code>fleet.maintenance.manage</code> permission.
        </p>
      )}
    </div>
  );
}

export default AdminFleetGaragePage;
