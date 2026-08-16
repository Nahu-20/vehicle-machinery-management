/**
 * ============================================================================
 * SYNTHETIC DEVELOPMENT FIXTURES — NOT OFFICIAL Oromia Agricultural Bureau DATA
 * ============================================================================
 *
 * This fixture file contains synthetic development data created SOLELY to test
 * the M6A thematic visualization map engine, quantile styling, and statistical
 * panel components.
 *
 * SAFEGUARD:
 * Demo data must be imported ONLY within /investment/map-lab testing pages.
 * DO NOT import this file into public production services or homepage components.
 */

import { CommodityConfig, CommodityKey, DemoZoneCommodityMetrics, MetricConfig, ThematicMetric } from '../types/thematic';

export class DEMO_DATA_DISCLAIMER {
  public static readonly TITLE = 'DEMO AGRICULTURAL DATA';
  public static readonly SUBTITLE = 'Synthetic values for interface testing only. Not official Oromia Agricultural Bureau statistics.';
}

export const SUPPORTED_COMMODITIES: CommodityConfig[] = [
  {
    key: 'coffee',
    labelEn: 'Coffee',
    labelOm: 'Bunna',
    labelAm: 'ቡና',
    unitVolume: 'Metric Tons',
    iconName: 'Coffee',
  },
  {
    key: 'wheat',
    labelEn: 'Wheat',
    labelOm: 'Qamadii',
    labelAm: 'ስንዴ',
    unitVolume: 'Metric Tons',
    iconName: 'Wheat',
  },
  {
    key: 'maize',
    labelEn: 'Maize',
    labelOm: 'Boqqoolloo',
    labelAm: 'በቆሎ',
    unitVolume: 'Metric Tons',
    iconName: 'Corn',
  },
];

export const SUPPORTED_METRICS: MetricConfig[] = [
  {
    key: 'production',
    labelEn: 'Current Production',
    labelOm: 'Omisha Ammee',
    labelAm: 'የአሁኑ ምርት',
    description: 'Where is this commodity currently produced and at what scale?',
  },
  {
    key: 'suitability',
    labelEn: 'Agricultural Suitability',
    labelOm: 'Mijata Misoomaa',
    labelAm: 'የግብርና ተስማሚነት',
    description: 'Where are environmental and agronomic conditions suitable for cultivation?',
  },
  {
    key: 'investment_potential',
    labelEn: 'Investment Potential',
    labelOm: 'Dandeettii Investermentii',
    labelAm: 'የኢንቨስትመንት አቅም',
    description: 'Where is investment attractive based on agriculture, markets, and infrastructure?',
  },
];

/**
 * 22 Canonical Oromia Zone IDs synthetic metrics database fixture
 */
