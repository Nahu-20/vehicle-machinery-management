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
import { loadAndValidateOromiaGeoJSON } from '../services/gisLoader';
import { GisValidationResult } from '../types/gis';
import { isCanonicalZoneId } from '../constants/canonicalZones';
import { CommodityKey, ThematicMetric } from '../types/thematic';
import {
  getDemoZoneCommodityMetrics,
  classifyThematicValue,
  getThematicColor,
} from '../services/thematicService';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface OpenLayersMapContainerProps {
  height?: string;
  selectedZoneId?: string | null;
  selectedCommodity?: CommodityKey | null;
  selectedMetric?: ThematicMetric;
  onSelectZone?: (zoneId: string) => void;
  onGisVerified?: (result: GisValidationResult) => void;
  onError?: () => void;
  allowDemoData?: boolean;
  className?: string;
}

/**
 * Calculates a clean single interior point for label rendering across Polygons and MultiPolygons
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
 * Generates OpenLayers Feature Style dynamically based on selection state, active thematic commodity/metric & theme.
 * Returns an array [polygonStyle, textLabelStyle] to guarantee 100% label rendering on interior points.
 */
function getZoneStyle(
  feature: FeatureLike,
  selectedZoneId: string | null | undefined,
  isDark: boolean,
  selectedCommodity?: CommodityKey | null,
  selectedMetric: ThematicMetric = 'production',
  allowDemoData: boolean = false
): Style[] {
  const zid = feature.get('zone_id');
  const isSelected = zid === selectedZoneId;
  const rawName = feature.get('name_en') || '';
  const nameEn = rawName.replace(' (OR)', '');
  const labelPoint = getLabelPoint(feature);

  // Determine thematic fill & stroke color
  let fillColor = isDark ? 'rgba(6, 78, 59, 0.65)' : 'rgba(209, 250, 229, 0.85)';
  let strokeColor = isDark ? '#34d399' : '#15803d';
  let strokeWidth = 1.5;

  if (allowDemoData && selectedCommodity && zid) {
    const metrics = getDemoZoneCommodityMetrics(zid, selectedCommodity);
    let rawVal: number | null | undefined = null;
    if (metrics) {
      if (selectedMetric === 'production') rawVal = metrics.production?.volumeMT;
      else if (selectedMetric === 'suitability') rawVal = metrics.suitability?.score;
      else if (selectedMetric === 'investment_potential') rawVal = metrics.investmentPotential?.score;
    }
    const classRes = classifyThematicValue(selectedCommodity, selectedMetric as ThematicMetric, rawVal);
    const thematicColors = getThematicColor(classRes.classification, isDark);
    fillColor = thematicColors.fill;
    strokeColor = thematicColors.stroke;
  }

  if (isSelected) {
    const polyStyle = new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({
        color: '#f59e0b', // Amber gold border for high contrast selection
        width: 3.5,
      }),
      zIndex: 10,
    });

    const textStyle = new Style({
      geometry: labelPoint || undefined,
      text: new Text({
        text: nameEn,
        font: 'bold 12px system-ui, -apple-system, sans-serif',
        overflow: true,
        textAlign: 'center',
        textBaseline: 'middle',
        fill: new Fill({ color: isDark ? '#fef3c7' : '#78350f' }),
        stroke: new Stroke({ color: isDark ? '#0f172a' : '#ffffff', width: 3 }),
        padding: [3, 6, 3, 6],
      }),
      zIndex: 20,
    });

    return [polyStyle, textStyle];
  }

  const polyStyle = new Style({
    fill: new Fill({ color: fillColor }),
    stroke: new Stroke({
      color: strokeColor,
      width: strokeWidth,
    }),
    zIndex: 1,
  });

  const textStyle = new Style({
    geometry: labelPoint || undefined,
    text: new Text({
      text: nameEn,
      font: '600 11px system-ui, -apple-system, sans-serif',
      overflow: true,
      textAlign: 'center',
      textBaseline: 'middle',
      fill: new Fill({ color: isDark ? '#f8fafc' : '#0f172a' }),
      stroke: new Stroke({ color: isDark ? '#0f172a' : '#ffffff', width: 2.5 }),
    }),
    zIndex: 2,
  });

  return [polyStyle, textStyle];
}

