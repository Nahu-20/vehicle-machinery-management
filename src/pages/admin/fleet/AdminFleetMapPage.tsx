import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Info, ArrowRight, Wrench, Gauge, User } from 'lucide-react';
import { listAssets } from '../../../features/fleet/services/fleetService';
import { listActiveAssignments, isOverdue } from '../../../features/fleet/services/fleetAssignmentService';
import type { FleetAsset, FleetAssignment } from '../../../features/fleet/types/fleet';
import {
  formatMeter,
  isServiceDue,
  meterUntilService,
} from '../../../features/fleet/constants/fleetVocabulary';
import {
  FleetPanel,
  FleetEmptyState,
  StatusPill,
  FleetLoading,
  FleetBanner,
} from '../../../features/fleet/components/FleetUI';
import { AssetImage } from '../../../features/fleet/components/AssetImage';
import { FleetZoneMap } from '../../../features/fleet/components/FleetZoneMap';
import {
  CANONICAL_ZONE_METADATA,
  type CanonicalZoneId,
} from '../../../features/investment-map/constants/canonicalZones';

/**
 * Fleet position by zone.
 *
 * Two selections, not one: a zone lists what is stationed there, and a vehicle
 * on the map opens that vehicle. Both are needed — "what does Arsi have" and
 * "what is that one" are different questions and a single panel answers neither
 * well.
 */
export function AdminFleetMapPage() {
  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [active, setActive] = useState<FleetAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, act] = await Promise.all([
        listAssets(),
        listActiveAssignments().catch(() => [] as FleetAssignment[]),
      ]);
      setAssets(a);
      setActive(act);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the fleet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const zoneAssets = useMemo(
    () =>
      selectedZone
        ? assets.filter((a) => a.zoneId === selectedZone && a.status !== 'disposed')
        : [],
    [assets, selectedZone]
  );

  const selectedAsset = useMemo(
    () => assets.find((a) => a.assetId === selectedAssetId) ?? null,
    [assets, selectedAssetId]
  );

  const assignmentFor = useCallback(
    (assetId: string) => active.find((x) => x.assetId === assetId && x.status === 'active') ?? null,
    [active]
  );

  const selectedName = selectedZone
    ? CANONICAL_ZONE_METADATA[selectedZone as CanonicalZoneId]?.displayName ?? selectedZone
    : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
        <span>
          Vehicles are drawn inside the zone they are registered to, spread out so they can be
          counted. This system holds no GPS, so a pin shows which zone holds a machine and who
          signed for it — not where it is standing. Zone colour is readiness: green where most of
          the fleet can work, red where most cannot.
        </span>
      </div>

      <FleetPanel
        title="Fleet by zone"
        description="Click a zone to list its machines, or a vehicle to open it. Clicking the selected zone again clears it."
      >
        <div className="p-4">
          <FleetZoneMap
            assets={assets}
            selectedZoneId={selectedZone}
            onSelectZone={setSelectedZone}
            selectedAssetId={selectedAssetId}
            onSelectAsset={setSelectedAssetId}
          />
        </div>
      </FleetPanel>

      {/* Selected vehicle */}
      {selectedAsset && (
        <FleetPanel
          title={`${selectedAsset.assetId} — ${selectedAsset.make} ${selectedAsset.model}`}
          description="Selected on the map."
          action={
            <Link
              to={`/admin/fleet/register/${encodeURIComponent(selectedAsset.assetId)}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Open full record <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="p-6 flex flex-col sm:flex-row gap-6">
            <AssetImage
              assetType={selectedAsset.assetType}
              imageUrl={selectedAsset.imageUrl}
              alt={`${selectedAsset.make} ${selectedAsset.model}`}
              size="card"
            />

            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Status
                </div>
                <div className="mt-1">
                  <StatusPill status={selectedAsset.status} />
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Zone / station
                </div>
                <div className="mt-1 font-semibold text-slate-700 dark:text-slate-200">
                  {CANONICAL_ZONE_METADATA[selectedAsset.zoneId]?.displayName ?? selectedAsset.zoneId}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedAsset.stationedAt}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Reading
                </div>
                <div className="mt-1 font-mono font-bold text-slate-700 dark:text-slate-200">
                  {formatMeter(selectedAsset.currentMeter, selectedAsset.meterType)}
                </div>
                {isServiceDue(selectedAsset) ? (
                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <Wrench className="w-3 h-3" /> Service due
                  </div>
                ) : (
                  meterUntilService(selectedAsset) !== null && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      service in{' '}
                      {formatMeter(meterUntilService(selectedAsset)!, selectedAsset.meterType)}
                    </div>
                  )
                )}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Held by
                </div>
                <div className="mt-1 font-semibold text-slate-700 dark:text-slate-200">
                  {selectedAsset.custodianName || '—'}
                </div>
                {(() => {
                  const a = assignmentFor(selectedAsset.assetId);
                  if (!a) return null;
                  return (
                    <div
                      className={`text-[11px] font-bold ${
                        isOverdue(a)
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {isOverdue(a) ? 'Overdue' : 'Out now'}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </FleetPanel>
      )}

      {/* Selected zone */}
      <FleetPanel
        title={
          selectedName
            ? `${selectedName} — ${zoneAssets.length} machine${zoneAssets.length === 1 ? '' : 's'}`
            : 'Zone detail'
        }
        description={
          selectedName
            ? 'Everything stationed in this zone, excluding disposed assets.'
            : 'No zone selected.'
        }
      >
        {loading ? (
          <FleetLoading />
        ) : !selectedZone ? (
          <FleetEmptyState
            icon={MapPin}
            title="Select a zone"
            message="Click any zone on the map to see which machines are stationed there, or click a vehicle to open it directly."
          />
        ) : zoneAssets.length === 0 ? (
          <FleetEmptyState
            icon={MapPin}
            title={`Nothing registered in ${selectedName}`}
            message="No assets are stationed in this zone yet."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-6 py-3">Machine</th>
                  <th className="px-6 py-3">Station</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Held by</th>
                  <th className="px-6 py-3 text-right">Reading</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {zoneAssets.map((a) => (
                  <tr
                    key={a.assetId}
                    onClick={() => setSelectedAssetId(a.assetId)}
                    className={`cursor-pointer transition-colors ${
                      a.assetId === selectedAssetId
                        ? 'bg-emerald-50 dark:bg-emerald-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <AssetImage
                          assetType={a.assetType}
                          imageUrl={a.imageUrl}
                          alt={`${a.make} ${a.model}`}
                        />
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400">
                            {a.assetId}
                          </span>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {a.make} {a.model}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-300">
                      {a.stationedAt}
                    </td>
                    <td className="px-6 py-3">
                      <StatusPill status={a.status} />
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-300">
                      {a.custodianName ? (
                        <span className="inline-flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          {a.custodianName}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-xs text-right font-mono text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <Gauge className="w-3 h-3 text-slate-400" />
                        {formatMeter(a.currentMeter, a.meterType)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FleetPanel>

      {error && (
        <FleetBanner tone="warn">{error}</FleetBanner>
      )}
    </div>
  );
}

export default AdminFleetMapPage;
