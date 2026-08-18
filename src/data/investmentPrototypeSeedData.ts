/**
 * Investment CMS prototype seed — source-attributed zone statistics for public map choropleths.
 *
 * These figures are ZONE-LEVEL PROTOTYPE ESTIMATES compiled for the Oromia Agriculture Bureau
 * Investment map. They are aligned with known Meher crop geography (coffee belt, Arsi–Bale wheat,
 * western maize) and CSA Agricultural Sample Survey regional patterns, but they are NOT a
 * verbatim extract of a single published CSA ADM2 table.
 *
 * qualityFlag on every value row is `estimated`. Cite the linked sources on the public map.
 */

import { CANONICAL_ZONE_IDS, CanonicalZoneId } from '../features/investment-map/constants/canonicalZones';

export const PROTOTYPE_SEED_VERSION = '2025.1-prototype';
export const PROTOTYPE_REFERENCE_PERIOD = {
  type: 'fiscal_year' as const,
  label: 'Meher 2024/2025',
  startYear: 2024,
  endYear: 2025,
  seasonName: 'Meher',
};

export const PROTOTYPE_SOURCE_IDS = {
  csaAgss: 'src_csa_agss_meher_2024',
  oboaZone: 'src_oboa_zone_estimates_2025',
  compilation: 'src_oab_investment_prototype_2025',
} as const;

export const PROTOTYPE_METHODOLOGY_ID = 'meth_oab_suitability_investment_v1';

export type PrototypeCommodity = 'coffee' | 'wheat' | 'maize';
export type PrototypeMetric = 'production' | 'suitability' | 'investment_potential';

export interface PrototypeZoneProduction {
  volumeMT: number;
  harvestedAreaHa: number;
  yieldPerHa: number;
  trendPercent: number;
}

export interface PrototypeZoneScores {
  suitability: number;
  investmentPotential: number;
}

/** Per-zone prototype estimates for coffee / wheat / maize (all 22 ADM2 zones). */
export const PROTOTYPE_ZONE_STATS: Record<
  CanonicalZoneId,
  Record<PrototypeCommodity, PrototypeZoneProduction & PrototypeZoneScores>
