/**
 * Investment CMS prototype infrastructure seed — source-attributed facilities.
 *
 * Coordinates are APPROXIMATE town/office locations used for map placement only.
 * They are not surveyed cadastral points. Capacities are prototype estimates
 * aligned with OBoA / corridor investment narratives for demonstration.
 */

import { CanonicalZoneId, CANONICAL_ZONE_METADATA } from '../features/investment-map/constants/canonicalZones';
import { InfrastructureCategory, FacilityOwnership } from '../types/investment';
import { PROTOTYPE_SEED_VERSION, PROTOTYPE_SOURCE_IDS } from './investmentPrototypeSeedData';

export const PROTOTYPE_INFRA_SEED_VERSION = `${PROTOTYPE_SEED_VERSION}-infra`;

export const PROTOTYPE_INFRA_SOURCE_IDS = {
  oboaInventory: 'src_oboa_infra_inventory_2025',
  corridorNotes: 'src_oab_agri_corridor_notes_2025',
  compilation: PROTOTYPE_SOURCE_IDS.compilation,
} as const;

/** Approximate zone reference points (major town / bureau office vicinity). */
export const ZONE_APPROX_POINTS: Record<CanonicalZoneId, { lat: number; lng: number; place: string }> = {
  west_wellega: { lat: 9.17, lng: 35.83, place: 'Gimbi' },
  east_wellega: { lat: 9.08, lng: 36.55, place: 'Nekemte' },
  ilu_aba_bora: { lat: 8.3, lng: 35.58, place: 'Metu' },
  jimma: { lat: 7.67, lng: 36.83, place: 'Jimma' },
  west_shewa: { lat: 8.98, lng: 37.85, place: 'Ambo' },
  north_shewa: { lat: 9.77, lng: 38.73, place: 'Fiche' },
  east_shewa: { lat: 8.54, lng: 39.27, place: 'Adama' },
  arsi: { lat: 7.95, lng: 39.14, place: 'Asella' },
  west_hararghe: { lat: 9.08, lng: 40.87, place: 'Chiro' },
  east_hararghe: { lat: 9.31, lng: 42.12, place: 'Harar corridor' },
  bale: { lat: 7.12, lng: 40.0, place: 'Robe' },
  borena: { lat: 4.89, lng: 38.08, place: 'Yabello' },
  south_west_shewa: { lat: 8.54, lng: 37.97, place: 'Woliso' },
  guji: { lat: 5.33, lng: 39.58, place: 'Negele' },
  west_guji: { lat: 5.59, lng: 38.25, place: 'Bule Hora' },
  buno_bedele: { lat: 8.45, lng: 36.35, place: 'Bedele' },
  west_arsi: { lat: 7.2, lng: 38.6, place: 'Shashamane' },
  kelem_wellega: { lat: 8.53, lng: 34.8, place: 'Dembi Dolo' },
  horo_gudru_wellega: { lat: 9.57, lng: 37.1, place: 'Shambu' },
  shager_city: { lat: 9.03, lng: 38.74, place: 'Finfinne metro' },
  east_bale: { lat: 7.15, lng: 40.71, place: 'Ginnir' },
  east_borena: { lat: 3.95, lng: 38.75, place: 'Moyale corridor' },
};

export interface PrototypeFacilitySpec {
  facilityId: string;
  zoneId: CanonicalZoneId;
  category: InfrastructureCategory;
  titleEn: string;
  descriptionEn: string;
  /** Small offset from zone reference point (degrees). */
  dLat: number;
  dLng: number;
  ownership: FacilityOwnership;
  operatorName: string;
  capacityMt?: number;
  capacityHa?: number;
  commodityKeys?: string[];
  commissioningYear?: number;
}

function offsetPoint(zoneId: CanonicalZoneId, dLat: number, dLng: number) {
  const base = ZONE_APPROX_POINTS[zoneId];
  return { lat: +(base.lat + dLat).toFixed(5), lng: +(base.lng + dLng).toFixed(5), place: base.place };
}

/**
 * Build ~3 facilities per zone (66 total) with a realistic category mix:
 * warehouse/collection + market/input + zone-specialized third site.
 */
