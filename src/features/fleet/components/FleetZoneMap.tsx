import React, { useEffect, useMemo, useRef, useState } from 'react';
// Aliased: importing this as `Map` shadows the built-in Map constructor, and
// grouping assets by zone then fails with "Map is not a constructor".
import MapGL, { Source, Layer, Marker, NavigationControl, type MapRef } from 'react-map-gl/mapbox';
import type { MapMouseEvent } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from '../../../context/ThemeContext';
import { loadAndValidateOromiaGeoJSON } from '../../investment-map/services/gisLoader';
import type { GisValidationResult } from '../../investment-map/types/gis';
import type { FleetAsset } from '../types/fleet';
import { STATUS_PILL_CLASSES } from '../constants/fleetVocabulary';

const MAPBOX_TOKEN = import.meta.env?.VITE_MAPBOX_TOKEN || '';

/**
 * Where the fleet is.
 *
 * Deliberately flat and Mapbox-only. The public investment map offers three
 * engines and a 3D terrain view because it is showing terrain; this is showing
 * where machines are parked, and tilting the camera only makes markers overlap
 * and distances harder to judge. Pitch is fixed at zero and rotation disabled.
 *
 * Positions are zone-level. Nothing here knows a machine's coordinates, so each
 * vehicle is drawn inside the zone it is registered to, spread around the zone
 * centre so several are countable rather than stacked. That is a drawing
 * convention, not a claim about where the tractor is standing, and the page
 * says so.
 */

const INITIAL_VIEW = { longitude: 39.2, latitude: 7.6, zoom: 5.6 };

/** Colour a zone by how much of its fleet is ready, not by how much it owns. */
const ZONE_FILL: any = {
  id: 'fleet-zone-fill',
  type: 'fill',
  paint: {
    'fill-color': [
      'case',
      ['==', ['get', 'fleetTotal'], 0],
      '#64748b',
      ['>=', ['get', 'fleetReadiness'], 0.75],
      '#10b981',
      ['>=', ['get', 'fleetReadiness'], 0.4],
      '#f59e0b',
      '#ef4444',
    ],
    'fill-opacity': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      0.55,
      ['boolean', ['feature-state', 'hover'], false],
      0.4,
      ['==', ['get', 'fleetTotal'], 0],
      0.08,
      0.22,
    ],
  },
};

const ZONE_LINE: any = {
  id: 'fleet-zone-line',
  type: 'line',
  paint: {
    'line-color': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      '#f8fafc',
      '#94a3b8',
    ],
    'line-width': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      2.5,
      0.7,
    ],
  },
};

/** Mean of a polygon's outer ring — good enough to sit a marker inside a zone. */
function centroidOf(geometry: any): [number, number] | null {
  const rings: number[][][] =
    geometry?.type === 'Polygon'
      ? [geometry.coordinates?.[0]]
      : geometry?.type === 'MultiPolygon'
      ? geometry.coordinates.map((p: number[][][]) => p[0])
      : [];

  let lon = 0;
  let lat = 0;
  let n = 0;
  for (const ring of rings) {
    if (!ring) continue;
    for (const [x, y] of ring) {
      lon += x;
      lat += y;
      n += 1;
    }
  }
  return n === 0 ? null : [lon / n, lat / n];
}

/**
 * Spread several markers around a zone's centre.
 *
 * Stacked pins hide how many machines a zone actually holds, which is the one
 * thing this view exists to show. A ring keeps them countable; the radius grows
 * with the count so a zone with twelve does not become a blob.
 */
function spread(centre: [number, number], index: number, count: number): [number, number] {
  if (count <= 1) return centre;
  const radius = 0.16 + Math.min(count, 12) * 0.012;
  const angle = (index / count) * Math.PI * 2;
  return [centre[0] + Math.cos(angle) * radius, centre[1] + Math.sin(angle) * radius * 0.75];
}

const STATUS_DOT: Record<string, string> = {
  available: 'bg-emerald-500',
  assigned: 'bg-blue-500',
  in_maintenance: 'bg-amber-500',
  awaiting_parts: 'bg-orange-500',
  out_of_service: 'bg-red-500',
  disposed: 'bg-slate-500',
};

export interface FleetZoneMapProps {
  assets: FleetAsset[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string | null) => void;
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string | null) => void;
  height?: string;
}

