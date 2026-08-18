import {
  setPublicInvestmentTestStore,
  resetPublicInvestmentTestStore,
  compareDatasetRecency,
} from '../services/investment/publicInvestmentService';
import {
  getPublishedProductStatistics,
  calculateProductStatisticsFromDataset,
  convertProductionToTonnes,
  isEligibleDataset,
} from '../features/products/services/productStatisticsService';
import {
  InvestmentDataset,
  InvestmentZoneValue,
  InvestmentSource,
  PublicInvestmentDataset,
  PublicInvestmentZoneValue,
  toPublicDataset,
  toPublicZoneValue,
} from '../types/investment';
import { CANONICAL_ZONE_IDS, CanonicalZoneId } from '../features/investment-map/constants/canonicalZones';

export interface TestCaseResult {
  id: string;
  name: string;
  passed: boolean;
  message: string;
}

export async function runAllProductStatisticsAdapterTests(): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  const recordResult = (id: string, name: string, passed: boolean, message: string) => {
    results.push({ id, name, passed, message });
  };

  // Helper to build test sources
  const mockSource1: InvestmentSource = {
    sourceId: 'src_moa_2025',
    title: 'National Crop Assessment 2025/26',
    organization: 'Ministry of Agriculture',
    documentTitle: 'Annual Agricultural Sample Survey 2025/26',
    publicationDate: '2026-01-15',
    url: 'https://moa.gov.et/reports/crop-2025',
    license: 'Open Government Data License',
    verificationStatus: 'verified',
    status: 'published',
    version: 1,
    createdAt: '2026-01-10T10:00:00Z',
    createdBy: 'admin_1',
    updatedAt: '2026-01-15T12:00:00Z',
    updatedBy: 'reviewer_1',
  };

  // =========================================================================
  // TEST 1: Full-Coverage Published & Verified Commodity Dataset (All 22 Zones)
  // =========================================================================
  try {
    const dsCoffee2025: InvestmentDataset = {
      datasetId: 'ds_coffee_2025_prod',
      title: 'Oromia Coffee Production 2025/26',
      category: 'production',
      commodity: 'coffee',
      metric: 'production',
      unit: 'MT',
      referencePeriod: {
        type: 'year',
        label: '2025/2026',
        startYear: 2025,
        endYear: 2026,
      },
      sourceIds: ['src_moa_2025'],
      verificationStatus: 'verified',
      lifecycleStatus: 'published',
      isCurrent: true,
      version: 1,
      createdAt: '2026-01-10T00:00:00Z',
      createdBy: 'officer_1',
      updatedAt: '2026-01-15T00:00:00Z',
      updatedBy: 'officer_1',
      publishedAt: '2026-01-15T12:00:00Z',
    };

    // Create 22 zone values
    const coffeeValues: InvestmentZoneValue[] = CANONICAL_ZONE_IDS.map((zoneId, idx) => ({
      zoneId,
      value: (idx + 1) * 1000,
      productionVolume: (idx + 1) * 1000,
      productionUnit: 'MT',
      harvestedAreaHa: (idx + 1) * 500,
      yieldValue: 2.0,
      qualityFlag: 'measured',
      version: 1,
      updatedAt: '2026-01-15T00:00:00Z',
      updatedBy: 'officer_1',
    }));

    setPublicInvestmentTestStore({
      datasets: [dsCoffee2025],
      values: { [dsCoffee2025.datasetId]: coffeeValues },
      sources: [mockSource1],
    });

    const stats = await getPublishedProductStatistics('coffee');

    const expectedTotalProd = coffeeValues.reduce((sum, v) => sum + (v.productionVolume ?? 0), 0);
    const expectedTotalArea = coffeeValues.reduce((sum, v) => sum + (v.harvestedAreaHa ?? 0), 0);
    const expectedYield = Math.round((expectedTotalProd / expectedTotalArea) * 100) / 100;

    const pass =
      stats !== null &&
      stats.coverage.isFullCoverage === true &&
      stats.coverage.populatedZoneCount === 22 &&
      stats.coverage.missingZoneCount === 0 &&
      stats.coverage.coveragePercent === 100 &&
      stats.annualProduction?.value === expectedTotalProd &&
      stats.cultivatedArea?.value === expectedTotalArea &&
      stats.averageYield?.value === expectedYield &&
      stats.averageYield?.isDerived === true &&
      stats.majorZones.length === 5 &&
      stats.majorZones[0].productionVolume > stats.majorZones[1].productionVolume &&
      stats.sources.length === 1 &&
      stats.sources[0].organization === 'Ministry of Agriculture';

    recordResult(
      'P2-01',
      'Full-Coverage Verified Dataset Aggregation (22 Zones)',
      pass,
      pass
        ? `Aggregated 22 zones: Prod=${stats?.annualProduction?.value} MT, Area=${stats?.cultivatedArea?.value} ha, Yield=${stats?.averageYield?.value} t/ha.`
        : `Aggregation mismatch or invalid coverage state. Got: ${JSON.stringify(stats?.coverage)}`
    );
  } catch (err: any) {
    recordResult('P2-01', 'Full-Coverage Verified Dataset Aggregation', false, err.message);
  }

  // =========================================================================
  // TEST 2: Partial-Coverage Dataset (e.g. 14 Populated Zones, 8 Missing Zones)
  // =========================================================================
  try {
    const dsWheatPartial: InvestmentDataset = {
      datasetId: 'ds_wheat_2025_partial',
      title: 'Oromia Wheat Production 2025/26 (Highland Sample)',
      category: 'production',
      commodity: 'wheat',
      metric: 'production',
      unit: 'MT',
      referencePeriod: {
        type: 'year',
        label: '2025/2026',
        startYear: 2025,
        endYear: 2026,
      },
      sourceIds: ['src_moa_2025'],
      verificationStatus: 'verified',
      lifecycleStatus: 'published',
      isCurrent: true,
      version: 1,
      createdAt: '2026-01-10T00:00:00Z',
      createdBy: 'officer_1',
      updatedAt: '2026-01-15T00:00:00Z',
      updatedBy: 'officer_1',
      publishedAt: '2026-01-15T12:00:00Z',
    };

    // Only populate 14 zones; 8 zones have null/undefined values
    const wheatValues: InvestmentZoneValue[] = CANONICAL_ZONE_IDS.map((zoneId, idx) => ({
      zoneId,
      value: idx < 14 ? (idx + 1) * 2000 : null,
      productionVolume: idx < 14 ? (idx + 1) * 2000 : null,
      harvestedAreaHa: idx < 14 ? (idx + 1) * 1000 : null,
      qualityFlag: idx < 14 ? 'measured' : 'unverified',
      version: 1,
      updatedAt: '2026-01-15T00:00:00Z',
      updatedBy: 'officer_1',
    }));

    setPublicInvestmentTestStore({
      datasets: [dsWheatPartial],
      values: { [dsWheatPartial.datasetId]: wheatValues },
      sources: [mockSource1],
    });

    const stats = await getPublishedProductStatistics('wheat');

    const expectedTotalProd = wheatValues.slice(0, 14).reduce((sum, v) => sum + (v.productionVolume ?? 0), 0);
    const expectedPopulated = 14;
    const expectedMissing = 8;
    const expectedPercent = Math.round((14 / 22) * 1000) / 10; // 63.6%

    const pass =
      stats !== null &&
      stats.coverage.isFullCoverage === false &&
      stats.coverage.populatedZoneCount === expectedPopulated &&
      stats.coverage.missingZoneCount === expectedMissing &&
      stats.coverage.coveragePercent === expectedPercent &&
      stats.annualProduction?.value === expectedTotalProd &&
      stats.majorZones.length === 5;

    recordResult(
      'P2-02',
      'Partial-Coverage Dataset Aggregation (14 Populated, 8 Missing)',
      pass,
      pass
        ? `Correctly handled partial coverage: ${stats?.coverage.populatedZoneCount}/22 (${stats?.coverage.coveragePercent}%), Prod=${stats?.annualProduction?.value} MT.`
        : `Partial coverage computation failed. Got: ${JSON.stringify(stats?.coverage)}`
    );
  } catch (err: any) {
    recordResult('P2-02', 'Partial-Coverage Dataset Aggregation', false, err.message);
  }

  // =========================================================================
  // TEST 3: No-Eligible-Data Returns Null (Triggers VerifiedDataUnavailable)
  // =========================================================================
  try {
    // Unregistered commodity or commodity with only unverified data
    const dsAvocadoUnverified: InvestmentDataset = {
      datasetId: 'ds_avocado_draft',
      title: 'Draft Avocado Study',
      category: 'production',
      commodity: 'avocado',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2025', startYear: 2025 },
      sourceIds: ['src_moa_2025'],
      verificationStatus: 'pending', // NOT verified
      lifecycleStatus: 'published',
      isCurrent: true,
      version: 1,
      createdAt: '2026-01-10T00:00:00Z',
      createdBy: 'officer_1',
      updatedAt: '2026-01-15T00:00:00Z',
      updatedBy: 'officer_1',
    };

    setPublicInvestmentTestStore({
      datasets: [dsAvocadoUnverified],
      values: {},
      sources: [mockSource1],
    });

    const stats = await getPublishedProductStatistics('avocado');
    const nonexistentStats = await getPublishedProductStatistics('dragonfruit');

    const pass = stats === null && nonexistentStats === null;

    recordResult(
      'P2-03',
      'No-Eligible-Data Policy (Unverified / Missing Returns Null)',
      pass,
      pass
        ? 'Correctly returned null for pending/unverified datasets and non-existent commodities.'
        : 'Failed to return null for unverified or missing commodity data.'
    );
  } catch (err: any) {
    recordResult('P2-03', 'No-Eligible-Data Policy', false, err.message);
  }

  // =========================================================================
  // TEST 4: Numeric Zero Value Handling vs Null/Missing
  // =========================================================================
  try {
    const dsZeroTest: InvestmentDataset = {
      datasetId: 'ds_sesame_2025',
      title: 'Sesame Production with Arid Zones',
      category: 'production',
      commodity: 'sesame',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2025', startYear: 2025 },
      sourceIds: ['src_moa_2025'],
      verificationStatus: 'verified',
      lifecycleStatus: 'published',
      isCurrent: true,
      version: 1,
      createdAt: '2026-01-10T00:00:00Z',
      createdBy: 'officer_1',
      updatedAt: '2026-01-15T00:00:00Z',
      updatedBy: 'officer_1',
      publishedAt: '2026-01-15T12:00:00Z',
    };

    // 10 zones with valid production, 5 zones with numeric 0 (measured no production), 7 zones null (unmeasured)
    const sesameValues: InvestmentZoneValue[] = CANONICAL_ZONE_IDS.map((zoneId, idx) => {
      let prod: number | null = null;
      let area: number | null = null;
      if (idx < 10) {
        prod = (idx + 1) * 500;
        area = (idx + 1) * 250;
      } else if (idx < 15) {
        prod = 0; // Numeric zero: measured 0 production
        area = 0;
      }
      return {
        zoneId,
        value: prod,
        productionVolume: prod,
        harvestedAreaHa: area,
        qualityFlag: prod !== null ? 'measured' : 'unverified',
        version: 1,
        updatedAt: '2026-01-15T00:00:00Z',
        updatedBy: 'officer_1',
      };
    });

    setPublicInvestmentTestStore({
      datasets: [dsZeroTest],
      values: { [dsZeroTest.datasetId]: sesameValues },
      sources: [mockSource1],
    });

    const stats = await getPublishedProductStatistics('sesame');

    // 10 positive + 5 zero = 15 populated zones. Missing = 7 zones.
    const pass =
      stats !== null &&
      stats.coverage.populatedZoneCount === 15 &&
      stats.coverage.missingZoneCount === 7 &&
      stats.annualProduction?.value === 27500; // sum(1..10 * 500) = 55 * 500 = 27500

    recordResult(
      'P2-04',
      'Numeric Zero Value vs Null Discrimination',
      pass,
      pass
        ? `Correctly counted 0 as populated (15 populated / 7 missing, Total=${stats?.annualProduction?.value} MT).`
        : `Zero handling failed. Populated count=${stats?.coverage.populatedZoneCount}, Total=${stats?.annualProduction?.value}`
    );
  } catch (err: any) {
    recordResult('P2-04', 'Numeric Zero Value Discrimination', false, err.message);
  }

  // =========================================================================
  // TEST 5: Deterministic Current Dataset Selection Policy (Recency & Period)
  // =========================================================================
  try {
    const dsMaize2024: InvestmentDataset = {
      datasetId: 'ds_maize_2024',
      title: 'Maize Production 2024/25',
      category: 'production',
      commodity: 'maize',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2024/2025', startYear: 2024, endYear: 2025 },
      sourceIds: ['src_moa_2025'],
      verificationStatus: 'verified',
      lifecycleStatus: 'published',
      isCurrent: false,
      version: 1,
      createdAt: '2025-01-10T00:00:00Z',
      createdBy: 'officer_1',
      updatedAt: '2025-01-15T00:00:00Z',
      updatedBy: 'officer_1',
      publishedAt: '2025-01-15T12:00:00Z',
    };

    const dsMaize2025: InvestmentDataset = {
      datasetId: 'ds_maize_2025',
      title: 'Maize Production 2025/26',
      category: 'production',
      commodity: 'maize',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2025/2026', startYear: 2025, endYear: 2026 },
      sourceIds: ['src_moa_2025'],
      verificationStatus: 'verified',
      lifecycleStatus: 'published',
      isCurrent: true,
      version: 1,
      createdAt: '2026-01-10T00:00:00Z',
      createdBy: 'officer_1',
      updatedAt: '2026-01-15T00:00:00Z',
      updatedBy: 'officer_1',
      publishedAt: '2026-01-15T12:00:00Z',
    };

    setPublicInvestmentTestStore({
      datasets: [dsMaize2024, dsMaize2025], // Provided in arbitrary order
      values: {
        [dsMaize2024.datasetId]: [
          { zoneId: 'jimma', value: 1000, productionVolume: 1000, qualityFlag: 'measured', version: 1, updatedAt: '', updatedBy: '' },
        ],
        [dsMaize2025.datasetId]: [
          { zoneId: 'jimma', value: 5000, productionVolume: 5000, qualityFlag: 'measured', version: 1, updatedAt: '', updatedBy: '' },
        ],
      },
      sources: [mockSource1],
    });

    const stats = await getPublishedProductStatistics('maize');

    const pass =
      stats !== null &&
      stats.datasetId === 'ds_maize_2025' &&
      stats.referencePeriod.label === '2025/2026' &&
      stats.annualProduction?.value === 5000;

    recordResult(
      'P2-05',
      'Deterministic Current Dataset Selection (Prefers Latest Reference Period)',
      pass,
      pass
        ? `Deterministically selected 2025/26 dataset (ID=${stats?.datasetId}, Prod=${stats?.annualProduction?.value} MT).`
        : `Failed to select latest period. Got datasetId=${stats?.datasetId}`
    );
  } catch (err: any) {
    recordResult('P2-05', 'Deterministic Current Dataset Selection', false, err.message);
  }

  // =========================================================================
  // TEST 6: Immutability & Lifecycle Isolation (Draft/Review Never Overrides Published)
  // =========================================================================
  try {
    const dsBarleyPublished2024: InvestmentDataset = {
      datasetId: 'ds_barley_2024_pub',
      title: 'Verified Barley Production 2024',
      category: 'production',
      commodity: 'barley',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2024', startYear: 2024 },
      sourceIds: ['src_moa_2025'],
      verificationStatus: 'verified',
      lifecycleStatus: 'published',
      isCurrent: true,
      version: 1,
      createdAt: '2025-01-10T00:00:00Z',
      createdBy: 'officer_1',
      updatedAt: '2025-01-15T00:00:00Z',
      updatedBy: 'officer_1',
      publishedAt: '2025-01-15T12:00:00Z',
    };

    const dsBarleyDraft2026: InvestmentDataset = {
      datasetId: 'ds_barley_2026_draft',
      title: 'Unverified 2026 Draft Barley Forecast',
      category: 'production',
      commodity: 'barley',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2026', startYear: 2026 },
      sourceIds: ['src_moa_2025'],
      verificationStatus: 'pending',
      lifecycleStatus: 'draft', // DRAFT
      isCurrent: false,
      version: 1,
      createdAt: '2026-02-01T00:00:00Z',
      createdBy: 'officer_1',
      updatedAt: '2026-02-01T00:00:00Z',
      updatedBy: 'officer_1',
    };

    setPublicInvestmentTestStore({
      datasets: [dsBarleyPublished2024, dsBarleyDraft2026],
      values: {
        [dsBarleyPublished2024.datasetId]: [
          { zoneId: 'arsi', value: 8000, productionVolume: 8000, qualityFlag: 'measured', version: 1, updatedAt: '', updatedBy: '' },
        ],
        [dsBarleyDraft2026.datasetId]: [
          { zoneId: 'arsi', value: 99999, productionVolume: 99999, qualityFlag: 'unverified', version: 1, updatedAt: '', updatedBy: '' },
        ],
      },
      sources: [mockSource1],
    });

    const stats = await getPublishedProductStatistics('barley');

    const pass =
      stats !== null &&
      stats.datasetId === 'ds_barley_2024_pub' &&
      stats.annualProduction?.value === 8000;

    recordResult(
      'P2-06',
      'Lifecycle Isolation (Draft/Review Datasets Strictly Excluded)',
      pass,
      pass
        ? `Safely served published dataset (${stats?.datasetId}) and ignored newer draft.`
        : `Draft leakage detected! Selected: ${stats?.datasetId}`
    );
  } catch (err: any) {
    recordResult('P2-06', 'Lifecycle Isolation', false, err.message);
  }

  // =========================================================================
  // TEST 7: Weighted Yield Calculation & Unit Conversions (Quintals to Tonnes)
  // =========================================================================
  try {
    const dsTeffQuintals: InvestmentDataset = {
      datasetId: 'ds_teff_quintals',
      title: 'Teff Production in Quintals',
      category: 'production',
      commodity: 'teff',
      metric: 'production',
      unit: 'quintal', // Quintals unit
      referencePeriod: { type: 'year', label: '2025', startYear: 2025 },
      sourceIds: ['src_moa_2025'],
      verificationStatus: 'verified',
      lifecycleStatus: 'published',
      isCurrent: true,
      version: 1,
      createdAt: '2026-01-10T00:00:00Z',
      createdBy: 'officer_1',
      updatedAt: '2026-01-15T00:00:00Z',
      updatedBy: 'officer_1',
      publishedAt: '2026-01-15T12:00:00Z',
    };

    // 100,000 quintals (= 10,000 MT) produced on 5,000 ha -> Yield = 2.0 t/ha
    const teffValues: InvestmentZoneValue[] = [
      {
        zoneId: 'east_shewa',
        value: 100000,
        productionVolume: 100000,
        harvestedAreaHa: 5000,
        qualityFlag: 'measured',
        version: 1,
        updatedAt: '',
        updatedBy: '',
      },
    ];

    setPublicInvestmentTestStore({
      datasets: [dsTeffQuintals],
      values: { [dsTeffQuintals.datasetId]: teffValues },
      sources: [mockSource1],
    });

    const stats = await getPublishedProductStatistics('teff');

    const pass =
      stats !== null &&
      stats.annualProduction?.value === 100000 &&
      stats.annualProduction?.unit === 'quintal' &&
      stats.cultivatedArea?.value === 5000 &&
      stats.averageYield?.value === 2.0 &&
      stats.averageYield?.unit === 't/ha' &&
      stats.averageYield?.isDerived === true;

    recordResult(
      'P2-07',
      'Weighted Yield Derivation with Unit Conversion (Quintals -> t/ha)',
      pass,
      pass
        ? `Derived correct weighted yield of ${stats?.averageYield?.value} t/ha from ${stats?.annualProduction?.value} quintals / ${stats?.cultivatedArea?.value} ha.`
        : `Yield conversion failed. Got: ${JSON.stringify(stats?.averageYield)}`
    );
  } catch (err: any) {
    recordResult('P2-07', 'Weighted Yield Derivation', false, err.message);
  }

  // =========================================================================
  // TEST 8: Public DTO Sanitization (No Private/Admin Fields Leaked)
  // =========================================================================
  try {
    const rawDataset: InvestmentDataset = {
      datasetId: 'ds_sanitization_check',
      title: 'Sanitization Check Dataset',
      category: 'production',
      commodity: 'soybean',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2025', startYear: 2025 },
      sourceIds: ['src_moa_2025'],
      verificationStatus: 'verified',
      lifecycleStatus: 'published',
      isCurrent: true,
      version: 4,
      createdAt: '2026-01-01T00:00:00Z',
      createdBy: 'admin_private_uid_123',
      updatedAt: '2026-01-15T00:00:00Z',
      updatedBy: 'admin_private_uid_456',
      publishedAt: '2026-01-15T12:00:00Z',
      publishedBy: 'admin_private_uid_789',
      notes: 'CONFIDENTIAL INTERNAL GOVERNMENT AUDIT NOTES',
    };

    const publicDs = toPublicDataset(rawDataset);

    // Verify admin fields are completely absent
    const hasAdminFields =
      'createdBy' in (publicDs as any) ||
      'updatedBy' in (publicDs as any) ||
      'publishedBy' in (publicDs as any) ||
      'notes' in (publicDs as any) ||
      'version' in (publicDs as any);

    const pass = publicDs !== null && !hasAdminFields && publicDs.datasetId === 'ds_sanitization_check';

    recordResult(
      'P2-08',
      'Public DTO Security & Sanitization',
      pass,
      pass
        ? 'Successfully stripped all internal admin and audit fields from public dataset DTO.'
        : 'Sanitization leak detected in public DTO!'
    );
  } catch (err: any) {
    recordResult('P2-08', 'Public DTO Sanitization', false, err.message);
  }

  // Reset test store after tests
  resetPublicInvestmentTestStore();

  return results;
}
