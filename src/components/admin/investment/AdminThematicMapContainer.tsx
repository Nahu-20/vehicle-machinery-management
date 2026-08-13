import React, { useState, useEffect, useRef } from 'react';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { Fill, Stroke, Style, Text } from 'ol/style.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import { FeatureLike } from 'ol/Feature.js';
import Polygon from 'ol/geom/Polygon.js';
import MultiPolygon from 'ol/geom/MultiPolygon.js';
import Point from 'ol/geom/Point.js';
import 'ol/ol.css';

import { useTheme } from '../../../context/ThemeContext';
import { loadAndValidateOromiaGeoJSON } from '../../../features/investment-map/services/gisLoader';
import { CANONICAL_ZONE_METADATA } from '../../../features/investment-map/constants/canonicalZones';
import { InvestmentDataset, InvestmentZoneValue } from '../../../types/investment';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  Layers,
  ShieldAlert,
  Info,
} from 'lucide-react';

export type MapViewMode = 'metric' | 'quality';

interface AdminThematicMapContainerProps {
  dataset: InvestmentDataset;
  zoneValues: InvestmentZoneValue[];
  selectedZoneId?: string | null;
  onSelectZone?: (zoneId: string) => void;
  viewMode?: MapViewMode;
  onViewModeChange?: (mode: MapViewMode) => void;
  className?: string;
  height?: string;
}

/**
 * Single interior point calculation for clean label rendering across Polygons & MultiPolygons
 */
function getLabelPoint(feature: FeatureLike): Point | null {
  const geom = feature.getGeometry();
  if (!geom) return null;
  const type = geom.getType();
  if (type === 'Point') return geom as Point;
  if (type === 'Polygon') return (geom as Polygon).getInteriorPoint();
  if (type === 'MultiPolygon') {
    const polygons = (geom as MultiPolygon).getPolygons();
    let largest = polygons[0];
    let maxArea = 0;
    polygons.forEach((p) => {
      const area = p.getArea();
      if (area > maxArea) {
        maxArea = area;
        largest = p;
      }
    });
    return largest ? largest.getInteriorPoint() : null;
  }
  return null;
}

/**
 * Quality Flag Color Mapping
 */
export const QUALITY_FLAG_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
  measured: { fill: 'rgba(16, 185, 129, 0.75)', stroke: '#047857', label: 'Measured' },
  estimated: { fill: 'rgba(59, 130, 246, 0.75)', stroke: '#1d4ed8', label: 'Estimated' },
  projected: { fill: 'rgba(245, 158, 11, 0.75)', stroke: '#b45309', label: 'Projected' },
  unverified: { fill: 'rgba(139, 92, 246, 0.75)', stroke: '#6d28d9', label: 'Unverified' },
  missing: { fill: 'rgba(148, 163, 184, 0.40)', stroke: '#64748b', label: 'Missing / No Data' },
};

/**
 * Standard Metric Classification Colors
 */
export const METRIC_BUCKET_COLORS: { fill: string; stroke: string; label: string }[] = [
  { fill: 'rgba(6, 78, 59, 0.88)', stroke: '#022c22', label: 'Very High' },
  { fill: 'rgba(4, 120, 87, 0.82)', stroke: '#064e3b', label: 'High' },
  { fill: 'rgba(16, 185, 129, 0.75)', stroke: '#047857', label: 'Moderate' },
  { fill: 'rgba(110, 231, 183, 0.70)', stroke: '#059669', label: 'Low' },
  { fill: 'rgba(209, 250, 229, 0.65)', stroke: '#10b981', label: 'Very Low' },
];

