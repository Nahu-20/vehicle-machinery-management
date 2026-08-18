import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  GisValidationResult,
  OromiaGeoJSONCollection,
  OromiaZoneFeature,
} from '../types/gis';
import { loadAndValidateOromiaGeoJSON } from '../services/gisLoader';
import { CanonicalZoneId } from '../constants/canonicalZones';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Info,
  MapPin,
  Sparkles,
} from 'lucide-react';

import { CommodityKey, ThematicMetric } from '../types/thematic';
import {
  getDemoZoneCommodityMetrics,
  classifyThematicValue,
  getThematicColor,
  THEMATIC_CLASS_LABELS,
} from '../services/thematicService';
import { PublicThematicDatasetResult } from '../services/publicThematicInvestmentService';

interface SvgMapContainerProps {
  height?: string;
  selectedZoneId?: string | null;
  selectedCommodity?: CommodityKey | null;
  selectedMetric?: ThematicMetric;
  thematicResult?: PublicThematicDatasetResult | null;
  onSelectZone?: (zoneId: string) => void;
  onGisVerified?: (result: GisValidationResult) => void;
  allowDemoData?: boolean;
  className?: string;
}

// Bounding box for Oromia COD-AB v04 dataset
const OROMIA_BBOX: [number, number, number, number] = [34.1242, 3.5139, 42.9798, 10.3869];
const BASE_WIDTH = 900;
const BASE_HEIGHT = 620;
const PADDING = 45;

/**
 * Projects longitude and latitude (WGS84) to SVG coordinate space
 */
function projectPoint(
  lon: number,
  lat: number,
  bbox = OROMIA_BBOX,
  width = BASE_WIDTH,
  height = BASE_HEIGHT,
  padding = PADDING
): [number, number] {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const w = width - padding * 2;
  const h = height - padding * 2;

  const x = padding + ((lon - minLon) / (maxLon - minLon)) * w;
  // Invert Y because latitude goes north (up), SVG Y goes down
  const y = padding + ((maxLat - lat) / (maxLat - minLat)) * h;

  return [x, y];
}

/**
 * Calculates centroid of a polygon geometry for crisp label placement
 */
function calculateCentroid(
  feature: OromiaZoneFeature,
  bbox = OROMIA_BBOX
): [number, number] {
  let sumX = 0;
  let sumY = 0;
  let pointCount = 0;

  const geom = feature.geometry;

  const processRing = (ring: number[][]) => {
    ring.forEach(([lon, lat]) => {
      const [x, y] = projectPoint(lon, lat, bbox);
      sumX += x;
      sumY += y;
      pointCount++;
    });
  };

  if (geom.type === 'Polygon') {
    (geom.coordinates as number[][][]).forEach(processRing);
  } else if (geom.type === 'MultiPolygon') {
    (geom.coordinates as number[][][][]).forEach((poly) => poly.forEach(processRing));
  }

  if (pointCount === 0) return [BASE_WIDTH / 2, BASE_HEIGHT / 2];
  return [sumX / pointCount, sumY / pointCount];
}

/**
 * Converts GeoJSON Polygon or MultiPolygon into an SVG path string
 */
