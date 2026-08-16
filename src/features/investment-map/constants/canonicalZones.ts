/**
 * Milestone M4 Canonical Candidate Inventory
 * Frozen 22 ADM2 Zone Identifiers derived from UN-OCHA COD-AB v04 dataset.
 */

export const CANONICAL_ZONE_IDS = [
  'west_wellega',
  'east_wellega',
  'ilu_aba_bora',
  'jimma',
  'west_shewa',
  'north_shewa',
  'east_shewa',
  'arsi',
  'west_hararghe',
  'east_hararghe',
  'bale',
  'borena',
  'south_west_shewa',
  'guji',
  'west_guji',
  'buno_bedele',
  'west_arsi',
  'kelem_wellega',
  'horo_gudru_wellega',
  'shager_city',
  'east_bale',
  'east_borena',
] as const;

export type CanonicalZoneId = (typeof CANONICAL_ZONE_IDS)[number];

export function isCanonicalZoneId(id: unknown): id is CanonicalZoneId {
  return typeof id === 'string' && CANONICAL_ZONE_IDS.includes(id as CanonicalZoneId);
}

export interface CanonicalZoneInfo {
  zoneId: CanonicalZoneId;
  displayName: string;
  pcode: string;
}

export const CANONICAL_ZONE_METADATA: Record<CanonicalZoneId, CanonicalZoneInfo> = {
  west_wellega: { zoneId: 'west_wellega', displayName: 'West Wellega', pcode: 'ET0401' },
  east_wellega: { zoneId: 'east_wellega', displayName: 'East Wellega', pcode: 'ET0402' },
  ilu_aba_bora: { zoneId: 'ilu_aba_bora', displayName: 'Ilu Aba Bora', pcode: 'ET0403' },
  jimma: { zoneId: 'jimma', displayName: 'Jimma', pcode: 'ET0404' },
  west_shewa: { zoneId: 'west_shewa', displayName: 'West Shewa', pcode: 'ET0405' },
  north_shewa: { zoneId: 'north_shewa', displayName: 'North Shewa', pcode: 'ET0406' },
  east_shewa: { zoneId: 'east_shewa', displayName: 'East Shewa', pcode: 'ET0407' },
  arsi: { zoneId: 'arsi', displayName: 'Arsi', pcode: 'ET0408' },
  west_hararghe: { zoneId: 'west_hararghe', displayName: 'West Hararghe', pcode: 'ET0409' },
  east_hararghe: { zoneId: 'east_hararghe', displayName: 'East Hararghe', pcode: 'ET0410' },
  bale: { zoneId: 'bale', displayName: 'Bale', pcode: 'ET0411' },
  borena: { zoneId: 'borena', displayName: 'Borena', pcode: 'ET0412' },
  south_west_shewa: { zoneId: 'south_west_shewa', displayName: 'South West Shewa', pcode: 'ET0413' },
  guji: { zoneId: 'guji', displayName: 'Guji', pcode: 'ET0414' },
  west_guji: { zoneId: 'west_guji', displayName: 'West Guji', pcode: 'ET0415' },
  buno_bedele: { zoneId: 'buno_bedele', displayName: 'Buno Bedele', pcode: 'ET0416' },
  west_arsi: { zoneId: 'west_arsi', displayName: 'West Arsi', pcode: 'ET0417' },
  kelem_wellega: { zoneId: 'kelem_wellega', displayName: 'Kelem Wellega', pcode: 'ET0418' },
  horo_gudru_wellega: { zoneId: 'horo_gudru_wellega', displayName: 'Horo Gudru Wellega', pcode: 'ET0419' },
  shager_city: { zoneId: 'shager_city', displayName: 'Shager City', pcode: 'ET0420' },
  east_bale: { zoneId: 'east_bale', displayName: 'East Bale', pcode: 'ET0421' },
  east_borena: { zoneId: 'east_borena', displayName: 'East Borena', pcode: 'ET0422' },
};
