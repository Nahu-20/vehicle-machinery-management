import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  CheckCircle2,
  Wrench,
  AlertOctagon,
  MapPin,
  ArrowRight,
  Clock,
  Fuel,
  ShieldAlert,
} from 'lucide-react';
import { listAssets, summariseFleet } from '../../../features/fleet/services/fleetService';
import { listWorkOrders, countGrounded } from '../../../features/fleet/services/fleetWorkOrderService';
import {
  listActiveAssignments,
  countOverdue,
} from '../../../features/fleet/services/fleetAssignmentService';
import type {
  FleetAsset,
  FleetAssignment,
  FleetWorkOrder,
} from '../../../features/fleet/types/fleet';
import {
  StatCard,
  FleetPanel,
  FleetEmptyState,
  FleetLoading,
  FleetBanner,
  etb,
} from '../../../features/fleet/components/FleetUI';
import { listFuelLogs } from '../../../features/fleet/services/fleetFuelService';
import { listDrivers } from '../../../features/fleet/services/fleetDriverService';
import type { FleetDriver, FleetFuelLog } from '../../../features/fleet/types/fleet';
import {
  assessAssetCompliance,
  assessDriverCompliance,
  totalFuelSpend,
  worstSeverity,
} from '../../../features/fleet/constants/fleetVocabulary';
import { CANONICAL_ZONE_METADATA } from '../../../features/investment-map/constants/canonicalZones';

/**
 * The headline view: how many machines are working, and where.
 *
 * This is the question the paper register cannot answer without a round of
 * phone calls, so it is what the module opens on. Figures that demand action —
 * grounded machines, assets past their service interval — are given their own
 * cards rather than being left for the reader to derive from a table.
 */
