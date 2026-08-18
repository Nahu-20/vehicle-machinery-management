import * as turf from '@turf/turf';
import { CanonicalZoneId, CANONICAL_ZONE_METADATA, isCanonicalZoneId } from '../constants/canonicalZones';
import { OromiaGeoJSONCollection, OromiaZoneFeature } from '../types/gis';

export interface PointInZoneResult {
  status: 'inside' | 'boundary' | 'near_boundary' | 'outside' | 'unknown_zone' | 'no_gis_data';
  isContained: boolean;
  distanceToBoundaryKm?: number;
  selectedZoneId: CanonicalZoneId;
  selectedZoneDisplayName: string;
  detectedZoneId?: CanonicalZoneId | null;
  detectedZoneDisplayName?: string | null;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

/**
 * Boundary proximity threshold in kilometers (0.5 km = 500 meters)
 * Points within this distance are classified as 'boundary' (if inside) or 'near_boundary' (if outside)
 */
export const BOUNDARY_TOLERANCE_KM = 0.5;

/**
 * Finds the canonical zone feature by its ID
 */
export function getCanonicalZoneFeature(
  zoneId: CanonicalZoneId,
  geojson: OromiaGeoJSONCollection | null
): OromiaZoneFeature | null {
  if (!geojson || !Array.isArray(geojson.features)) return null;
  const match = geojson.features.find(
    (f) =>
      (f.properties?.zone_id as string) === zoneId ||
      f.id === zoneId ||
      (f.properties?.prototype_id as string) === zoneId
  );
  return (match as OromiaZoneFeature) || null;
}

/**
 * Detects which canonical zone (if any) contains the given [lng, lat] point.
 * Accurately accounts for MultiPolygons (e.g. West Wellega) and enclave holes (e.g. East Hararghe, Shager City).
 */
export function findContainingZone(
  lng: number,
  lat: number,
  geojson: OromiaGeoJSONCollection | null
): { zoneId: CanonicalZoneId; displayName: string } | null {
  if (!geojson || !Array.isArray(geojson.features)) return null;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

  try {
    const pt = turf.point([lng, lat]);
    for (const feature of geojson.features) {
      const zid = (feature.properties?.zone_id || feature.id) as string;
      if (isCanonicalZoneId(zid)) {
        const isInside = turf.booleanPointInPolygon(pt, feature as any);
        if (isInside) {
          const meta = CANONICAL_ZONE_METADATA[zid];
          return {
            zoneId: zid,
            displayName: meta?.displayName || feature.properties?.name_en || zid,
          };
        }
      }
    }
  } catch (err) {
    console.warn('[facilitySpatialService] Error in findContainingZone:', err);
  }

  return null;
}

/**
 * Validates whether a coordinate point [lng, lat] falls within the assigned canonical zone.
 * Evaluates polygon rings (exterior and interior holes), calculates boundary distances,
 * and detects actual zone containment if outside.
 */
export function validateFacilityPointInZone(
  lng: number | null | undefined,
  lat: number | null | undefined,
  zoneId: CanonicalZoneId,
  geojson: OromiaGeoJSONCollection | null
): PointInZoneResult {
  const zoneMeta = CANONICAL_ZONE_METADATA[zoneId];
  const selectedZoneDisplayName = zoneMeta?.displayName || zoneId;

  if (lng == null || lat == null || !Number.isFinite(lng) || !Number.isFinite(lat)) {
    return {
      status: 'no_gis_data',
      isContained: false,
      selectedZoneId: zoneId,
      selectedZoneDisplayName,
      message: 'No coordinates specified for location validation.',
      severity: 'info',
    };
  }

  if (!geojson || !Array.isArray(geojson.features) || geojson.features.length === 0) {
    return {
      status: 'no_gis_data',
      isContained: true, // Graceful fallback if GIS data is still loading
      selectedZoneId: zoneId,
      selectedZoneDisplayName,
      message: 'GIS zone boundary dataset is loading...',
      severity: 'info',
    };
  }

  const targetFeature = getCanonicalZoneFeature(zoneId, geojson);
  if (!targetFeature) {
    return {
      status: 'unknown_zone',
      isContained: false,
      selectedZoneId: zoneId,
      selectedZoneDisplayName,
      message: `Assigned zone "${selectedZoneDisplayName}" was not found in the canonical GIS dataset.`,
      severity: 'error',
    };
  }

  try {
    const pt = turf.point([lng, lat]);
    const isContained = turf.booleanPointInPolygon(pt, targetFeature as any);

    // Calculate distance to boundary lines for boundary tolerance analysis
    let distanceToBoundaryKm = 0;
    try {
      const boundaryLines = turf.polygonToLine(targetFeature as any);
      const flattenedLines = turf.flatten(boundaryLines as any);
      let minDist = Infinity;
      for (const lineFeature of flattenedLines.features) {
        const d = turf.pointToLineDistance(pt, lineFeature as any, { units: 'kilometers' });
        if (d < minDist) minDist = d;
      }
      distanceToBoundaryKm = minDist === Infinity ? 0 : minDist;
    } catch {
      distanceToBoundaryKm = 0;
    }

    // 1. Point is inside the target zone polygon
    if (isContained) {
      if (distanceToBoundaryKm <= BOUNDARY_TOLERANCE_KM) {
        return {
          status: 'boundary',
          isContained: true,
          distanceToBoundaryKm: Number(distanceToBoundaryKm.toFixed(2)),
          selectedZoneId: zoneId,
          selectedZoneDisplayName,
          message: `Point is inside ${selectedZoneDisplayName}, within ${(distanceToBoundaryKm * 1000).toFixed(0)}m of the boundary.`,
          severity: 'info',
        };
      }

      return {
        status: 'inside',
        isContained: true,
        distanceToBoundaryKm: Number(distanceToBoundaryKm.toFixed(2)),
        selectedZoneId: zoneId,
        selectedZoneDisplayName,
        message: `Point falls cleanly within ${selectedZoneDisplayName} (${distanceToBoundaryKm.toFixed(1)} km from boundary).`,
        severity: 'success',
      };
    }

    // 2. Point is outside the target zone polygon
    // Check if it's very close to the boundary (near-boundary edge case)
    if (distanceToBoundaryKm <= BOUNDARY_TOLERANCE_KM) {
      return {
        status: 'near_boundary',
        isContained: false,
        distanceToBoundaryKm: Number(distanceToBoundaryKm.toFixed(2)),
        selectedZoneId: zoneId,
        selectedZoneDisplayName,
        message: `Point is just outside the ${selectedZoneDisplayName} border (${(distanceToBoundaryKm * 1000).toFixed(0)}m away). Please review placement.`,
        severity: 'warning',
      };
    }

    // Check if it falls within another canonical zone
    const actualZone = findContainingZone(lng, lat, geojson);
    if (actualZone) {
      return {
        status: 'outside',
        isContained: false,
        distanceToBoundaryKm: Number(distanceToBoundaryKm.toFixed(2)),
        selectedZoneId: zoneId,
        selectedZoneDisplayName,
        detectedZoneId: actualZone.zoneId,
        detectedZoneDisplayName: actualZone.displayName,
        message: `Location appears to fall outside ${selectedZoneDisplayName}. Coordinates detect placement inside ${actualZone.displayName}.`,
        severity: 'warning',
      };
    }

    return {
      status: 'outside',
      isContained: false,
      distanceToBoundaryKm: Number(distanceToBoundaryKm.toFixed(2)),
      selectedZoneId: zoneId,
      selectedZoneDisplayName,
      message: `Location appears to fall outside the selected zone boundary (${selectedZoneDisplayName}).`,
      severity: 'warning',
    };
  } catch (err) {
    console.error('[facilitySpatialService] Spatial computation error:', err);
    return {
      status: 'outside',
      isContained: false,
      selectedZoneId: zoneId,
      selectedZoneDisplayName,
      message: 'Failed to complete spatial validation calculation.',
      severity: 'warning',
    };
  }
}

/**
 * Calculates bounding box [minLng, minLat, maxLng, maxLat] for a canonical zone
 */
export function getZoneBoundingBox(
  zoneId: CanonicalZoneId,
  geojson: OromiaGeoJSONCollection | null
): [number, number, number, number] | null {
  const feature = getCanonicalZoneFeature(zoneId, geojson);
  if (!feature) return null;
  try {
    const bbox = turf.bbox(feature as any);
    return [bbox[0], bbox[1], bbox[2], bbox[3]];
  } catch {
    return null;
  }
}

/**
 * Computes an interior representative centroid point [lng, lat] for a canonical zone.
 * Uses turf.pointOnFeature / turf.centerOfMass for Polygons and MultiPolygons
 * to ensure the centroid falls strictly inside the zone.
 */
export function getZoneCentroidPoint(
  zoneId: CanonicalZoneId,
  geojson: OromiaGeoJSONCollection | null
): { lat: number; lng: number } | null {
  const feature = getCanonicalZoneFeature(zoneId, geojson);
  if (!feature) return null;
  try {
    const pt = turf.pointOnFeature(feature as any);
    const coords = pt.geometry.coordinates;
    if (coords && Number.isFinite(coords[0]) && Number.isFinite(coords[1])) {
      return {
        lng: coords[0],
        lat: coords[1],
      };
    }
  } catch (err) {
    console.warn(`[facilitySpatialService] Failed to compute centroid for zone ${zoneId}:`, err);
  }
  return null;
}

/**
 * Validates coordinate numbers (finite, within global bounds)
 */
export function validateFacilityCoordinates(coords: { lat: number; lng: number } | null | undefined): boolean {
  if (!coords) return false;
  if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) return false;
  if (coords.lat < -90 || coords.lat > 90 || coords.lng < -180 || coords.lng > 180) return false;
  return true;
}

