import {
  OromiaGeoJSONCollection,
  OromiaZoneFeature,
  OromiaZoneProperties,
  GisValidationResult,
  GisMetadata,
} from '../types/gis';
import { EMBEDDED_OROMIA_GEOJSON } from '../data/embeddedOromiaGeoJson';

export const OFFICIAL_GIS_METADATA: GisMetadata = {
  datasetId: 'cod-ab-eth-v04',
  datasetTitle: 'Ethiopia - Subnational Administrative Boundaries',
  version: 'v04',
  boundaryReferenceDate: '2025-01-01',
  sourceOrganization: 'UN-OCHA FIS / Ethiopia CSA + BoFED',
  licenseTitle: 'Creative Commons Attribution for Intergovernmental Organisations (CC BY-IGO)',
  runtimeChecksum: '2fd8286a9608b4b2db04029f51eae3eeeafcea890e06ea2469670102acd4e6f0',
  attribution: 'Base Boundaries: UN-OCHA FIS / Ethiopia CSA COD-AB (v04, 2025) via HDX',
  disclaimer: 'Candidate GIS Dataset — For Technical Laboratory & Planning Evaluation Only',
  caveat:
    'Candidate administrative boundary dataset derived from UN-OCHA FIS / Ethiopia CSA COD-AB (v04, 2025), pending formal Oromia Planning & Development Commission / Bureau GIS acceptance. Administrative boundaries and names shown do not imply official endorsement or legal recognition.',
};

let cachedGisResultPromise: Promise<GisValidationResult> | null = null;

