import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as turf from '@turf/turf';
import {
  validateFacilityPointInZone,
  findContainingZone,
  getZoneBoundingBox,
  getCanonicalZoneFeature,
  BOUNDARY_TOLERANCE_KM,
} from '../features/investment-map/services/facilitySpatialService';
import {
  CANONICAL_ZONE_IDS,
  CANONICAL_ZONE_METADATA,
  isCanonicalZoneId,
} from '../features/investment-map/constants/canonicalZones';
import { OromiaGeoJSONCollection } from '../features/investment-map/types/gis';

// Load candidate GeoJSON for testing
const geojsonPath = path.resolve(process.cwd(), 'public/data/gis/oromia-zones-candidate.geojson');
const rawData = fs.readFileSync(geojsonPath, 'utf-8');
const candidateGeoJson: OromiaGeoJSONCollection = JSON.parse(rawData);

describe('P4A-2B: Facility Location Spatial Governance & Point-in-Zone Verification', () => {
  it('P4A-2B-1: Candidate GIS Dataset has exactly 22 canonical features matching metadata', () => {
    expect(candidateGeoJson.features.length).toBe(22);
    for (const zid of CANONICAL_ZONE_IDS) {
      const feat = getCanonicalZoneFeature(zid, candidateGeoJson);
      expect(feat).not.toBeNull();
      expect(feat?.properties?.zone_id || feat?.id).toBe(zid);
    }
  });

  it('P4A-2B-2: Validates standard centroid point inside Jimma zone', () => {
    // Jimma town center coordinates: 7.6732 N, 36.8344 E
    const res = validateFacilityPointInZone(36.8344, 7.6732, 'jimma', candidateGeoJson);
    expect(res.isContained).toBe(true);
    expect(res.status).toBe('inside');
    expect(res.selectedZoneId).toBe('jimma');
    expect(res.severity).toBe('success');
    expect(res.distanceToBoundaryKm).toBeGreaterThan(5);
  });

  it('P4A-2B-3: Validates West Wellega MultiPolygon member 1 (main body)', () => {
    // West Wellega main body: ~ 9.5 N, 35.0 E
    const res = validateFacilityPointInZone(35.0, 9.5, 'west_wellega', candidateGeoJson);
    expect(res.isContained).toBe(true);
    expect(res.selectedZoneId).toBe('west_wellega');
  });

  it('P4A-2B-4: Validates West Wellega MultiPolygon member 2 (exclave/disjoint part)', () => {
    // West Wellega second polygon piece: ~ 9.05 N, 36.1 E
    const res = validateFacilityPointInZone(36.1, 9.05, 'west_wellega', candidateGeoJson);
    expect(res.isContained).toBe(true);
    expect(res.selectedZoneId).toBe('west_wellega');
  });

  it('P4A-2B-5: Validates East Hararghe valid territory outside Harar enclave hole', () => {
    // East Hararghe outside Harar: ~ 9.1 N, 41.8 E
    const res = validateFacilityPointInZone(41.8, 9.1, 'east_hararghe', candidateGeoJson);
    expect(res.isContained).toBe(true);
    expect(res.selectedZoneId).toBe('east_hararghe');
  });

  it('P4A-2B-6: Rejects point inside Harar City enclave hole from East Hararghe containment', () => {
    // Harar city center: ~ 9.313 N, 42.128 E (Interior ring hole in East Hararghe polygon)
    const res = validateFacilityPointInZone(42.128, 9.313, 'east_hararghe', candidateGeoJson);
    expect(res.isContained).toBe(false);
    expect(res.status).toBe('outside');
    expect(res.severity).toBe('warning');
    expect(res.distanceToBoundaryKm).toBeGreaterThan(1);
  });

  it('P4A-2B-7: Validates Shager City territory outside Addis Ababa enclave hole', () => {
    // Shager City valid polygon territory: ~ 8.9 N, 38.65 E
    const res = validateFacilityPointInZone(38.65, 8.9, 'shager_city', candidateGeoJson);
    expect(res.isContained).toBe(true);
    expect(res.selectedZoneId).toBe('shager_city');
  });

  it('P4A-2B-8: Rejects point inside Addis Ababa enclave hole from Shager City containment', () => {
    // Addis Ababa city center: ~ 9.0222 N, 38.7578 E (Interior ring hole in Shager City polygon)
    const res = validateFacilityPointInZone(38.7578, 9.0222, 'shager_city', candidateGeoJson);
    expect(res.isContained).toBe(false);
    expect(res.status).toBe('outside');
    expect(res.severity).toBe('warning');
    expect(res.distanceToBoundaryKm).toBeGreaterThan(1);
  });

  it('P4A-2B-9: Validates newly recognized canonical zone East Borena (ET0422)', () => {
    // East Borena: ~ 4.8 N, 39.5 E
    const res = validateFacilityPointInZone(39.5, 4.8, 'east_borena', candidateGeoJson);
    expect(res.isContained).toBe(true);
    expect(res.selectedZoneId).toBe('east_borena');
  });

  it('P4A-2B-10: Accurately detects containing zone when point is placed in a different zone', () => {
    // Point in Ilu Aba Bora (35.5 N, 8.2 E) tested against Jimma
    const res = validateFacilityPointInZone(35.5, 8.2, 'jimma', candidateGeoJson);
    expect(res.isContained).toBe(false);
    expect(res.status).toBe('outside');
    expect(res.detectedZoneId).toBe('ilu_aba_bora');
    expect(res.detectedZoneDisplayName).toContain('Ilu Aba Bora');
  });

  it('P4A-2B-11: Handles boundary proximity threshold correctly (0.5 km)', () => {
    expect(BOUNDARY_TOLERANCE_KM).toBe(0.5);

    // Pick a point right on the outer boundary of East Shewa
    const feat = getCanonicalZoneFeature('east_shewa', candidateGeoJson);
    expect(feat).not.toBeNull();
    const coord = (feat!.geometry as any).coordinates[0][0]; // [lng, lat] on boundary
    const onBoundaryRes = validateFacilityPointInZone(coord[0], coord[1], 'east_shewa', candidateGeoJson);
    expect(onBoundaryRes.distanceToBoundaryKm).toBeLessThanOrEqual(0.1);
    expect(['boundary', 'near_boundary', 'inside']).toContain(onBoundaryRes.status);
  });

  it('P4A-2B-12: Handles missing / null / NaN coordinates safely without errors', () => {
    const resNull = validateFacilityPointInZone(null, null, 'jimma', candidateGeoJson);
    expect(resNull.isContained).toBe(false);
    expect(resNull.status).toBe('no_gis_data');

    const resUndef = validateFacilityPointInZone(undefined, undefined, 'jimma', candidateGeoJson);
    expect(resUndef.isContained).toBe(false);
    expect(resUndef.status).toBe('no_gis_data');

    const resNan = validateFacilityPointInZone(NaN, NaN, 'jimma', candidateGeoJson);
    expect(resNan.isContained).toBe(false);
    expect(resNan.status).toBe('no_gis_data');
  });

  it('P4A-2B-13: Computes zone bounding box accurately for map fitting across all 22 zones', () => {
    for (const zid of CANONICAL_ZONE_IDS) {
      const bbox = getZoneBoundingBox(zid, candidateGeoJson);
      expect(bbox).not.toBeNull();
      if (bbox) {
        const [minLng, minLat, maxLng, maxLat] = bbox;
        expect(minLng).toBeLessThan(maxLng);
        expect(minLat).toBeLessThan(maxLat);
        // Oromia is located roughly between 33E-43E and 3N-11N
        expect(minLng).toBeGreaterThan(33);
        expect(maxLng).toBeLessThan(44);
        expect(minLat).toBeGreaterThan(3);
        expect(maxLat).toBeLessThan(12);
      }
    }
  });

  it('P4A-2B-14: Canonical zone metadata includes all 22 zones with display names and pcodes', () => {
    expect(CANONICAL_ZONE_IDS.length).toBe(22);
    for (const id of CANONICAL_ZONE_IDS) {
      const meta = CANONICAL_ZONE_METADATA[id];
      expect(meta).toBeDefined();
      expect(meta.zoneId).toBe(id);
      expect(meta.displayName.length).toBeGreaterThan(0);
      expect(meta.pcode.startsWith('ET04')).toBe(true);
      expect(isCanonicalZoneId(id)).toBe(true);
    }
  });

  it('P4A-2B-15: findContainingZone correctly resolves points across multiple zones', () => {
    // Point in Arsi (39.0 N, 7.5 E)
    const arsiMatch = findContainingZone(39.0, 7.5, candidateGeoJson);
    expect(arsiMatch).not.toBeNull();
    expect(arsiMatch?.zoneId).toBe('arsi');

    // Point in Bale (40.5 N, 6.5 E)
    const baleMatch = findContainingZone(40.5, 6.5, candidateGeoJson);
    expect(baleMatch).not.toBeNull();
    expect(baleMatch?.zoneId).toBe('bale');

    // Point in Borena (38.30 N, 4.92 E)
    const borenaMatch = findContainingZone(38.30, 4.92, candidateGeoJson);
    expect(borenaMatch).not.toBeNull();
    expect(borenaMatch?.zoneId).toBe('borena');
  });
});
