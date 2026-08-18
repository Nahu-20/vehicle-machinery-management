import React, { useState, useEffect, useRef, useCallback } from 'react';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { Fill, Stroke, Style, Text, Circle as CircleStyle } from 'ol/style.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import { Feature } from 'ol/index.js';
import Point from 'ol/geom/Point.js';
import Polygon from 'ol/geom/Polygon.js';
import MultiPolygon from 'ol/geom/MultiPolygon.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import Translate from 'ol/interaction/Translate.js';
import 'ol/ol.css';

import { useTheme } from '../../../context/ThemeContext';
import { loadAndValidateOromiaGeoJSON } from '../../../features/investment-map/services/gisLoader';
import { OromiaGeoJSONCollection } from '../../../features/investment-map/types/gis';
import {
  CanonicalZoneId,
  CANONICAL_ZONE_METADATA,
  isCanonicalZoneId,
} from '../../../features/investment-map/constants/canonicalZones';
import {
  validateFacilityPointInZone,
  getZoneBoundingBox,
  PointInZoneResult,
} from '../../../features/investment-map/services/facilitySpatialService';
import { LocationPrecision } from '../../../types/investment';
import {
  MapPin,
  Crosshair,
  RotateCcw,
  Trash2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface FacilityLocationPickerProps {
  zoneId: CanonicalZoneId;
  locationPrecision: LocationPrecision;
  latitude: number | null;
  longitude: number | null;
  savedLatitude?: number | null;
  savedLongitude?: number | null;
  isReadOnly?: boolean;
  onChangeCoordinates: (coords: { lat: number | null; lng: number | null }) => void;
  onResetLocation?: () => void;
  className?: string;
}

/**
 * Calculates label interior point safely across Polygons and MultiPolygons
 */
function getLabelPoint(geom: Polygon | MultiPolygon): Point | null {
  if (!geom) return null;
  const type = geom.getType();
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

export function FacilityLocationPicker({
  zoneId,
  locationPrecision,
  latitude,
  longitude,
  savedLatitude,
  savedLongitude,
  isReadOnly = false,
  onChangeCoordinates,
  onResetLocation,
  className = '',
}: FacilityLocationPickerProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const mapTargetRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const zonesSourceRef = useRef<VectorSource | null>(null);
  const markerSourceRef = useRef<VectorSource | null>(null);
  const markerFeatureRef = useRef<Feature | null>(null);
  const translateRef = useRef<Translate | null>(null);

  const [geojson, setGeojson] = useState<OromiaGeoJSONCollection | null>(null);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [hoveredZoneName, setHoveredZoneName] = useState<string | null>(null);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Spatial Consistency Check
  const spatialResult: PointInZoneResult = validateFacilityPointInZone(
    longitude,
    latitude,
    zoneId,
    geojson
  );

  // 1. Fetch & Cache Web GIS Boundaries
  useEffect(() => {
    let mounted = true;
    loadAndValidateOromiaGeoJSON()
      .then((res) => {
        if (!mounted) return;
        if (res.isValid && res.data) {
          setGeojson(res.data);
          setGisLoaded(true);
        }
      })
      .catch((err) => {
        console.warn('[FacilityLocationPicker] GIS GeoJSON load warning:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Zone Style Generator
  const getZoneFeatureStyle = useCallback(
    (feature: Feature) => {
      const zid = (feature.get('zone_id') || feature.getId()) as string;
      const isSelected = zid === zoneId;
      const rawName = (feature.get('name_en') as string) || '';
      const cleanName = rawName.replace(' (OR)', '');
      const geom = feature.getGeometry();
      const labelPt = geom ? getLabelPoint(geom as Polygon | MultiPolygon) : null;

      if (isSelected) {
        // High-contrast highlighted zone
        const fillAlpha = isDark ? 0.35 : 0.22;
        const polyStyle = new Style({
          fill: new Fill({
            color:
              locationPrecision === 'zone_centroid'
                ? `rgba(139, 92, 246, ${fillAlpha})` // Purple for zone-centroid
                : `rgba(245, 158, 11, ${fillAlpha})`, // Amber for selected zone
          }),
          stroke: new Stroke({
            color: locationPrecision === 'zone_centroid' ? '#8b5cf6' : '#f59e0b',
            width: 3.5,
          }),
          zIndex: 10,
        });

        const textStyle = new Style({
          geometry: labelPt || undefined,
          text: new Text({
            text: cleanName,
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

      // Neutral background canonical zones
      const polyStyle = new Style({
        fill: new Fill({
          color: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.65)',
        }),
        stroke: new Stroke({
          color: isDark ? '#475569' : '#cbd5e1',
          width: 1.2,
        }),
        zIndex: 1,
      });

      const textStyle = new Style({
        geometry: labelPt || undefined,
        text: new Text({
          text: cleanName,
          font: '500 10px system-ui, -apple-system, sans-serif',
          overflow: false,
          textAlign: 'center',
          textBaseline: 'middle',
          fill: new Fill({ color: isDark ? '#94a3b8' : '#64748b' }),
          stroke: new Stroke({ color: isDark ? '#0f172a' : '#ffffff', width: 2 }),
        }),
        zIndex: 2,
      });

      return [polyStyle, textStyle];
    },
    [zoneId, isDark, locationPrecision]
  );

  // 3. Facility Marker Style Generator
  const getMarkerStyle = useCallback(() => {
    if (locationPrecision === 'zone_centroid') {
      // Suppress point marker in zone_centroid mode
      return new Style({});
    }

    if (locationPrecision === 'approximate') {
      // Approximate: Amber dashed target circle with central dot
      return [
        new Style({
          image: new CircleStyle({
            radius: 18,
            stroke: new Stroke({
              color: '#f59e0b',
              width: 2,
              lineDash: [4, 4],
            }),
            fill: new Fill({ color: 'rgba(245, 158, 11, 0.15)' }),
          }),
          zIndex: 100,
        }),
        new Style({
          image: new CircleStyle({
            radius: 6,
            fill: new Fill({ color: '#d97706' }),
            stroke: new Stroke({ color: '#ffffff', width: 2 }),
          }),
          zIndex: 101,
        }),
      ];
    }

    // Exact: High-precision green target pin
    return [
      new Style({
        image: new CircleStyle({
          radius: 14,
          fill: new Fill({ color: 'rgba(16, 185, 129, 0.25)' }),
          stroke: new Stroke({ color: '#059669', width: 2 }),
        }),
        zIndex: 100,
      }),
      new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: '#059669' }),
          stroke: new Stroke({ color: '#ffffff', width: 2 }),
        }),
        zIndex: 101,
      }),
    ];
  }, [locationPrecision]);

  // 4. Initialize OpenLayers Map Instance
  useEffect(() => {
    if (!mapTargetRef.current || mapRef.current) return;

    const zonesSource = new VectorSource();
    zonesSourceRef.current = zonesSource;

    const zonesLayer = new VectorLayer({
      source: zonesSource,
      style: (feat) => getZoneFeatureStyle(feat as Feature),
    });

    const markerSource = new VectorSource();
    markerSourceRef.current = markerSource;

    const markerLayer = new VectorLayer({
      source: markerSource,
      style: () => getMarkerStyle(),
      zIndex: 99,
    });

    // Default Oromia center
    const initialCenter = fromLonLat([38.75, 8.5]);

    const map = new Map({
      target: mapTargetRef.current,
      controls: defaultControls({
        zoom: false,
        attribution: false,
        rotate: false,
      }),
      layers: [zonesLayer, markerLayer],
      view: new View({
        center: initialCenter,
        zoom: 6.8,
        minZoom: 5.5,
        maxZoom: 15,
      }),
    });

    mapRef.current = map;

    // Hover inspection for zones
    map.on('pointermove', (evt) => {
      const pixel = map.getEventPixel(evt.originalEvent);
      const hit = map.forEachFeatureAtPixel(pixel, (feat, layer) => {
        if (layer === zonesLayer) return feat;
        return null;
      });

      if (hit) {
        const nameEn = (hit.get('name_en') as string) || '';
        setHoveredZoneName(nameEn.replace(' (OR)', ''));
        map.getTargetElement().style.cursor = isReadOnly ? 'default' : 'crosshair';
      } else {
        setHoveredZoneName(null);
        map.getTargetElement().style.cursor = 'default';
      }
    });

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, [getZoneFeatureStyle, getMarkerStyle, isReadOnly]);

  // 5. Populate Zones Features when GeoJSON is loaded
  useEffect(() => {
    if (!geojson || !zonesSourceRef.current || !mapRef.current) return;

    const format = new GeoJSON();
    const olFeatures = format.readFeatures(geojson, {
      featureProjection: 'EPSG:3857',
    }) as Feature[];

    zonesSourceRef.current.clear();
    zonesSourceRef.current.addFeatures(olFeatures);

    // Initial View Fit: if coordinates present, center on them; otherwise fit selected zone or full Oromia
    if (latitude != null && longitude != null && locationPrecision !== 'zone_centroid') {
      mapRef.current.getView().animate({
        center: fromLonLat([longitude, latitude]),
        zoom: 10,
        duration: prefersReducedMotion ? 0 : 400,
      });
    } else {
      const bbox = getZoneBoundingBox(zoneId, geojson);
      if (bbox) {
        const [minLng, minLat, maxLng, maxLat] = bbox;
        const extent = [
          ...fromLonLat([minLng, minLat]),
          ...fromLonLat([maxLng, maxLat]),
        ];
        mapRef.current.getView().fit(extent, {
          padding: [30, 30, 30, 30],
          duration: prefersReducedMotion ? 0 : 400,
          maxZoom: 11,
        });
      }
    }
  }, [geojson]); // Intentionally only run on initial GeoJSON load

  // 6. Update Zones Layer Styling on Zone / Theme / Precision Change
  useEffect(() => {
    if (zonesSourceRef.current) {
      zonesSourceRef.current.changed();
    }
  }, [zoneId, isDark, locationPrecision, getZoneFeatureStyle]);

  // 7. Synchronize Point Marker Position from lat / lng props
  useEffect(() => {
    if (!markerSourceRef.current) return;

    if (
      latitude != null &&
      longitude != null &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      locationPrecision !== 'zone_centroid'
    ) {
      const coords3857 = fromLonLat([longitude, latitude]);

      if (!markerFeatureRef.current) {
        const feature = new Feature({
          geometry: new Point(coords3857),
        });
        markerFeatureRef.current = feature;
        markerSourceRef.current.clear();
        markerSourceRef.current.addFeature(feature);
      } else {
        const pointGeom = markerFeatureRef.current.getGeometry() as Point;
        pointGeom.setCoordinates(coords3857);
      }
    } else {
      // Clear marker when coordinates are empty or in zone_centroid mode
      if (markerFeatureRef.current) {
        markerSourceRef.current.clear();
        markerFeatureRef.current = null;
      }
    }

    if (markerSourceRef.current) {
      markerSourceRef.current.changed();
    }
  }, [latitude, longitude, locationPrecision, getMarkerStyle]);

  // 8. Handle Map Click-to-Place
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = (evt: any) => {
      if (isReadOnly || locationPrecision === 'zone_centroid') return;

      const lonLat = toLonLat(evt.coordinate);
      const lng = Number(lonLat[0].toFixed(6));
      const lat = Number(lonLat[1].toFixed(6));

      onChangeCoordinates({ lat, lng });
    };

    map.on('singleclick', handleMapClick);
    return () => {
      map.un('singleclick', handleMapClick);
    };
  }, [isReadOnly, locationPrecision, onChangeCoordinates]);

  // 9. Configure Marker Drag Interaction (Translate)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !markerSourceRef.current) return;

    // Clean up previous translate interaction
    if (translateRef.current) {
      map.removeInteraction(translateRef.current);
      translateRef.current = null;
    }

    if (!isReadOnly && locationPrecision !== 'zone_centroid') {
      const translate = new Translate({
        layers: [map.getLayers().getArray()[1] as VectorLayer<any>], // Marker layer
      });

      translate.on('translateend', (evt) => {
        if (evt.features && evt.features.getLength() > 0) {
          const feature = evt.features.item(0);
          const geom = feature.getGeometry() as Point;
          if (geom) {
            const coords = geom.getCoordinates();
            const lonLat = toLonLat(coords);
            const lng = Number(lonLat[0].toFixed(6));
            const lat = Number(lonLat[1].toFixed(6));
            onChangeCoordinates({ lat, lng });
          }
        }
      });

      map.addInteraction(translate);
      translateRef.current = translate;
    }

    return () => {
      if (translateRef.current && map) {
        map.removeInteraction(translateRef.current);
        translateRef.current = null;
      }
    };
  }, [isReadOnly, locationPrecision, onChangeCoordinates]);

  // Actions: Fit to Selected Zone
  const handleFitSelectedZone = useCallback(() => {
    if (!mapRef.current || !geojson) return;
    const bbox = getZoneBoundingBox(zoneId, geojson);
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox;
      const extent = [
        ...fromLonLat([minLng, minLat]),
        ...fromLonLat([maxLng, maxLat]),
      ];
      mapRef.current.getView().fit(extent, {
        padding: [40, 40, 40, 40],
        duration: prefersReducedMotion ? 0 : 500,
        maxZoom: 11,
      });
    }
  }, [zoneId, geojson, prefersReducedMotion]);

  // Actions: Fit to Facility Marker
  const handleFitFacility = useCallback(() => {
    if (!mapRef.current || latitude == null || longitude == null) return;
    mapRef.current.getView().animate({
      center: fromLonLat([longitude, latitude]),
      zoom: 11,
      duration: prefersReducedMotion ? 0 : 500,
    });
  }, [latitude, longitude, prefersReducedMotion]);

  // Actions: Clear Coordinates
  const handleClearCoordinates = useCallback(() => {
    if (isReadOnly) return;
    onChangeCoordinates({ lat: null, lng: null });
  }, [isReadOnly, onChangeCoordinates]);

  const zoneMeta = CANONICAL_ZONE_METADATA[zoneId];
  const hasCoordinates =
    latitude != null && longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude);

  return (
    <div
      id="facility-location-picker-container"
      className={`space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs ${className}`}
    >
      {/* Header & Spatial Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            OpenLayers Coordinate Placement & Spatial Review
          </h4>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            id="btn-fit-selected-zone"
            aria-label="Fit map to selected canonical zone"
            title={`Fit to ${zoneMeta?.displayName || zoneId}`}
            onClick={handleFitSelectedZone}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>Fit to Zone</span>
          </button>

          {hasCoordinates && locationPrecision !== 'zone_centroid' && (
            <button
              type="button"
              id="btn-fit-facility"
              aria-label="Fit map to facility point marker"
              title="Zoom to placed coordinates"
              onClick={handleFitFacility}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Fit to Facility</span>
            </button>
          )}

          {!isReadOnly && onResetLocation && savedLatitude !== undefined && (
            <button
              type="button"
              id="btn-reset-location"
              aria-label="Reset coordinates to saved location"
              title="Reset to saved coordinates"
              onClick={onResetLocation}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {!isReadOnly && hasCoordinates && (
            <button
              type="button"
              id="btn-clear-location"
              aria-label="Clear placed coordinates"
              title="Clear coordinates"
              onClick={handleClearCoordinates}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode / Read-Only Banner */}
      {isReadOnly ? (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Read-only mode:</strong> Facility coordinates and spatial placement are locked in current lifecycle state.
          </span>
        </div>
      ) : locationPrecision === 'zone_centroid' ? (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 text-xs border border-purple-200 dark:border-purple-800/60">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            <strong>Zone Centroid Mode:</strong> Exact point placement is suppressed from public exposure. The facility will be anchored to the assigned zone boundary.
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs border border-emerald-200/80 dark:border-emerald-800/40">
          <div className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Click anywhere on the map or drag the marker to position the facility point.
            </span>
          </div>
          {hoveredZoneName && (
            <span className="text-[11px] font-medium px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 rounded text-emerald-900 dark:text-emerald-200">
              Hovering: {hoveredZoneName}
            </span>
          )}
        </div>
      )}

      {/* Map Canvas Container */}
      <div className="relative w-full h-[360px] sm:h-[400px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
        <div
          ref={mapTargetRef}
          className="w-full h-full"
          tabIndex={0}
          aria-label="Interactive Oromia Facility Location Map"
        />

        {/* Map Overlays: Zoom Controls */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <button
            type="button"
            id="ol-btn-zoom-in"
            aria-label="Zoom in map"
            onClick={() => {
              if (mapRef.current) {
                const view = mapRef.current.getView();
                view.animate({
                  zoom: (view.getZoom() || 7) + 1,
                  duration: prefersReducedMotion ? 0 : 250,
                });
              }
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 shadow-md border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="ol-btn-zoom-out"
            aria-label="Zoom out map"
            onClick={() => {
              if (mapRef.current) {
                const view = mapRef.current.getView();
                view.animate({
                  zoom: (view.getZoom() || 7) - 1,
                  duration: prefersReducedMotion ? 0 : 250,
                });
              }
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 shadow-md border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Zone Pill on Map Canvas */}
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs text-xs font-bold text-slate-800 dark:text-slate-100 shadow-md border border-slate-200 dark:border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Zone: {zoneMeta?.displayName || zoneId}</span>
          </div>
        </div>

        {/* Bottom Status Ribbon */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10 text-[10px] text-slate-500 dark:text-slate-400 px-2 py-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-md border border-slate-200/60 dark:border-slate-800/60">
          <span>UN-OCHA COD-AB v04 Canonical GIS Layer (22 Zones)</span>
          <span>WGS84 [EPSG:4326]</span>
        </div>
      </div>

      {/* Location Review & Spatial Consistency Card */}
      <div
        id="location-review-summary-card"
        className={`p-3.5 rounded-xl border text-xs space-y-2.5 ${
          spatialResult.severity === 'success'
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
            : spatialResult.severity === 'warning'
            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
          <div className="flex items-center gap-1.5 font-bold">
            {spatialResult.severity === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            {spatialResult.severity === 'warning' && (
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            {spatialResult.severity === 'info' && (
              <Info className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            )}
            <span>Location Spatial Review Summary</span>
          </div>
          <span className="text-[11px] font-mono opacity-75">
            Precision: {locationPrecision.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              Assigned Zone
            </span>
            <span className="font-semibold">{zoneMeta?.displayName || zoneId}</span>
            <span className="text-[10px] text-slate-400 block">P-Code: {zoneMeta?.pcode}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              Geographic Coordinates
            </span>
            {locationPrecision === 'zone_centroid' ? (
              <span className="font-mono text-purple-700 dark:text-purple-300 font-semibold">
                [Zone Centroid Privacy Gate]
              </span>
            ) : hasCoordinates ? (
              <span className="font-mono font-semibold">
                {latitude?.toFixed(6)}° N, {longitude?.toFixed(6)}° E
              </span>
            ) : (
              <span className="text-slate-400 italic">No coordinates placed</span>
            )}
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
              Zone Consistency
            </span>
            <span
              className={`font-semibold ${
                spatialResult.isContained
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {locationPrecision === 'zone_centroid'
                ? '✓ Zone-Level Attribution'
                : spatialResult.message}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
