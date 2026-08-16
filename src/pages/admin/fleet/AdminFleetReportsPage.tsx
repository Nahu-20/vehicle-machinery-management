import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Wrench, Clock, Coins, AlertTriangle, ShieldAlert } from 'lucide-react';
import { listAssets } from '../../../features/fleet/services/fleetService';
import { listWorkOrders } from '../../../features/fleet/services/fleetWorkOrderService';
import {
  listActiveAssignments,
  isOverdue,
} from '../../../features/fleet/services/fleetAssignmentService';
import type {
  FleetAsset,
  FleetAssignment,
  FleetWorkOrder,
} from '../../../features/fleet/types/fleet';
import {
  formatMeter,
  isServiceDue,
  isExpired,
  isExpiringSoon,
  meterUntilService,
  OPEN_WORK_ORDER_STATUSES,
} from '../../../features/fleet/constants/fleetVocabulary';
import {
  StatCard,
  FleetPanel,
  FleetEmptyState,
  StatusPill,
} from '../../../features/fleet/components/FleetUI';
import { CANONICAL_ZONE_METADATA } from '../../../features/investment-map/constants/canonicalZones';

/**
 * Operational reports.
 *
 * Public-sector fleet guidance is consistent that the figure which has to stand
 * up is *defensible utilisation* — which assets are earning their place. So the
 * reports here answer three questions an auditor actually asks: what is due for
 * attention, what is costing money, and what is sitting idle.
 *
 * Everything is derived from the register on read. Nothing is precomputed into a
 * reporting table that could disagree with the records it summarises.
 */