export function buildPrototypeFacilitySpecs(): PrototypeFacilitySpec[] {
  const specs: PrototypeFacilitySpec[] = [];

  const specialization: Record<
    CanonicalZoneId,
    { category: InfrastructureCategory; title: string; desc: string; commodities?: string[]; capacityMt?: number; capacityHa?: number }
  > = {
    jimma: {
      category: 'processing',
      title: 'Jimma coffee wet & dry mill cluster',
      desc: 'Cooperative coffee processing node serving Jimma specialty and commercial lots.',
      commodities: ['coffee'],
      capacityMt: 12000,
    },
    guji: {
      category: 'processing',
      title: 'Guji specialty coffee processing hub',
      desc: 'Washing station and dry mill capacity for Guji specialty coffee.',
      commodities: ['coffee'],
      capacityMt: 8000,
    },
    west_guji: {
      category: 'cold_storage',
      title: 'West Guji cold room for cherry & inputs',
      desc: 'Cold storage supporting coffee cherry holding and agro-input temperature control.',
      commodities: ['coffee'],
      capacityMt: 1500,
    },
    ilu_aba_bora: {
      category: 'processing',
      title: 'Metu coffee & honey processing yard',
      desc: 'Mixed forest-agri processing yard near Metu.',
      commodities: ['coffee'],
      capacityMt: 5000,
    },
    buno_bedele: {
      category: 'collection_center',
      title: 'Bedele coffee aggregation center',
      desc: 'Primary aggregation for smallholder coffee deliveries.',
      commodities: ['coffee'],
      capacityMt: 3500,
    },
    west_wellega: {
      category: 'warehouse',
      title: 'Gimbi grain & coffee warehouse',
      desc: 'Multi-commodity warehouse for western Oromia coffee and maize.',
      commodities: ['coffee', 'maize'],
      capacityMt: 10000,
    },
    east_wellega: {
      category: 'processing',
      title: 'Nekemte maize milling & packing plant',
      desc: 'Maize milling serving East Wellega surplus corridors.',
      commodities: ['maize'],
      capacityMt: 20000,
    },
    kelem_wellega: {
      category: 'irrigation',
      title: 'Dembi Dolo smallholder irrigation scheme',
      desc: 'Surface irrigation supporting mixed cereals and horticulture.',
      capacityHa: 1200,
    },
    horo_gudru_wellega: {
      category: 'warehouse',
      title: 'Shambu cereal warehouse',
      desc: 'Cereal storage for Horo Gudru maize and wheat.',
      commodities: ['maize', 'wheat'],
      capacityMt: 8000,
    },
    arsi: {
      category: 'warehouse',
      title: 'Asella wheat strategic warehouse',
      desc: 'Strategic wheat storage on the Arsi breadbasket corridor.',
      commodities: ['wheat'],
      capacityMt: 25000,
    },
    west_arsi: {
      category: 'processing',
      title: 'Shashamane wheat & oilseed processing',
      desc: 'Flour and oilseed processing linked to West Arsi farms.',
      commodities: ['wheat'],
      capacityMt: 18000,
    },
    bale: {
      category: 'warehouse',
      title: 'Robe wheat & barley warehouse',
      desc: 'Large cereal warehouse serving Bale highland production.',
      commodities: ['wheat'],
      capacityMt: 22000,
    },
    east_bale: {
      category: 'livestock_market',
      title: 'Ginnir livestock trading ground',
      desc: 'Primary livestock market for East Bale pastoral–agropastoral trade.',
    },
    west_shewa: {
      category: 'irrigation',
      title: 'Ambo irrigated horticulture scheme',
      desc: 'Irrigation supporting wheat, maize, and horticulture near Ambo.',
      commodities: ['wheat', 'maize'],
      capacityHa: 2500,
    },
    south_west_shewa: {
      category: 'collection_center',
      title: 'Woliso grain collection center',
      desc: 'Farmer collection and quality screening for cereal marketing.',
      commodities: ['wheat', 'maize'],
      capacityMt: 6000,
    },
    north_shewa: {
      category: 'warehouse',
      title: 'Fiche highland wheat warehouse',
      desc: 'Wheat storage for North Shewa highland producers.',
      commodities: ['wheat'],
      capacityMt: 12000,
    },
    east_shewa: {
      category: 'logistics',
      title: 'Adama agri-logistics & freight yard',
      desc: 'Regional logistics hub linking East Shewa production to national corridors.',
      commodities: ['maize', 'wheat'],
      capacityMt: 30000,
    },
    west_hararghe: {
      category: 'processing',
      title: 'Chiro Harar coffee processing unit',
      desc: 'Specialty Harar coffee processing near Chiro.',
      commodities: ['coffee'],
      capacityMt: 4000,
    },
    east_hararghe: {
      category: 'cold_storage',
      title: 'Harar corridor cold storage',
      desc: 'Cold chain node for coffee and horticulture on the Harar corridor.',
      commodities: ['coffee'],
      capacityMt: 2000,
    },
    borena: {
      category: 'livestock_market',
      title: 'Yabello livestock market',
      desc: 'Major Borena cattle and small-ruminant trading market.',
    },
    east_borena: {
      category: 'veterinary',
      title: 'Moyale corridor veterinary post',
      desc: 'Veterinary and animal health post supporting cross-border livestock trade.',
    },
    shager_city: {
      category: 'laboratory',
      title: 'Finfinne soil & produce testing lab',
      desc: 'Central testing laboratory supporting investment due diligence and quality control.',
    },
  };

  for (const zoneId of Object.keys(ZONE_APPROX_POINTS) as CanonicalZoneId[]) {
    const meta = CANONICAL_ZONE_METADATA[zoneId];
    const place = ZONE_APPROX_POINTS[zoneId].place;
    const spec = specialization[zoneId];

    specs.push({
      facilityId: `fac_proto_${zoneId}_warehouse`,
      zoneId,
      category: 'warehouse',
      titleEn: `${meta.displayName} primary agricultural warehouse`,
      descriptionEn: `Government/cooperative warehouse near ${place} for cereal and cash-crop storage (prototype inventory).`,
      dLat: 0.02,
      dLng: -0.03,
      ownership: 'government',
      operatorName: 'Oromia Bureau of Agriculture / zone cooperative union',
      capacityMt: spec.capacityMt && spec.category === 'warehouse' ? spec.capacityMt : 5000,
      commodityKeys: spec.commodities || ['maize', 'wheat'],
      commissioningYear: 2018,
    });

    specs.push({
      facilityId: `fac_proto_${zoneId}_market`,
      zoneId,
      category: zoneId === 'borena' || zoneId === 'east_borena' || zoneId === 'east_bale' ? 'livestock_market' : 'market',
      titleEn:
        zoneId === 'borena' || zoneId === 'east_borena' || zoneId === 'east_bale'
          ? `${meta.displayName} livestock market`
          : `${meta.displayName} primary agricultural market`,
      descriptionEn: `Primary market facilitating farmer–trader exchange near ${place}.`,
      dLat: -0.025,
      dLng: 0.035,
      ownership: 'government',
      operatorName: `${meta.displayName} municipality / market committee`,
      commissioningYear: 2015,
    });

    specs.push({
      facilityId: `fac_proto_${zoneId}_specialty`,
      zoneId,
      category: spec.category,
      titleEn: spec.title,
      descriptionEn: spec.desc,
      dLat: 0.04,
      dLng: 0.02,
      ownership: spec.category === 'processing' || spec.category === 'cold_storage' ? 'cooperative' : 'government',
      operatorName:
        spec.category === 'processing' || spec.category === 'cold_storage'
          ? `${meta.displayName} cooperative union`
          : 'Oromia Bureau of Agriculture',
      capacityMt: spec.capacityMt,
      capacityHa: spec.capacityHa,
      commodityKeys: spec.commodities,
      commissioningYear: 2020,
    });
  }

  return specs;
}

