/**
 * Prototype investment opportunities — source-attributed profiles for /investment.
 *
 * Profiles are compiled from OBoA corridor notes and CSA Meher crop geography.
 * USD ranges and land figures are INDICATIVE PROTOTYPE estimates for demonstration,
 * not binding offer documents.
 */

import { CanonicalZoneId } from '../features/investment-map/constants/canonicalZones';
import { PROTOTYPE_SEED_VERSION, PROTOTYPE_SOURCE_IDS } from './investmentPrototypeSeedData';
import { PROTOTYPE_INFRA_SOURCE_IDS } from './investmentPrototypeInfraSeedData';

export const PROTOTYPE_OPP_SEED_VERSION = `${PROTOTYPE_SEED_VERSION}-opps-v2`;

export const PROTOTYPE_OPP_SOURCE_IDS = {
  pipelineBrief: 'src_oboa_investment_pipeline_2025',
  csaAgss: PROTOTYPE_SOURCE_IDS.csaAgss,
  oboaZone: PROTOTYPE_SOURCE_IDS.oboaZone,
  corridorNotes: PROTOTYPE_INFRA_SOURCE_IDS.corridorNotes,
  compilation: PROTOTYPE_SOURCE_IDS.compilation,
} as const;

export const OPPORTUNITY_TYPE_OPTIONS = [
  { value: 'processing_cluster', label: 'Processing cluster' },
  { value: 'irrigation_scheme', label: 'Irrigation scheme' },
  { value: 'warehouse_logistics', label: 'Warehouse & logistics' },
  { value: 'specialty_coffee', label: 'Specialty coffee' },
  { value: 'livestock_corridor', label: 'Livestock corridor' },
  { value: 'land_partnership', label: 'Land partnership' },
  { value: 'cold_chain', label: 'Cold chain' },
  { value: 'input_services', label: 'Inputs & services' },
  { value: 'general', label: 'General' },
] as const;

export interface PrototypeOpportunitySpec {
  opportunityId: string;
  title: string;
  slug: string;
  zoneIds: CanonicalZoneId[];
  commodityKeys: string[];
  opportunityType: string;
  summary: string;
  description: string;
  estimatedInvestmentRange?: { minUsd?: number; maxUsd?: number; notes?: string };
  landInformation?: { totalHa?: number; tenureType?: string; notes?: string };
  responsibleOffice: string;
}

export const PROTOTYPE_OPP_SOURCES = [
  {
    sourceId: PROTOTYPE_OPP_SOURCE_IDS.pipelineBrief,
    title: 'OBoA priority agribusiness investment pipeline brief (2025)',
    organization: 'Oromia Bureau of Agriculture — Investment & Market Systems',
    documentTitle: 'Priority corridor investment opportunities — coffee, cereals, livestock, irrigation',
    publicationDate: '2025-07-15',
    referencePeriod: '2024/2025–2025/2026',
    url: 'https://www.oromiya.gov.et/',
    methodologyNotes:
      'Bureau investment desk compilation of zone-prioritized processing, logistics, irrigation, and livestock corridor opportunities. Linked to CSA Meher production geography and OBoA facility inventory. USD ranges are indicative for prototype demonstration only.',
    license: 'Bureau public Investment portal attribution required.',
    contactInfo: 'Oromia Bureau of Agriculture, Finfinne',
  },
] as const;