export function AdminFleetDashboardPage() {
  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [workOrders, setWorkOrders] = useState<FleetWorkOrder[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<FleetAssignment[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FleetFuelLog[]>([]);
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Faults and open assignments load alongside the register so the headline
        // counts come from records rather than sitting at zero.
        const [all, faults, act, fuel, driverRows] = await Promise.all([
          listAssets(),
          listWorkOrders().catch(() => [] as FleetWorkOrder[]),
          listActiveAssignments().catch(() => [] as FleetAssignment[]),
          // Both non-critical: the overview still answers its original question
          // if either fails, it just cannot add the newer two tiles.
          listFuelLogs().catch(() => [] as FleetFuelLog[]),
          listDrivers().catch(() => [] as FleetDriver[]),
        ]);
        if (!cancelled) {
          setAssets(all);
          setWorkOrders(faults);
          setActiveAssignments(act);
          setFuelLogs(fuel);
          setDrivers(driverRows);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load the fleet.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(
    () => summariseFleet(assets, countOverdue(activeAssignments), countGrounded(workOrders)),
    [assets, activeAssignments, workOrders]
  );

  /** Fuel bought since the first of this month. */
  const fuelThisMonth = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return totalFuelSpend(fuelLogs.filter((l) => l.filledAt.toMillis() >= start));
  }, [fuelLogs]);

  /**
   * Vehicles and drivers with a document that needs attention.
   *
   * Counted together, because whoever opens this page in the morning is going to
   * chase both from the same desk — and counted at all, because until the
   * compliance work landed a vehicle nobody had insured was indistinguishable
   * from one that was covered.
   */
  const complianceRisk = useMemo(() => {
    const bad = (items: ReturnType<typeof assessAssetCompliance>) =>
      items.length > 0 && worstSeverity(items) !== 'ok';
    return (
      assets.filter((a) => bad(assessAssetCompliance(a))).length +
      drivers.filter((d) => bad(assessDriverCompliance(d))).length
    );
  }, [assets, drivers]);

  const inService = summary.byStatus.available + summary.byStatus.assigned;
  const down =
    summary.byStatus.in_maintenance +
    summary.byStatus.awaiting_parts +
    summary.byStatus.out_of_service;

  return (
    <div className="space-y-6">
      {/* Hero, matching AdminDashboardPage's treatment */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-3">
            <Truck className="w-3.5 h-3.5" />
            Fleet Overview
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            {loading ? 'Loading fleet…' : `${inService} of ${summary.totalAssets} in service`}
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl">
            Live position of every Bureau vehicle, tractor and machine across the region — replacing
            the zonal paper registers with one record everyone reads from.
          </p>
        </div>
      </div>

      {error && (
        <FleetBanner tone="warn">{error}</FleetBanner>
      )}

      {!loading && (summary.groundedCount > 0 || summary.overdueReturnCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {summary.groundedCount > 0 && (
            <StatCard
              label="Machines grounded"
              value={summary.groundedCount}
              icon={AlertOctagon}
              tone="bad"
              hint="Cannot work until repaired"
            />
          )}
          {summary.overdueReturnCount > 0 && (
            <StatCard
              label="Overdue returns"
              value={summary.overdueReturnCount}
              icon={Clock}
              tone="bad"
              hint="Out past the agreed date"
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Available now"
          value={summary.byStatus.available}
          icon={CheckCircle2}
          tone="good"
          hint="Ready to be issued"
        />
        <StatCard
          label="In use"
          value={summary.byStatus.assigned}
          icon={Truck}
          hint="Currently signed out"
        />
        <StatCard
          label="Off the road"
          value={down}
          icon={Wrench}
          tone={down > 0 ? 'warn' : 'neutral'}
          hint="In garage, awaiting parts or withdrawn"
        />
        <StatCard
          label="Service due"
          value={summary.serviceDueCount}
          icon={AlertOctagon}
          tone={summary.serviceDueCount > 0 ? 'bad' : 'neutral'}
          hint="Past the service interval"
        />
      </div>

      {/* What the module learned to track after the first round: what the fleet
          costs to run, and whether its paperwork is in order. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard
          label="Fuel this month"
          value={etb(fuelThisMonth)}
          icon={Fuel}
          hint="Recorded from slips — repairs are counted apart"
        />
        <StatCard
          label="Compliance risk"
          value={complianceRisk}
          icon={ShieldAlert}
          tone={complianceRisk > 0 ? 'warn' : 'good'}
          hint="Vehicles and drivers: lapsed, expiring or never recorded"
        />
      </div>

      <FleetPanel
        title="Availability by zone"
        description="Where the machines are. Disposed assets are excluded so a zone is not made to look better resourced than it is."
        action={
          <Link
            to="/admin/fleet/register"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Open register <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {loading ? (
          <FleetLoading />
        ) : summary.byZone.length === 0 ? (
          <FleetEmptyState
            icon={MapPin}
            title="No assets recorded yet"
            message="Once vehicles are added to the register, this grid shows how many are available in each zone."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-3">Zone</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-right">Available</th>
                  <th className="px-6 py-3 text-right">In use</th>
                  <th className="px-6 py-3 text-right">Off the road</th>
                  <th className="px-6 py-3 w-40">Readiness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {summary.byZone.map((row) => {
                  const readiness = row.total > 0 ? Math.round((row.available / row.total) * 100) : 0;
                  return (
                    <tr key={row.zoneId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {CANONICAL_ZONE_METADATA[row.zoneId]?.displayName ?? row.zoneId}
                      </td>
                      <td className="px-6 py-3 text-xs text-right font-mono text-slate-600 dark:text-slate-300">
                        {row.total}
                      </td>
                      <td className="px-6 py-3 text-xs text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {row.available}
                      </td>
                      <td className="px-6 py-3 text-xs text-right font-mono text-blue-700 dark:text-blue-400">
                        {row.assigned}
                      </td>
                      <td className="px-6 py-3 text-xs text-right font-mono text-amber-700 dark:text-amber-400">
                        {row.down}
                      </td>
                      <td className="px-6 py-3">
                        <div
                          className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"
                          role="img"
                          aria-label={`${readiness}% available`}
                        >
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${readiness}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </FleetPanel>
    </div>
  );
}

export default AdminFleetDashboardPage;