export const FleetZoneMap: React.FC<FleetZoneMapProps> = ({
  assets,
  selectedZoneId,
  onSelectZone,
  selectedAssetId,
  onSelectAsset,
  height = '540px',
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const mapRef = useRef<MapRef | null>(null);

  const [geo, setGeo] = useState<GisValidationResult['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hoverRef = useRef<string | number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await loadAndValidateOromiaGeoJSON();
        if (!cancelled) setGeo(result.data ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Zone boundaries could not be loaded.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Live assets grouped by zone; disposed ones are history and are not drawn. */
  const byZone = useMemo(() => {
    const map = new Map<string, FleetAsset[]>();
    for (const a of assets) {
      if (a.status === 'disposed') continue;
      const list = map.get(a.zoneId) ?? [];
      list.push(a);
      map.set(a.zoneId, list);
    }
    return map;
  }, [assets]);

  /**
   * Fleet counts are written onto the features themselves so the fill can be a
   * data-driven expression. Recomputing on the GPU beats re-rendering React
   * markers for the choropleth.
   */
  const styledGeo = useMemo(() => {
    if (!geo) return null;
    return {
      ...geo,
      features: (geo.features ?? []).map((f: any) => {
        const zoneId = f.properties?.zone_id;
        const list = byZone.get(zoneId) ?? [];
        const ready = list.filter((a) => a.status === 'available' || a.status === 'assigned').length;
        return {
          ...f,
          properties: {
            ...f.properties,
            fleetTotal: list.length,
            fleetReadiness: list.length ? ready / list.length : 0,
          },
        };
      }),
    };
  }, [geo, byZone]);

  const markers = useMemo(() => {
    if (!geo) return [];
    const out: { asset: FleetAsset; lngLat: [number, number] }[] = [];

    for (const f of (geo.features ?? []) as any[]) {
      const zoneId = f.properties?.zone_id;
      const list = byZone.get(zoneId);
      if (!list?.length) continue;

      const centre = centroidOf(f.geometry);
      if (!centre) continue;

      list.forEach((asset, i) => {
        out.push({ asset, lngLat: spread(centre, i, list.length) });
      });
    }
    return out;
  }, [geo, byZone]);

  const handleClick = (event: MapMouseEvent) => {
    const zid = event.features?.[0]?.properties?.zone_id;
    if (!zid) {
      onSelectZone(null);
      onSelectAsset(null);
      return;
    }
    // Clicking the selected zone again clears it, matching the public map.
    onSelectZone(String(zid) === selectedZoneId ? null : String(zid));
    onSelectAsset(null);
  };

  const handleMouseMove = (event: MapMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const id = event.features?.[0]?.id;
    if (hoverRef.current !== null && hoverRef.current !== id) {
      map.setFeatureState({ source: 'fleet-zones', id: hoverRef.current }, { hover: false });
    }
    if (id !== undefined) {
      map.setFeatureState({ source: 'fleet-zones', id }, { hover: true });
      hoverRef.current = id;
    }
  };

  const handleMouseLeave = () => {
    const map = mapRef.current?.getMap();
    if (map && hoverRef.current !== null) {
      map.setFeatureState({ source: 'fleet-zones', id: hoverRef.current }, { hover: false });
      hoverRef.current = null;
    }
  };

  /** Selection is drawn through feature state so it survives re-renders. */
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !styledGeo) return;
    for (const f of (styledGeo.features ?? []) as any[]) {
      const id = f.id ?? f.properties?.zone_id;
      if (id === undefined) continue;
      map.setFeatureState(
        { source: 'fleet-zones', id },
        { selected: f.properties?.zone_id === selectedZoneId }
      );
    }
  }, [selectedZoneId, styledGeo]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        style={{ height }}
        className="rounded-2xl border border-amber-500/40 bg-amber-500/5 flex items-center justify-center p-6 text-center text-xs text-amber-800 dark:text-amber-300"
      >
        Set VITE_MAPBOX_TOKEN to show the fleet map.
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800" style={{ height }}>
      <MapGL
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={INITIAL_VIEW}
        style={{ width: '100%', height: '100%' }}
        mapStyle={isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'}
        projection={{ name: 'mercator' }}
        // Flat by intent: this view is about position, not terrain.
        pitch={0}
        maxPitch={0}
        dragRotate={false}
        touchPitch={false}
        interactiveLayerIds={['fleet-zone-fill']}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseOut={handleMouseLeave}
        cursor="pointer"
        attributionControl
      >
        <NavigationControl position="top-right" showCompass={false} />

        {styledGeo && (
          <Source id="fleet-zones" type="geojson" data={styledGeo as any} generateId>
            <Layer {...ZONE_FILL} />
            <Layer {...ZONE_LINE} />
          </Source>
        )}

        {markers.map(({ asset, lngLat }) => {
          const selected = asset.assetId === selectedAssetId;
          return (
            <Marker
              key={asset.assetId}
              longitude={lngLat[0]}
              latitude={lngLat[1]}
              anchor="center"
              onClick={(e) => {
                // Without this the click falls through to the zone beneath and
                // immediately clears the selection just made.
                e.originalEvent.stopPropagation();
                onSelectAsset(selected ? null : asset.assetId);
                onSelectZone(asset.zoneId);
              }}
            >
              <button
                type="button"
                title={`${asset.assetId} — ${asset.make} ${asset.model}`}
                aria-label={`${asset.assetId}, ${asset.status.replace('_', ' ')}`}
                className={`flex items-center gap-1 px-1.5 py-1 rounded-full border shadow-md transition-transform cursor-pointer ${
                  selected
                    ? 'bg-white dark:bg-slate-100 border-slate-900 scale-125 z-10'
                    : 'bg-white/90 dark:bg-slate-900/90 border-slate-300 dark:border-slate-600 hover:scale-110'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${STATUS_DOT[asset.status] ?? 'bg-slate-500'}`}
                />
                <span
                  className={`text-[9px] font-bold font-mono leading-none pr-0.5 ${
                    selected ? 'text-slate-900' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {asset.assetId}
                </span>
              </button>
            </Marker>
          );
        })}
      </MapGL>

      {/* Legend */}
      <div className="absolute left-3 bottom-3 z-10 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 px-3 py-2 shadow-lg backdrop-blur">
        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
          Vehicle status
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {(
            [
              ['available', 'Available'],
              ['assigned', 'In use'],
              ['in_maintenance', 'In garage'],
              ['awaiting_parts', 'Awaiting parts'],
              ['out_of_service', 'Out of service'],
            ] as const
          ).map(([key, label]) => (
            <span key={key} className="inline-flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT[key]}`} />
              <span className="text-[10px] text-slate-600 dark:text-slate-300">{label}</span>
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div className="absolute inset-x-3 top-3 z-10 rounded-xl bg-amber-500/90 px-3 py-2 text-[11px] font-semibold text-amber-950">
          {error}
        </div>
      )}
    </div>
  );
};

export default FleetZoneMap;
export { STATUS_PILL_CLASSES };
