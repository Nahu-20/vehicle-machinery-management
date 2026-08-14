import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import Map, { NavigationControl, FullscreenControl, Source, Layer, MapRef } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '../../../context/ThemeContext';
import { AlertTriangle, MapPin, CheckCircle2, RefreshCw } from 'lucide-react';
import { loadAndValidateOromiaGeoJSON, OFFICIAL_GIS_METADATA } from '../services/gisLoader';
import { GisValidationResult } from '../types/gis';
import { CanonicalZoneId } from '../constants/canonicalZones';

// Minimal static locally-controlled MapLibre base style definition
const MAP_BASE_STYLE: StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {},
  layers: [],
};

interface MapLibreContainerProps {
  className?: string;
  height?: string | number;
  onGisVerified?: (result: GisValidationResult) => void;
  selectedZoneId?: CanonicalZoneId | null;
  onSelectZone?: (zoneId: string | null) => void;
  onError?: () => void;
}

export const MapLibreContainer: React.FC<MapLibreContainerProps> = ({
  className = '',
  height = '560px',
  onGisVerified,
  selectedZoneId = null,
  onSelectZone,
  onError,
}) => {
  const { resolvedTheme } = useTheme();
  const mapRef = useRef<MapRef | null>(null);

  const [webGlSupported, setWebGlSupported] = useState<boolean | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [gisResult, setGisResult] = useState<GisValidationResult | null>(null);
  const [isLoadingGis, setIsLoadingGis] = useState<boolean>(true);

  const onGisVerifiedRef = useRef(onGisVerified);
  useEffect(() => {
    onGisVerifiedRef.current = onGisVerified;
  }, [onGisVerified]);

  // 1. Check WebGL support
  useEffect(() => {
    try {
      const maplibreObj = maplibregl as unknown as { supported?: () => boolean; default?: { supported?: () => boolean } };
      const supportedFn = maplibreObj.supported || maplibreObj.default?.supported;
      const isSupported = typeof supportedFn === 'function' ? supportedFn() : true;
      setWebGlSupported(isSupported);
      if (!isSupported) {
        setMapError('WebGL is not supported by your current browser or hardware setup.');
        if (onError) onError();
      }
    } catch (err) {
      setWebGlSupported(false);
      setMapError(err instanceof Error ? err.message : 'Failed to initialize MapLibre GL engine.');
      if (onError) onError();
    }
  }, []);

  // 2. Load and validate candidate GeoJSON
  useEffect(() => {
    let isMounted = true;
    setIsLoadingGis(true);

    loadAndValidateOromiaGeoJSON().then((result) => {
      if (!isMounted) return;
      setGisResult(result);
      setIsLoadingGis(false);
      if (onGisVerifiedRef.current) {
        onGisVerifiedRef.current(result);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fit map bounds to candidate Oromia bounding box
  const handleFitBounds = useCallback(() => {
    if (mapRef.current && gisResult && gisResult.isValid && gisResult.bbox) {
      const [minLon, minLat, maxLon, maxLat] = gisResult.bbox;
      const map = mapRef.current.getMap();
      if (map) {
        map.resize();
        map.fitBounds(
          [
            [minLon, minLat],
            [maxLon, maxLat],
          ],
          {
            padding: { top: 40, bottom: 40, left: 40, right: 40 },
            duration: 800,
          }
        );
      }
    }
  }, [gisResult]);

  // Ensure bounds are fitted once Map canvas and GIS data are ready
  useEffect(() => {
    if (!isLoadingGis && gisResult?.isValid) {
      const timer = setTimeout(() => {
        handleFitBounds();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoadingGis, gisResult, handleFitBounds]);

  // Handle map load event
  const handleMapLoad = useCallback(() => {
    handleFitBounds();
  }, [handleFitBounds]);

  // Handle interactive feature picking on zone-fill layer
  const handleMapClick = useCallback(
    (e: maplibregl.MapLayerMouseEvent) => {
      if (!onSelectZone) return;

      const features = e.features;
      if (features && features.length > 0) {
        const clickedFeature = features[0];
        const zoneId = clickedFeature.properties?.zone_id;
        if (typeof zoneId === 'string' && zoneId.length > 0) {
          onSelectZone(zoneId);
        } else {
          console.warn('[M4 Selection Warning] Clicked feature lacks valid zone_id property');
        }
      }
    },
    [onSelectZone]
  );

  // Hover cursor affordances
  const handleMouseEnter = useCallback((e: maplibregl.MapLayerMouseEvent) => {
    if (e.target) {
      e.target.getCanvas().style.cursor = 'pointer';
    }
  }, []);

  const handleMouseLeave = useCallback((e: maplibregl.MapLayerMouseEvent) => {
    if (e.target) {
      e.target.getCanvas().style.cursor = '';
    }
  }, []);

  const isDark = resolvedTheme === 'dark';

  // Base neutral agricultural fill with optimal map contrast
  const fillStyle = useMemo(
    () => ({
      'fill-color': isDark ? '#059669' : '#10b981',
      'fill-opacity': isDark ? 0.55 : 0.45,
    }),
    [isDark]
  );

  // Muted zone boundary lines
  const lineStyle = useMemo(
    () => ({
      'line-color': isDark ? '#34d399' : '#047857',
      'line-width': 1.5,
      'line-opacity': 0.95,
    }),
    [isDark]
  );

  // Selected-zone soft halo
  const selectedHaloStyle = useMemo(
    () => ({
      'line-color': isDark ? '#34d399' : '#059669',
      'line-width': isDark ? 10 : 8,
      'line-opacity': isDark ? 0.45 : 0.4,
      'line-blur': 3,
    }),
    [isDark]
  );

  // Selected-zone strong crisp outline
  const selectedOutlineStyle = useMemo(
    () => ({
      'line-color': isDark ? '#a7f3d0' : '#064e3b',
      'line-width': 3,
      'line-opacity': 1.0,
    }),
    [isDark]
  );

  // Zone labels
  const labelStyle = useMemo(
    () => ({
      'text-color': isDark ? '#f8fafc' : '#0f172a',
      'text-halo-color': isDark ? '#020617' : '#ffffff',
      'text-halo-width': 2.0,
    }),
    [isDark]
  );

  const selectedFilter = useMemo(
    () =>
      (selectedZoneId
        ? ['==', ['get', 'zone_id'], selectedZoneId]
        : ['==', ['get', 'zone_id'], '']) as unknown as maplibregl.ExpressionSpecification,
    [selectedZoneId]
  );

  // WebGL error state
  if (mapError || webGlSupported === false) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center ${className}`}
        style={{ height }}
      >
        <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
          Map Engine Error
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
          {mapError || 'WebGL acceleration is unavailable. MapLibre GL canvas cannot be rendered.'}
        </p>
      </div>
    );
  }

  // Loading state
  if (webGlSupported === null || isLoadingGis) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 ${className}`}
        style={{ height }}
      >
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Loading & Validating Candidate Oromia GIS Dataset...
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Verifying 22 ADM2 zone geometries & PCODE integrity ({OFFICIAL_GIS_METADATA.datasetId})
        </p>
      </div>
    );
  }

  // GIS Validation failure state
  if (gisResult && !gisResult.isValid) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-slate-900 dark:text-slate-100 ${className}`}
        style={{ height }}
      >
        <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400 mb-3 shrink-0" />
        <h3 className="text-lg font-bold text-red-800 dark:text-red-300 mb-2">
          GIS Validation Failure State
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg text-center mb-4 leading-relaxed">
          The candidate GeoJSON asset failed strict runtime verification rules. Map rendering has been halted to prevent rendering partial or corrupted geographic boundaries.
        </p>

        <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-lg p-3 text-left space-y-1 text-xs font-mono max-h-40 overflow-y-auto">
          {gisResult.errors.map((err, idx) => (
            <p key={idx} className="text-red-600 dark:text-red-400 flex items-start gap-1.5">
              <span>•</span>
              <span>{err}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }

  const versionFn = (maplibregl as unknown as { getVersion?: () => string }).getVersion;
  const mapLibreVersion = typeof versionFn === 'function' ? versionFn() : '5.x';

  return (
    <div
      role="region"
      aria-label="Candidate Oromia ADM2 Boundary Interactive Map"
      className={`relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner ${className}`}
      style={{ height }}
    >
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 38.5,
          latitude: 7.5,
          zoom: 5.8,
        }}
        mapStyle={MAP_BASE_STYLE}
        mapLib={maplibregl as unknown as typeof import('maplibre-gl')}
        style={{ width: '100%', height: '100%' }}
        onLoad={handleMapLoad}
        interactiveLayerIds={['zone-fill']}
        onClick={handleMapClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onError={(e) => {
          console.warn('[MapLibre Container Warning]', e.error);
        }}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* Local Neutral Background Layer */}
        <Layer
          id="background"
          type="background"
          paint={{
            'background-color': isDark ? '#090d16' : '#f8fafc',
          }}
        />

        {/* Candidate Oromia GeoJSON Source & Layers */}
        {gisResult?.data && (
          <Source id="oromia-candidate-source" type="geojson" data={gisResult.data}>
            {/* Layer 1: Uniform Neutral Agricultural Fill */}
            <Layer id="zone-fill" type="fill" paint={fillStyle} />

            {/* Layer 2: Muted Zone Boundary Lines */}
            <Layer id="zone-boundary" type="line" paint={lineStyle} />

            {/* Layer 3: Selected Zone Soft Halo */}
            <Layer
              id="selected-zone-halo"
              type="line"
              filter={selectedFilter}
              paint={selectedHaloStyle}
            />

            {/* Layer 4: Selected Zone Strong Outline */}
            <Layer
              id="selected-zone-outline"
              type="line"
              filter={selectedFilter}
              paint={selectedOutlineStyle}
            />

            {/* Layer 5: Zone Label (Authoritative Source English Names) */}
            <Layer
              id="zone-label"
              type="symbol"
              layout={{
                'text-field': ['get', 'name_en'],
                'text-font': ['Noto Sans Regular'],
                'text-size': 11,
                'text-anchor': 'center',
                'text-allow-overlap': false,
              }}
              paint={labelStyle}
            />
          </Source>
        )}
      </Map>

      {/* Development Indicator & Fit Camera Control */}
      <div className="absolute bottom-3 left-3 bg-slate-900/85 dark:bg-slate-950/90 text-white backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-mono border border-slate-700/50 flex items-center gap-3 z-10 shadow-lg">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>MapLibre GL v{mapLibreVersion} | 22 Candidate ADM2 Polygons</span>
        </div>

        <button
          onClick={handleFitBounds}
          title="Reset camera to candidate Oromia bounding box extent"
          className="hover:text-emerald-300 text-slate-300 transition-colors border-l border-slate-700 pl-2.5 flex items-center gap-1 cursor-pointer pointer-events-auto"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Fit Extent</span>
        </button>
      </div>

      {/* Candidate Verification Status Tag */}
      <div className="absolute top-3 left-3 bg-emerald-950/90 text-emerald-200 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-medium border border-emerald-700/60 flex items-center gap-1.5 z-10 shadow-md pointer-events-none">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white">Candidate GIS</span>
          <span className="text-emerald-400">·</span>
          <span>Technical Validation Passed</span>
        </div>
      </div>
    </div>
  );
};
