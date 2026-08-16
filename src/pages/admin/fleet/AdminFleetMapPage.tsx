import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Info } from 'lucide-react';
import { listAssets, summariseFleet } from '../../../features/fleet/services/fleetService';
import type { FleetAsset } from '../../../features/fleet/types/fleet';
import { FleetPanel, FleetEmptyState, StatusPill } from '../../../features/fleet/components/FleetUI';
import { UnifiedMapContainer } from '../../../features/investment-map/components/UnifiedMapContainer';
import {
  CANONICAL_ZONE_METADATA,
  type CanonicalZoneId,
} from '../../../features/investment-map/constants/canonicalZones';

/**
 * Fleet position by zone.
 *
 * Zone-level, not GPS. Nothing here tracks a machine's coordinates, because
 * nothing in this system knows them — the position shown is the zone the asset
 * is registered to and the office holding it, which is what the paper register
 * records. Selecting a zone lists what is actually there.
 *
 * Reuses the map already built for the public investment portal rather than
 * standing up a second one.
 */
export function AdminFleetMapPage() {
  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAssets(await listAssets());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the fleet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => summariseFleet(assets), [assets]);

  const zoneAssets = useMemo(
    () =>
      selectedZone
        ? assets.filter((a) => a.zoneId === selectedZone && a.status !== 'disposed')
        : [],
    [assets, selectedZone]
  );

  const selectedName = selectedZone
    ? CANONICAL_ZONE_METADATA[selectedZone as CanonicalZoneId]?.displayName ?? selectedZone
    : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
        <span>
          Position is recorded at zone level. This system holds no GPS or telematics data, so a
          machine is shown where it is registered and with whoever signed for it — the same
          information the paper register carries, kept current.
        </span>
      </div>

      <FleetPanel
        title="Fleet by zone"
        description="Select a zone on the map to list the machines stationed there."
      >
        <div className="p-4">
          <UnifiedMapContainer
            height="520px"
            selectedZoneId={selectedZone}
            onSelectZone={setSelectedZone}
          />
        </div>
      </FleetPanel>

      <FleetPanel
        title={selectedName ? `${selectedName} — ${zoneAssets.length} asset${zoneAssets.length === 1 ? '' : 's'}` : 'Zone detail'}
        description={
          selectedName
            ? 'Everything registered to this zone, excluding disposed assets.'
            : 'No zone selected.'
        }
      >
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">Loading…</div>
        ) : !selectedZone ? (
          <FleetEmptyState
            icon={MapPin}
            title="Select a zone"
            message="Click any zone on the map above to see which machines are stationed there and what condition they are in."
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
                  <th className="px-6 py-3">Asset</th>
                  <th className="px-6 py-3">Station</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Held by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {zoneAssets.map((a) => (
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
                      {a.stationedAt}
                    </td>
                    <td className="px-6 py-3">
                      <StatusPill status={a.status} />
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-300">
                      {a.custodianName || <span className="text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FleetPanel>

      {error && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
          {error}
        </div>
      )}

      {summary.byZone.length > 0 && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Assets are registered across {summary.byZone.length} of Oromia&apos;s 22 zones.
        </p>
      )}
    </div>
  );
}

export default AdminFleetMapPage;
