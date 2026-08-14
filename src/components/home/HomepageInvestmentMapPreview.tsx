import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Compass, ShieldCheck, Loader2 } from 'lucide-react';
import { loadAndValidateOromiaGeoJSON } from '../../features/investment-map/services/gisLoader';
import {
  OromiaGeoJSONCollection,
  OromiaZoneFeature,
  GisValidationResult,
} from '../../features/investment-map/types/gis';

interface HomepageInvestmentMapPreviewProps {
  className?: string;
}

// Bounding box for Oromia COD-AB v04 dataset
const OROMIA_BBOX: [number, number, number, number] = [34.1242, 3.5139, 42.9798, 10.3869];
const BASE_WIDTH = 900;
const BASE_HEIGHT = 620;
const PADDING = 40;

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
  const y = padding + ((maxLat - lat) / (maxLat - minLat)) * h;

  return [x, y];
}

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
    (geom.coordinates as number[][][]).forEach((ring) => processRing(ring));
  } else if (geom.type === 'MultiPolygon') {
    (geom.coordinates as number[][][][]).forEach((poly) => poly.forEach((ring) => processRing(ring)));
  }

  if (pointCount === 0) return [BASE_WIDTH / 2, BASE_HEIGHT / 2];
  return [sumX / pointCount, sumY / pointCount];
}

