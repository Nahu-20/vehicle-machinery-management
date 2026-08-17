import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Wrench,
  Clock,
  Coins,
  AlertTriangle,
  ShieldAlert,
  Droplets,
} from 'lucide-react';
import { listAssets, listServiceRecords } from '../../../features/fleet/services/fleetService';
import { listWorkOrders } from '../../../features/fleet/services/fleetWorkOrderService';
import {
  listActiveAssignments,
  isOverdue,
} from '../../../features/fleet/services/fleetAssignmentService';
import type {
  FleetAsset,
  FleetAssignment,
  FleetServiceRecord,
  FleetWorkOrder,
} from '../../../features/fleet/types/fleet';
import {
  assessAssetCompliance,
  worstSeverity,
  COMPLIANCE_ORDER,
  formatMeter,
  isServiceDue,
  isExpired,
  isExpiringSoon,
  meterUntilService,
  IN_GARAGE_WORK_ORDER_STATUSES,
} from '../../../features/fleet/constants/fleetVocabulary';
import {
  StatCard,
  FleetPanel,
  FleetEmptyState,
  StatusPill,
  fmtDay,
  FleetLoading,
  FleetBanner,
} from '../../../features/fleet/components/FleetUI';
import { CANONICAL_ZONE_METADATA } from '../../../features/investment-map/constants/canonicalZones';

/** Short date for expiry and service rows. */

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
  const [services, setServices] = useState<FleetServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, w, act, svc] = await Promise.all([
        listAssets(),
        listWorkOrders().catch(() => [] as FleetWorkOrder[]),
        listActiveAssignments().catch(() => [] as FleetAssignment[]),
        listServiceRecords().catch(() => [] as FleetServiceRecord[]),
      ]);
      setAssets(a);
      setWorkOrders(w);
      setActive(act);
      setServices(svc);
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

  /**
   * Road documents that need somebody to do something — a compliance risk, not
   * a maintenance one.
   *
   * This used to ask isExpired and isExpiringSoon directly, which meant a
   * vehicle with no date recorded at all passed both and was counted as fine.
   * assessAssetCompliance names that case, so the figure now includes the
   * vehicles nobody has checked as well as the ones known to have lapsed.
   */
  const documentRisk = useMemo(
    () =>
      assets
        .map((a) => ({ asset: a, items: assessAssetCompliance(a) }))
        .filter((r) => r.items.length > 0 && worstSeverity(r.items) !== 'ok')
        .sort(
          (x, y) =>
            COMPLIANCE_ORDER[worstSeverity(x.items)] - COMPLIANCE_ORDER[worstSeverity(y.items)]
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

  /**
   * Jobs that carry a cost, which is what the spend total is summed from.
   *
   * Not every work order: an open fault with nothing spent yet contributes
   * nothing, and counting it made the card read "37,050 ETB across 8 jobs" when
   * the money came from five.
   */
  const chargedJobs = useMemo(() => workOrders.filter((w) => (w.totalCost ?? 0) > 0), [workOrders]);

  const totalSpend = useMemo(
    () => chargedJobs.reduce((sum, w) => sum + (w.totalCost ?? 0), 0),
    [chargedJobs]
  );

  const openJobs = useMemo(
    () => workOrders.filter((w) => IN_GARAGE_WORK_ORDER_STATUSES.includes(w.status)),
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
        <FleetLoading />
      </FleetPanel>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <FleetBanner tone="warn">{error}</FleetBanner>
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
          hint="Lapsed, expiring within 30 days, or never recorded"
        />
        <StatCard
          label="Repair spend"
          value={`${totalSpend.toLocaleString()} ETB`}
          icon={Coins}
          hint={`Across ${chargedJobs.length} job${chargedJobs.length === 1 ? '' : 's'} with costs recorded`}
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* The Document risk card had no panel under it, so it named a number
            nobody could act on. */}
        <FleetPanel
          title={`Document risk — ${documentRisk.length}`}
          description="Insurance and roadworthiness: lapsed, falling due within 30 days, or never recorded at all. Farm machinery carries neither, so only road vehicles appear."
          action={
            <Link
              to="/admin/fleet/compliance"
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              Open compliance →
            </Link>
          }
        >
          {documentRisk.length === 0 ? (
            <FleetEmptyState
              icon={ShieldAlert}
              title="Nothing outstanding"
              message="Every road vehicle has both documents recorded and in date for the next 30 days."
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {documentRisk.map(({ asset: a, items }) => (
                <div key={a.assetId} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/admin/fleet/register/${encodeURIComponent(a.assetId)}`}
                      className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      {a.assetId}
                    </Link>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {a.make} {a.model}
                      {a.plateNumber ? ` · ${a.plateNumber}` : ''} ·{' '}
                      {CANONICAL_ZONE_METADATA[a.zoneId]?.displayName ?? a.zoneId}
                    </div>
                  </div>
                  <div className="text-right">
                    {items
                      .filter((i) => i.severity !== 'ok')
                      .map((i) => (
                        <div
                          key={i.kind}
                          className={`text-[11px] font-bold ${
                            i.severity === 'lapsed'
                              ? 'text-red-600 dark:text-red-400'
                              : i.severity === 'unknown'
                              ? 'text-slate-500 dark:text-slate-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {i.severity === 'unknown'
                            ? `${i.label} never recorded`
                            : `${i.label} ${i.severity === 'lapsed' ? 'expired' : 'due'} ${fmtDay(
                                i.expiry as any
                              )}`}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </FleetPanel>

        {/* The counterpart to 'Due for service': what proves the register is
            being kept up rather than only being asked things. */}
        <FleetPanel
          title={`Serviced recently — ${services.length}`}
          description="Completed services, newest first. Recorded from a vehicle's page, and kept apart from repair spend."
        >
          {services.length === 0 ? (
            <FleetEmptyState
              icon={Droplets}
              title="No services recorded"
              message="Use Record service on a vehicle to log one. It clears the machine from the due list above."
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {services.slice(0, 12).map((r) => {
                const asset = assets.find((a) => a.assetId === r.assetId);
                return (
                  <div key={r.serviceRecordId} className="p-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/admin/fleet/register/${encodeURIComponent(r.assetId)}`}
                        className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        {r.assetId}
                      </Link>
                      {r.note && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-300">{r.note}</div>
                      )}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {fmtDay(r.servicedAt)} · {r.recordedByName}
                      </div>
                    </div>
                    <div className="text-right text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      {asset ? formatMeter(r.meterAtService, asset.meterType) : r.meterAtService}
                      {r.cost ? (
                        <div className="text-slate-500 dark:text-slate-400">
                          {r.cost.toLocaleString()} ETB
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
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