export function AdminFleetReportsPage() {
  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [workOrders, setWorkOrders] = useState<FleetWorkOrder[]>([]);
  const [active, setActive] = useState<FleetAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, w, act] = await Promise.all([
        listAssets(),
        listWorkOrders().catch(() => [] as FleetWorkOrder[]),
        listActiveAssignments().catch(() => [] as FleetAssignment[]),
      ]);
      setAssets(a);
      setWorkOrders(w);
      setActive(act);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not build the reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const serviceDue = useMemo(() => assets.filter(isServiceDue), [assets]);
  const overdueReturns = useMemo(() => active.filter((a) => isOverdue(a)), [active]);

  /** Road documents that have lapsed or are about to — a compliance risk, not a maintenance one. */
  const documentRisk = useMemo(
    () =>
      assets.filter(
        (a) =>
          isExpired(a.insuranceExpiry) ||
          isExpired(a.inspectionExpiry) ||
          isExpiringSoon(a.insuranceExpiry) ||
          isExpiringSoon(a.inspectionExpiry)
      ),
    [assets]
  );

  /** Repair spend per machine, highest first. */
  const costByAsset = useMemo(() => {
    const map = new Map<string, { assetId: string; total: number; jobs: number }>();
    for (const wo of workOrders) {
      const row = map.get(wo.assetId) ?? { assetId: wo.assetId, total: 0, jobs: 0 };
      row.total += wo.totalCost ?? 0;
      row.jobs += 1;
      map.set(wo.assetId, row);
    }
    return [...map.values()].filter((r) => r.total > 0).sort((a, b) => b.total - a.total);
  }, [workOrders]);

  const openJobs = useMemo(
    () => workOrders.filter((w) => OPEN_WORK_ORDER_STATUSES.includes(w.status)),
    [workOrders]
  );

  /**
   * Idle assets: available, and not currently out.
   *
   * This is the underutilisation signal a public-sector fleet has to justify.
   * It is a starting point rather than a verdict — a spare pump kept for the
   * rainy season is idle by design — so the page names it "sitting idle" and
   * leaves the judgement to the reader.
   */
  const idle = useMemo(() => assets.filter((a) => a.status === 'available'), [assets]);

  if (loading) {
    return (
      <FleetPanel title="Building reports…">
        <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading…</div>
      </FleetPanel>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Service due"
          value={serviceDue.length}
          icon={Wrench}
          tone={serviceDue.length > 0 ? 'warn' : 'good'}
          hint="Past the interval"
        />
        <StatCard
          label="Overdue returns"
          value={overdueReturns.length}
          icon={Clock}
          tone={overdueReturns.length > 0 ? 'bad' : 'good'}
          hint="Out past the due date"
        />
        <StatCard
          label="Document risk"
          value={documentRisk.length}
          icon={ShieldAlert}
          tone={documentRisk.length > 0 ? 'bad' : 'neutral'}
          hint="Insurance or inspection lapsed"
        />
        <StatCard
          label="Repair spend"
          value={`${costByAsset.reduce((s, r) => s + r.total, 0).toLocaleString()} ETB`}
          icon={Coins}
          hint={`Across ${workOrders.length} job${workOrders.length === 1 ? '' : 's'}`}
        />
      </div>

      <FleetPanel
        title={`Due for service — ${serviceDue.length}`}
        description="Hours for machinery, kilometres for road vehicles. Assets without an interval are never listed."
      >
        {serviceDue.length === 0 ? (
          <FleetEmptyState
            icon={Wrench}
            title="Nothing due"
            message="No asset has passed its service interval."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-3">Asset</th>
                  <th className="px-6 py-3">Zone</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Reading</th>
                  <th className="px-6 py-3 text-right">Overdue by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {serviceDue.map((a) => {
                  const past = meterUntilService(a);
                  return (
                    <tr key={a.assetId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3">
                        <Link
                          to={`/admin/fleet/register/${encodeURIComponent(a.assetId)}`}
                          className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          {a.assetId}
                        </Link>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {a.make} {a.model}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {CANONICAL_ZONE_METADATA[a.zoneId]?.displayName ?? a.zoneId}
                      </td>
                      <td className="px-6 py-3">
                        <StatusPill status={a.status} />
                      </td>
                      <td className="px-6 py-3 text-xs text-right font-mono text-slate-600 dark:text-slate-300">
                        {formatMeter(a.currentMeter, a.meterType)}
                      </td>
                      <td className="px-6 py-3 text-xs text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                        {past !== null ? formatMeter(Math.abs(past), a.meterType) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </FleetPanel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FleetPanel
          title={`Overdue returns — ${overdueReturns.length}`}
          description="Out past the agreed date."
        >
          {overdueReturns.length === 0 ? (
            <FleetEmptyState
              icon={Clock}
              title="Nothing overdue"
              message="Every issued asset is within its return date."
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {overdueReturns.map((a) => (
                <div key={a.assignmentId} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      to={`/admin/fleet/register/${encodeURIComponent(a.assetId)}`}
                      className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      {a.assetId}
                    </Link>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {a.assignedToName}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-red-600 dark:text-red-400 shrink-0">
                    due {a.dueAt?.toDate ? a.dueAt.toDate().toLocaleDateString() : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </FleetPanel>

        <FleetPanel
          title={`Repair spend by machine — ${costByAsset.length}`}
          description="Highest first. A machine near the top repeatedly is a replacement case, not a repair case."
        >
          {costByAsset.length === 0 ? (
            <FleetEmptyState
              icon={Coins}
              title="No costs recorded"
              message="Parts and labour entered on work orders will be totalled here."
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {costByAsset.slice(0, 10).map((r) => (
                <div key={r.assetId} className="px-6 py-3 flex items-center justify-between gap-4">
                  <Link
                    to={`/admin/fleet/register/${encodeURIComponent(r.assetId)}`}
                    className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    {r.assetId}
                  </Link>
                  <div className="text-right">
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white font-mono">
                      {r.total.toLocaleString()} ETB
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {r.jobs} job{r.jobs === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </FleetPanel>
      </div>

      <FleetPanel
        title={`Sitting idle — ${idle.length}`}
        description="Available and not currently issued. A starting point for the utilisation question, not a verdict — a pump kept back for the rainy season is idle by design."
      >
        {idle.length === 0 ? (
          <FleetEmptyState
            icon={BarChart3}
            title="Nothing idle"
            message="Every serviceable asset is either issued or in the garage."
          />
        ) : (
          <div className="p-6 flex flex-wrap gap-2">
            {idle.map((a) => (
              <Link
                key={a.assetId}
                to={`/admin/fleet/register/${encodeURIComponent(a.assetId)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500"
              >
                {a.assetId}
                <span className="font-sans font-normal text-[11px] text-slate-500 dark:text-slate-400">
                  {CANONICAL_ZONE_METADATA[a.zoneId]?.displayName ?? a.zoneId}
                </span>
              </Link>
            ))}
          </div>
        )}
      </FleetPanel>

      {openJobs.length > 0 && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          {openJobs.length} open job{openJobs.length === 1 ? '' : 's'} in the garage — see the
          Garage &amp; Repairs tab.
        </p>
      )}
    </div>
  );
}

export default AdminFleetReportsPage;