function featureToSvgPath(feature: OromiaZoneFeature, bbox = OROMIA_BBOX): string {
  const geom = feature.geometry;
  let d = '';

  const ringToPath = (ring: number[][]) => {
    if (ring.length === 0) return '';
    const points = ring.map(([lon, lat]) => {
      const [x, y] = projectPoint(lon, lat, bbox);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return 'M ' + points.join(' L ') + ' Z ';
  };

  if (geom.type === 'Polygon') {
    (geom.coordinates as number[][][]).forEach((ring) => {
      d += ringToPath(ring);
    });
  } else if (geom.type === 'MultiPolygon') {
    (geom.coordinates as number[][][][]).forEach((poly) => {
      poly.forEach((ring) => {
        d += ringToPath(ring);
      });
    });
  }

  return d;
}

export const SvgMapContainer: React.FC<SvgMapContainerProps> = ({
  height = '650px',
  selectedZoneId,
  selectedCommodity,
  selectedMetric = 'production',
  thematicResult,
  onSelectZone,
  onGisVerified,
  allowDemoData = false,
  className = '',
}) => {
  const [gisResult, setGisResult] = useState<GisValidationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredFeature, setHoveredFeature] = useState<OromiaZoneFeature | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Pan and Zoom State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      const res = await loadAndValidateOromiaGeoJSON();
      if (isMounted) {
        setGisResult(res);
        setLoading(false);
        if (onGisVerified) onGisVerified(res);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [onGisVerified]);

  // Compute SVG Paths & Centroids for all features
  const processedFeatures = useMemo(() => {
    if (!gisResult || !gisResult.data || !gisResult.data.features) return [];
    return gisResult.data.features.map((feature) => {
      const path = featureToSvgPath(feature);
      const [centroidX, centroidY] = calculateCentroid(feature);
      return {
        feature,
        path,
        centroidX,
        centroidY,
        zoneId: feature.properties.zone_id,
        nameEn: feature.properties.name_en,
        nameOm: feature.properties.name_om,
        nameAm: feature.properties.name_am,
        pcode: feature.properties.pcode,
        areaSqKm: feature.properties.area_sqkm,
      };
    });
  }, [gisResult]);

  // Handle Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.25, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.25, 0.8));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Drag Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      style={{ height }}
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 select-none shadow-inner ${className}`}
    >
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Top Status Header Bar */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-md flex items-center gap-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-emerald-400">Vector SVG Map Engine</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">22 Candidate Polygons</span>
        </div>

        {gisResult?.isValid && (
          <div className="bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 rounded-xl px-3 py-1.5 shadow-md flex items-center gap-1.5 text-xs font-mono font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>GIS Validation Passed</span>
          </div>
        )}
      </div>

      {/* Zoom / Pan Floating Toolbar Controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg">
        <button
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          title="Reset View Fit"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border-t border-slate-800 mt-1 pt-1.5"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-bold text-slate-200">Loading Candidate GIS Boundary Polygons...</p>
            <p className="text-xs text-slate-400 mt-0.5">Processing 22 Oromia ADM2 candidate zones</p>
          </div>
        </div>
      )}

      {/* Main Interactive SVG Canvas */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`}
        className={`w-full h-full cursor-${isDragging ? 'grabbing' : 'grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          style={{ transformOrigin: 'center center', transition: isDragging ? 'none' : 'transform 0.15s ease-out' }}
        >
          {/* Base Layer: Oromia Outer Ambient Boundary Shadow */}
          <g className="opacity-20 filter drop-shadow-lg">
            {processedFeatures.map((item) => (
              <path
                key={`shadow-${item.zoneId}`}
                d={item.path}
                fill="#000000"
                fillRule="evenodd"
              />
            ))}
          </g>

          {/* Layer 1: Zone Fill Polygons */}
          <g>
            {processedFeatures.map((item) => {
              const isSelected = selectedZoneId === item.zoneId;
              const isHovered = hoveredFeature?.properties.zone_id === item.zoneId;
              const zid = item.zoneId as CanonicalZoneId;

              let fillColor = '#059669'; // Default Emerald
              let fillOpacity = 0.55;
              let strokeColor = '#34d399';
              let strokeWidth = 1.25;

              // Priority 1: Real published thematic dataset
              if (thematicResult && zid && thematicResult.valuesByZoneId) {
                const zoneVal = thematicResult.valuesByZoneId[zid];
                if (zoneVal) {
                  const colors = getThematicColor(zoneVal.thematicClass, true);
                  fillColor = colors.legendColor;
                  fillOpacity = 0.85;
                  strokeColor = colors.stroke;
                }
              }
              // Priority 2: Demo/synthetic data if explicitly allowed (for Lab regression tests)
              else if (allowDemoData && selectedCommodity && zid) {
                const metrics = getDemoZoneCommodityMetrics(zid, selectedCommodity);
                let rawVal: number | null | undefined = null;
                if (metrics) {
                  if (selectedMetric === 'production') rawVal = metrics.production?.volumeMT;
                  else if (selectedMetric === 'suitability') rawVal = metrics.suitability?.score;
                  else if (selectedMetric === 'investment_potential') rawVal = metrics.investmentPotential?.score;
                }
                const classRes = classifyThematicValue(selectedCommodity, (selectedMetric as ThematicMetric) || 'production', rawVal);
                const colors = getThematicColor(classRes.classification, true);
                fillColor = colors.legendColor;
                fillOpacity = 0.85;
                strokeColor = colors.stroke;
              }

              if (isSelected) {
                strokeColor = '#f59e0b'; // Amber Gold highlight stroke
                strokeWidth = 2.5;
                fillOpacity = 0.95;
              } else if (isHovered) {
                strokeWidth = 2.0;
                fillOpacity = Math.min(fillOpacity + 0.15, 1.0);
              }

              return (
                <path
                  key={`poly-${item.zoneId}`}
                  d={item.path}
                  fill={fillColor}
                  fillOpacity={fillOpacity}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth / zoom} // Keep stroke crisp during zoom
                  fillRule="evenodd"
                  className="transition-all duration-150 cursor-pointer hover:filter hover:brightness-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectZone) onSelectZone(item.zoneId);
                  }}
                  onMouseEnter={() => setHoveredFeature(item.feature)}
                  onMouseLeave={() => setHoveredFeature(null)}
                />
              );
            })}
          </g>

          {/* Layer 2: Selected Zone Halo Highlight */}
          {processedFeatures
            .filter((item) => item.zoneId === selectedZoneId)
            .map((item) => (
              <path
                key={`halo-${item.zoneId}`}
                d={item.path}
                fill="none"
                stroke="#fbbf24"
                strokeWidth={3.5 / zoom}
                strokeDasharray="4 2"
                fillRule="evenodd"
                className="animate-pulse pointer-events-none"
              />
            ))}

          {/* Layer 3: Centroid Zone Labels */}
          <g className="pointer-events-none">
            {processedFeatures.map((item) => {
              const isSelected = selectedZoneId === item.zoneId;
              const isHovered = hoveredFeature?.properties.zone_id === item.zoneId;

              return (
                <g
                  key={`label-${item.zoneId}`}
                  transform={`translate(${item.centroidX}, ${item.centroidY})`}
                >
                  {/* Subtle Label Background Capsule */}
                  <rect
                    x={-(item.nameEn.length * 3.2 + 6)}
                    y={-9}
                    width={item.nameEn.length * 6.4 + 12}
                    height={16}
                    rx={4}
                    fill={isSelected ? '#78350f' : isHovered ? '#064e3b' : '#0f172a'}
                    fillOpacity={0.85}
                    stroke={isSelected ? '#f59e0b' : '#334155'}
                    strokeWidth={0.75}
                  />
                  {/* Zone Name Text */}
                  <text
                    textAnchor="middle"
                    dy={3}
                    fontSize={10}
                    fontWeight={isSelected || isHovered ? '700' : '500'}
                    fill={isSelected ? '#fef3c7' : '#f8fafc'}
                    className="font-sans font-semibold tracking-tight"
                  >
                    {item.nameEn}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Hover Floating Tooltip Card */}
      {hoveredFeature && (() => {
        const zid = hoveredFeature.properties.zone_id as CanonicalZoneId;
        const realZoneVal = thematicResult && thematicResult.valuesByZoneId ? thematicResult.valuesByZoneId[zid] : null;

        const demoMetrics = allowDemoData && selectedCommodity ? getDemoZoneCommodityMetrics(zid, selectedCommodity) : null;
        let metricVal: number | null | undefined = null;
        if (demoMetrics) {
          if (selectedMetric === 'production') metricVal = demoMetrics.production?.volumeMT;
          else if (selectedMetric === 'suitability') metricVal = demoMetrics.suitability?.score;
          else if (selectedMetric === 'investment_potential') metricVal = demoMetrics.investmentPotential?.score;
        }
        const activeMet = (selectedMetric as ThematicMetric) || 'production';
        const classRes = allowDemoData && selectedCommodity
          ? classifyThematicValue(selectedCommodity, activeMet, metricVal)
          : null;

        return (
          <div
            className="absolute z-30 pointer-events-none bg-slate-900/95 border border-slate-700/90 text-slate-100 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-2 transition-opacity duration-150 max-w-xs"
            style={{
              left: Math.min(mousePos.x + 15, BASE_WIDTH - 260),
              top: Math.min(mousePos.y + 15, BASE_HEIGHT - 130),
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <span className="font-black text-sm text-emerald-400 uppercase tracking-tight">
                {hoveredFeature.properties.name_en}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 font-bold shrink-0">
                {hoveredFeature.properties.pcode}
              </span>
            </div>

            {realZoneVal ? (
              <div className="space-y-1 font-mono text-[11px] bg-slate-800/80 p-2 rounded-lg border border-slate-700/80">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 capitalize">{thematicResult!.dataset.commodity} ({thematicResult!.dataset.metric}):</span>
                  <span className="font-bold text-emerald-300">
                    {realZoneVal.productionVolume !== null && realZoneVal.productionVolume !== undefined
                      ? `${realZoneVal.productionVolume.toLocaleString()} ${thematicResult!.dataset.unit || 'MT'}`
                      : realZoneVal.value !== null && realZoneVal.value !== undefined
                      ? `${realZoneVal.value} Score`
                      : 'No Data'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Class:</span>
                  <span className="font-bold text-amber-300">
                    {THEMATIC_CLASS_LABELS[realZoneVal.thematicClass]}
                  </span>
                </div>
                {realZoneVal.regionalRank && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Regional Rank:</span>
                    <span className="font-bold text-emerald-400">#{realZoneVal.regionalRank} of 22</span>
                  </div>
                )}
              </div>
            ) : selectedCommodity && classRes ? (
              <div className="space-y-1 font-mono text-[11px] bg-slate-800/80 p-2 rounded-lg border border-slate-700/80">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 capitalize">{selectedCommodity} ({selectedMetric}):</span>
                  <span className="font-bold text-emerald-300">
                    {metricVal !== null && metricVal !== undefined
                      ? selectedMetric === 'production'
                        ? `${metricVal.toLocaleString()} MT`
                        : `${metricVal}/100`
                      : 'No Data'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Class:</span>
                  <span className="font-bold text-amber-300">
                    {classRes.classLabel}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 italic text-[11px]">
                Click zone to inspect canonical profile.
              </div>
            )}
            {/* Bottom tooltip action hint */}
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex items-center gap-1 font-sans">
              <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Click to view profile</span>
            </div>
          </div>
        );
      })()}

      {/* Bottom Map Info Footer Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/80 border border-emerald-400" />
            <span className="text-slate-300 font-medium">Candidate Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-400 border border-amber-400" />
            <span className="text-amber-300 font-medium">Selected Zone</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span>COD-AB v04 (2025/2026)</span>
          <span>•</span>
          <span>EPSG:4326</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">100% Vector Compatible Engine</span>
        </div>
      </div>
    </div>
  );
};
