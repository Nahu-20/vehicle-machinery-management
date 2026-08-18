import {
  InvestmentFacility,
  PublicInvestmentFacility,
  toPublicFacility,
  InfrastructureCategory,
  LocationPrecision,
  FacilityOperationalStatus,
  InvestmentSource,
} from '../types/investment';
import {
  fetchPublicFacilities,
  fetchPublicFacilitiesByZone,
  fetchPublicFacilitiesByCategory,
  fetchPublicFacilityById,
  fetchPublicFacilitySources,
  setPublicInfrastructureTestStore,
  resetPublicInfrastructureTestStore,
} from '../services/investment/publicInfrastructureService';
import {
  getZoneCentroidPoint,
  validateFacilityCoordinates,
} from '../features/investment-map/services/facilitySpatialService';
import {
  getFacilityColor,
  getFacilityFeatureStyle,
  getPrecisionLabel,
} from '../features/investment-map/services/facilityStyleService';
import {
  CANONICAL_ZONE_IDS,
  CanonicalZoneId,
} from '../features/investment-map/constants/canonicalZones';
import { loadAndValidateOromiaGeoJSON, OFFICIAL_GIS_METADATA } from '../features/investment-map/services/gisLoader';
import Point from 'ol/geom/Point.js';
import Feature from 'ol/Feature.js';
import { fromLonLat } from 'ol/proj.js';

export interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export async function runPublicInfrastructureMapTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const runTest = async (id: string, name: string, fn: () => Promise<void> | void) => {
    const start = performance.now();
    try {
      await fn();
      results.push({
        id,
        name,
        passed: true,
        message: 'PASS',
        durationMs: Math.round(performance.now() - start),
      });
    } catch (err: any) {
      results.push({
        id,
        name,
        passed: false,
        message: `FAIL: ${err?.message || String(err)}`,
        durationMs: Math.round(performance.now() - start),
      });
    }
  };

  // Setup test facilities fixture
  const sampleFacilities: InvestmentFacility[] = [
    {
      facilityId: 'fac_published_exact',
      zoneId: 'jimma',
      category: 'processing',
      title: { en: 'Jimma Agro Industrial Park', om: 'Paarkii Agro Indaastirii Jimmaa', am: 'የጅማ አግሮ ኢንዱስትሪ ፓርክ' },
      description: { en: 'Primary agro-processing facility.' },
      locationPrecision: 'exact',
      coordinates: { lat: 7.67, lng: 36.83 },
      operationalStatus: 'operational',
      lifecycleStatus: 'published',
      verificationStatus: 'verified',
      capacities: [
        { metricKey: 'processing_capacity', numericValue: 50000, unit: 'tonnes' },
      ],
      version: 3,
      sourceIds: ['src_verified_01'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
      publishedAt: '2026-01-15T00:00:00Z',
      verifiedAt: '2026-01-14T00:00:00Z',
      verifiedBy: 'staff_verifier_01',
      createdBy: 'staff_editor_01',
      updatedBy: 'staff_editor_01',
      changeNotes: 'Production ready.',
    } as InvestmentFacility,
    {
      facilityId: 'fac_published_centroid',
      zoneId: 'arsi',
      category: 'warehouse',
      title: { en: 'Asella Regional Grain Silo', om: 'Kuusaa Midhaanii Asallaa', am: 'የአሰላ የእህል ማከማቻ' },
      description: { en: 'Strategic wheat reserve.' },
      locationPrecision: 'zone_centroid',
      coordinates: { lat: 7.95, lng: 39.12 }, // should be stripped to null in public DTO
      operationalStatus: 'operational',
      lifecycleStatus: 'published',
      verificationStatus: 'verified',
      capacities: [
        { metricKey: 'storage_capacity', numericValue: 120000, unit: 'tonnes' },
      ],
      version: 2,
      sourceIds: ['src_verified_01'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-10T00:00:00Z',
      publishedAt: '2026-01-10T00:00:00Z',
      verifiedAt: '2026-01-09T00:00:00Z',
      verifiedBy: 'staff_verifier_01',
      createdBy: 'staff_editor_01',
      updatedBy: 'staff_editor_01',
    },
    {
      facilityId: 'fac_draft_verified',
      zoneId: 'bale',
      category: 'cold_storage',
      title: { en: 'Bale Robe Cold Storage' },
      locationPrecision: 'exact',
      coordinates: { lat: 7.12, lng: 39.99 },
      operationalStatus: 'under_construction',
      lifecycleStatus: 'draft',
      verificationStatus: 'verified',
      capacities: [],
      version: 1,
      sourceIds: ['src_verified_01'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      createdBy: 'staff_editor_01',
      updatedBy: 'staff_editor_01',
    },
    {
      facilityId: 'fac_published_unverified',
      zoneId: 'shager_city',
      category: 'logistics',
      title: { en: 'Dukem Logistics Hub' },
      locationPrecision: 'exact',
      coordinates: { lat: 8.79, lng: 38.90 },
      operationalStatus: 'planned',
      lifecycleStatus: 'published',
      verificationStatus: 'pending',
      capacities: [],
      version: 1,
      sourceIds: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      createdBy: 'staff_editor_01',
      updatedBy: 'staff_editor_01',
    },
    {
      facilityId: 'fac_unpublished_verified',
      zoneId: 'west_shewa',
      category: 'electricity',
      title: { en: 'Ambo Power Grid Unit' },
      locationPrecision: 'approximate',
      coordinates: { lat: 8.98, lng: 37.85 },
      operationalStatus: 'operational',
      lifecycleStatus: 'unpublished',
      verificationStatus: 'verified',
      capacities: [],
      version: 2,
      sourceIds: ['src_verified_01'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
      createdBy: 'staff_editor_01',
      updatedBy: 'staff_editor_01',
    },
  ];

  const sampleSources: InvestmentSource[] = [
    {
      sourceId: 'src_verified_01',
      title: 'Oromia Investment Commission Official Gazette 2026',
      organization: 'Oromia Investment Commission',
      url: 'https://oic.gov.et/reports/2026',
      verificationStatus: 'verified',
      status: 'published',
      version: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      createdBy: 'staff_editor_01',
      updatedBy: 'staff_editor_01',
    },
  ];

  setPublicInfrastructureTestStore({
    facilities: sampleFacilities,
    sources: sampleSources,
  });

  // Test 1: Public Visibility Gate
  await runTest(
    '#PUB-INFRA-01',
    '[Public Visibility Gate] Only published + verified facilities are returned to public map',
    async () => {
      const publicFacilities = await fetchPublicFacilities();
      if (publicFacilities.length !== 2) {
        throw new Error(`Expected exactly 2 eligible facilities, received ${publicFacilities.length}`);
      }

      const ids = publicFacilities.map((f) => f.facilityId);
      if (!ids.includes('fac_published_exact') || !ids.includes('fac_published_centroid')) {
        throw new Error(`Missing expected published+verified facilities: ${ids.join(', ')}`);
      }

      if (ids.includes('fac_draft_verified')) {
        throw new Error('Draft facility leaked into public facility list');
      }
      if (ids.includes('fac_published_unverified')) {
        throw new Error('Unverified published facility leaked into public facility list');
      }
      if (ids.includes('fac_unpublished_verified')) {
        throw new Error('Unpublished facility leaked into public facility list');
      }
    }
  );

  // Test 2: Public DTO Sanitization & Privacy
  await runTest(
    '#PUB-INFRA-02',
    '[Data Privacy] Internal staff metadata, versions, and zone_centroid coordinates stripped',
    async () => {
      const exactFac = await fetchPublicFacilityById('fac_published_exact');
      if (!exactFac) throw new Error('Failed to fetch exact facility');

      // Check stripped fields
      if ((exactFac as any).createdBy || (exactFac as any).verifiedBy || (exactFac as any).changeNotes || (exactFac as any).version) {
        throw new Error('Sensitive internal audit fields present on public facility DTO');
      }
      if (!exactFac.coordinates || exactFac.coordinates.lat !== 7.67) {
        throw new Error('Exact facility coordinates were unexpectedly stripped');
      }

      const centroidFac = await fetchPublicFacilityById('fac_published_centroid');
      if (!centroidFac) throw new Error('Failed to fetch centroid facility');

      if (centroidFac.coordinates !== null) {
        throw new Error('Coordinates for zone_centroid facility must be stripped to null in public DTO');
      }
      if (centroidFac.locationPrecision !== 'zone_centroid') {
        throw new Error(`Expected locationPrecision 'zone_centroid', got ${centroidFac.locationPrecision}`);
      }
    }
  );

  // Test 3: Zone-Centroid Spatial Fallback Generation
  await runTest(
    '#PUB-INFRA-03',
    '[Spatial Calculation] Representative centroid calculated safely for zone_centroid precision',
    async () => {
      const gis = await loadAndValidateOromiaGeoJSON();
      if (!gis.isValid || !gis.data) throw new Error('GIS dataset not valid');

      const centroid = getZoneCentroidPoint('arsi', gis.data);
      if (!centroid) throw new Error('Failed to calculate centroid for Arsi zone');

      if (!Number.isFinite(centroid.lat) || !Number.isFinite(centroid.lng)) {
        throw new Error('Centroid coordinates are not finite numbers');
      }

      // Check bounds roughly in Ethiopia/Oromia
      if (centroid.lat < 3 || centroid.lat > 15 || centroid.lng < 33 || centroid.lng > 48) {
        throw new Error(`Centroid out of bounds: lat=${centroid.lat}, lng=${centroid.lng}`);
      }
    }
  );

  // Test 4: Category Filtering & Styling Contract
  await runTest(
    '#PUB-INFRA-04',
    '[Category & Styling] Category colors and OpenLayers feature styling generated accurately',
    async () => {
      const categories: InfrastructureCategory[] = [
        'processing',
        'warehouse',
        'cold_storage',
        'electricity',
        'logistics',
        'irrigation',
      ];

      for (const cat of categories) {
        const color = getFacilityColor(cat);
        if (!color || !color.startsWith('#')) {
          throw new Error(`Invalid category color for ${cat}: ${color}`);
        }
      }

      // Test OpenLayers feature styling
      const olPoint = new Point(fromLonLat([36.83, 7.67]));
      const feature = new Feature({
        geometry: olPoint,
        facilityId: 'fac_published_exact',
        category: 'processing',
        locationPrecision: 'exact',
        title: { en: 'Jimma Park' },
      });

      const styleDefault = getFacilityFeatureStyle(feature, { isSelected: false, isHovered: false, isDark: false });
      if (!styleDefault || styleDefault.length === 0) {
        throw new Error('Failed to generate OpenLayers style for facility feature');
      }

      const styleSelected = getFacilityFeatureStyle(feature, { isSelected: true, isHovered: false, isDark: false });
      if (!styleSelected || styleSelected.length < 2) {
        throw new Error('Selected facility style must contain highlight halo');
      }
    }
  );

  // Test 5: Source Provenance Querying
  await runTest(
    '#PUB-INFRA-05',
    '[Provenance] Verified source metadata accessible on public facility detail card',
    async () => {
      const sources = await fetchPublicFacilitySources(['src_verified_01']);
      if (sources.length !== 1) {
        throw new Error(`Expected 1 public verified source, got ${sources.length}`);
      }
      if (sources[0].sourceId !== 'src_verified_01') {
        throw new Error(`Unexpected sourceId: ${sources[0].sourceId}`);
      }
      if ((sources[0] as any).verifiedBy || (sources[0] as any).internalNotes) {
        throw new Error('Source DTO contains private staff metadata');
      }
    }
  );

  // Test 6: GIS Geometry Checksum Verification
  await runTest(
    '#PUB-INFRA-06',
    '[GIS Baseline] 22 Canonical Oromia Zones Checksum preserved identically',
    async () => {
      const gis = await loadAndValidateOromiaGeoJSON();
      if (!gis.isValid || !gis.data) throw new Error('Candidate GIS GeoJSON failed validation');
      if (OFFICIAL_GIS_METADATA.runtimeChecksum !== '2fd8286a9608b4b2db04029f51eae3eeeafcea890e06ea2469670102acd4e6f0') {
        throw new Error(`Checksum mismatch! Expected: 2fd8286a9608b4b2db04029f51eae3eeeafcea890e06ea2469670102acd4e6f0, Actual: ${OFFICIAL_GIS_METADATA.runtimeChecksum}`);
      }
      if (gis.data.features.length !== 22) {
        throw new Error(`Expected 22 features, found ${gis.data.features.length}`);
      }
    }
  );

  // Clean up test store
  resetPublicInfrastructureTestStore();

  return results;
}
