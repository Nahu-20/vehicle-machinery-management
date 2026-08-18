import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Map, {
  Source,
  Layer,
  NavigationControl,
  MapMouseEvent,
  MapRef,
  FillLayerSpecification,
  LineLayerSpecification,
  FillExtrusionLayerSpecification,
} from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, ShieldCheck, Loader2, AlertTriangle, Box, Square } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { GisValidationResult } from '../types/gis';
import { CommodityKey, ThematicMetric } from '../types/thematic';
import { loadAndValidateOromiaGeoJSON } from '../services/gisLoader';
import {
  getDemoZoneCommodityMetrics,
  classifyThematicValue,
  getThematicColor,
  getAllProductionVolumes,
  THEMATIC_CLASS_LABELS,
} from '../services/thematicService';

/**
 * Mapbox GL rendering engine — the third option in the GIS engine selector.
 *
 * Unlike the OpenLayers and SVG engines, which draw flat polygons on an empty
 * background, this one is built around what Mapbox can do that they cannot:
 *
 *   - hover highlighting through feature-state, resolved on the GPU rather than
 *     by re-rendering React or rebuilding the GeoJSON on every pointer move
 *   - extrusion, so a zone's thematic value becomes its physical height and the
 *     strong performers literally stand above the rest
 *   - a tilted camera, so those heights read as volume rather than shading
 *   - a real basemap, so zones sit in recognisable geography
 *
 * The thematic classification itself still comes from thematicService, exactly as
 * the other two engines use it, so all three agree on how a zone is classified —
 * only the presentation differs.
 */

interface MapboxMapContainerProps {
  height?: string;
  selectedZoneId?: string | null;
  selectedCommodity?: CommodityKey | null;
  selectedMetric?: ThematicMetric;
  onSelectZone?: (zoneId: string | null) => void;
  onGisVerified?: (result: GisValidationResult) => void;
  onError?: () => void;
  allowDemoData?: boolean;
  className?: string;
}

const MAPBOX_TOKEN = import.meta.env?.VITE_MAPBOX_TOKEN || '';

const SELECTION_COLOR = '#f59e0b';

/**
 * Vertical exaggeration for the terrain.
 *
 * At regional zoom one pixel covers roughly 2km of ground, so Oromia's real
 * 2,600m spread between the Bale peaks and the Borena lowlands amounts to under
 * two pixels of relief — true to life and completely invisible. 6x lifts that to
 * something the eye can actually read while keeping the shape of the landscape
 * recognisable. It is a deliberate distortion, which is why hillshade carries most
 * of the relief impression rather than geometry alone.
 */
const TERRAIN_EXAGGERATION = 6;

/**
 * Opening camera, measured against the live map rather than derived.
 *
 * Deriving it from the dataset bbox via fitBounds was the obvious approach and it
 * does not survive here: enabling terrain and swapping the basemap style when the
 * colour theme resolves both re-apply the camera afterwards, and the initial view
 * is what ends up winning. Since Oromia's boundaries are fixed, a measured opening
 * frame is both simpler and stable. fitToBounds still runs, so the view is
 * re-derived whenever the data or the 2D/3D mode changes.
 *
 * Centre is biased south of the region's midpoint so that, once tilted, Oromia
 * sits in the lower half of the frame with sky above it.
 */
const INITIAL_VIEW = {
  longitude: 38.55,
  latitude: 5.8,
  zoom: 6.8,
  pitch: 55,
  bearing: -15,
};

/**
 * Extrusion heights are in metres, and Oromia spans roughly 900km, so values
 * that would suit a city map are invisible here. This range was tuned against
 * the region's actual extent to read clearly at the default tilt.
 */
const HEIGHT_BASE = 6000;
const HEIGHT_RANGE = 62000;

interface HoverInfo {
  x: number;
  y: number;
  name: string;
  classLabel: string;
  value: number | null;
  unit: string;
}