> = {
  jimma: {
    coffee: { volumeMT: 125000, harvestedAreaHa: 142000, yieldPerHa: 0.88, trendPercent: 4.2, suitability: 96, investmentPotential: 94 },
    wheat: { volumeMT: 28000, harvestedAreaHa: 11000, yieldPerHa: 2.55, trendPercent: 1.1, suitability: 58, investmentPotential: 62 },
    maize: { volumeMT: 340000, harvestedAreaHa: 95000, yieldPerHa: 3.58, trendPercent: 5.0, suitability: 92, investmentPotential: 90 },
  },
  ilu_aba_bora: {
    coffee: { volumeMT: 98000, harvestedAreaHa: 115000, yieldPerHa: 0.85, trendPercent: 3.8, suitability: 94, investmentPotential: 88 },
    wheat: { volumeMT: 12000, harvestedAreaHa: 5200, yieldPerHa: 2.31, trendPercent: 0.5, suitability: 45, investmentPotential: 50 },
    maize: { volumeMT: 210000, harvestedAreaHa: 62000, yieldPerHa: 3.38, trendPercent: 2.9, suitability: 85, investmentPotential: 82 },
  },
  west_wellega: {
    coffee: { volumeMT: 84000, harvestedAreaHa: 98000, yieldPerHa: 0.86, trendPercent: 2.1, suitability: 89, investmentPotential: 85 },
    wheat: { volumeMT: 8500, harvestedAreaHa: 3800, yieldPerHa: 2.24, trendPercent: -1.2, suitability: 40, investmentPotential: 42 },
    maize: { volumeMT: 290000, harvestedAreaHa: 81000, yieldPerHa: 3.58, trendPercent: 4.1, suitability: 91, investmentPotential: 87 },
  },
  east_wellega: {
    coffee: { volumeMT: 62000, harvestedAreaHa: 75000, yieldPerHa: 0.83, trendPercent: 1.9, suitability: 82, investmentPotential: 81 },
    wheat: { volumeMT: 32000, harvestedAreaHa: 12500, yieldPerHa: 2.56, trendPercent: 2.4, suitability: 65, investmentPotential: 68 },
    maize: { volumeMT: 380000, harvestedAreaHa: 102000, yieldPerHa: 3.73, trendPercent: 6.2, suitability: 95, investmentPotential: 93 },
  },
  buno_bedele: {
    coffee: { volumeMT: 71000, harvestedAreaHa: 82000, yieldPerHa: 0.87, trendPercent: 3.1, suitability: 91, investmentPotential: 86 },
    wheat: { volumeMT: 15000, harvestedAreaHa: 6100, yieldPerHa: 2.46, trendPercent: 0.8, suitability: 52, investmentPotential: 55 },
    maize: { volumeMT: 195000, harvestedAreaHa: 56000, yieldPerHa: 3.48, trendPercent: 3.0, suitability: 87, investmentPotential: 84 },
  },
  kelem_wellega: {
    coffee: { volumeMT: 54000, harvestedAreaHa: 66000, yieldPerHa: 0.82, trendPercent: 2.0, suitability: 84, investmentPotential: 79 },
    wheat: { volumeMT: 6000, harvestedAreaHa: 2800, yieldPerHa: 2.14, trendPercent: -0.5, suitability: 38, investmentPotential: 40 },
    maize: { volumeMT: 220000, harvestedAreaHa: 64000, yieldPerHa: 3.44, trendPercent: 3.5, suitability: 88, investmentPotential: 83 },
  },
  horo_gudru_wellega: {
    coffee: { volumeMT: 18000, harvestedAreaHa: 24000, yieldPerHa: 0.75, trendPercent: 1.0, suitability: 62, investmentPotential: 60 },
    wheat: { volumeMT: 85000, harvestedAreaHa: 29000, yieldPerHa: 2.93, trendPercent: 4.8, suitability: 78, investmentPotential: 76 },
    maize: { volumeMT: 260000, harvestedAreaHa: 72000, yieldPerHa: 3.61, trendPercent: 4.2, suitability: 89, investmentPotential: 85 },
  },
  arsi: {
    coffee: { volumeMT: 12000, harvestedAreaHa: 16000, yieldPerHa: 0.75, trendPercent: 0.5, suitability: 50, investmentPotential: 55 },
    wheat: { volumeMT: 480000, harvestedAreaHa: 135000, yieldPerHa: 3.56, trendPercent: 7.8, suitability: 98, investmentPotential: 97 },
    maize: { volumeMT: 180000, harvestedAreaHa: 52000, yieldPerHa: 3.46, trendPercent: 2.1, suitability: 72, investmentPotential: 75 },
  },
  west_arsi: {
    coffee: { volumeMT: 22000, harvestedAreaHa: 28000, yieldPerHa: 0.78, trendPercent: 1.2, suitability: 65, investmentPotential: 68 },
    wheat: { volumeMT: 390000, harvestedAreaHa: 112000, yieldPerHa: 3.48, trendPercent: 6.5, suitability: 95, investmentPotential: 94 },
    maize: { volumeMT: 210000, harvestedAreaHa: 58000, yieldPerHa: 3.62, trendPercent: 3.2, suitability: 80, investmentPotential: 82 },
  },
  bale: {
    coffee: { volumeMT: 35000, harvestedAreaHa: 45000, yieldPerHa: 0.77, trendPercent: 2.4, suitability: 74, investmentPotential: 72 },
    wheat: { volumeMT: 420000, harvestedAreaHa: 122000, yieldPerHa: 3.44, trendPercent: 7.1, suitability: 96, investmentPotential: 95 },
    maize: { volumeMT: 95000, harvestedAreaHa: 31000, yieldPerHa: 3.06, trendPercent: 1.8, suitability: 60, investmentPotential: 64 },
  },
  east_bale: {
    coffee: { volumeMT: 8000, harvestedAreaHa: 11000, yieldPerHa: 0.72, trendPercent: 0.4, suitability: 42, investmentPotential: 45 },
    wheat: { volumeMT: 180000, harvestedAreaHa: 62000, yieldPerHa: 2.9, trendPercent: 4.2, suitability: 82, investmentPotential: 80 },
    maize: { volumeMT: 45000, harvestedAreaHa: 16000, yieldPerHa: 2.81, trendPercent: 1.1, suitability: 48, investmentPotential: 50 },
  },
  west_shewa: {
    coffee: { volumeMT: 15000, harvestedAreaHa: 19000, yieldPerHa: 0.78, trendPercent: 0.8, suitability: 55, investmentPotential: 58 },
    wheat: { volumeMT: 310000, harvestedAreaHa: 92000, yieldPerHa: 3.37, trendPercent: 5.4, suitability: 91, investmentPotential: 92 },
    maize: { volumeMT: 280000, harvestedAreaHa: 78000, yieldPerHa: 3.58, trendPercent: 4.8, suitability: 88, investmentPotential: 89 },
  },
  south_west_shewa: {
    coffee: { volumeMT: 21000, harvestedAreaHa: 26000, yieldPerHa: 0.8, trendPercent: 1.5, suitability: 68, investmentPotential: 70 },
    wheat: { volumeMT: 240000, harvestedAreaHa: 74000, yieldPerHa: 3.24, trendPercent: 4.1, suitability: 88, investmentPotential: 87 },
    maize: { volumeMT: 215000, harvestedAreaHa: 61000, yieldPerHa: 3.52, trendPercent: 3.6, suitability: 85, investmentPotential: 86 },
  },
  north_shewa: {
    coffee: { volumeMT: 2000, harvestedAreaHa: 3100, yieldPerHa: 0.64, trendPercent: -0.2, suitability: 25, investmentPotential: 30 },
    wheat: { volumeMT: 265000, harvestedAreaHa: 81000, yieldPerHa: 3.27, trendPercent: 5.0, suitability: 89, investmentPotential: 88 },
    maize: { volumeMT: 110000, harvestedAreaHa: 36000, yieldPerHa: 3.05, trendPercent: 2.0, suitability: 62, investmentPotential: 65 },
  },
  east_shewa: {
    coffee: { volumeMT: 5000, harvestedAreaHa: 6800, yieldPerHa: 0.73, trendPercent: 0.2, suitability: 35, investmentPotential: 45 },
    wheat: { volumeMT: 190000, harvestedAreaHa: 58000, yieldPerHa: 3.27, trendPercent: 4.8, suitability: 82, investmentPotential: 91 },
    maize: { volumeMT: 310000, harvestedAreaHa: 80000, yieldPerHa: 3.87, trendPercent: 5.8, suitability: 90, investmentPotential: 96 },
  },
  west_hararghe: {
    coffee: { volumeMT: 52000, harvestedAreaHa: 68000, yieldPerHa: 0.76, trendPercent: 2.3, suitability: 88, investmentPotential: 84 },
    wheat: { volumeMT: 42000, harvestedAreaHa: 16000, yieldPerHa: 2.62, trendPercent: 1.5, suitability: 62, investmentPotential: 65 },
    maize: { volumeMT: 165000, harvestedAreaHa: 52000, yieldPerHa: 3.17, trendPercent: 2.7, suitability: 76, investmentPotential: 78 },
  },
  east_hararghe: {
    coffee: { volumeMT: 68000, harvestedAreaHa: 84000, yieldPerHa: 0.81, trendPercent: 3.0, suitability: 92, investmentPotential: 89 },
    wheat: { volumeMT: 28000, harvestedAreaHa: 11000, yieldPerHa: 2.54, trendPercent: 0.9, suitability: 55, investmentPotential: 58 },
    maize: { volumeMT: 140000, harvestedAreaHa: 46000, yieldPerHa: 3.04, trendPercent: 2.1, suitability: 72, investmentPotential: 75 },
  },
  guji: {
    coffee: { volumeMT: 89000, harvestedAreaHa: 102000, yieldPerHa: 0.87, trendPercent: 4.8, suitability: 95, investmentPotential: 92 },
    wheat: { volumeMT: 18000, harvestedAreaHa: 7500, yieldPerHa: 2.4, trendPercent: 1.0, suitability: 48, investmentPotential: 52 },
    maize: { volumeMT: 155000, harvestedAreaHa: 48000, yieldPerHa: 3.22, trendPercent: 3.1, suitability: 78, investmentPotential: 80 },
  },
  west_guji: {
    coffee: { volumeMT: 76000, harvestedAreaHa: 88000, yieldPerHa: 0.86, trendPercent: 4.1, suitability: 93, investmentPotential: 90 },
    wheat: { volumeMT: 14000, harvestedAreaHa: 5800, yieldPerHa: 2.41, trendPercent: 0.6, suitability: 45, investmentPotential: 48 },
    maize: { volumeMT: 130000, harvestedAreaHa: 41000, yieldPerHa: 3.17, trendPercent: 2.8, suitability: 75, investmentPotential: 77 },
  },
  borena: {
    coffee: { volumeMT: 0, harvestedAreaHa: 0, yieldPerHa: 0, trendPercent: 0, suitability: 12, investmentPotential: 18 },
    wheat: { volumeMT: 3500, harvestedAreaHa: 1800, yieldPerHa: 1.94, trendPercent: -2.1, suitability: 22, investmentPotential: 25 },
    maize: { volumeMT: 28000, harvestedAreaHa: 12000, yieldPerHa: 2.33, trendPercent: 0.1, suitability: 32, investmentPotential: 35 },
  },
  east_borena: {
    // Low pastoral estimate (not null) so public choropleths keep full 22-zone coverage.
    coffee: { volumeMT: 400, harvestedAreaHa: 600, yieldPerHa: 0.67, trendPercent: 0, suitability: 14, investmentPotential: 16 },
    wheat: { volumeMT: 2100, harvestedAreaHa: 1100, yieldPerHa: 1.9, trendPercent: -1.0, suitability: 18, investmentPotential: 20 },
    maize: { volumeMT: 19000, harvestedAreaHa: 8500, yieldPerHa: 2.23, trendPercent: 0, suitability: 28, investmentPotential: 30 },
  },
  shager_city: {
    coffee: { volumeMT: 0, harvestedAreaHa: 0, yieldPerHa: 0, trendPercent: 0, suitability: 15, investmentPotential: 65 },
    wheat: { volumeMT: 5000, harvestedAreaHa: 1800, yieldPerHa: 2.77, trendPercent: 1.0, suitability: 35, investmentPotential: 70 },
    maize: { volumeMT: 18000, harvestedAreaHa: 5200, yieldPerHa: 3.46, trendPercent: 2.0, suitability: 45, investmentPotential: 75 },
  },
};

