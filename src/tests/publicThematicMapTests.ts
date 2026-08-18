import {
  setPublicInvestmentTestStore,
  resetPublicInvestmentTestStore,
} from '../services/investment/publicInvestmentService';
import {
  calculateDatasetQuantiles,
  generateDynamicLegendRanges,
  transformToPublicThematicResult,
  fetchPublicThematicDataset,
  PublicThematicDatasetResult,
} from '../features/investment-map/services/publicThematicInvestmentService';
import {
  getPublishedProductStatistics,
} from '../features/products/services/productStatisticsService';
import {
  InvestmentDataset,
  InvestmentZoneValue,
  InvestmentSource,
  toPublicDataset,
  toPublicZoneValue,
} from '../types/investment';
import { CANONICAL_ZONE_IDS, CANONICAL_ZONE_METADATA } from '../features/investment-map/constants/canonicalZones';

export interface TestAuditResult {
  id: string;
  category: string;
  name: string;
  passed: boolean;
  message: string;
}

export async function runAllPublicThematicMapTests(): Promise<TestAuditResult[]> {
  const results: TestAuditResult[] = [];

  const record = (id: string, category: string, name: string, passed: boolean, message: string) => {
    results.push({ id, category, name, passed, message });
  };

  const mockSource1: InvestmentSource = {
    sourceId: 'src_oab_2025',
    title: 'Oromia Agricultural Bureau Annual Report 2025/26',
    organization: 'Oromia Agricultural Bureau',
    documentTitle: 'Official Crop Production Statistics 2025/26',
    publicationDate: '2026-01-15',
    url: 'https://oab.gov.et/reports/crop-2025',
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
  // SECTION 1: PUBLIC DATA ELIGIBILITY — HARD GATE
  // =========================================================================

  // Test 1: published + verified -> VISIBLE (PASS)
  try {
    const dsPubVer: InvestmentDataset = {
      datasetId: 'ds_test_pub_ver',
      title: 'Published Verified Coffee',
      category: 'production',
      commodity: 'coffee',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2025/2026', startYear: 2025, endYear: 2026 },
      sourceIds: ['src_oab_2025'],
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
    const vals: InvestmentZoneValue[] = [
      { zoneId: 'jimma', value: 5000, productionVolume: 5000, qualityFlag: 'measured', version: 1, updatedAt: '', updatedBy: '' },
    ];
    setPublicInvestmentTestStore({
      datasets: [dsPubVer],
      values: { [dsPubVer.datasetId]: vals },
      sources: [mockSource1],
    });

    const res = await fetchPublicThematicDataset('coffee', 'production');
    const passed = res !== null && res.dataset.datasetId === 'ds_test_pub_ver';
    record('P3-01', 'Data Eligibility', 'published + verified is VISIBLE on public map', passed,
      passed ? 'Dataset correctly resolved and loaded.' : 'Failed to load published+verified dataset.'
    );
  } catch (err: any) {
    record('P3-01', 'Data Eligibility', 'published + verified is VISIBLE on public map', false, err.message);
  }

  // Test 2: draft + verified -> NOT PUBLIC (BLOCKED)
  try {
    const dsDraftVer: InvestmentDataset = {
      datasetId: 'ds_test_draft_ver',
      title: 'Draft Verified Coffee',
      category: 'production',
      commodity: 'coffee',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2025/2026', startYear: 2025, endYear: 2026 },
      sourceIds: ['src_oab_2025'],
      verificationStatus: 'verified',
      lifecycleStatus: 'draft', // DRAFT
      isCurrent: true,
      version: 1,
      createdAt: '2026-01-10T00:00:00Z',
      createdBy: 'officer_1',
      updatedAt: '2026-01-15T00:00:00Z',
      updatedBy: 'officer_1',
    };
    setPublicInvestmentTestStore({
      datasets: [dsDraftVer],
      values: {},
      sources: [mockSource1],
    });

    const res = await fetchPublicThematicDataset('coffee', 'production');
    const passed = res === null;
    record('P3-02', 'Data Eligibility', 'draft + verified is NOT PUBLIC', passed,
      passed ? 'Correctly rejected draft dataset.' : 'Security leak: draft dataset returned.'
    );
  } catch (err: any) {
    record('P3-02', 'Data Eligibility', 'draft + verified is NOT PUBLIC', false, err.message);
  }

  // Test 3: review + verified -> NOT PUBLIC (BLOCKED)
  try {
    const dsReviewVer: InvestmentDataset = {
      datasetId: 'ds_test_review_ver',
      title: 'Review Verified Coffee',
      category: 'production',
      commodity: 'coffee',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2025/2026', startYear: 2025, endYear: 2026 },
      sourceIds: ['src_oab_2025'],
      verificationStatus: 'verified',
      lifecycleStatus: 'review', // REVIEW
      isCurrent: true,
      version: 1,
      createdAt: '2026-01-10T00:00:00Z',
      createdBy: 'officer_1',
      updatedAt: '2026-01-15T00:00:00Z',
      updatedBy: 'officer_1',
    };
    setPublicInvestmentTestStore({
      datasets: [dsReviewVer],
      values: {},
      sources: [mockSource1],
    });

    const res = await fetchPublicThematicDataset('coffee', 'production');
    const passed = res === null;
    record('P3-03', 'Data Eligibility', 'review + verified is NOT PUBLIC', passed,
      passed ? 'Correctly rejected review dataset.' : 'Security leak: review dataset returned.'
    );
  } catch (err: any) {
    record('P3-03', 'Data Eligibility', 'review + verified is NOT PUBLIC', false, err.message);
  }

  // Test 4: unpublished + verified -> NOT PUBLIC (BLOCKED)
  try {
    const dsUnpubVer: InvestmentDataset = {
      datasetId: 'ds_test_unpub_ver',
      title: 'Unpublished Verified Coffee',
      category: 'production',
      commodity: 'coffee',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2025/2026', startYear: 2025, endYear: 2026 },
      sourceIds: ['src_oab_2025'],
      verificationStatus: 'verified',
      lifecycleStatus: 'unpublished', // UNPUBLISHED
      isCurrent: true,
      version: 1,
      createdAt: '2026-01-10T00:00:00Z',
      createdBy: 'officer_1',
      updatedAt: '2026-01-15T00:00:00Z',
      updatedBy: 'officer_1',
    };
    setPublicInvestmentTestStore({
      datasets: [dsUnpubVer],
      values: {},
      sources: [mockSource1],
    });

    const res = await fetchPublicThematicDataset('coffee', 'production');
    const passed = res === null;
    record('P3-04', 'Data Eligibility', 'unpublished + verified is NOT PUBLIC', passed,
      passed ? 'Correctly rejected unpublished dataset.' : 'Security leak: unpublished dataset returned.'
    );
  } catch (err: any) {
    record('P3-04', 'Data Eligibility', 'unpublished + verified is NOT PUBLIC', false, err.message);
  }

  // Test 5: published + pending -> NOT PUBLIC (BLOCKED)
  try {
    const dsPubPending: InvestmentDataset = {
      datasetId: 'ds_test_pub_pend',
      title: 'Published Pending Coffee',
      category: 'production',
      commodity: 'coffee',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2025/2026', startYear: 2025, endYear: 2026 },
      sourceIds: ['src_oab_2025'],
      verificationStatus: 'pending', // PENDING
      lifecycleStatus: 'published',
      isCurrent: true,
      version: 1,
      createdAt: '2026-01-10T00:00:00Z',
      createdBy: 'officer_1',
      updatedAt: '2026-01-15T00:00:00Z',
      updatedBy: 'officer_1',
    };
    setPublicInvestmentTestStore({
      datasets: [dsPubPending],
      values: {},
      sources: [mockSource1],
    });

    const res = await fetchPublicThematicDataset('coffee', 'production');
    const passed = res === null;
    record('P3-05', 'Data Eligibility', 'published + pending is NOT PUBLIC', passed,
      passed ? 'Correctly rejected unverified dataset.' : 'Security leak: unverified dataset returned.'
    );
  } catch (err: any) {
    record('P3-05', 'Data Eligibility', 'published + pending is NOT PUBLIC', false, err.message);
  }

  // Test 6: published + rejected -> NOT PUBLIC (BLOCKED)
  try {
    const dsPubRejected: InvestmentDataset = {
      datasetId: 'ds_test_pub_rej',
      title: 'Published Rejected Coffee',
      category: 'production',
      commodity: 'coffee',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2025/2026', startYear: 2025, endYear: 2026 },
      sourceIds: ['src_oab_2025'],
      verificationStatus: 'rejected', // REJECTED
      lifecycleStatus: 'published',
      isCurrent: true,
      version: 1,
      createdAt: '2026-01-10T00:00:00Z',
      createdBy: 'officer_1',
      updatedAt: '2026-01-15T00:00:00Z',
      updatedBy: 'officer_1',
    };
    setPublicInvestmentTestStore({
      datasets: [dsPubRejected],
      values: {},
      sources: [mockSource1],
    });

    const res = await fetchPublicThematicDataset('coffee', 'production');
    const passed = res === null;
    record('P3-06', 'Data Eligibility', 'published + rejected is NOT PUBLIC', passed,
      passed ? 'Correctly rejected rejected dataset.' : 'Security leak: rejected dataset returned.'
    );
  } catch (err: any) {
    record('P3-06', 'Data Eligibility', 'published + rejected is NOT PUBLIC', false, err.message);
  }

  // =========================================================================
  // SECTION 2: DETERMINISTIC RECENCY RESOLUTION & ISOLATION
  // =========================================================================

  // Test 7: Latest eligible reference period selected
  try {
    const dsWheat2024: InvestmentDataset = {
      datasetId: 'ds_wheat_2024',
      title: 'Wheat Production 2024',
      category: 'production',
      commodity: 'wheat',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2024', startYear: 2024 },
      sourceIds: ['src_oab_2025'],
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
    const dsWheat2025: InvestmentDataset = {
      datasetId: 'ds_wheat_2025',
      title: 'Wheat Production 2025',
      category: 'production',
      commodity: 'wheat',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2025', startYear: 2025 },
      sourceIds: ['src_oab_2025'],
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
      datasets: [dsWheat2024, dsWheat2025],
      values: {
        [dsWheat2024.datasetId]: [{ zoneId: 'arsi', value: 1000, productionVolume: 1000, qualityFlag: 'measured', version: 1, updatedAt: '', updatedBy: '' }],
        [dsWheat2025.datasetId]: [{ zoneId: 'arsi', value: 3000, productionVolume: 3000, qualityFlag: 'measured', version: 1, updatedAt: '', updatedBy: '' }],
      },
      sources: [mockSource1],
    });

    const res = await fetchPublicThematicDataset('wheat', 'production');
    const passed = res !== null && res.dataset.datasetId === 'ds_wheat_2025' && res.dataset.referencePeriod.startYear === 2025;
    record('P3-07', 'Recency Resolution', 'Deterministically selects latest eligible period', passed,
      passed ? 'Resolved 2025 reference period.' : 'Failed to select latest period.'
    );
  } catch (err: any) {
    record('P3-07', 'Recency Resolution', 'Deterministically selects latest eligible period', false, err.message);
  }

  // Test 8: Newer draft/review dataset ignored
  try {
    const dsMaizePub2024: InvestmentDataset = {
      datasetId: 'ds_maize_pub_2024',
      title: 'Published Maize 2024',
      category: 'production',
      commodity: 'maize',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2024', startYear: 2024 },
      sourceIds: ['src_oab_2025'],
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
    const dsMaizeDraft2026: InvestmentDataset = {
      datasetId: 'ds_maize_draft_2026',
      title: 'Draft Maize 2026',
      category: 'production',
      commodity: 'maize',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2026', startYear: 2026 },
      sourceIds: ['src_oab_2025'],
      verificationStatus: 'pending',
      lifecycleStatus: 'draft',
      isCurrent: false,
      version: 1,
      createdAt: '2026-02-01T00:00:00Z',
      createdBy: 'officer_1',
      updatedAt: '2026-02-01T00:00:00Z',
      updatedBy: 'officer_1',
    };
    setPublicInvestmentTestStore({
      datasets: [dsMaizePub2024, dsMaizeDraft2026],
      values: {
        [dsMaizePub2024.datasetId]: [{ zoneId: 'west_shewa', value: 4000, productionVolume: 4000, qualityFlag: 'measured', version: 1, updatedAt: '', updatedBy: '' }],
        [dsMaizeDraft2026.datasetId]: [{ zoneId: 'west_shewa', value: 99999, productionVolume: 99999, qualityFlag: 'unverified', version: 1, updatedAt: '', updatedBy: '' }],
      },
      sources: [mockSource1],
    });

    const res = await fetchPublicThematicDataset('maize', 'production');
    const passed = res !== null && res.dataset.datasetId === 'ds_maize_pub_2024' && res.annualProduction?.value === 4000;
    record('P3-08', 'Lifecycle Isolation', 'Newer unverified draft is completely ignored', passed,
      passed ? 'Served published 2024 dataset, ignored draft.' : 'Draft leakage detected.'
    );
  } catch (err: any) {
    record('P3-08', 'Lifecycle Isolation', 'Newer unverified draft is completely ignored', false, err.message);
  }

  // =========================================================================
  // SECTION 3: NUMERIC ZERO VALUE vs NULL / MISSING PRESERVATION
  // =========================================================================

  // Test 9: Zero preserved in calculation, total, and ranking
  try {
    const dsZeroCheck: InvestmentDataset = {
      datasetId: 'ds_zero_check',
      title: 'Zero Value Preservation Check',
      category: 'production',
      commodity: 'coffee',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2025', startYear: 2025 },
      sourceIds: ['src_oab_2025'],
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
    // 3 zones: jimma=5000, ilu_aba_bora=0 (measured zero), borena=null (omitted)
    const zeroVals: InvestmentZoneValue[] = [
      { zoneId: 'jimma', value: 5000, productionVolume: 5000, qualityFlag: 'measured', version: 1, updatedAt: '', updatedBy: '' },
      { zoneId: 'ilu_aba_bora', value: 0, productionVolume: 0, qualityFlag: 'measured', version: 1, updatedAt: '', updatedBy: '' },
      { zoneId: 'borena', value: null, productionVolume: null, qualityFlag: 'unverified', version: 1, updatedAt: '', updatedBy: '' },
    ];
    setPublicInvestmentTestStore({
      datasets: [dsZeroCheck],
      values: { [dsZeroCheck.datasetId]: zeroVals },
      sources: [mockSource1],
    });

    const res = await fetchPublicThematicDataset('coffee', 'production');
    const ilu = res?.valuesByZoneId['ilu_aba_bora'];
    const borena = res?.valuesByZoneId['borena'];

    const passed =
      res !== null &&
      res.annualProduction?.value === 5000 &&
      ilu !== undefined &&
      ilu.isNoData === false &&
      ilu.productionVolume === 0 &&
      ilu.thematicClass !== 'no_data' &&
      borena !== undefined &&
      borena.isNoData === true &&
      borena.thematicClass === 'no_data';

    record('P3-09', 'Data Semantics', 'Zero preserved as valid measurement, null as No Data', passed,
      passed ? 'Zero value preserved with active class; null zone marked No Data.' : 'Failed zero/null semantic check.'
    );
  } catch (err: any) {
    record('P3-09', 'Data Semantics', 'Zero preserved as valid measurement, null as No Data', false, err.message);
  }

  // =========================================================================
  // SECTION 4: PRODUCT & MAP PARITY (TOTALS & RANKS)
  // =========================================================================

  // Test 10: Product and Map dataset identity & total equality
  try {
    const dsCoffeeFull: InvestmentDataset = {
      datasetId: 'ds_coffee_full_22',
      title: 'Full 22 Zone Coffee 2025/26',
      category: 'production',
      commodity: 'coffee',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2025/2026', startYear: 2025, endYear: 2026 },
      sourceIds: ['src_oab_2025'],
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
    const fullVals: InvestmentZoneValue[] = CANONICAL_ZONE_IDS.map((zoneId, idx) => ({
      zoneId,
      value: (idx + 1) * 1000,
      productionVolume: (idx + 1) * 1000,
      harvestedAreaHa: (idx + 1) * 500,
      qualityFlag: 'measured',
      version: 1,
      updatedAt: '',
      updatedBy: '',
    }));
    setPublicInvestmentTestStore({
      datasets: [dsCoffeeFull],
      values: { [dsCoffeeFull.datasetId]: fullVals },
      sources: [mockSource1],
    });

    const prodStats = await getPublishedProductStatistics('coffee');
    const mapResult = await fetchPublicThematicDataset('coffee', 'production');

    const passed =
      prodStats !== null &&
      mapResult !== null &&
      prodStats.datasetId === mapResult.dataset.datasetId &&
      prodStats.annualProduction?.value === mapResult.annualProduction?.value &&
      prodStats.cultivatedArea?.value === mapResult.cultivatedArea?.value &&
      prodStats.averageYield?.value === mapResult.averageYield?.value;

    record('P3-10', 'System Parity', 'Product and Map page dataset & totals equality', passed,
      passed
        ? `Both resolved datasetId=${prodStats?.datasetId} with Total Production=${prodStats?.annualProduction?.value} MT.`
        : 'Totals or dataset ID mismatch between Product and Map!'
    );
  } catch (err: any) {
    record('P3-10', 'System Parity', 'Product and Map page dataset & totals equality', false, err.message);
  }

  // Test 11: Zone Rank equality & tie-breaking
  try {
    const dsTieCheck: InvestmentDataset = {
      datasetId: 'ds_tie_check',
      title: 'Tie Breaking Rank Check',
      category: 'production',
      commodity: 'wheat',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2025', startYear: 2025 },
      sourceIds: ['src_oab_2025'],
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
    // bale and arsi have identical 5000 MT. 'arsi' should rank before 'bale' alphabetically.
    const tieVals: InvestmentZoneValue[] = [
      { zoneId: 'bale', value: 5000, productionVolume: 5000, qualityFlag: 'measured', version: 1, updatedAt: '', updatedBy: '' },
      { zoneId: 'arsi', value: 5000, productionVolume: 5000, qualityFlag: 'measured', version: 1, updatedAt: '', updatedBy: '' },
      { zoneId: 'jimma', value: 8000, productionVolume: 8000, qualityFlag: 'measured', version: 1, updatedAt: '', updatedBy: '' },
    ];
    setPublicInvestmentTestStore({
      datasets: [dsTieCheck],
      values: { [dsTieCheck.datasetId]: tieVals },
      sources: [mockSource1],
    });

    const mapResult = await fetchPublicThematicDataset('wheat', 'production');
    const prodStats = await getPublishedProductStatistics('wheat');

    const jimmaRankMap = mapResult?.valuesByZoneId['jimma']?.regionalRank;
    const arsiRankMap = mapResult?.valuesByZoneId['arsi']?.regionalRank;
    const baleRankMap = mapResult?.valuesByZoneId['bale']?.regionalRank;

    const arsiMajor = prodStats?.majorZones.find(z => z.zoneId === 'arsi');
    const baleMajor = prodStats?.majorZones.find(z => z.zoneId === 'bale');

    const passed =
      jimmaRankMap === 1 &&
      arsiRankMap === 2 &&
      baleRankMap === 3 &&
      arsiMajor?.regionalRank === 2 &&
      baleMajor?.regionalRank === 3;

    record('P3-11', 'System Parity', 'Zone Rank consistency and alphabetical tie-breaking', passed,
      passed
        ? 'Jimma=#1, Arsi=#2 (alphabetical tie-break), Bale=#3 matching in Product & Map.'
        : 'Ranking or tie-breaking discrepancy between Product and Map.'
    );
  } catch (err: any) {
    record('P3-11', 'System Parity', 'Zone Rank consistency and alphabetical tie-breaking', false, err.message);
  }

  // =========================================================================
  // SECTION 5: QUANTILE CLASSIFICATION & LEGEND DYNAMICS
  // =========================================================================

  // Test 12: Quantiles with identical/duplicate values & small distribution
  try {
    const q1 = calculateDatasetQuantiles([100, 200, 300, 400, 500]);
    const q2 = calculateDatasetQuantiles([500, 500, 500, 500, 500]);
    const q3 = calculateDatasetQuantiles([10]);

    const ranges1 = generateDynamicLegendRanges('production', 'MT', q1);
    const ranges2 = generateDynamicLegendRanges('suitability', 'Score');

    const passed =
      q1.min === 100 && q1.max === 500 &&
      q2.min === 500 && q2.max === 500 &&
      q3.min === 10 && q3.max === 10 &&
      ranges1.very_high.includes('MT') &&
      ranges2.very_high.includes('80 – 100 Score');

    record('P3-12', 'Quantiles & Legend', 'Quantile calculation robust across edge distributions', passed,
      passed ? 'Handled single-value, uniform, and sequential distributions correctly.' : 'Quantile calculation failed.'
    );
  } catch (err: any) {
    record('P3-12', 'Quantiles & Legend', 'Quantile calculation robust across edge distributions', false, err.message);
  }

  // =========================================================================
  // SECTION 6: METRIC SWITCHING & CONTRACT SAFETY
  // =========================================================================

  // Test 13: Suitability metric applies score boundaries & methodology note
  try {
    const dsSuitability: InvestmentDataset = {
      datasetId: 'ds_coffee_suitability',
      title: 'Coffee Suitability Index 2025',
      category: 'suitability',
      commodity: 'coffee',
      metric: 'suitability',
      unit: 'Score',
      referencePeriod: { type: 'year', label: '2025', startYear: 2025 },
      sourceIds: ['src_oab_2025'],
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
    const suitVals: InvestmentZoneValue[] = [
      { zoneId: 'jimma', value: 92, qualityFlag: 'measured', version: 1, updatedAt: '', updatedBy: '' },
      { zoneId: 'borena', value: 35, qualityFlag: 'measured', version: 1, updatedAt: '', updatedBy: '' },
    ];
    setPublicInvestmentTestStore({
      datasets: [dsSuitability],
      values: { [dsSuitability.datasetId]: suitVals },
      sources: [mockSource1],
    });

    const res = await fetchPublicThematicDataset('coffee', 'suitability');
    const jimma = res?.valuesByZoneId['jimma'];
    const borena = res?.valuesByZoneId['borena'];

    const passed =
      res !== null &&
      res.dataset.metric === 'suitability' &&
      jimma?.thematicClass === 'very_high' &&
      borena?.thematicClass === 'low';

    record('P3-13', 'Metric Transformation', 'Suitability metric maps 0-100 scores to classes', passed,
      passed ? 'Jimma (92) -> very_high, Borena (35) -> low.' : 'Suitability classification failed.'
    );
  } catch (err: any) {
    record('P3-13', 'Metric Transformation', 'Suitability metric maps 0-100 scores to classes', false, err.message);
  }

  // =========================================================================
  // SECTION 7: SECURITY & DTO SANITIZATION
  // =========================================================================

  // Test 14: Public DTO strips private fields
  try {
    const raw: InvestmentDataset = {
      datasetId: 'ds_secret_audit',
      title: 'Secret Internal Notes Test',
      category: 'production',
      commodity: 'coffee',
      metric: 'production',
      unit: 'MT',
      referencePeriod: { type: 'year', label: '2025', startYear: 2025 },
      sourceIds: ['src_oab_2025'],
      verificationStatus: 'verified',
      lifecycleStatus: 'published',
      isCurrent: true,
      version: 9,
      createdAt: '2026-01-10T00:00:00Z',
      createdBy: 'confidential_user_id_xyz',
      updatedAt: '2026-01-15T00:00:00Z',
      updatedBy: 'confidential_reviewer_id_abc',
      publishedAt: '2026-01-15T12:00:00Z',
      publishedBy: 'confidential_admin_id_def',
      notes: 'SECRET RESTRICTED GOVERNMENT AUDIT NOTES',
    };

    const pub = toPublicDataset(raw);
    const hasAdminLeaking =
      'createdBy' in (pub as any) ||
      'updatedBy' in (pub as any) ||
      'publishedBy' in (pub as any) ||
      'notes' in (pub as any) ||
      'version' in (pub as any);

    const passed = pub !== null && !hasAdminLeaking && pub.datasetId === 'ds_secret_audit';
    record('P3-14', 'Security & Sanitization', 'Public DTO strips internal actor IDs, notes, and versions', passed,
      passed ? 'All internal fields stripped safely.' : 'Security leak in public DTO!'
    );
  } catch (err: any) {
    record('P3-14', 'Security & Sanitization', 'Public DTO strips internal actor IDs, notes, and versions', false, err.message);
  }

  // =========================================================================
  // SECTION 8: 22 CANONICAL ZONES & SPECIAL GEOMETRIES
  // =========================================================================

  // Test 15: Exactly 22 Canonical Zone definitions intact
  try {
    const totalCount = CANONICAL_ZONE_IDS.length;
    const hasWestWellega = CANONICAL_ZONE_IDS.includes('west_wellega');
    const hasEastHararghe = CANONICAL_ZONE_IDS.includes('east_hararghe');
    const hasShagerCity = CANONICAL_ZONE_IDS.includes('shager_city');
    const hasEastBorena = CANONICAL_ZONE_IDS.includes('east_borena');

    const passed =
      totalCount === 22 &&
      hasWestWellega &&
      hasEastHararghe &&
      hasShagerCity &&
      hasEastBorena &&
      Object.keys(CANONICAL_ZONE_METADATA).length === 22;

    record('P3-15', 'GIS Geometry Integrity', 'Frozen 22 canonical zones and special geometries verified', passed,
      passed ? '22 zones verified including west_wellega, east_hararghe, shager_city, east_borena.' : 'Canonical zone list corrupted!'
    );
  } catch (err: any) {
    record('P3-15', 'GIS Geometry Integrity', 'Frozen 22 canonical zones and special geometries verified', false, err.message);
  }

  // Test 16: Public shell data provider isolation (allowDemoData = false)
  try {
    // In PublicThematicInvestmentService, fetchPublicThematicDataset always queries verified published store
    resetPublicInvestmentTestStore();
    const emptyResult = await fetchPublicThematicDataset('coffee', 'production');
    const passed = emptyResult === null; // No unverified fallback data returned in public service

    record('P3-16', 'Provider Isolation', 'Public thematic service isolated from unverified demo data', passed,
      passed ? 'Public map queries return null when no verified dataset is published (no demo fallback leak).' : 'Demo data leaked into public service.'
    );
  } catch (err: any) {
    record('P3-16', 'Provider Isolation', 'Public thematic service isolated from unverified demo data', false, err.message);
  }

  resetPublicInvestmentTestStore();
  return results;
}