export const DEMO_THEMATIC_FIXTURES: Record<string, Record<CommodityKey, DemoZoneCommodityMetrics>> = {
  // 1. Jimma (Major Coffee & Maize Zone)
  jimma: {
    coffee: {
      zoneId: 'jimma',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 125000, harvestedAreaHa: 142000, yieldPerHa: 0.88, trendPercent: +4.2, referenceYear: '2024/2025' },
      suitability: { score: 96, referencePeriod: '2025' },
      investmentPotential: { score: 94, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'jimma',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 28000, harvestedAreaHa: 11000, yieldPerHa: 2.55, trendPercent: +1.1, referenceYear: '2024/2025' },
      suitability: { score: 58, referencePeriod: '2025' },
      investmentPotential: { score: 62, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'jimma',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 340000, harvestedAreaHa: 95000, yieldPerHa: 3.58, trendPercent: +5.0, referenceYear: '2024/2025' },
      suitability: { score: 92, referencePeriod: '2025' },
      investmentPotential: { score: 90, referencePeriod: '2025' },
    },
  },

  // 2. Ilu Aba Bora (Coffee & Forest Agri)
  ilu_aba_bora: {
    coffee: {
      zoneId: 'ilu_aba_bora',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 98000, harvestedAreaHa: 115000, yieldPerHa: 0.85, trendPercent: +3.8, referenceYear: '2024/2025' },
      suitability: { score: 94, referencePeriod: '2025' },
      investmentPotential: { score: 88, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'ilu_aba_bora',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 12000, harvestedAreaHa: 5200, yieldPerHa: 2.31, trendPercent: +0.5, referenceYear: '2024/2025' },
      suitability: { score: 45, referencePeriod: '2025' },
      investmentPotential: { score: 50, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'ilu_aba_bora',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 210000, harvestedAreaHa: 62000, yieldPerHa: 3.38, trendPercent: +2.9, referenceYear: '2024/2025' },
      suitability: { score: 85, referencePeriod: '2025' },
      investmentPotential: { score: 82, referencePeriod: '2025' },
    },
  },

  // 3. West Wellega (Coffee & Maize)
  west_wellega: {
    coffee: {
      zoneId: 'west_wellega',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 84000, harvestedAreaHa: 98000, yieldPerHa: 0.86, trendPercent: +2.1, referenceYear: '2024/2025' },
      suitability: { score: 89, referencePeriod: '2025' },
      investmentPotential: { score: 85, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'west_wellega',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 8500, harvestedAreaHa: 3800, yieldPerHa: 2.24, trendPercent: -1.2, referenceYear: '2024/2025' },
      suitability: { score: 40, referencePeriod: '2025' },
      investmentPotential: { score: 42, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'west_wellega',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 290000, harvestedAreaHa: 81000, yieldPerHa: 3.58, trendPercent: +4.1, referenceYear: '2024/2025' },
      suitability: { score: 91, referencePeriod: '2025' },
      investmentPotential: { score: 87, referencePeriod: '2025' },
    },
  },

  // 4. East Wellega (Maize & Coffee)
  east_wellega: {
    coffee: {
      zoneId: 'east_wellega',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 62000, harvestedAreaHa: 75000, yieldPerHa: 0.83, trendPercent: +1.9, referenceYear: '2024/2025' },
      suitability: { score: 82, referencePeriod: '2025' },
      investmentPotential: { score: 81, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'east_wellega',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 32000, harvestedAreaHa: 12500, yieldPerHa: 2.56, trendPercent: +2.4, referenceYear: '2024/2025' },
      suitability: { score: 65, referencePeriod: '2025' },
      investmentPotential: { score: 68, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'east_wellega',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 380000, harvestedAreaHa: 102000, yieldPerHa: 3.73, trendPercent: +6.2, referenceYear: '2024/2025' },
      suitability: { score: 95, referencePeriod: '2025' },
      investmentPotential: { score: 93, referencePeriod: '2025' },
    },
  },

  // 5. Buno Bedele (Coffee)
  buno_bedele: {
    coffee: {
      zoneId: 'buno_bedele',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 71000, harvestedAreaHa: 82000, yieldPerHa: 0.87, trendPercent: +3.1, referenceYear: '2024/2025' },
      suitability: { score: 91, referencePeriod: '2025' },
      investmentPotential: { score: 86, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'buno_bedele',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 15000, harvestedAreaHa: 6100, yieldPerHa: 2.46, trendPercent: +0.8, referenceYear: '2024/2025' },
      suitability: { score: 52, referencePeriod: '2025' },
      investmentPotential: { score: 55, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'buno_bedele',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 195000, harvestedAreaHa: 56000, yieldPerHa: 3.48, trendPercent: +3.0, referenceYear: '2024/2025' },
      suitability: { score: 87, referencePeriod: '2025' },
      investmentPotential: { score: 84, referencePeriod: '2025' },
    },
  },

  // 6. Kelem Wellega (Coffee)
  kelem_wellega: {
    coffee: {
      zoneId: 'kelem_wellega',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 54000, harvestedAreaHa: 66000, yieldPerHa: 0.82, trendPercent: +2.0, referenceYear: '2024/2025' },
      suitability: { score: 84, referencePeriod: '2025' },
      investmentPotential: { score: 79, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'kelem_wellega',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 6000, harvestedAreaHa: 2800, yieldPerHa: 2.14, trendPercent: -0.5, referenceYear: '2024/2025' },
      suitability: { score: 38, referencePeriod: '2025' },
      investmentPotential: { score: 40, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'kelem_wellega',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 220000, harvestedAreaHa: 64000, yieldPerHa: 3.44, trendPercent: +3.5, referenceYear: '2024/2025' },
      suitability: { score: 88, referencePeriod: '2025' },
      investmentPotential: { score: 83, referencePeriod: '2025' },
    },
  },

  // 7. Horo Gudru Wellega (Maize & Mixed Grains)
  horo_gudru_wellega: {
    coffee: {
      zoneId: 'horo_gudru_wellega',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 18000, harvestedAreaHa: 24000, yieldPerHa: 0.75, trendPercent: +1.0, referenceYear: '2024/2025' },
      suitability: { score: 62, referencePeriod: '2025' },
      investmentPotential: { score: 60, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'horo_gudru_wellega',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 85000, harvestedAreaHa: 29000, yieldPerHa: 2.93, trendPercent: +4.8, referenceYear: '2024/2025' },
      suitability: { score: 78, referencePeriod: '2025' },
      investmentPotential: { score: 76, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'horo_gudru_wellega',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 260000, harvestedAreaHa: 72000, yieldPerHa: 3.61, trendPercent: +4.2, referenceYear: '2024/2025' },
      suitability: { score: 89, referencePeriod: '2025' },
      investmentPotential: { score: 85, referencePeriod: '2025' },
    },
  },

  // 8. Arsi (Major Wheat Belt)
  arsi: {
    coffee: {
      zoneId: 'arsi',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 12000, harvestedAreaHa: 16000, yieldPerHa: 0.75, trendPercent: +0.5, referenceYear: '2024/2025' },
      suitability: { score: 50, referencePeriod: '2025' },
      investmentPotential: { score: 55, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'arsi',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 480000, harvestedAreaHa: 135000, yieldPerHa: 3.56, trendPercent: +7.8, referenceYear: '2024/2025' },
      suitability: { score: 98, referencePeriod: '2025' },
      investmentPotential: { score: 97, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'arsi',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 180000, harvestedAreaHa: 52000, yieldPerHa: 3.46, trendPercent: +2.1, referenceYear: '2024/2025' },
      suitability: { score: 72, referencePeriod: '2025' },
      investmentPotential: { score: 75, referencePeriod: '2025' },
    },
  },

  // 9. West Arsi (Wheat & Oilseeds)
  west_arsi: {
    coffee: {
      zoneId: 'west_arsi',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 22000, harvestedAreaHa: 28000, yieldPerHa: 0.78, trendPercent: +1.2, referenceYear: '2024/2025' },
      suitability: { score: 65, referencePeriod: '2025' },
      investmentPotential: { score: 68, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'west_arsi',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 390000, harvestedAreaHa: 112000, yieldPerHa: 3.48, trendPercent: +6.5, referenceYear: '2024/2025' },
      suitability: { score: 95, referencePeriod: '2025' },
      investmentPotential: { score: 94, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'west_arsi',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 210000, harvestedAreaHa: 58000, yieldPerHa: 3.62, trendPercent: +3.2, referenceYear: '2024/2025' },
      suitability: { score: 80, referencePeriod: '2025' },
      investmentPotential: { score: 82, referencePeriod: '2025' },
    },
  },

  // 10. Bale (Major Wheat & Grain Belt)
  bale: {
    coffee: {
      zoneId: 'bale',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 35000, harvestedAreaHa: 45000, yieldPerHa: 0.77, trendPercent: +2.4, referenceYear: '2024/2025' },
      suitability: { score: 74, referencePeriod: '2025' },
      investmentPotential: { score: 72, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'bale',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 420000, harvestedAreaHa: 122000, yieldPerHa: 3.44, trendPercent: +7.1, referenceYear: '2024/2025' },
      suitability: { score: 96, referencePeriod: '2025' },
      investmentPotential: { score: 95, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'bale',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 95000, harvestedAreaHa: 31000, yieldPerHa: 3.06, trendPercent: +1.8, referenceYear: '2024/2025' },
      suitability: { score: 60, referencePeriod: '2025' },
      investmentPotential: { score: 64, referencePeriod: '2025' },
    },
  },

  // 11. East Bale (Wheat & Pasture)
  east_bale: {
    coffee: {
      zoneId: 'east_bale',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 8000, harvestedAreaHa: 11000, yieldPerHa: 0.72, trendPercent: +0.4, referenceYear: '2024/2025' },
      suitability: { score: 42, referencePeriod: '2025' },
      investmentPotential: { score: 45, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'east_bale',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 180000, harvestedAreaHa: 62000, yieldPerHa: 2.90, trendPercent: +4.2, referenceYear: '2024/2025' },
      suitability: { score: 82, referencePeriod: '2025' },
      investmentPotential: { score: 80, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'east_bale',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 45000, harvestedAreaHa: 16000, yieldPerHa: 2.81, trendPercent: +1.1, referenceYear: '2024/2025' },
      suitability: { score: 48, referencePeriod: '2025' },
      investmentPotential: { score: 50, referencePeriod: '2025' },
    },
  },

  // 12. West Shewa (Wheat & Maize)
  west_shewa: {
    coffee: {
      zoneId: 'west_shewa',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 15000, harvestedAreaHa: 19000, yieldPerHa: 0.78, trendPercent: +0.8, referenceYear: '2024/2025' },
      suitability: { score: 55, referencePeriod: '2025' },
      investmentPotential: { score: 58, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'west_shewa',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 310000, harvestedAreaHa: 92000, yieldPerHa: 3.37, trendPercent: +5.4, referenceYear: '2024/2025' },
      suitability: { score: 91, referencePeriod: '2025' },
      investmentPotential: { score: 92, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'west_shewa',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 280000, harvestedAreaHa: 78000, yieldPerHa: 3.58, trendPercent: +4.8, referenceYear: '2024/2025' },
      suitability: { score: 88, referencePeriod: '2025' },
      investmentPotential: { score: 89, referencePeriod: '2025' },
    },
  },

  // 13. South West Shewa (Grain & Pulses)
  south_west_shewa: {
    coffee: {
      zoneId: 'south_west_shewa',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 21000, harvestedAreaHa: 26000, yieldPerHa: 0.80, trendPercent: +1.5, referenceYear: '2024/2025' },
      suitability: { score: 68, referencePeriod: '2025' },
      investmentPotential: { score: 70, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'south_west_shewa',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 240000, harvestedAreaHa: 74000, yieldPerHa: 3.24, trendPercent: +4.1, referenceYear: '2024/2025' },
      suitability: { score: 88, referencePeriod: '2025' },
      investmentPotential: { score: 87, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'south_west_shewa',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 215000, harvestedAreaHa: 61000, yieldPerHa: 3.52, trendPercent: +3.6, referenceYear: '2024/2025' },
      suitability: { score: 85, referencePeriod: '2025' },
      investmentPotential: { score: 86, referencePeriod: '2025' },
    },
  },

  // 14. North Shewa (Wheat & Barley)
  north_shewa: {
    coffee: {
      zoneId: 'north_shewa',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 2000, harvestedAreaHa: 3100, yieldPerHa: 0.64, trendPercent: -0.2, referenceYear: '2024/2025' },
      suitability: { score: 25, referencePeriod: '2025' },
      investmentPotential: { score: 30, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'north_shewa',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 265000, harvestedAreaHa: 81000, yieldPerHa: 3.27, trendPercent: +5.0, referenceYear: '2024/2025' },
      suitability: { score: 89, referencePeriod: '2025' },
      investmentPotential: { score: 88, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'north_shewa',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 110000, harvestedAreaHa: 36000, yieldPerHa: 3.05, trendPercent: +2.0, referenceYear: '2024/2025' },
      suitability: { score: 62, referencePeriod: '2025' },
      investmentPotential: { score: 65, referencePeriod: '2025' },
    },
  },

  // 15. East Shewa (Commercial Agri, Irrigation, Maize, Vegetables)
  east_shewa: {
    coffee: {
      zoneId: 'east_shewa',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 5000, harvestedAreaHa: 6800, yieldPerHa: 0.73, trendPercent: +0.2, referenceYear: '2024/2025' },
      suitability: { score: 35, referencePeriod: '2025' },
      investmentPotential: { score: 45, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'east_shewa',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 190000, harvestedAreaHa: 58000, yieldPerHa: 3.27, trendPercent: +4.8, referenceYear: '2024/2025' },
      suitability: { score: 82, referencePeriod: '2025' },
      investmentPotential: { score: 91, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'east_shewa',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 310000, harvestedAreaHa: 80000, yieldPerHa: 3.87, trendPercent: +5.8, referenceYear: '2024/2025' },
      suitability: { score: 90, referencePeriod: '2025' },
      investmentPotential: { score: 96, referencePeriod: '2025' },
    },
  },

  // 16. West Hararghe (Harar Coffee & Sorghum)
  west_hararghe: {
    coffee: {
      zoneId: 'west_hararghe',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 52000, harvestedAreaHa: 68000, yieldPerHa: 0.76, trendPercent: +2.3, referenceYear: '2024/2025' },
      suitability: { score: 88, referencePeriod: '2025' },
      investmentPotential: { score: 84, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'west_hararghe',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 42000, harvestedAreaHa: 16000, yieldPerHa: 2.62, trendPercent: +1.5, referenceYear: '2024/2025' },
      suitability: { score: 62, referencePeriod: '2025' },
      investmentPotential: { score: 65, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'west_hararghe',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 165000, harvestedAreaHa: 52000, yieldPerHa: 3.17, trendPercent: +2.7, referenceYear: '2024/2025' },
      suitability: { score: 76, referencePeriod: '2025' },
      investmentPotential: { score: 78, referencePeriod: '2025' },
    },
  },

  // 17. East Hararghe (Harar Specialty Coffee)
  east_hararghe: {
    coffee: {
      zoneId: 'east_hararghe',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 68000, harvestedAreaHa: 84000, yieldPerHa: 0.81, trendPercent: +3.0, referenceYear: '2024/2025' },
      suitability: { score: 92, referencePeriod: '2025' },
      investmentPotential: { score: 89, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'east_hararghe',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 28000, harvestedAreaHa: 11000, yieldPerHa: 2.54, trendPercent: +0.9, referenceYear: '2024/2025' },
      suitability: { score: 55, referencePeriod: '2025' },
      investmentPotential: { score: 58, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'east_hararghe',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 140000, harvestedAreaHa: 46000, yieldPerHa: 3.04, trendPercent: +2.1, referenceYear: '2024/2025' },
      suitability: { score: 72, referencePeriod: '2025' },
      investmentPotential: { score: 75, referencePeriod: '2025' },
    },
  },

  // 18. Guji (Specialty Guji Coffee)
  guji: {
    coffee: {
      zoneId: 'guji',
      commodity: 'guji' as unknown as CommodityKey, // key match 'guji' for zone_id 'guji'
      dataStatus: 'demo',
      production: { volumeMT: 89000, harvestedAreaHa: 102000, yieldPerHa: 0.87, trendPercent: +4.8, referenceYear: '2024/2025' },
      suitability: { score: 95, referencePeriod: '2025' },
      investmentPotential: { score: 92, referencePeriod: '2025' },
    } as unknown as DemoZoneCommodityMetrics,
    wheat: {
      zoneId: 'guji',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 18000, harvestedAreaHa: 7500, yieldPerHa: 2.40, trendPercent: +1.0, referenceYear: '2024/2025' },
      suitability: { score: 48, referencePeriod: '2025' },
      investmentPotential: { score: 52, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'guji',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 155000, harvestedAreaHa: 48000, yieldPerHa: 3.22, trendPercent: +3.1, referenceYear: '2024/2025' },
      suitability: { score: 78, referencePeriod: '2025' },
      investmentPotential: { score: 80, referencePeriod: '2025' },
    },
  },

  // 19. West Guji (Specialty Coffee)
  west_guji: {
    coffee: {
      zoneId: 'west_guji',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 76000, harvestedAreaHa: 88000, yieldPerHa: 0.86, trendPercent: +4.1, referenceYear: '2024/2025' },
      suitability: { score: 93, referencePeriod: '2025' },
      investmentPotential: { score: 90, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'west_guji',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 14000, harvestedAreaHa: 5800, yieldPerHa: 2.41, trendPercent: +0.6, referenceYear: '2024/2025' },
      suitability: { score: 45, referencePeriod: '2025' },
      investmentPotential: { score: 48, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'west_guji',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 130000, harvestedAreaHa: 41000, yieldPerHa: 3.17, trendPercent: +2.8, referenceYear: '2024/2025' },
      suitability: { score: 75, referencePeriod: '2025' },
      investmentPotential: { score: 77, referencePeriod: '2025' },
    },
  },

  // 20. Borena (Pastoral & Livestock - 0 Coffee, Low Wheat, Null/Low Maize)
  borena: {
    coffee: {
      zoneId: 'borena',
      commodity: 'coffee',
      dataStatus: 'demo',
      // Explicit 0 value (not null) to test Zero value vs No Data!
      production: { volumeMT: 0, harvestedAreaHa: 0, yieldPerHa: 0, trendPercent: 0, referenceYear: '2024/2025' },
      suitability: { score: 12, referencePeriod: '2025' },
      investmentPotential: { score: 18, referencePeriod: '2025' },
    },
    wheat: {
      zoneId: 'borena',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 3500, harvestedAreaHa: 1800, yieldPerHa: 1.94, trendPercent: -2.1, referenceYear: '2024/2025' },
      suitability: { score: 22, referencePeriod: '2025' },
      investmentPotential: { score: 25, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'borena',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 28000, harvestedAreaHa: 12000, yieldPerHa: 2.33, trendPercent: +0.1, referenceYear: '2024/2025' },
      suitability: { score: 32, referencePeriod: '2025' },
      investmentPotential: { score: 35, referencePeriod: '2025' },
    },
  },

  // 21. East Borena (Pastoral - Null Coffee to test "NO DATA" state)
  east_borena: {
    coffee: {
      zoneId: 'east_borena',
      commodity: 'coffee',
      dataStatus: 'demo',
      // Explicit null to test NO DATA gray state!
      production: { volumeMT: null, harvestedAreaHa: null, yieldPerHa: null, trendPercent: null },
      suitability: { score: null },
      investmentPotential: { score: null },
    },
    wheat: {
      zoneId: 'east_borena',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 2100, harvestedAreaHa: 1100, yieldPerHa: 1.90, trendPercent: -1.0, referenceYear: '2024/2025' },
      suitability: { score: 18, referencePeriod: '2025' },
      investmentPotential: { score: 20, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'east_borena',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 19000, harvestedAreaHa: 8500, yieldPerHa: 2.23, trendPercent: +0.0, referenceYear: '2024/2025' },
      suitability: { score: 28, referencePeriod: '2025' },
      investmentPotential: { score: 30, referencePeriod: '2025' },
    },
  },

  // 22. Shager City (Urban & Peri-urban special zone - Null Coffee/Wheat)
  shager_city: {
    coffee: {
      zoneId: 'shager_city',
      commodity: 'coffee',
      dataStatus: 'demo',
      production: { volumeMT: 0, harvestedAreaHa: 0, yieldPerHa: 0, trendPercent: 0, referenceYear: '2024/2025' },
      suitability: { score: 15, referencePeriod: '2025' },
      investmentPotential: { score: 65, referencePeriod: '2025' }, // high infrastructure
    },
    wheat: {
      zoneId: 'shager_city',
      commodity: 'wheat',
      dataStatus: 'demo',
      production: { volumeMT: 5000, harvestedAreaHa: 1800, yieldPerHa: 2.77, trendPercent: +1.0, referenceYear: '2024/2025' },
      suitability: { score: 35, referencePeriod: '2025' },
      investmentPotential: { score: 70, referencePeriod: '2025' },
    },
    maize: {
      zoneId: 'shager_city',
      commodity: 'maize',
      dataStatus: 'demo',
      production: { volumeMT: 18000, harvestedAreaHa: 5200, yieldPerHa: 3.46, trendPercent: +2.0, referenceYear: '2024/2025' },
      suitability: { score: 45, referencePeriod: '2025' },
      investmentPotential: { score: 75, referencePeriod: '2025' },
    },
  },
};

// Ensure Guji fixture has correct type
(DEMO_THEMATIC_FIXTURES.guji as Record<string, DemoZoneCommodityMetrics>).coffee = {
  zoneId: 'guji',
  commodity: 'coffee',
  dataStatus: 'demo',
  production: { volumeMT: 89000, harvestedAreaHa: 102000, yieldPerHa: 0.87, trendPercent: +4.8, referenceYear: '2024/2025' },
  suitability: { score: 95, referencePeriod: '2025' },
  investmentPotential: { score: 92, referencePeriod: '2025' },
};
