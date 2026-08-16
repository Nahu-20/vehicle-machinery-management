import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, AlertTriangle, RefreshCw, CheckCircle2, ChevronRight } from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  listWorkOrders,
  advanceWorkOrder,
} from '../../../features/fleet/services/fleetWorkOrderService';
import type { FleetWorkOrder, FleetWorkOrderStatus } from '../../../features/fleet/types/fleet';
import {
  WORK_ORDER_TRANSITIONS,
  OPEN_WORK_ORDER_STATUSES,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await listWorkOrders());
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

  const open = useMemo(
    () => orders.filter((o) => OPEN_WORK_ORDER_STATUSES.includes(o.status)),
    [orders]
  );
  const closed = useMemo(
    () => orders.filter((o) => !OPEN_WORK_ORDER_STATUSES.includes(o.status)),
    [orders]
  );
  const grounded = useMemo(() => open.filter((o) => o.severity === 'grounded'), [open]);
  const awaitingParts = useMemo(() => open.filter((o) => o.status === 'awaiting_parts'), [open]);

  const advance = async (wo: FleetWorkOrder, next: FleetWorkOrderStatus) => {
    if (!staffUser || busyId) return;
    setBusyId(wo.workOrderId);
    setError(null);
    try {
      await advanceWorkOrder(
        { workOrderId: wo.workOrderId, next, expectedVersion: wo.version },
        staffUser
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the work order.');
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
          hint="Reported, triaged or in progress"
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
                                onClick={() => void advance(wo, n)}
                              >
                                {NEXT_LABELS[n]}
                              </FleetButton>
                            ))}
                        </div>
                      )}
                    </div>
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