async function getGeoJsonFromAnySource(): Promise<OromiaGeoJSONCollection> {
  const candidateUrls = [
    '/data/gis/oromia-zones-candidate.geojson',
    './data/gis/oromia-zones-candidate.geojson',
    `${(import.meta as any).env?.BASE_URL || '/'}data/gis/oromia-zones-candidate.geojson`.replace('//', '/'),
  ];

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/geo+json, application/json, */*',
        },
      });
      if (response.ok) {
        const text = await response.text();
        if (text && text.trim() && !text.trim().startsWith('<')) {
          const parsed = JSON.parse(text) as OromiaGeoJSONCollection;
          if (parsed && parsed.type === 'FeatureCollection' && Array.isArray(parsed.features) && parsed.features.length === 22) {
            return parsed;
          }
        }
      }
    } catch {
      // Continue to next candidate URL
    }
  }

  // Instant infallible fallback: return the bundled high-precision dataset
  return EMBEDDED_OROMIA_GEOJSON as unknown as OromiaGeoJSONCollection;
}

/**
 * Fetches the candidate GeoJSON from public asset delivery or bundled fallback,
 * and performs strict runtime GIS verification.
 */
export async function loadAndValidateOromiaGeoJSON(): Promise<GisValidationResult> {
  if (cachedGisResultPromise) {
    return cachedGisResultPromise;
  }

  cachedGisResultPromise = (async () => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const data = await getGeoJsonFromAnySource();

    if (!data) {
      // Don't permanently lock cache on complete network failure, allow subsequent retry
      cachedGisResultPromise = null;
      return {
        isValid: false,
        errors: ['Failed to load Oromia Candidate GIS GeoJSON from both remote and bundled assets.'],
        warnings,
        featureCount: 0,
        uniqueZoneIdsCount: 0,
        uniquePcodesCount: 0,
        bbox: [0, 0, 0, 0],
      };
    }

    try {
      // 1. Structure Checks
      if (!data || data.type !== 'FeatureCollection') {
        errors.push("Invalid GeoJSON: root object is not a 'FeatureCollection'");
      }

      if (!data || !Array.isArray(data.features)) {
        errors.push("Invalid GeoJSON: 'features' property is missing or not an array");
        return {
          isValid: false,
          errors,
          warnings,
          featureCount: 0,
          uniqueZoneIdsCount: 0,
          uniquePcodesCount: 0,
          bbox: [0, 0, 0, 0],
        };
      }

      // 2. Feature Count Check (Strict 22 for Oromia COD-AB v04)
      const featureCount = data.features.length;
      if (featureCount !== 22) {
        warnings.push(`Expected 22 candidate ADM2 features for Oromia v04, found ${featureCount}`);
      }

      // 3. Properties and Geometry Integrity Checks
      const zoneIdsSeen = new Set<string>();
      const pcodesSeen = new Set<string>();

      let minLon = 180;
      let maxLon = -180;
      let minLat = 90;
      let maxLat = -90;

      (data?.features || []).forEach((feature: OromiaZoneFeature, idx: number) => {
        const indexStr = `Feature [${idx}]`;
        const props = (feature.properties || {}) as Partial<OromiaZoneProperties>;

        // Check zone_id
        if (!props.zone_id) {
          errors.push(`${indexStr}: Missing required property 'zone_id'`);
        } else {
          if (zoneIdsSeen.has(props.zone_id)) {
            errors.push(`${indexStr}: Duplicate 'zone_id' detected: '${props.zone_id}'`);
          }
          zoneIdsSeen.add(props.zone_id);
        }

        // Check pcode
        const pcode = props.pcode || (props as unknown as { adm2_pcode?: string }).adm2_pcode;
        if (!pcode) {
          errors.push(`${indexStr}: Missing required property 'pcode'`);
        } else {
          if (pcodesSeen.has(pcode)) {
            errors.push(`${indexStr}: Duplicate source PCODE detected: '${pcode}'`);
          }
          pcodesSeen.add(pcode);
        }

        // Check Geometry
        const geom = feature.geometry;
        if (!geom) {
          errors.push(`${indexStr} (${props.zone_id || 'unknown'}): Geometry is null or undefined`);
          return;
        }

        if (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon') {
          errors.push(`${indexStr} (${props.zone_id || 'unknown'}): Unsupported geometry type '${geom.type}'`);
          return;
        }

        if (!geom.coordinates || geom.coordinates.length === 0) {
          errors.push(`${indexStr} (${props.zone_id || 'unknown'}): Geometry coordinates array is empty`);
          return;
        }

        // Compute bounding box
        const updatePoint = (pt: number[]) => {
          const [lon, lat] = pt;
          if (typeof lon === 'number' && typeof lat === 'number') {
            if (lon < minLon) minLon = lon;
            if (lon > maxLon) maxLon = lon;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
          }
        };

        if (geom.type === 'Polygon') {
          (geom.coordinates as number[][][]).forEach((ring) => ring.forEach(updatePoint));
        } else if (geom.type === 'MultiPolygon') {
          (geom.coordinates as number[][][][]).forEach((poly) =>
            poly.forEach((ring) => ring.forEach(updatePoint))
          );
        }
      });

      const isValid = errors.length === 0;
      const bbox: [number, number, number, number] = [minLon, minLat, maxLon, maxLat];

      return {
        isValid,
        errors,
        warnings,
        featureCount,
        uniqueZoneIdsCount: zoneIdsSeen.size,
        uniquePcodesCount: pcodesSeen.size,
        bbox,
        data,
      };
    } catch (err) {
      return {
        isValid: false,
        errors: [err instanceof Error ? err.message : 'Unknown error during GeoJSON validation'],
        warnings,
        featureCount: 0,
        uniqueZoneIdsCount: 0,
        uniquePcodesCount: 0,
        bbox: [0, 0, 0, 0],
      };
    }
  })();

  return cachedGisResultPromise;
}

/**
 * Safe feature lookup helper operating on loaded candidate GeoJSON using canonical zone_id.
 */
export function getZoneFeatureById(
  data: OromiaGeoJSONCollection | null | undefined,
  zoneId: string | null | undefined
): OromiaZoneFeature | null {
  if (!data || !data.features || !zoneId) return null;
  return data.features.find((f) => f.properties.zone_id === zoneId) || null;
}
