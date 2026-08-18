import type { LocalizedText } from '../../../types';
import type { CanonicalZoneId } from '../../investment-map/constants/canonicalZones';

/**
 * What can be priced, where, and in what.
 *
 * A closed dictionary rather than free text, for two reasons.
 *
 * The first is arithmetic. Every figure the market section reports is a
 * comparison between two prices for the same thing, so "Teff", "teff" and
 * "Teff (White)" typed on three different weeks are three different series, each
 * with too little history to say anything. Names have to be picked, not typed.
 *
 * The second is the language. Commodity, unit and market are all trilingual, and
 * a clerk entering a dozen prices a week is not going to type
 * "Teff / ጤፍ / Xaafii" a dozen times. Named once here, weekly entry becomes
 * pick, pick, type a number. The drift this prevents is already visible: the
 * admin page invented its own flat English rows while the public section renders
 * a trilingual shape, and nothing forced them to agree.
 *
 * Zones are deliberately not redefined — they come from CANONICAL_ZONE_METADATA,
 * which the investment map, the fleet register and the security rules all
 * already share.
 */

/* ------------------------------------------------------------------- units */

export const MARKET_UNIT_KEYS = ['quintal', 'kg', 'head', 'litre'] as const;
export type MarketUnitKey = (typeof MARKET_UNIT_KEYS)[number];

export interface MarketUnitInfo {
  unitKey: MarketUnitKey;
  label: LocalizedText;
  /**
   * Kilograms in one of this unit, for units that measure weight.
   *
   * Null means the unit is a count or a volume and cannot be converted to
   * another. A head of cattle is not a number of kilograms of anything, and
   * pretending otherwise is how a herd gets priced like grain.
   */
  kilograms: number | null;
}

export const MARKET_UNITS: Record<MarketUnitKey, MarketUnitInfo> = {
  quintal: {
    unitKey: 'quintal',
    label: { om: 'Kuntaala (100kg)', am: 'ኩንታል (100ኪግ)', en: 'Quintal (100kg)' },
    kilograms: 100,
  },
  kg: {
    unitKey: 'kg',
    label: { om: 'Kiiloogiraama', am: 'ኪሎግራም', en: 'Kilogram' },
    kilograms: 1,
  },
  head: {
    unitKey: 'head',
    label: { om: 'Mataa tokko', am: 'በራስ', en: 'Per head' },
    kilograms: null,
  },
  litre: {
    unitKey: 'litre',
    label: { om: 'Liitira', am: 'ሊትር', en: 'Litre' },
    kilograms: null,
  },
};

/* ------------------------------------------------------------- commodities */

export type MarketCommodityGroup = 'cereal' | 'pulse' | 'oilseed' | 'cash_crop' | 'livestock';

export interface MarketCommodityInfo {
  commodityKey: string;
  name: LocalizedText;
  group: MarketCommodityGroup;
  /**
   * The unit this commodity's series is stored in.
   *
   * Entry may use any compatible unit; the service converts to this one before
   * writing. Without that, a price entered per kilogram lands in a series
   * recorded per quintal and every later comparison is out by a hundred — the
   * same silent corruption as a mistyped odometer reading, and just as hard to
   * spot afterwards because the number still looks like a price.
   */
  canonicalUnit: MarketUnitKey;
}

export const MARKET_COMMODITIES: MarketCommodityInfo[] = [
  {
    commodityKey: 'teff_white',
    name: { om: 'Xaafii Adii', am: 'ነጭ ጤፍ', en: 'Teff (White)' },
    group: 'cereal',
    canonicalUnit: 'quintal',
  },
  {
    commodityKey: 'teff_red',
    name: { om: 'Xaafii Diimaa', am: 'ቀይ ጤፍ', en: 'Teff (Red)' },
    group: 'cereal',
    canonicalUnit: 'quintal',
  },
  {
    commodityKey: 'wheat',
    name: { om: 'Qamadii', am: 'ስንዴ', en: 'Wheat' },
    group: 'cereal',
    canonicalUnit: 'quintal',
  },
  {
    commodityKey: 'maize',
    name: { om: 'Boqqolloo', am: 'በቆሎ', en: 'Maize' },
    group: 'cereal',
    canonicalUnit: 'quintal',
  },
  {
    commodityKey: 'barley',
    name: { om: 'Garbuu', am: 'ገብስ', en: 'Barley' },
    group: 'cereal',
    canonicalUnit: 'quintal',
  },
  {
    commodityKey: 'sorghum',
    name: { om: 'Bishingaa', am: 'ማሽላ', en: 'Sorghum' },
    group: 'cereal',
    canonicalUnit: 'quintal',
  },
  {
    commodityKey: 'faba_bean',
    name: { om: 'Baaqelaa', am: 'ባቄላ', en: 'Faba Bean' },
    group: 'pulse',
    canonicalUnit: 'quintal',
  },
  {
    commodityKey: 'chickpea',
    name: { om: 'Shumburaa', am: 'ሽምብራ', en: 'Chickpea' },
    group: 'pulse',
    canonicalUnit: 'quintal',
  },
  {
    commodityKey: 'kidney_bean',
    name: { om: 'Boloqqee Diimaa', am: 'ቀይ ቦሎቄ', en: 'Red Kidney Bean' },
    group: 'pulse',
    canonicalUnit: 'quintal',
  },
  {
    commodityKey: 'lentil',
    name: { om: 'Misira', am: 'ምስር', en: 'Lentil' },
    group: 'pulse',
    canonicalUnit: 'quintal',
  },
  {
    commodityKey: 'sesame',
    name: { om: 'Salixa', am: 'ሰሊጥ', en: 'Sesame' },
    group: 'oilseed',
    canonicalUnit: 'quintal',
  },
  {
    commodityKey: 'niger_seed',
    name: { om: 'Nuugii', am: 'ኑግ', en: 'Niger Seed' },
    group: 'oilseed',
    canonicalUnit: 'quintal',
  },
  {
    commodityKey: 'coffee_washed',
    name: { om: 'Buna Dhiqame', am: 'የታጠበ ቡና', en: 'Coffee (Washed)' },
    group: 'cash_crop',
    canonicalUnit: 'quintal',
  },
  {
    commodityKey: 'coffee_natural',
    name: { om: 'Buna Uumamaa', am: 'ተፈጥሯዊ ቡና', en: 'Coffee (Natural)' },
    group: 'cash_crop',
    canonicalUnit: 'quintal',
  },
  {
    commodityKey: 'cattle_ox',
    name: { om: 'Sangaa', am: 'በሬ', en: 'Ox' },
    group: 'livestock',
    canonicalUnit: 'head',
  },
  {
    commodityKey: 'sheep',
    name: { om: 'Hoolaa', am: 'በግ', en: 'Sheep' },
    group: 'livestock',
    canonicalUnit: 'head',
  },
  {
    commodityKey: 'goat',
    name: { om: 'Re’ee', am: 'ፍየል', en: 'Goat' },
    group: 'livestock',
    canonicalUnit: 'head',
  },
  {
    commodityKey: 'cow_milk',
    name: { om: 'Aannan Saawaa', am: 'የላም ወተት', en: 'Cow Milk' },
    group: 'livestock',
    canonicalUnit: 'litre',
  },
];