export const PROTOTYPE_OPPORTUNITIES: PrototypeOpportunitySpec[] = [
  {
    opportunityId: 'opp_proto_jimma_coffee_processing',
    title: 'Jimma specialty coffee processing & export cluster',
    slug: 'jimma-specialty-coffee-processing-cluster',
    zoneIds: ['jimma', 'buno_bedele', 'ilu_aba_bora'],
    commodityKeys: ['coffee'],
    opportunityType: 'specialty_coffee',
    summary:
      'Expand wet/dry mill capacity and quality labs linking Jimma belt cooperatives to export buyers.',
    description:
      'Partnership opportunity for private or PPP investment in coffee washing, milling, cupping labs, and traceability across the Jimma–Bedele–Metu corridor. Aligned with OBoA coffee corridor priorities and CSA Meher coffee production densification in western Oromia.',
    estimatedInvestmentRange: {
      minUsd: 2_500_000,
      maxUsd: 8_000_000,
      notes: 'Indicative CAPEX for mill upgrade + cold holding + lab (prototype range).',
    },
    landInformation: {
      totalHa: 12,
      tenureType: 'lease_or_ppp_site',
      notes: 'Industrial plot / cooperative compound expansion near Jimma.',
    },
    responsibleOffice: 'Oromia Bureau of Agriculture — Coffee & Horticulture Directorate',
  },
  {
    opportunityId: 'opp_proto_arsi_bale_wheat_logistics',
    title: 'Arsi–Bale wheat warehouse & logistics corridor',
    slug: 'arsi-bale-wheat-warehouse-logistics',
    zoneIds: ['arsi', 'west_arsi', 'bale'],
    commodityKeys: ['wheat'],
    opportunityType: 'warehouse_logistics',
    summary:
      'Strategic wheat storage, cleaning, and freight aggregation on the Arsi–Bale breadbasket corridor.',
    description:
      'Multi-zone cereal logistics (warehouses, bagging, quality control) serving Asella, Shashamane, and Robe surplus areas. Supports national wheat self-sufficiency logistics informed by CSA Meher highland wheat patterns and OBoA cereals marketing priorities.',
    estimatedInvestmentRange: {
      minUsd: 4_000_000,
      maxUsd: 12_000_000,
      notes: 'Indicative range for 20–40k MT storage + handling equipment.',
    },
    landInformation: {
      totalHa: 25,
      tenureType: 'government_lease',
      notes: 'Warehouse parks near primary markets / trunk roads.',
    },
    responsibleOffice: 'Oromia Bureau of Agriculture — Cereals & Marketing',
  },
  {
    opportunityId: 'opp_proto_east_shewa_irrigation',
    title: 'East Shewa irrigated commercial agriculture scheme',
    slug: 'east-shewa-irrigated-commercial-agriculture',
    zoneIds: ['east_shewa'],
    commodityKeys: ['maize', 'wheat'],
    opportunityType: 'irrigation_scheme',
    summary:
      'Expand irrigated command area near Adama for commercial maize, wheat, and horticulture.',
    description:
      'Irrigation and on-farm infrastructure partnership leveraging East Shewa logistics access to the national market. Suitable for nucleus farm / outgrower models subject to verified water allocation review.',
    estimatedInvestmentRange: {
      minUsd: 3_000_000,
      maxUsd: 10_000_000,
      notes: 'Depends on water works scope and power connection.',
    },
    landInformation: {
      totalHa: 1500,
      tenureType: 'lease_with_outgrowers',
      notes: 'Indicative irrigated command area (prototype).',
    },
    responsibleOffice: 'Oromia Bureau of Agriculture — Irrigation & Water Use',
  },
  {
    opportunityId: 'opp_proto_guji_coffee_value_add',
    title: 'Guji specialty coffee value-addition & roasting hub',
    slug: 'guji-specialty-coffee-value-addition',
    zoneIds: ['guji', 'west_guji'],
    commodityKeys: ['coffee'],
    opportunityType: 'processing_cluster',
    summary:
      'Local roasting, packaging, and specialty lot preparation for Guji / West Guji origins.',
    description:
      'Specialty coffee value addition (micro-lot preparation, roasting for domestic/export niches) tied to Guji and West Guji production densification recognized in OBoA coffee corridor notes.',
    estimatedInvestmentRange: {
      minUsd: 1_200_000,
      maxUsd: 4_500_000,
    },
    landInformation: {
      totalHa: 6,
      tenureType: 'lease_or_cooperative_joint_venture',
    },
    responsibleOffice: 'Oromia Bureau of Agriculture — Coffee & Horticulture Directorate',
  },
  {
    opportunityId: 'opp_proto_borena_livestock',
    title: 'Borena livestock market & veterinary corridor upgrade',
    slug: 'borena-livestock-market-veterinary-corridor',
    zoneIds: ['borena', 'east_borena'],
    commodityKeys: ['livestock'],
    opportunityType: 'livestock_corridor',
    summary:
      'Upgrade Yabello–Moyale livestock markets, holding grounds, and veterinary posts for trade and animal health.',
    description:
      'Pastoral corridor opportunity focusing on market yards, water points, and veterinary services supporting cattle and small-ruminant trade toward Moyale — a priority livestock corridor in OBoA livestock development planning.',
    estimatedInvestmentRange: {
      minUsd: 1_500_000,
      maxUsd: 5_000_000,
    },
    landInformation: {
      totalHa: 40,
      tenureType: 'communal_with_lga_lease',
      notes: 'Market and holding-ground footprints (prototype).',
    },
    responsibleOffice: 'Oromia Bureau of Agriculture — Livestock Development',
  },
  {
    opportunityId: 'opp_proto_wellega_maize_processing',
    title: 'Western Wellega maize milling & feed processing',
    slug: 'western-wellega-maize-milling-feed',
    zoneIds: ['east_wellega', 'west_wellega', 'horo_gudru_wellega'],
    commodityKeys: ['maize'],
    opportunityType: 'processing_cluster',
    summary:
      'Maize milling and animal-feed processing drawing on western Oromia maize surplus.',
    description:
      'Processing investment linked to East/West Wellega and Horo Gudru maize production (CSA Meher maize belt), with warehouse aggregation and feed markets serving livestock producers.',
    estimatedInvestmentRange: {
      minUsd: 2_000_000,
      maxUsd: 7_000_000,
    },
    landInformation: {
      totalHa: 10,
      tenureType: 'industrial_lease',
    },
    responsibleOffice: 'Oromia Bureau of Agriculture — Agro-processing & Investment Desk',
  },
  {
    opportunityId: 'opp_proto_hararghe_coffee_coldchain',
    title: 'Hararghe Harar coffee cold-chain & quality hub',
    slug: 'hararghe-harar-coffee-cold-chain',
    zoneIds: ['west_hararghe', 'east_hararghe'],
    commodityKeys: ['coffee'],
    opportunityType: 'cold_chain',
    summary:
      'Cold storage, dry mills, and quality control for Harar specialty coffee on the Chiro–Harar corridor.',
    description:
      'Cold-chain and quality infrastructure opportunity for Harar-origin coffee, combining West and East Hararghe aggregation with temperature-controlled holding and cupping capacity. Anchored to OBoA specialty coffee corridor notes.',
    estimatedInvestmentRange: {
      minUsd: 1_800_000,
      maxUsd: 6_000_000,
      notes: 'Cold rooms + mill upgrade + lab (indicative).',
    },
    landInformation: {
      totalHa: 8,
      tenureType: 'lease_or_ppp_site',
      notes: 'Near Chiro / Harar corridor aggregation points.',
    },
    responsibleOffice: 'Oromia Bureau of Agriculture — Coffee & Horticulture Directorate',
  },
  {
    opportunityId: 'opp_proto_west_shewa_wheat_mill',
    title: 'West Shewa wheat milling & bakery-flour cluster',
    slug: 'west-shewa-wheat-milling-cluster',
    zoneIds: ['west_shewa', 'south_west_shewa', 'north_shewa'],
    commodityKeys: ['wheat'],
    opportunityType: 'processing_cluster',
    summary:
      'Flour milling and bakery-grade wheat processing serving Ambo–Woliso–Fiche highland production.',
    description:
      'Cereal processing investment drawing on West Shewa, South West Shewa, and North Shewa wheat surplus. Complements Arsi–Bale logistics with closer-to-market milling for Finfinne demand.',
    estimatedInvestmentRange: {
      minUsd: 2_200_000,
      maxUsd: 7_500_000,
    },
    landInformation: {
      totalHa: 8,
      tenureType: 'industrial_lease',
    },
    responsibleOffice: 'Oromia Bureau of Agriculture — Cereals & Marketing',
  },
  {
    opportunityId: 'opp_proto_kelem_irrigation',
    title: 'Kelem Wellega smallholder irrigation expansion',
    slug: 'kelem-wellega-smallholder-irrigation',
    zoneIds: ['kelem_wellega'],
    commodityKeys: ['maize', 'horticulture'],
    opportunityType: 'irrigation_scheme',
    summary:
      'Surface and small-scale irrigation for mixed cereals and horticulture around Dembi Dolo.',
    description:
      'Irrigation scheme partnership to raise yields for maize and horticulture in Kelem Wellega, consistent with OBoA irrigation prioritization in western lowland–midland transition zones.',
    estimatedInvestmentRange: {
      minUsd: 1_000_000,
      maxUsd: 3_500_000,
    },
    landInformation: {
      totalHa: 1200,
      tenureType: 'lease_with_outgrowers',
      notes: 'Indicative command area (prototype).',
    },
    responsibleOffice: 'Oromia Bureau of Agriculture — Irrigation & Water Use',
  },
  {
    opportunityId: 'opp_proto_shager_agri_logistics',
    title: 'Shager / Finfinne metro agri-logistics & wholesale hub',
    slug: 'shager-finfinne-agri-logistics-hub',
    zoneIds: ['shager_city', 'east_shewa'],
    commodityKeys: ['maize', 'wheat', 'horticulture'],
    opportunityType: 'warehouse_logistics',
    summary:
      'Metro wholesale, cold rooms, and last-mile agri-logistics linking regional surplus to Finfinne markets.',
    description:
      'Urban–peri-urban logistics opportunity for aggregation, cold holding, and distribution serving the capital market. Complements East Shewa corridor logistics and OBoA market systems priorities.',
    estimatedInvestmentRange: {
      minUsd: 5_000_000,
      maxUsd: 15_000_000,
      notes: 'Land-intensive metro logistics CAPEX (indicative).',
    },
    landInformation: {
      totalHa: 15,
      tenureType: 'lease_or_ppp_site',
      notes: 'Wholesale / logistics yard near trunk roads.',
    },
    responsibleOffice: 'Oromia Bureau of Agriculture — Investment & Market Systems',
  },
  {
    opportunityId: 'opp_proto_east_bale_livestock_feed',
    title: 'East Bale livestock feed & market services',
    slug: 'east-bale-livestock-feed-market-services',
    zoneIds: ['east_bale', 'bale'],
    commodityKeys: ['livestock', 'wheat'],
    opportunityType: 'livestock_corridor',
    summary:
      'Feed milling, market yards, and veterinary outreach for East Bale pastoral–agropastoral systems.',
    description:
      'Integrated livestock services opportunity combining feed processing from local cereals with market and animal-health infrastructure in East Bale / Bale transition zones.',
    estimatedInvestmentRange: {
      minUsd: 1_400_000,
      maxUsd: 4_800_000,
    },
    landInformation: {
      totalHa: 20,
      tenureType: 'government_lease',
    },
    responsibleOffice: 'Oromia Bureau of Agriculture — Livestock Development',
  },
  {
    opportunityId: 'opp_proto_input_seed_distribution',
    title: 'Regional seed & input distribution network (central & east)',
    slug: 'regional-seed-input-distribution-network',
    zoneIds: ['east_shewa', 'arsi', 'west_hararghe', 'jimma'],
    commodityKeys: ['wheat', 'maize', 'coffee'],
    opportunityType: 'input_services',
    summary:
      'Multi-zone seed, fertilizer, and agro-input distribution hubs serving priority production belts.',
    description:
      'Input-services investment linking certified seed and fertilizer last-mile distribution to coffee, wheat, and maize belts. Supports OBoA extension and private agro-dealer models with zone warehouses.',
    estimatedInvestmentRange: {
      minUsd: 2_000_000,
      maxUsd: 6_500_000,
    },
    landInformation: {
      totalHa: 5,
      tenureType: 'lease_network',
      notes: 'Multiple small hubs rather than one site.',
    },
    responsibleOffice: 'Oromia Bureau of Agriculture — Input Supply & Extension Support',
  },
];

export function prototypeOpportunitySourceIds(): string[] {
  return [
    PROTOTYPE_OPP_SOURCE_IDS.pipelineBrief,
    PROTOTYPE_OPP_SOURCE_IDS.csaAgss,
    PROTOTYPE_OPP_SOURCE_IDS.oboaZone,
    PROTOTYPE_OPP_SOURCE_IDS.corridorNotes,
    PROTOTYPE_OPP_SOURCE_IDS.compilation,
  ];
}