export const OpenLayersMapContainer: React.FC<OpenLayersMapContainerProps> = ({
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
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  const onGisVerifiedRef = useRef(onGisVerified);
  onGisVerifiedRef.current = onGisVerified;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const onSelectZoneRef = useRef(onSelectZone);
  onSelectZoneRef.current = onSelectZone;

  const selectedCommodityRef = useRef(selectedCommodity);
  selectedCommodityRef.current = selectedCommodity;

  const selectedMetricRef = useRef(selectedMetric);
  selectedMetricRef.current = selectedMetric;

  const allowDemoDataRef = useRef(allowDemoData);
  allowDemoDataRef.current = allowDemoData;

  const [gisResult, setGisResult] = useState<GisValidationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hoveredZoneName, setHoveredZoneName] = useState<string | null>(null);

  // 1. Fetch & Validate Candidate GeoJSON (runs once on mount)
  useEffect(() => {
    let isMounted = true;
    async function initGisData() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const result = await loadAndValidateOromiaGeoJSON();
        if (!isMounted) return;

        setGisResult(result);
        setLoading(false);

        if (onGisVerifiedRef.current) {
          onGisVerifiedRef.current(result);
        }

        if (!result.isValid || !result.data) {
          setErrorMsg('GIS validation failed for candidate dataset.');
          if (onErrorRef.current) onErrorRef.current();
        }
      } catch (err) {
        if (!isMounted) return;
        setLoading(false);
        setErrorMsg(err instanceof Error ? err.message : 'Failed to initialize GIS layer');
        if (onErrorRef.current) onErrorRef.current();
      }
    }

    initGisData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Initialize OpenLayers Map Instance once GeoJSON is ready
  useEffect(() => {
    if (!gisResult?.data || !mapElementRef.current) return;

    try {
      const isDark = resolvedTheme === 'dark';

      // Parse GeoJSON features with projection EPSG:4326 -> EPSG:3857
      const olGeoJSON = new GeoJSON();
      const features = olGeoJSON.readFeatures(gisResult.data, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });

      const vectorSource = new VectorSource({
        features,
      });
      vectorSourceRef.current = vectorSource;

      // Base Vector Layer with initial style function attached
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: (f) =>
          getZoneStyle(
            f,
            selectedZoneId,
            isDark,
            selectedCommodityRef.current,
            selectedMetricRef.current,
            allowDemoDataRef.current
          ),
      });
      vectorLayerRef.current = vectorLayer;

      // Initialize OpenLayers Map
      const map = new Map({
        target: mapElementRef.current,
        layers: [vectorLayer],
        controls: defaultControls({ zoom: false, rotate: false, attribution: false }),
        view: new View({
          projection: 'EPSG:3857',
          center: [4330000, 870000], // Center on Oromia in EPSG:3857
          zoom: 6,
        }),
      });

      mapInstanceRef.current = map;

      // Fit Oromia Extent reliably across layout render cycles
      const fitMapExtent = () => {
        if (!map || !vectorSource) return;
        map.updateSize();
        const extent = vectorSource.getExtent();
        if (extent && extent.every((val) => Number.isFinite(val))) {
          map.getView().fit(extent, {
            padding: [60, 60, 60, 60],
            duration: 0,
          });
        }
      };

      fitMapExtent();
      const animFrameId = requestAnimationFrame(fitMapExtent);
      const timerId = setTimeout(fitMapExtent, 100);

      // Feature Click Interaction
      map.on('singleclick', (evt) => {
        let clickedZoneId: string | null = null;

        map.forEachFeatureAtPixel(
          evt.pixel,
          (feature) => {
            const zid = feature.get('zone_id');
            if (zid && isCanonicalZoneId(zid)) {
              clickedZoneId = zid;
              return true; // Stop iteration
            }
            return false;
          },
          {
            layerFilter: (l) => l === vectorLayer,
          }
        );

        if (clickedZoneId && onSelectZoneRef.current) {
          onSelectZoneRef.current(clickedZoneId);
        }
      });

      // Pointer Cursor & Hover Feedback
      map.on('pointermove', (evt) => {
        if (evt.dragging) return;
        const pixel = map.getEventPixel(evt.originalEvent);
        let foundName: string | null = null;

        const hit = map.hasFeatureAtPixel(pixel, {
          layerFilter: (l) => l === vectorLayer,
        });

        if (hit) {
          map.forEachFeatureAtPixel(
            pixel,
            (feature) => {
              const name = feature.get('name_en') || '';
              const zid = feature.get('zone_id');
              const activeComm = selectedCommodityRef.current;
              const activeMet = selectedMetricRef.current;

              if (allowDemoDataRef.current && activeComm && zid) {
                const metrics = getDemoZoneCommodityMetrics(zid, activeComm);
                let val: number | null | undefined = null;
                if (metrics) {
                  if (activeMet === 'production') val = metrics.production?.volumeMT;
                  else if (activeMet === 'suitability') val = metrics.suitability?.score;
                  else if (activeMet === 'investment_potential') val = metrics.investmentPotential?.score;
                }
                const classRes = classifyThematicValue(activeComm, activeMet || 'production', val);
                const valStr = val === null || val === undefined ? 'No Data' : val.toLocaleString();
                foundName = `${name} • ${valStr} (${classRes.classLabel}) [DEMO]`;
              } else {
                foundName = name;
              }
              return true;
            },
            { layerFilter: (l) => l === vectorLayer }
          );
        }

        const targetEl = map.getTargetElement();
        if (targetEl) {
          targetEl.style.cursor = hit ? 'pointer' : '';
        }
        setHoveredZoneName(foundName);
      });

      // Resize observer to auto-trigger map.updateSize()
      const resizeObserver = new ResizeObserver(() => {
        fitMapExtent();
      });
      if (mapElementRef.current) {
        resizeObserver.observe(mapElementRef.current);
      }

      return () => {
        cancelAnimationFrame(animFrameId);
        clearTimeout(timerId);
        resizeObserver.disconnect();
        map.setTarget(undefined);
        map.dispose();
        mapInstanceRef.current = null;
        vectorSourceRef.current = null;
        vectorLayerRef.current = null;
      };
    } catch (err) {
      console.error('[OpenLayers Initialization Error]', err);
      setErrorMsg('OpenLayers Map failed to initialize.');
      if (onErrorRef.current) onErrorRef.current();
    }
  }, [gisResult]);

  // 3. Update Styles dynamically on theme, selectedZoneId, or thematic selection changes
  useEffect(() => {
    if (!vectorLayerRef.current) return;
    const isDark = resolvedTheme === 'dark';
    vectorLayerRef.current.setStyle((feature) =>
      getZoneStyle(
        feature,
        selectedZoneId,
        isDark,
        selectedCommodity,
        (selectedMetric as ThematicMetric) || 'production',
        allowDemoData
      )
    );
  }, [selectedZoneId, selectedCommodity, selectedMetric, resolvedTheme, allowDemoData]);

  // Map Navigation Handlers
  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    const view = mapInstanceRef.current.getView();
    view.animate({ zoom: (view.getZoom() || 0) + 0.5, duration: 200 });
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    const view = mapInstanceRef.current.getView();
    view.animate({ zoom: (view.getZoom() || 0) - 0.5, duration: 200 });
  };

  const handleResetFit = () => {
    if (!mapInstanceRef.current || !vectorSourceRef.current) return;
    mapInstanceRef.current.updateSize();
    const extent = vectorSourceRef.current.getExtent();
    mapInstanceRef.current.getView().fit(extent, {
      padding: [60, 60, 60, 60],
      duration: 300,
    });
  };

  return (
    <div
      style={{ height }}
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 select-none shadow-inner ${className}`}
    >
      {/* Target Div for OpenLayers Canvas */}
      <div ref={mapElementRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Top Status Header Bar */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 shadow-md flex items-center gap-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-emerald-700 dark:text-emerald-400">OpenLayers Primary Engine</span>
          <span className="text-slate-400 dark:text-slate-500">|</span>
          <span className="text-slate-700 dark:text-slate-300">22 Candidate Polygons</span>
        </div>

        {gisResult?.isValid && (
          <div className="bg-emerald-500/10 dark:bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 rounded-xl px-3 py-1.5 shadow-md flex items-center gap-1.5 text-xs font-mono font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>GIS Checksum Verified</span>
          </div>
        )}

        {hoveredZoneName && (
          <div className="bg-slate-900/90 text-amber-300 backdrop-blur-md border border-amber-500/40 rounded-xl px-3 py-1.5 shadow-md text-xs font-mono font-bold animate-fadeIn">
            {hoveredZoneName}
          </div>
        )}
      </div>

      {/* Map Control Toolbar */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-xl p-1 shadow-lg">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetFit}
          title="Reset Fit Oromia Extent"
          className="p-2 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border-t border-slate-200 dark:border-slate-800 mt-1 pt-1.5"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-bold">Initializing OpenLayers GIS View...</p>
            <p className="text-xs text-slate-400 mt-0.5">Reading 22 candidate ADM2 features (EPSG:4326 → EPSG:3857)</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {errorMsg && !loading && (
        <div className="absolute inset-0 z-30 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
          <p className="text-base font-bold text-slate-100">OpenLayers Map Error</p>
          <p className="text-xs text-slate-400 mt-1 max-w-md">{errorMsg}</p>
        </div>
      )}

      {/* Bottom Map Info Footer Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/80 border border-emerald-600 dark:border-emerald-400" />
            <span className="text-slate-800 dark:text-slate-200 font-medium">Candidate Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 border border-amber-500" />
            <span className="text-amber-800 dark:text-amber-300 font-semibold">Selected Zone</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span>OpenLayers v10.10</span>
          <span>•</span>
          <span>EPSG:3857 View</span>
          <span>•</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">100% Client-Side Vector GIS</span>
        </div>
      </div>
    </div>
  );
};