function featureToSvgPath(feature: OromiaZoneFeature, bbox = OROMIA_BBOX): string {
  const geom = feature.geometry;

  const ringToPath = (ring: number[][]): string => {
    return ring
      .map(([lon, lat], idx) => {
        const [x, y] = projectPoint(lon, lat, bbox);
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ') + ' Z';
  };

  if (geom.type === 'Polygon') {
    const rings = geom.coordinates as number[][][];
    return rings.map(ringToPath).join(' ');
  }

  if (geom.type === 'MultiPolygon') {
    const polygons = geom.coordinates as number[][][][];
    return polygons
      .flatMap((poly) => poly.map(ringToPath))
      .join(' ');
  }

  return '';
}

export const HomepageInvestmentMapPreview: React.FC<HomepageInvestmentMapPreviewProps> = ({
  className = '',
}) => {
  const [gisData, setGisData] = useState<OromiaGeoJSONCollection | null>(null);
  const [validationResult, setValidationResult] = useState<GisValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>('jimma');
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadGis() {
      try {
        const result = await loadAndValidateOromiaGeoJSON();
        if (!isMounted) return;
        setValidationResult(result);
        if (result.isValid && result.data) {
          setGisData(result.data);
        } else {
          // Fallback fetch if validation wrapped data differently
          const res = await fetch('/data/gis/oromia-zones-candidate.geojson');
          const data = await res.json();
          setGisData(data);
        }
      } catch (err) {
        console.error('Failed to load candidate GeoJSON for homepage preview:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadGis();
    return () => {
      isMounted = false;
    };
  }, []);

  const zonePaths = useMemo(() => {
    if (!gisData) return [];
    return gisData.features.map((feature) => {
      const path = featureToSvgPath(feature);
      const centroid = calculateCentroid(feature);
      return {
        feature,
        zoneId: feature.properties.zone_id,
        name: feature.properties.zone_name,
        pcode: feature.properties.zone_pcode,
        path,
        centroid,
      };
    });
  }, [gisData]);

  const activeZone = useMemo(() => {
    if (!selectedZoneId) return null;
    return zonePaths.find((z) => z.zoneId === selectedZoneId) || null;
  }, [selectedZoneId, zonePaths]);

  const hoveredZone = useMemo(() => {
    if (!hoveredZoneId) return null;
    return zonePaths.find((z) => z.zoneId === hoveredZoneId) || null;
  }, [hoveredZoneId, zonePaths]);

  return (
    <div
      role="region"
      aria-label="Interactive Oromia Agricultural Investment Map Preview"
      className={`relative w-full rounded-3xl bg-[#031d13] border border-emerald-800/40 text-white overflow-hidden shadow-2xl flex flex-col justify-between ${className}`}
    >
      {/* BACKGROUND DECORATIVE GRID */}
      <div className="absolute inset-0 bg-[radial-gradient(#A3E635_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* HEADER BAR */}
      <div className="relative z-10 p-4 sm:p-6 bg-gradient-to-b from-[#02150D] to-transparent border-b border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-4 h-4 text-[#A3E635]" />
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Oromia Agricultural Investment Map
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-300/80 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span>Candidate GIS boundaries — Formal Bureau GIS acceptance pending</span>
          </div>
        </div>

        <Link
          to={selectedZoneId ? `/investment/map?zone=${selectedZoneId}` : '/investment/map'}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-[#A3E635] text-xs font-bold border border-emerald-700/50 transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
        >
          <span>Explore Full Investment Map</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* SVG MAP CANVAS */}
      <div className="relative flex-1 w-full flex items-center justify-center p-2 sm:p-4 min-h-[380px] sm:min-h-[460px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-emerald-300">
            <Loader2 className="w-8 h-8 animate-spin text-[#A3E635]" />
            <span className="text-xs font-bold tracking-wider">Loading Candidate GIS Boundaries...</span>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg
              viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`}
              className="w-full h-full max-h-[500px] object-contain drop-shadow-lg"
              role="img"
              aria-label="Interactive map preview of Oromia administrative zones"
            >
              {/* RENDERING 22 CANONICAL ZONE POLYGONS */}
              <g className="transition-all duration-300">
                {zonePaths.map((z) => {
                  const isSelected = z.zoneId === selectedZoneId;
                  const isHovered = z.zoneId === hoveredZoneId;

                  let fillClass = 'fill-[#0d4a33]';
                  let strokeClass = 'stroke-[#10b981]/40';
                  let strokeWidth = '1.2';

                  if (isSelected) {
                    fillClass = 'fill-[#059669]';
                    strokeClass = 'stroke-[#A3E635]';
                    strokeWidth = '2.5';
                  } else if (isHovered) {
                    fillClass = 'fill-[#10704c]';
                    strokeClass = 'stroke-[#34d399]';
                    strokeWidth = '2';
                  }

                  return (
                    <path
                      key={z.zoneId}
                      d={z.path}
                      className={`${fillClass} ${strokeClass} cursor-pointer transition-all duration-150 focus:outline-none`}
                      strokeWidth={strokeWidth}
                      strokeLinejoin="round"
                      tabIndex={0}
                      role="button"
                      aria-label={`${z.name} Zone (${z.pcode})`}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedZoneId(z.zoneId)}
                      onMouseEnter={() => setHoveredZoneId(z.zoneId)}
                      onMouseLeave={() => setHoveredZoneId(null)}
                      onFocus={() => setHoveredZoneId(z.zoneId)}
                      onBlur={() => setHoveredZoneId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedZoneId(z.zoneId);
                        }
                      }}
                    />
                  );
                })}

                {/* ZONE English LABELS */}
                {zonePaths.map((z) => {
                  const isSelected = z.zoneId === selectedZoneId;
                  const isHovered = z.zoneId === hoveredZoneId;
                  // Hide small city labels on small scale if overlapping
                  const isSmallZone = z.zoneId === 'shager_city' || z.zoneId === 'harari';

                  return (
                    <g
                      key={`label-${z.zoneId}`}
                      transform={`translate(${z.centroid[0]}, ${z.centroid[1]})`}
                      className="pointer-events-none"
                    >
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        className={`text-[10px] font-bold tracking-tight transition-all duration-200 select-none ${
                          isSelected
                            ? 'fill-white font-extrabold text-[12px] drop-shadow-md'
                            : isHovered
                            ? 'fill-[#A3E635] font-bold'
                            : 'fill-emerald-200/80'
                        } ${isSmallZone ? 'hidden sm:block' : ''}`}
                      >
                        {z.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* HOVER TOOLTIP */}
            {hoveredZone && !selectedZoneId && (
              <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-[#02150D]/90 backdrop-blur-md border border-emerald-500/30 text-white text-xs font-bold shadow-xl flex items-center gap-2 pointer-events-none">
                <MapPin className="w-3.5 h-3.5 text-[#A3E635]" />
                <span>{hoveredZone.name}</span>
                <span className="text-emerald-400 font-mono text-[11px]">({hoveredZone.pcode})</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER BAR WITH SELECTED ZONE SUMMARY & DIRECT ACTION */}
      <div className="relative z-10 p-4 sm:p-5 bg-gradient-to-t from-[#02150D] to-transparent border-t border-emerald-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
        {activeZone ? (
          <div className="flex items-center gap-3 text-xs w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#A3E635]/15 text-[#A3E635]">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-white tracking-wide uppercase">
                  {activeZone.name}
                </span>
                <span className="ml-2 font-mono text-emerald-400 text-xs font-semibold">
                  {activeZone.pcode}
                </span>
              </div>
            </div>
            <span className="hidden md:inline text-emerald-300/60 text-xs">
              Candidate GIS Zone Boundary (22 / 22 Total)
            </span>
          </div>
        ) : (
          <div className="text-xs text-emerald-300/70 font-medium">
            Select a zone on the map to inspect boundary identity.
          </div>
        )}

        <Link
          to={selectedZoneId ? `/investment/map?zone=${selectedZoneId}` : '/investment/map'}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#063D2A] hover:bg-[#0c5634] text-white text-xs font-extrabold border border-emerald-500/40 shadow-lg transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
        >
          <span>Explore Full Investment Map</span>
          <ArrowRight className="w-4 h-4 text-[#A3E635]" />
        </Link>
      </div>
    </div>
  );
};
