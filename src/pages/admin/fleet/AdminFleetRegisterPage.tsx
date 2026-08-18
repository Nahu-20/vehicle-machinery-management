import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Truck,
  Search,
  Plus,
  AlertTriangle,
  RefreshCw,
  Wrench,
  X,
  Rows3,
  Map as MapIcon,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import { listAssets } from '../../../features/fleet/services/fleetService';
import type {
  FleetAsset,
  FleetAssetFilters,
  FleetAssetStatus,
  FleetAssetType,
} from '../../../features/fleet/types/fleet';
import {
  FLEET_ASSET_STATUSES,
  FLEET_ASSET_TYPES,
  formatMeter,
  isServiceDue,
  meterUntilService,
} from '../../../features/fleet/constants/fleetVocabulary';
import {
  StatusPill,
  FleetPanel,
  FleetEmptyState,
  FleetButton,
  FleetLoading,
  FleetBanner,
  INPUT,
  SELECT_CLASSES,
  STATUS_LABELS,
  FleetTabs,
  type FleetTab,
} from '../../../features/fleet/components/FleetUI';
import { AssetImage } from '../../../features/fleet/components/AssetImage';
import { AdminFleetMapPage } from './AdminFleetMapPage';
import {
  CANONICAL_ZONE_IDS,
  CANONICAL_ZONE_METADATA,
  type CanonicalZoneId,
} from '../../../features/investment-map/constants/canonicalZones';

const TYPE_LABELS: Record<FleetAssetType, string> = {
  tractor: 'Tractor',
  harvester: 'Harvester',
  implement: 'Implement',
  pickup: 'Pickup',
  truck: 'Truck',
  motorcycle: 'Motorcycle',
  bus: 'Bus',
  pump: 'Pump',
  generator: 'Generator',
  other: 'Other',
};

