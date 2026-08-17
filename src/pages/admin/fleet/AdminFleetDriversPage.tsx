import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  AlertTriangle,
  RefreshCw,
  Phone,
  IdCard,
  ShieldAlert,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  listDrivers,
  listOpenAssignmentsByDriver,
  type FleetDriverFilters,
} from '../../../features/fleet/services/fleetDriverService';
import type {
  FleetAssignment,
  FleetDriver,
  FleetDriverStatus,
} from '../../../features/fleet/types/fleet';
import {
  DRIVER_STATUS_LABELS,
  daysUntil,
  licenceState,
} from '../../../features/fleet/constants/fleetVocabulary';
import {
  StatCard,
  FleetPanel,
  FleetEmptyState,
  FleetButton,
  DriverStatusPill,
  LicencePill,
} from '../../../features/fleet/components/FleetUI';
import {
  CANONICAL_ZONE_IDS,
  CANONICAL_ZONE_METADATA,
  type CanonicalZoneId,
} from '../../../features/investment-map/constants/canonicalZones';

const SELECT_CLASSES =
  'px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500';

const DRIVER_STATUSES: FleetDriverStatus[] = ['active', 'suspended', 'inactive'];

const EMPLOYMENT_LABELS: Record<FleetDriver['employment'], string> = {
  permanent: 'Permanent',
  contract: 'Contract',
  seconded: 'Seconded',
  daily: 'Daily',
};

/**
 * The driver directory.
 *
 * Answers the question the register could not: not "where is the tractor" but
 * "who has it, and are they licensed to". The licence column is the reason this
 * page is worth opening — a directory of names and phone numbers is an address
 * book, and the Bureau already has one of those on paper.
 */
export function AdminFleetDriversPage() {
  const { staffUser } = useStaffAuthorizationContext();
  const canManage = hasPermission(staffUser, 'fleet.driver.manage');

  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [holding, setHolding] = useState<Map<string, FleetAssignment>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [zoneId, setZoneId] = useState<CanonicalZoneId | 'all'>('all');
  const [status, setStatus] = useState<FleetDriverStatus | 'all'>('all');

  const filters = useMemo<FleetDriverFilters>(
    () => ({ zoneId, status, search: search.trim() || undefined }),
    [zoneId, status, search]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, open] = await Promise.all([
        listDrivers(filters),
        // Non-critical: if this fails the directory still lists everyone, it
        // just cannot say what they are holding.
        listOpenAssignmentsByDriver().catch(() => new Map<string, FleetAssignment>()),
      ]);
      setDrivers(rows);
      setHolding(open);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the driver directory.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  /**
   * Counted over every driver, not the filtered view.
   *
   * A licence problem hidden behind a zone filter is a licence problem nobody
   * sees, and these tiles exist precisely to be seen without looking for them.
   */
  const summary = useMemo(() => {
    const active = drivers.filter((d) => d.status === 'active');
    const lapsed = active.filter((d) => licenceState(d) === 'lapsed').length;
    const expiring = active.filter((d) => licenceState(d) === 'expiring').length;
    const unrecorded = active.filter((d) => licenceState(d) === 'none').length;
    return { total: drivers.length, active: active.length, lapsed, expiring, unrecorded };
  }, [drivers]);

  const filtered = zoneId !== 'all' || status !== 'all' || search.trim();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Drivers"
          value={summary.total}
          icon={Users}
          hint={`${summary.active} active`}
        />
        <StatCard
          label="Licence lapsed"
          value={summary.lapsed}
          icon={ShieldAlert}
          tone={summary.lapsed > 0 ? 'bad' : 'good'}
          hint={summary.lapsed > 0 ? 'Cannot be issued a road vehicle' : 'None expired'}
        />
        <StatCard
          label="Expiring soon"
          value={summary.expiring}
          icon={IdCard}
          tone={summary.expiring > 0 ? 'warn' : 'neutral'}
          hint="Within 30 days"
        />
        <StatCard
          label="No licence recorded"
          value={summary.unrecorded}
          icon={AlertTriangle}
          tone={summary.unrecorded > 0 ? 'warn' : 'neutral'}
          hint="Not the same as having none"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, employee or licence number…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value as CanonicalZoneId | 'all')}
            className={SELECT_CLASSES}
          >
            <option value="all">All zones</option>
            {CANONICAL_ZONE_IDS.map((z) => (
              <option key={z} value={z}>
                {CANONICAL_ZONE_METADATA[z].displayName}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FleetDriverStatus | 'all')}
            className={SELECT_CLASSES}
          >
            <option value="all">All statuses</option>
            {DRIVER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {DRIVER_STATUS_LABELS[st]}
              </option>
            ))}
          </select>

          <FleetButton variant="secondary" icon={RefreshCw} onClick={() => void load()}>
            Refresh
          </FleetButton>

          {canManage && (
            <Link to="/admin/fleet/drivers/new">
              <FleetButton icon={Plus}>Add driver</FleetButton>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
          {error}
        </div>
      )}

      <FleetPanel
        title={`Drivers — ${drivers.length}`}
        description="Operators and drivers who may be issued a machine. Records, not portal accounts."
      >
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading…</div>
        ) : drivers.length === 0 ? (
          <FleetEmptyState
            icon={Users}
            title="No drivers listed"
            message={
              filtered
                ? 'Nothing matches these filters. Clear them to see the whole directory.'
                : 'Add the operators and drivers who take machines out, so a sign-out names a person the register knows.'
            }
            action={
              canManage && !filtered ? (
                <Link to="/admin/fleet/drivers/new">
                  <FleetButton icon={Plus}>Add driver</FleetButton>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-3">Driver</th>
                  <th className="px-6 py-3">Licence</th>
                  <th className="px-6 py-3">Zone</th>
                  <th className="px-6 py-3">Holding</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {drivers.map((d) => {
                  const state = licenceState(d);
                  const days = daysUntil(d.licenceExpiry);
                  const open = holding.get(d.driverId);
                  return (
                    <tr
                      key={d.driverId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <Link
                          to={`/admin/fleet/drivers/${d.driverId}`}
                          className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          {d.fullName}
                        </Link>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono">{d.driverId}</span>
                          <span>·</span>
                          <span>{EMPLOYMENT_LABELS[d.employment]}</span>
                          {d.phone && (
                            <>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1">
                                <Phone className="w-3 h-3 shrink-0" />
                                {d.phone}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <LicencePill
                          state={state}
                          detail={
                            state === 'expiring' && days !== null
                              ? `${days}d`
                              : state === 'lapsed' && days !== null
                              ? `${Math.abs(days)}d ago`
                              : undefined
                          }
                        />
                        {d.licenceNumber && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                            {d.licenceNumber}
                            {d.licenceGrade ? ` · grade ${d.licenceGrade}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {CANONICAL_ZONE_METADATA[d.zoneId]?.displayName ?? d.zoneId}
                        {d.stationedAt && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {d.stationedAt}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-xs">
                        {open ? (
                          <Link
                            to={`/admin/fleet/register/${open.assetId}`}
                            className="font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                          >
                            {open.assetId}
                          </Link>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <DriverStatusPill status={d.status} />
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

export default AdminFleetDriversPage;