export function assertPrototypeCoversAllZones(): void {
  for (const zoneId of CANONICAL_ZONE_IDS) {
    if (!PROTOTYPE_ZONE_STATS[zoneId]) {
      throw new Error(`Prototype seed missing zone: ${zoneId}`);
    }
  }
}

export const PROTOTYPE_SOURCES = [
  {
    sourceId: PROTOTYPE_SOURCE_IDS.csaAgss,
    title: 'CSA Agricultural Sample Survey — Meher season crop production (national/regional patterns)',
    organization: 'Central Statistical Agency of Ethiopia (CSA)',
    documentTitle: 'Agricultural Sample Survey (Meher Season) — Crop Production',
    publicationDate: '2024-12-01',
    referencePeriod: 'Meher 2023/24–2024/25',
    url: 'https://www.statsethiopia.gov.et/',
    methodologyNotes:
      'National and regional AGSS Meher tables inform crop geography and yield bands. Zone (ADM2) rows in this prototype are compiled estimates, not a direct CSA zone microdata dump.',
    license: 'Official CSA publication; cite CSA when redistributing.',
    contactInfo: 'www.statsethiopia.gov.et',
  },
  {
    sourceId: PROTOTYPE_SOURCE_IDS.oboaZone,
    title: 'Oromia Bureau of Agriculture — zone office production & area estimates',
    organization: 'Oromia Bureau of Agriculture (OBoA)',
    documentTitle: 'Zone agricultural performance estimates (Investment CMS prototype pack)',
    publicationDate: '2025-06-01',
    referencePeriod: 'Meher 2024/2025',
    methodologyNotes:
      'Zone offices report harvested area and production for priority commodities. Figures are harmonized to canonical ADM2 IDs used by the Investment map.',
    license: 'Internal bureau use / public Investment portal attribution required.',
    contactInfo: 'Oromia Bureau of Agriculture, Finfinne',
  },
  {
    sourceId: PROTOTYPE_SOURCE_IDS.compilation,
    title: 'OAB Investment CMS prototype compilation (source-attributed zone layer)',
    organization: 'Oromia Agriculture Bureau — Investment & Market Systems',
    documentTitle: `Investment thematic prototype seed ${PROTOTYPE_SEED_VERSION}`,
    publicationDate: '2025-08-18',
    referencePeriod: PROTOTYPE_REFERENCE_PERIOD.label,
    methodologyNotes:
      'Combines CSA Meher regional patterns with OBoA zone estimates into 22 canonical zones for coffee, wheat, and maize. Suitability and investment-potential scores follow meth_oab_suitability_investment_v1. All numeric production rows are qualityFlag=estimated.',
    license: 'Prototype for bureau portal demonstration; replace with verified official releases before formal publication claims.',
  },
] as const;