export const PROTOTYPE_INFRA_SOURCES = [
  {
    sourceId: PROTOTYPE_INFRA_SOURCE_IDS.oboaInventory,
    title: 'OBoA zone agricultural infrastructure inventory (prototype pack)',
    organization: 'Oromia Bureau of Agriculture (OBoA)',
    documentTitle: 'Zone facility inventory — warehouses, markets, irrigation, processing',
    publicationDate: '2025-05-01',
    referencePeriod: '2024/2025',
    methodologyNotes:
      'Compiled from zone office facility lists and corridor investment briefs. Coordinates are approximate town-vicinity points for map display, not surveyed parcels.',
    license: 'Bureau internal / public Investment portal attribution required.',
    contactInfo: 'Oromia Bureau of Agriculture, Finfinne',
  },
  {
    sourceId: PROTOTYPE_INFRA_SOURCE_IDS.corridorNotes,
    title: 'OAB agribusiness corridor infrastructure notes',
    organization: 'Oromia Agriculture Bureau — Investment & Market Systems',
    documentTitle: 'Coffee, wheat, and maize corridor enabling infrastructure notes',
    publicationDate: '2025-07-01',
    referencePeriod: '2025',
    methodologyNotes:
      'Narrative corridor notes identifying priority warehouses, cold chain, processing, irrigation, and livestock markets used to prioritize prototype facility placement.',
    license: 'Prototype demonstration; replace with verified facility surveys before formal claims.',
  },
] as const;

export function resolveFacilityCoordinates(spec: PrototypeFacilitySpec) {
  return offsetPoint(spec.zoneId, spec.dLat, spec.dLng);
}