export const MapboxMapContainer: React.FC<MapboxMapContainerProps> = ({
  height = '650px',
  selectedZoneId,
  selectedCommodity,
  selectedMetric = 'production',
  onSelectZone,
  onGisVerified,
  onError,
  allowDemoData = false,
  className = '',
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const mapRef = useRef<MapRef | null>(null);

  const [geo, setGeo] = useState<GisValidationResult['data'] | null>(null);
  const [bbox, setBbox] = useState<GisValidationResult['bbox'] | null>(null);
  const [featureCount, setFeatureCount] = useState(0);
  const [checksumOk, setChecksumOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [is3D, setIs3D] = useState(true);
  const [hover, setHover] = useState<HoverInfo | null>(null);

  // Published figures are what make extruded heights meaningful; without them
  // the zones are drawn flat over the terrain instead.
  const showValueHeights = allowDemoData && Boolean(selectedCommodity);

  /**
   * Memoized because react-map-gl compares this prop by identity. A fresh object
   * literal each render made it re-apply terrain on every render, which reset the
   * camera continuously and silently undid the initial framing. Exaggeration lifts
   * Ethiopia's relief enough to read at regional zoom without caricaturing it.
   */
  /**
   * The 3D view uses the outdoors basemap rather than the themed light/dark ones.
   *
   * Hillshade works by casting shadow, and on Mapbox Dark there is nothing for a
   * shadow to contrast against — the relief was being drawn correctly and was
   * simply invisible. The outdoors style is built for terrain: it carries relief
   * shading and contour colouring of its own, so elevation reads immediately.
   * Flat view keeps the themed basemaps, which suit the surrounding UI.
   */
  const mapStyle = is3D
    ? 'mapbox://styles/mapbox/outdoors-v12'
    : isDark
    ? 'mapbox://styles/mapbox/dark-v11'
    : 'mapbox://styles/mapbox/light-v11';

  // Overlay colours must follow the basemap actually in use, not the site theme:
  // the outdoors style is light even when the rest of the page is dark.
  const onDarkBasemap = isDark && !is3D;

  const terrainSpec = useMemo(
    () => (is3D ? { source: 'mapbox-dem', exaggeration: TERRAIN_EXAGGERATION } : undefined),
    [is3D]
  );

  const onGisVerifiedRef = useRef(onGisVerified);
  onGisVerifiedRef.current = onGisVerified;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Whether the map ever finished loading. Once it has, the engine is working and
  // no later error should tear it down.
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    if (!MAPBOX_TOKEN) {
      setError('VITE_MAPBOX_TOKEN is not set.');
      setLoading(false);
      onErrorRef.current?.();
      return;
    }

    (async () => {
      try {
        const result = await loadAndValidateOromiaGeoJSON();
        if (cancelled) return;
        setGeo(result.data ?? null);
        setFeatureCount(result.featureCount);
        setChecksumOk(result.isValid);
        setLoading(false);
        onGisVerifiedRef.current?.(result);
        setBbox(result.bbox ?? null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load Oromia GIS boundaries.');
        setLoading(false);
        onErrorRef.current?.();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Resolve each zone's colour, height and readout once, into feature properties.
   *
   * Mapbox styles through expressions rather than per-feature callbacks, so doing
   * the classification here keeps thematicService the single source of truth
   * instead of restating quantile thresholds as style expressions.
   */
  const styledGeo = useMemo(() => {
    if (!geo) return null;

    const baseFill = isDark ? 'rgba(6, 78, 59, 0.72)' : 'rgba(16, 122, 87, 0.55)';
    const baseStroke = isDark ? '#34d399' : '#15803d';

    // Normalising production against the observed maximum keeps tall zones tall
    // relative to their peers; scores are already on a fixed 0-100 scale.
    const volumes =
      allowDemoData && selectedCommodity ? getAllProductionVolumes(selectedCommodity) : [];
    const maxVolume = volumes.length ? volumes[volumes.length - 1] : 0;

    // Height must not imply data the Bureau has not verified. With demo figures
    // gated off, every zone extrudes to the same modest height: the map still
    // reads as 3D and hover still works, but no zone appears to outperform
    // another on the strength of unpublished numbers.
    const showValues = showValueHeights;

    return {
      ...geo,
      features: geo.features.map((feature: any) => {
        const zid = feature.properties?.zone_id;
        let fillColor = baseFill;
        let strokeColor = baseStroke;
        let normalized = 0;
        let rawValue: number | null = null;
        let classLabel = '';
        let unit = '';

        if (showValues && zid) {
          const metrics = getDemoZoneCommodityMetrics(zid, selectedCommodity as CommodityKey);
          let val: number | null | undefined = null;
          if (metrics) {
            if (selectedMetric === 'production') {
              val = metrics.production?.volumeMT;
              unit = 'MT';
            } else if (selectedMetric === 'suitability') {
              val = metrics.suitability?.score;
              unit = '/100';
            } else if (selectedMetric === 'investment_potential') {
              val = metrics.investmentPotential?.score;
              unit = '/100';
            }
          }
          const classRes = classifyThematicValue(
            selectedCommodity as CommodityKey,
            selectedMetric as ThematicMetric,
            val
          );
          const colors = getThematicColor(classRes.classification, isDark);
          fillColor = colors.fill;
          strokeColor = colors.stroke;
          classLabel = THEMATIC_CLASS_LABELS[classRes.classification] ?? '';
          rawValue = typeof val === 'number' ? val : null;

          if (typeof val === 'number') {
            normalized =
              selectedMetric === 'production'
                ? maxVolume > 0
                  ? val / maxVolume
                  : 0
                : Math.min(Math.max(val / 100, 0), 1);
          }
        }

        return {
          ...feature,
          properties: {
            ...feature.properties,
            __fill: fillColor,
            __stroke: strokeColor,
            __selected: zid === selectedZoneId ? 1 : 0,
            __label: (feature.properties?.name_en || '').replace(' (OR)', ''),
            __height: HEIGHT_BASE + normalized * HEIGHT_RANGE,
            __value: rawValue,
            __classLabel: classLabel,
            __unit: unit,
          },
        };
      }),
    };
  }, [geo, isDark, showValueHeights, selectedCommodity, selectedMetric, selectedZoneId]);

  /**
   * Frame Oromia, then tilt.
   *
   * fitBounds is deliberately given pitch 0: fitting a tilted frustum forces the
   * camera far enough back that the whole Horn of Africa ends up in shot. Fitting
   * flat and applying pitch afterwards keeps the region filling the frame, which
   * is what tilting from a fitted view looks like to a user anyway.
   */
  const fitToBounds = useCallback(() => {
    const ref = mapRef.current;
    if (!ref || !bbox) return;
    const map = ref.getMap();
    const [minLon, minLat, maxLon, maxLat] = bbox;

    // Fit flat and un-tilted first. Both terrain and pitch make fitBounds pull the
    // camera back to keep the bounds inside a taller frustum — measured at 1.2
    // zoom levels for terrain alone — which drags Sudan and Yemen into frame.
    // Framing on the flat case and restoring the 3D camera afterwards keeps
    // Oromia filling the view.
    const terrain = map.getTerrain?.() ?? null;
    if (terrain) map.setTerrain(null);

    map.fitBounds(
      [
        [minLon, minLat],
        [maxLon, maxLat],
      ],
      { padding: 40, duration: 0, pitch: 0, bearing: 0 }
    );

    if (terrain) map.setTerrain(terrain);

    // Tilting reveals the horizon, so a camera that framed the region flat now
    // shows half of East Africa. These offsets were measured against the live map:
    // zoom in to recover the lost coverage, and bias the centre south so Oromia
    // sits in the lower half of the frame with sky above it.
    if (is3D) {
      const center = map.getCenter();
      map.easeTo({
        pitch: 55,
        bearing: -15,
        zoom: map.getZoom() + 1.05,
        center: [center.lng, center.lat - 1.15],
        duration: 0,
      });
    }
  }, [bbox, is3D]);

  /**
   * Only genuine engine failures may hand back to OpenLayers.
   *
   * Mapbox GL emits `error` for anything that goes wrong, including things that
   * do not affect the map: a single tile that failed, and notably the telemetry
   * POST to events.mapbox.com, which returned 503 in production while the style,
   * icon set and terrain DEM all returned 200. Treating that as fatal swapped a
   * working map for the fallback engine at random.
   *
   * A rejected token is the case that genuinely cannot recover, so 401 and 403
   * still fall back. Everything else is logged and ignored, and once the map has
   * loaded nothing tears it down at all.
   */
  const handleMapError = useCallback((evt: { error?: Error & { status?: number } }) => {
    const status = evt?.error?.status;
    const isAuthFailure = status === 401 || status === 403;

    if (!isAuthFailure) {
      console.warn('[MapboxMap] non-fatal map error, continuing:', evt?.error?.message ?? evt);
      return;
    }

    if (hasLoadedRef.current) {
      console.warn('[MapboxMap] token rejected after load; leaving the rendered map in place.');
      return;
    }

    setError('Mapbox rejected the access token. It may be invalid or URL-restricted.');
    onErrorRef.current?.();
  }, []);

  const handleLoad = useCallback(() => {
    hasLoadedRef.current = true;
    fitToBounds();
  }, [fitToBounds]);


  /**
   * Frame once the map has actually settled.
   *
   * Framing immediately on load proved unreliable: enabling terrain and swapping
   * the style when the colour theme resolves both re-apply the camera afterwards,
   * silently discarding the fit. Waiting for 'idle' means the camera is applied
   * after everything that would otherwise overwrite it.
   */
  useEffect(() => {
    const ref = mapRef.current;
    if (!ref || !bbox) return;
    const map = ref.getMap();

    let cancelled = false;
    const run = () => {
      if (!cancelled) fitToBounds();
    };

    if (map.loaded()) run();
    map.once('idle', run);

    return () => {
      cancelled = true;
      map.off('idle', run);
    };
  }, [fitToBounds, bbox]);

  /**
   * Hover is tracked through Mapbox feature-state rather than React state.
   *
   * The alternative — rebuilding the GeoJSON with a hovered flag on every pointer
   * move — re-uploads all 22 polygons to the GPU per frame. feature-state changes
   * one value and lets the existing style expressions react to it.
   */
  const hoveredId = useRef<number | string | null>(null);

  const setHoverState = useCallback((id: number | string | null) => {
    const map = mapRef.current?.getMap();
    if (!map || !map.getSource('oromia-zones')) return;
    if (hoveredId.current !== null && hoveredId.current !== id) {
      map.setFeatureState({ source: 'oromia-zones', id: hoveredId.current }, { hover: false });
    }
    if (id !== null) {
      map.setFeatureState({ source: 'oromia-zones', id }, { hover: true });
    }
    hoveredId.current = id;
  }, []);

  const handleMouseMove = useCallback(
    (event: MapMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature) {
        setHover(null);
        setHoverState(null);
        return;
      }
      const p = feature.properties || {};
      setHover({
        x: event.point.x,
        y: event.point.y,
        name: p.__label || '',
        classLabel: p.__classLabel || '',
        value: typeof p.__value === 'number' ? p.__value : null,
        unit: p.__unit || '',
      });
      if (feature.id !== hoveredId.current) setHoverState(feature.id ?? null);
    },
    [setHoverState]
  );

  const handleMouseLeave = useCallback(() => {
    setHover(null);
    setHoverState(null);
  }, [setHoverState]);

  /**
   * Clicking a zone selects it; clicking the selected zone again, or anywhere
   * outside Oromia, clears the selection.
   *
   * Both parents already accept null and treat it as "clear" — the public shell
   * also drops the ?zone= URL parameter — so deselection needs no separate
   * callback, just the ability to say nothing is selected.
   */
  const handleClick = useCallback(
    (event: MapMouseEvent) => {
      if (!onSelectZone) return;
      const zid = event.features?.[0]?.properties?.zone_id;

      if (!zid) {
        onSelectZone(null);
        return;
      }

      onSelectZone(String(zid) === selectedZoneId ? null : String(zid));
    },
    [onSelectZone, selectedZoneId]
  );

  const toggle3D = useCallback(() => {
    setIs3D((prev) => {
      const next = !prev;
      mapRef.current?.easeTo({ pitch: next ? 50 : 0, duration: 600 });
      return next;
    });
  }, []);

  // ─── Layer specs ──────────────────────────────────────────────────────────
  // Hover and selection are resolved inside the style so the GPU does the work.

  const extrusionLayer: FillExtrusionLayerSpecification = {
    id: 'oromia-zone-extrusion',
    type: 'fill-extrusion',
    source: 'oromia-zones',
    paint: {
      'fill-extrusion-color': [
        'case',
        ['==', ['get', '__selected'], 1],
        SELECTION_COLOR,
        ['boolean', ['feature-state', 'hover'], false],
        isDark ? '#5eead4' : '#0f766e',
        ['get', '__fill'],
      ],
      // Hovered zones lift further so the cursor target separates from its neighbours.
      'fill-extrusion-height': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        ['*', ['get', '__height'], 1.35],
        ['get', '__height'],
      ],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.92,
      'fill-extrusion-vertical-gradient': true,
    },
  };

  const fillLayer: FillLayerSpecification = {
    id: 'oromia-zone-fill',
    type: 'fill',
    source: 'oromia-zones',
    paint: {
      'fill-color': [
        'case',
        ['==', ['get', '__selected'], 1],
        SELECTION_COLOR,
        ['boolean', ['feature-state', 'hover'], false],
        isDark ? '#5eead4' : '#0f766e',
        ['get', '__fill'],
      ],
      // Kept low so the hillshade beneath stays visible inside Oromia; a zone
      // that is hovered or selected opts out of that to stand clear.
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        0.8,
        ['==', ['get', '__selected'], 1],
        0.7,
        0.4,
      ],
    },
  };

  const outlineLayer: LineLayerSpecification = {
    id: 'oromia-zone-outline',
    type: 'line',
    source: 'oromia-zones',
    paint: {
      'line-color': [
        'case',
        ['==', ['get', '__selected'], 1],
        SELECTION_COLOR,
        ['boolean', ['feature-state', 'hover'], false],
        isDark ? '#f0fdfa' : '#042f2e',
        ['get', '__stroke'],
      ],
      'line-width': [
        'case',
        ['==', ['get', '__selected'], 1],
        3.5,
        ['boolean', ['feature-state', 'hover'], false],
        2.5,
        1,
      ],
    },
  };

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-6 text-center ${className}`}
        style={{ height }}
      >
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm font-extrabold text-amber-800 dark:text-amber-300">
          Mapbox engine unavailable
        </p>
        <p className="max-w-md text-xs text-[#56635B] dark:text-[#a5aba6]">
          {error} Switch to the OpenLayers engine above, which needs no access token.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl" style={{ height }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-[#0A1912]/60 text-sm text-[#A3E635]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading Oromia GIS boundaries…</span>
          </div>
        )}

        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={INITIAL_VIEW}
          style={{ width: '100%', height: '100%' }}
          mapStyle={mapStyle}
          // Mapbox v3 defaults to globe, which curves the horizon at this zoom and
          // makes a single region look like a planet. Mercator suits a regional map.
          projection={{ name: 'mercator' }}
          interactiveLayerIds={showValueHeights ? ['oromia-zone-extrusion'] : ['oromia-zone-fill']}
          onLoad={handleLoad}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseOut={handleMouseLeave}
          cursor={hover ? 'pointer' : 'grab'}
          terrain={terrainSpec}
          // Right-drag / ctrl-drag tilts and rotates the camera.
          dragRotate
          pitchWithRotate
          maxPitch={80}
          onError={handleMapError}
          attributionControl
        >
          <NavigationControl position="top-right" visualizePitch showCompass />

          {/* Real elevation. Oromia's agriculture is largely a function of
              altitude — the Bale massif, the Rift Valley escarpment — so the
              terrain is meaningful context, not decoration. Unlike extrusion it
              needs no dataset: this is measured ground, not a statistic. */}
          {is3D && (
            <Source
              id="mapbox-dem"
              type="raster-dem"
              url="mapbox://mapbox.mapbox-terrain-dem-v1"
              tileSize={512}
              maxzoom={14}
            />
          )}

          {/* Hillshade carries the relief through light and shadow, which reads at
              any zoom — unlike geometry, which needs the camera tilted and the
              elevation range to exceed a pixel or two. */}
          {is3D && (
            <Layer
              id="oromia-hillshade"
              type="hillshade"
              source="mapbox-dem"
              paint={{
                'hillshade-exaggeration': 0.85,
                'hillshade-shadow-color': onDarkBasemap ? '#000000' : '#334155',
                'hillshade-highlight-color': onDarkBasemap ? '#94a3b8' : '#ffffff',
                'hillshade-accent-color': onDarkBasemap ? '#1e293b' : '#64748b',
              }}
            />
          )}

          {/* Ethiopia's national boundary, so Oromia is placed within the country
              rather than floating in the Horn of Africa. */}
          <Source id="ethiopia" type="geojson" data="/data/ethiopia.geojson">
            <Layer
              id="ethiopia-outline"
              type="line"
              paint={{
                'line-color': onDarkBasemap ? '#94a3b8' : '#1e293b',
                'line-width': 2,
                'line-dasharray': [3, 2],
                'line-opacity': 0.9,
              }}
            />
          </Source>

          {is3D && (
            <Layer
              id="sky"
              type="sky"
              paint={{
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun-intensity': 12,
                'sky-atmosphere-color': '#bfdcff',
              }}
            />
          )}

          {styledGeo && (
            // generateId gives every feature a stable numeric id, which
            // setFeatureState requires to target a single polygon.
            <Source id="oromia-zones" type="geojson" data={styledGeo as any} generateId>
              {/* Extruded blocks only make sense when heights differ, which needs
                  published figures. Otherwise the zones drape over the terrain as
                  translucent overlays, so the relief shows through and the 3D you
                  see is the land itself rather than a chart. */}
              {showValueHeights ? (
                <Layer {...extrusionLayer} />
              ) : (
                <>
                  <Layer {...fillLayer} />
                  <Layer {...outlineLayer} />
                </>
              )}
              <Layer
                id="oromia-zone-label"
                type="symbol"
                layout={{
                  'text-field': ['get', '__label'],
                  'text-size': 11,
                  'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                  'text-allow-overlap': false,
                }}
                paint={{
                  'text-color': onDarkBasemap ? '#f8fafc' : '#0f172a',
                  'text-halo-color': onDarkBasemap ? '#0f172a' : '#ffffff',
                  'text-halo-width': 1.6,
                }}
              />
            </Source>
          )}
        </Map>

        {/* 2D / 3D camera toggle */}
        <button
          onClick={toggle3D}
          className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-lg border border-[#A3E635]/40 bg-[#0A1912]/85 px-2.5 py-1.5 text-[11px] font-bold text-[#A3E635] shadow-lg backdrop-blur transition-colors hover:bg-[#0A1912] cursor-pointer"
          title={is3D ? 'Switch to flat 2D view' : 'Switch to 3D terrain view'}
        >
          {is3D ? <Square className="h-3.5 w-3.5" /> : <Box className="h-3.5 w-3.5" />}
          <span>{is3D ? 'Flat View' : '3D Terrain'}</span>
        </button>

        {/* Hover readout — carries the figure, not just the name, so the map can be
            read without clicking through to the profile panel. */}
        {hover && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-lg border border-[#A3E635]/40 bg-[#0A1912]/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
            style={{ left: hover.x, top: hover.y }}
          >
            <div className="font-bold text-white">{hover.name}</div>
            {hover.value !== null ? (
              <div className="mt-0.5 text-[#A3E635]">
                {hover.value.toLocaleString()} {hover.unit}
                {hover.classLabel && (
                  <span className="ml-1.5 text-[#A3E635]/70">· {hover.classLabel}</span>
                )}
              </div>
            ) : (
              <div className="mt-0.5 text-[#a5aba6]">
                {selectedCommodity ? 'No data published' : 'Select a commodity'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status strip, mirroring the other engines so the toggle feels consistent. */}
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2EFE0] bg-[#F0F7EE] px-2 py-1 font-mono dark:border-white/10 dark:bg-[#161d18]">
          <MapPin className="h-3 w-3 text-[#075B36] dark:text-[#A3E635]" />
          <span className="font-bold text-[#075B36] dark:text-[#A3E635]">Mapbox GL Engine</span>
          <span className="text-[#56635B] dark:text-[#a5aba6]">
            | {featureCount} Candidate Polygons
          </span>
        </span>
        {checksumOk && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2EFE0] bg-[#F0F7EE] px-2 py-1 font-bold text-[#075B36] dark:border-white/10 dark:bg-[#161d18] dark:text-[#A3E635]">
            <ShieldCheck className="h-3 w-3" />
            GIS Checksum Verified
          </span>
        )}
        <span className="text-[#56635B] dark:text-[#a5aba6]">
          Drag to pan · right-drag to tilt and rotate · hover a zone for details
        </span>
      </div>
    </div>
  );
};