export const PROTOTYPE_METHODOLOGY = {
  methodologyId: PROTOTYPE_METHODOLOGY_ID,
  title: 'OAB commodity suitability & investment potential score (v1)',
  description:
    'Composite 0–100 scores for public Investment map layers. Suitability emphasizes agro-ecology and observed production intensity; investment potential adds market access and infrastructure signals.',
  versionLabel: 'v1.0-prototype',
  components: [
    { name: 'Agro-ecological suitability', weight: 0.35, description: 'Altitude, rainfall, and crop-specific ecological fit' },
    { name: 'Observed production intensity', weight: 0.25, description: 'Relative harvested area and yield vs regional peers' },
    { name: 'Market & logistics access', weight: 0.2, description: 'Proximity to corridors, towns, and aggregation points' },
    { name: 'Infrastructure & services', weight: 0.2, description: 'Extension, storage, and processing readiness' },
  ],
  weights: {
    agroEcology: 0.35,
    productionIntensity: 0.25,
    marketAccess: 0.2,
    infrastructure: 0.2,
  },
  calculationNotes:
    'Scores are expert-compiled prototype indices for choropleth demonstration. They are not a substitute for a full multi-criteria GIS model.',
  limitations:
    'Not field-validated plot-level suitability. Pastoral zones may understate livestock investment opportunities. Replace with verified model outputs for investment decisions.',
  sourceIds: [PROTOTYPE_SOURCE_IDS.csaAgss, PROTOTYPE_SOURCE_IDS.oboaZone, PROTOTYPE_SOURCE_IDS.compilation],
} as const;