export function AdminFleetRegisterPage() {
  const { staffUser } = useStaffAuthorizationContext();
  const canManage = hasPermission(staffUser, 'fleet.asset.manage');

  /**
   * Table or map, held in the URL.
   *
   * The map used to be its own tab, which made it a destination — somewhere you
   * went instead of the register. It is not: it is the same list of machines
   * drawn by zone rather than in rows, and the questions it answers ("what has
   * Arsi got") are register questions. Keeping the choice in the query string
   * means a map view can still be linked to and bookmarked, which a tab you have
   * to click your way back to could not offer either.
   */
  const [params, setParams] = useSearchParams();
  const mapView = params.get('view') === 'map';
  const setMapView = (on: boolean) => {
    const next = new URLSearchParams(params);
    if (on) next.set('view', 'map');
    else next.delete('view');
    setParams(next, { replace: true });
  };

  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [zoneId, setZoneId] = useState<CanonicalZoneId | 'all'>('all');
  const [assetType, setAssetType] = useState<FleetAssetType | 'all'>('all');
  const [status, setStatus] = useState<FleetAssetStatus | 'all'>('all');
  const [serviceDueOnly, setServiceDueOnly] = useState(false);
  const [search, setSearch] = useState('');

  /**
   * The typed value and the value the query actually uses.
   *
   * These were one thing, which meant the register refetched on every
   * keystroke: eight requests to type a plate number, each one racing the last.
   * The input stays instant and the query follows a beat behind.
   */
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(id);
  }, [search]);

  /**
   * The tab strip answers "what is out right now" in one click.
   *
   * It writes through to the same status filter the dropdown uses rather than
   * being a second, parallel notion of state — two filters that can disagree
   * about the same list is how a register starts showing one thing and counting
   * another.
   */
  const view = status;
  const setView = (next: FleetAssetStatus | 'all') => setStatus(next);

  const filters: FleetAssetFilters = useMemo(
    () => ({ zoneId, assetType, status, serviceDueOnly, search: debouncedSearch }),
    [zoneId, assetType, status, serviceDueOnly, debouncedSearch]
  );

  const filtersActive =
    zoneId !== 'all' || assetType !== 'all' || status !== 'all' || serviceDueOnly || search.trim() !== '';

  const clearFilters = () => {
    setZoneId('all');
    setAssetType('all');
    setStatus('all');
    setServiceDueOnly(false);
    setSearch('');
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAssets(await listAssets(filters));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the register.');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const dueCount = useMemo(() => assets.filter(isServiceDue).length, [assets]);

  const VIEWS: FleetTab<FleetAssetStatus | 'all'>[] = [
    { id: 'all', label: 'All' },
    { id: 'assigned', label: 'In use' },
    { id: 'available', label: 'Available' },
    { id: 'in_maintenance', label: 'In garage' },
    { id: 'out_of_service', label: 'Off the road' },
    { id: 'disposed', label: 'Retired' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FleetTabs
          tabs={VIEWS}
          active={view}
          onChange={setView}
          ariaLabel="Filter the register by what each machine is doing"
        />
        <div className="flex items-center gap-1 shrink-0">
          <FleetButton
            variant={mapView ? 'secondary' : 'primary'}
            icon={Rows3}
            onClick={() => setMapView(false)}
          >
            Table
          </FleetButton>
          <FleetButton
            variant={mapView ? 'primary' : 'secondary'}
            icon={MapIcon}
            onClick={() => setMapView(true)}
          >
            Map
          </FleetButton>
        </div>
      </div>

      {/* The map draws the whole register by zone. The filters above do not
          apply to it: a map with half its pins hidden reads as a map of an
          emptier fleet, which is worse than no map. */}
      {mapView && <AdminFleetMapPage />}

      {!mapView && (
        <>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, make, model, plate or station…"
              className={`${INPUT} pl-9`}
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
            value={assetType}
            onChange={(e) => setAssetType(e.target.value as FleetAssetType | 'all')}
            className={SELECT_CLASSES}
          >
            <option value="all">All types</option>
            {FLEET_ASSET_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FleetAssetStatus | 'all')}
            className={SELECT_CLASSES}
          >
            <option value="all">All statuses</option>
            {FLEET_ASSET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={serviceDueOnly}
              onChange={(e) => setServiceDueOnly(e.target.checked)}
              className="accent-emerald-600"
            />
            Service due only
          </label>

          {filtersActive && (
            <FleetButton variant="secondary" icon={X} onClick={clearFilters}>
              Clear filters
            </FleetButton>
          )}

          <FleetButton variant="secondary" icon={RefreshCw} onClick={() => void load()}>
            Refresh
          </FleetButton>

          {canManage && (
            <Link to="/admin/fleet/register/new">
              <FleetButton icon={Plus}>Add asset</FleetButton>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <FleetBanner tone="warn" icon={AlertTriangle}><span>{error}</span></FleetBanner>
      )}

      <FleetPanel
        title={`Register — ${assets.length} asset${assets.length === 1 ? '' : 's'}`}
        description={
          dueCount > 0
            ? `${dueCount} due for service.`
            : 'Every asset the Bureau owns, with its current status and holder.'
        }
      >
        {loading ? (
          <FleetLoading label="Loading register…" />
        ) : assets.length === 0 ? (
          <FleetEmptyState
            icon={Truck}
            title="No assets match"
            message={
              search || zoneId !== 'all' || status !== 'all' || assetType !== 'all' || serviceDueOnly
                ? 'Nothing matches these filters. Use Clear filters to see the whole register.'
                : 'The register is empty. Add the first vehicle or machine to begin.'
            }
            action={
              canManage ? (
                <Link to="/admin/fleet/register/new">
                  <FleetButton icon={Plus}>Add asset</FleetButton>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-3">Asset</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Zone / Station</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Holder</th>
                  <th className="px-6 py-3">Meter</th>
                  <th className="px-6 py-3">Service</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {assets.map((asset) => {
                  const due = isServiceDue(asset);
                  const remaining = meterUntilService(asset);
                  return (
                    <tr
                      key={asset.assetId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <AssetImage
                            assetType={asset.assetType}
                            imageUrl={asset.imageUrl}
                            alt={`${asset.make} ${asset.model}`}
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/admin/fleet/register/${encodeURIComponent(asset.assetId)}`}
                              className="font-bold text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
                            >
                              {asset.assetId}
                            </Link>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {asset.make} {asset.model}
                              {asset.plateNumber ? ` · ${asset.plateNumber}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {TYPE_LABELS[asset.assetType]}
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {CANONICAL_ZONE_METADATA[asset.zoneId]?.displayName ?? asset.zoneId}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {asset.stationedAt}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <StatusPill status={asset.status} />
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {asset.custodianDriverId ? (
                          <Link
                            to={`/admin/fleet/drivers/${asset.custodianDriverId}`}
                            className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                          >
                            {asset.custodianName}
                          </Link>
                        ) : (
                          asset.custodianName || <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-xs font-mono text-slate-600 dark:text-slate-300">
                        {formatMeter(asset.currentMeter, asset.meterType)}
                      </td>
                      <td className="px-6 py-3">
                        {due ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                            <Wrench className="w-3.5 h-3.5" />
                            Due now
                          </span>
                        ) : remaining === null ? (
                          <span className="text-[11px] text-slate-400">—</span>
                        ) : (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            in {formatMeter(remaining, asset.meterType)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </FleetPanel>
        </>
      )}
    </div>
  );
}

export default AdminFleetRegisterPage;