export function AdminThematicMapContainer({
  dataset,
  zoneValues,
  selectedZoneId,
  onSelectZone,
  viewMode = 'metric',
  onViewModeChange,
  className = '',
  height = '480px',
}: AdminThematicMapContainerProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);

  const [gisError, setGisError] = useState<string | null>(null);

  // Map zone values into a lookup table by zoneId
  const valueMap = React.useMemo(() => {
    const map = new Map<string, InvestmentZoneValue>();
    zoneValues.forEach((v) => {
      map.set(v.zoneId, v);
    });
    return map;
  }, [zoneValues]);

  // Extract non-null numeric values across all zones
  const numericValues = React.useMemo(() => {
    const isProd = dataset.metric === 'production';
    const vals: number[] = [];
    zoneValues.forEach((v) => {
      const raw = isProd ? v.productionVolume : v.value;
      if (raw !== null && raw !== undefined && typeof raw === 'number' && !isNaN(raw)) {
        vals.push(raw);
      }
    });
    return vals.sort((a, b) => a - b);
  }, [zoneValues, dataset.metric]);

  // Calculate quantiles for production or general numeric distribution
  const quantiles = React.useMemo(() => {
    if (numericValues.length === 0) return null;
    const len = numericValues.length;
    const getP = (p: number) => {
      const idx = (len - 1) * p;
      const lower = Math.floor(idx);
      const upper = Math.ceil(idx);
      const weight = idx - lower;
      return numericValues[lower] * (1 - weight) + numericValues[upper] * weight;
    };
    return {
      min: numericValues[0],
      q1: getP(0.2),
      q2: getP(0.4),
      q3: getP(0.6),
      q4: getP(0.8),
      max: numericValues[len - 1],
    };
  }, [numericValues]);

  // Helper to classify a raw value into bucket index [0..4] or -1 for No Data
  const getMetricBucketIndex = (rawVal: number | null | undefined): number => {
    if (rawVal === null || rawVal === undefined || typeof rawVal !== 'number' || isNaN(rawVal)) {
      return -1; // No Data
    }

    if (dataset.metric === 'suitability' || dataset.metric === 'investment_potential') {
      if (rawVal >= 80) return 0; // Very High
      if (rawVal >= 60) return 1; // High
      if (rawVal >= 40) return 2; // Moderate
      if (rawVal >= 20) return 3; // Low
      return 4; // Very Low
    }

    if (!quantiles || numericValues.length === 0) return 2;

    if (rawVal >= quantiles.q4 && (quantiles.q4 > quantiles.q3 || rawVal > quantiles.q3)) return 0;
    if (rawVal >= quantiles.q3 && (quantiles.q3 > quantiles.q2 || rawVal > quantiles.q2)) return 1;
    if (rawVal >= quantiles.q2 && (quantiles.q2 > quantiles.q1 || rawVal > quantiles.q1)) return 2;
    if (rawVal >= quantiles.q1) return 3;
    return 4;
  };

  // Dynamic Style Resolver
  const getStyleForFeature = (feature: FeatureLike): Style[] => {
    const zid = feature.get('zone_id') as string;
    const isSelected = zid === selectedZoneId;
    const rawName = feature.get('name_en') || '';
    const nameEn = rawName.replace(' (OR)', '');
    const labelPoint = getLabelPoint(feature);

    const zv = valueMap.get(zid);
    const isProd = dataset.metric === 'production';
    const rawVal = zv ? (isProd ? zv.productionVolume : zv.value) : null;

    let fillColor = 'rgba(148, 163, 184, 0.40)'; // Default neutral gray No Data
    let strokeColor = isDark ? '#64748b' : '#94a3b8';
    let strokeWidth = isSelected ? 3 : 1;

    if (viewMode === 'quality') {
      let qFlag = zv?.qualityFlag || 'missing';
      if (!zv || (zv.value === null && zv.productionVolume === null)) {
        qFlag = 'missing';
      }
      const qConfig = QUALITY_FLAG_COLORS[qFlag] || QUALITY_FLAG_COLORS.missing;
      fillColor = qConfig.fill;
      strokeColor = qConfig.stroke;
    } else {
      // Metric Mode
      const bucketIdx = getMetricBucketIndex(rawVal);
      if (bucketIdx >= 0 && bucketIdx < METRIC_BUCKET_COLORS.length) {
        fillColor = METRIC_BUCKET_COLORS[bucketIdx].fill;
        strokeColor = METRIC_BUCKET_COLORS[bucketIdx].stroke;
      } else {
        // No Data (null/undefined)
        fillColor = isDark ? 'rgba(71, 85, 105, 0.50)' : 'rgba(148, 163, 184, 0.50)';
        strokeColor = isDark ? '#64748b' : '#94a3b8';
      }
    }

    if (isSelected) {
      strokeColor = '#f59e0b'; // Bold Amber outline for selection
      strokeWidth = 3.5;
    }

    const polygonStyle = new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({
        color: strokeColor,
        width: strokeWidth,
      }),
    });

    const styles = [polygonStyle];

    if (labelPoint && nameEn) {
      const textStyle = new Style({
        geometry: labelPoint,
        text: new Text({
          text: nameEn,
          font: 'bold 10px sans-serif',
          fill: new Fill({ color: isDark ? '#f8fafc' : '#0f172a' }),
          stroke: new Stroke({
            color: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            width: 2.5,
          }),
          overflow: false,
          textAlign: 'center',
          textBaseline: 'middle',
        }),
      });
      styles.push(textStyle);
    }

    return styles;
  };

  // Initialize Map
  useEffect(() => {
    if (!mapElementRef.current) return;

    loadAndValidateOromiaGeoJSON()
      .then((res) => {
        if (!res.valid || !res.geoJson) {
          setGisError(res.checksumError || 'Canonical GIS GeoJSON verification failed.');
          return;
        }

        const format = new GeoJSON();
        const features = format.readFeatures(res.geoJson, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857',
        });

        const vSource = new VectorSource({ features });
        vectorSourceRef.current = vSource;

        const vLayer = new VectorLayer({
          source: vSource,
          style: (feature) => getStyleForFeature(feature),
        });

        const olMap = new Map({
          target: mapElementRef.current!,
          layers: [vLayer],
          controls: defaultControls({ zoom: false, rotate: false, attribution: false }),
          view: new View({
            projection: 'EPSG:3857',
            center: [0, 0],
            zoom: 6,
          }),
        });

        // Fit to Oromia extent
        const extent = vSource.getExtent();
        if (extent && isFinite(extent[0])) {
          olMap.getView().fit(extent, {
            padding: [20, 20, 20, 20],
            maxZoom: 9,
          });
        }

        // Pointer Click Handler for zone selection
        olMap.on('singleclick', (evt) => {
          let clickedZoneId: string | null = null;
          olMap.forEachFeatureAtPixel(evt.pixel, (feat) => {
            const zid = feat.get('zone_id');
            if (zid) {
              clickedZoneId = zid;
              return true; // Stop iteration
            }
            return false;
          });

          if (clickedZoneId && onSelectZone) {
            onSelectZone(clickedZoneId);
          }
        });

        mapRef.current = olMap;
      })
      .catch((err) => {
        setGisError('Failed to load canonical GIS layer: ' + err.message);
      });

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(undefined);
        mapRef.current = null;
      }
    };
  }, []);

  // Refresh Styles on viewMode, selectedZoneId, zoneValues or theme change
  useEffect(() => {
    if (vectorSourceRef.current) {
      vectorSourceRef.current.changed();
    }
  }, [viewMode, selectedZoneId, zoneValues, isDark]);

  // Zoom Helpers
  const handleZoomIn = () => {
    if (mapRef.current) {
      const view = mapRef.current.getView();
      view.setZoom((view.getZoom() || 6) + 0.5);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const view = mapRef.current.getView();
      view.setZoom((view.getZoom() || 6) - 0.5);
    }
  };

  const handleResetView = () => {
    if (mapRef.current && vectorSourceRef.current) {
      const extent = vectorSourceRef.current.getExtent();
      if (extent && isFinite(extent[0])) {
        mapRef.current.getView().fit(extent, {
          padding: [20, 20, 20, 20],
          maxZoom: 9,
          duration: 400,
        });
      }
    }
  };

  if (gisError) {
    return (
      <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 space-y-2">
        <AlertTriangle className="w-8 h-8 mx-auto text-rose-500" />
        <p className="font-bold">GIS Layer Validation Failure</p>
        <p>{gisError}</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 shadow-xs ${className}`}>
      {/* Top Banner: Admin Preview Warning */}
      <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold uppercase text-[10px] tracking-wider">
            ADMIN PREVIEW
          </span>
          <span className="font-medium text-slate-300">
            Internal review visualization — Not accessible on public portal.
          </span>
        </div>

        <div className="flex items-center gap-2">
          {dataset.verificationStatus !== 'verified' && (
            <span className="px-2 py-0.5 rounded bg-rose-600/80 text-white font-bold text-[10px] uppercase flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              UNVERIFIED DATASET
            </span>
          )}

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => onViewModeChange && onViewModeChange('metric')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                viewMode === 'metric'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Metric Value
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange && onViewModeChange('quality')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                viewMode === 'quality'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Data Quality
            </button>
          </div>
        </div>
      </div>

      {/* Map Element Container */}
      <div ref={mapElementRef} style={{ height }} className="w-full relative" />

      {/* Map Control Buttons Overlay */}
      <div className="absolute top-14 right-3 z-10 flex flex-col gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-md">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
          title="Reset Extent"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg text-xs space-y-2 max-w-xs">
        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
          <span>{viewMode === 'metric' ? 'Thematic Legend' : 'Data Quality Legend'}</span>
          <span className="text-[10px] text-slate-400 font-mono capitalize">{dataset.metric?.replace('_', ' ')}</span>
        </div>

        {viewMode === 'quality' ? (
          <div className="space-y-1">
            {Object.entries(QUALITY_FLAG_COLORS).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-sm border shrink-0" style={{ backgroundColor: cfg.fill, borderColor: cfg.stroke }} />
                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">{cfg.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {METRIC_BUCKET_COLORS.map((cfg, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-sm border shrink-0" style={{ backgroundColor: cfg.fill, borderColor: cfg.stroke }} />
                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">{cfg.label}</span>
              </div>
            ))}
            {/* Always include No Data with neutral gray */}
            <div className="flex items-center gap-2 pt-0.5 border-t border-slate-100 dark:border-slate-800">
              <span className="w-3.5 h-3.5 rounded-sm bg-slate-400/50 border border-slate-500 shrink-0" />
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">No Data (null)</span>
            </div>
          </div>
        )}

        <div className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1">
          <Info className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>
            {viewMode === 'metric'
              ? dataset.metric === 'production'
                ? 'Visualization Classification: Quantile-based admin preview'
                : 'Preview visualization classification only'
              : 'Data Quality Classification (Review Information)'}
          </span>
        </div>
      </div>
    </div>
  );
}