export const PROTOTYPE_DATASETS: Array<{
  datasetId: string;
  title: string;
  commodity: PrototypeCommodity;
  metric: PrototypeMetric;
  category: 'production' | 'suitability' | 'investment_potential';
  unit: 'tonne' | 'score';
  description: string;
}> = [
  {
    datasetId: 'ds_proto_coffee_production_2024',
    title: 'Coffee production by zone (Meher 2024/25 prototype)',
    commodity: 'coffee',
    metric: 'production',
    category: 'production',
    unit: 'tonne',
    description: 'Estimated green-coffee equivalent production (MT) across 22 Oromia ADM2 zones.',
  },
  {
    datasetId: 'ds_proto_wheat_production_2024',
    title: 'Wheat production by zone (Meher 2024/25 prototype)',
    commodity: 'wheat',
    metric: 'production',
    category: 'production',
    unit: 'tonne',
    description: 'Estimated wheat production (MT) across 22 Oromia ADM2 zones.',
  },
  {
    datasetId: 'ds_proto_maize_production_2024',
    title: 'Maize production by zone (Meher 2024/25 prototype)',
    commodity: 'maize',
    metric: 'production',
    category: 'production',
    unit: 'tonne',
    description: 'Estimated maize production (MT) across 22 Oromia ADM2 zones.',
  },
  {
    datasetId: 'ds_proto_coffee_suitability_2025',
    title: 'Coffee agricultural suitability by zone (2025 prototype)',
    commodity: 'coffee',
    metric: 'suitability',
    category: 'suitability',
    unit: 'score',
    description: '0–100 suitability score for coffee cultivation.',
  },
  {
    datasetId: 'ds_proto_wheat_suitability_2025',
    title: 'Wheat agricultural suitability by zone (2025 prototype)',
    commodity: 'wheat',
    metric: 'suitability',
    category: 'suitability',
    unit: 'score',
    description: '0–100 suitability score for wheat cultivation.',
  },
  {
    datasetId: 'ds_proto_maize_suitability_2025',
    title: 'Maize agricultural suitability by zone (2025 prototype)',
    commodity: 'maize',
    metric: 'suitability',
    category: 'suitability',
    unit: 'score',
    description: '0–100 suitability score for maize cultivation.',
  },
  {
    datasetId: 'ds_proto_coffee_investment_2025',
    title: 'Coffee investment potential by zone (2025 prototype)',
    commodity: 'coffee',
    metric: 'investment_potential',
    category: 'investment_potential',
    unit: 'score',
    description: '0–100 investment attractiveness score for coffee value chains.',
  },
  {
    datasetId: 'ds_proto_wheat_investment_2025',
    title: 'Wheat investment potential by zone (2025 prototype)',
    commodity: 'wheat',
    metric: 'investment_potential',
    category: 'investment_potential',
    unit: 'score',
    description: '0–100 investment attractiveness score for wheat value chains.',
  },
  {
    datasetId: 'ds_proto_maize_investment_2025',
    title: 'Maize investment potential by zone (2025 prototype)',
    commodity: 'maize',
    metric: 'investment_potential',
    category: 'investment_potential',
    unit: 'score',
    description: '0–100 investment attractiveness score for maize value chains.',
  },
];