export const MARKET_COMMODITY_BY_KEY: Record<string, MarketCommodityInfo> = Object.fromEntries(
  MARKET_COMMODITIES.map((c) => [c.commodityKey, c])
);

export const MARKET_COMMODITY_GROUP_LABELS: Record<MarketCommodityGroup, LocalizedText> = {
  cereal: { om: 'Midhaan', am: 'እህል', en: 'Cereals' },
  pulse: { om: 'Midhaan Facaasaa', am: 'ጥራጥሬ', en: 'Pulses' },
  oilseed: { om: 'Sanyii Zayitii', am: 'የቅባት እህል', en: 'Oilseeds' },
  cash_crop: { om: 'Midhaan Gurgurtaa', am: 'የገንዘብ ሰብል', en: 'Cash Crops' },
  livestock: { om: 'Horii', am: 'የቤት እንስሳት', en: 'Livestock' },
};

/* ---------------------------------------------------------- market centres */

export interface MarketCentreInfo {
  marketId: string;
  name: LocalizedText;
  /** The zone the market sits in, from the canonical list the rest of the site uses. */
  zoneId: CanonicalZoneId;
}

export const MARKET_CENTRES: MarketCentreInfo[] = [
  {
    marketId: 'adama_central',
    name: { om: 'Gabaa Giddugaleessaa Adaamaa', am: 'አዳማ ማዕከላዊ ገበያ', en: 'Adama Central Market' },
    zoneId: 'east_shewa',
  },
  {
    marketId: 'asella',
    name: { om: 'Gabaa Asallaa', am: 'አሰላ ገበያ', en: 'Asella Market' },
    zoneId: 'arsi',
  },
  {
    marketId: 'shashamane',
    name: { om: 'Gabaa Shaashamannee', am: 'ሻሸመኔ ገበያ', en: 'Shashamane Market' },
    zoneId: 'west_arsi',
  },
  {
    marketId: 'jimma_main',
    name: { om: 'Gabaa Guddaa Jimmaa', am: 'ጅማ ዋና ገበያ', en: 'Jimma Main Market' },
    zoneId: 'jimma',
  },
  {
    marketId: 'nekemte',
    name: { om: 'Gabaa Naqamtee', am: 'ነቀምት ገበያ', en: 'Nekemte Market' },
    zoneId: 'east_wellega',
  },
  {
    marketId: 'bishoftu',
    name: { om: 'Gabaa Bishooftuu', am: 'ቢሾፍቱ ገበያ', en: 'Bishoftu Market' },
    zoneId: 'east_shewa',
  },
  {
    marketId: 'ambo',
    name: { om: 'Gabaa Amboo', am: 'አምቦ ገበያ', en: 'Ambo Market' },
    zoneId: 'west_shewa',
  },
  {
    marketId: 'chiro',
    name: { om: 'Gabaa Ciroo', am: 'ጭሮ ገበያ', en: 'Chiro Market' },
    zoneId: 'west_hararghe',
  },
  {
    marketId: 'robe_bale',
    name: { om: 'Gabaa Roobee', am: 'ሮቤ ገበያ', en: 'Robe Market' },
    zoneId: 'bale',
  },
  {
    marketId: 'yabelo',
    name: { om: 'Gabaa Yaaballoo', am: 'ያቤሎ ገበያ', en: 'Yabelo Market' },
    zoneId: 'borena',
  },
];

export const MARKET_CENTRE_BY_ID: Record<string, MarketCentreInfo> = Object.fromEntries(
  MARKET_CENTRES.map((m) => [m.marketId, m])
);
