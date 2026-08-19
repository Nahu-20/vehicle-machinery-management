import type { MarketPrice as PublicMarketPrice } from '../../../types';
import {
  CANONICAL_ZONE_METADATA,
  type CanonicalZoneId,
} from '../../investment-map/constants/canonicalZones';
import type { MarketPriceObservation, MarketPricePoint, MarketTrend } from '../types/market';
import {
  MARKET_CENTRE_BY_ID,
  MARKET_COMMODITY_BY_KEY,
  MARKET_UNITS,
  type MarketUnitKey,
} from './marketCommodities';

/**
 * The arithmetic of the market section, as pure functions.
 *
 * Nothing here touches Firestore or React. The service executes what these
 * decide, and the demo path calls exactly the same functions, so the two cannot
 * drift apart in the way the admin page and the public section already did. It
 * also means the rules that matter — what counts as a suspicious price, which
 * way an arrow points — can be tested without a project or a network.
 *
 * This is the same split as fleetVocabulary.ts and for the same reason.
 */

/* --------------------------------------------------------------- the series */

/** Two observations belong to the same series when both keys match. */
export function seriesKey(commodityKey: string, marketId: string): string {
  return `${commodityKey}::${marketId}`;
}

/** A superseded observation is a correction's shadow, not a price. */
export function isLive(o: MarketPriceObservation): boolean {
  return !o.supersededAt;
}

/* ------------------------------------------------------------- unit scaling */

/**
 * Convert an entered price to the unit the commodity's series is kept in.
 *
 * Returns null when the two units cannot be compared at all — a price per head
 * has no reading in quintals, and inventing one would be worse than refusing.
 *
 * This exists because the error it prevents is invisible. A teff price entered
 * as 92 per kilogram against a series held per quintal is not a wrong-looking
 * number; it is a plausible number in the wrong scale, and it drags the trend
 * for that week and the next one with it.
 */
export function toCanonicalUnit(
  price: number,
  fromUnit: MarketUnitKey,
  commodityKey: string
): { priceETB: number; unitKey: MarketUnitKey } | null {
  const commodity = MARKET_COMMODITY_BY_KEY[commodityKey];
  if (!commodity) return null;

  const target = commodity.canonicalUnit;
  if (fromUnit === target) return { priceETB: price, unitKey: target };

  const from = MARKET_UNITS[fromUnit];
  const to = MARKET_UNITS[target];
  if (!from || !to) return null;

  // Only weight converts to weight. Head and litre stand alone by design.
  if (from.kilograms == null || to.kilograms == null) return null;

  const scaled = (price / from.kilograms) * to.kilograms;
  // Money, so two decimals. Carrying more would show 9199.999999 on a slip that
  // said 92.
  return { priceETB: Math.round(scaled * 100) / 100, unitKey: target };
}

/** Which units an officer may enter this commodity in. */
export function enterableUnits(commodityKey: string): MarketUnitKey[] {
  const commodity = MARKET_COMMODITY_BY_KEY[commodityKey];
  if (!commodity) return [];
  const target = MARKET_UNITS[commodity.canonicalUnit];
  if (target.kilograms == null) return [commodity.canonicalUnit];
  return (Object.keys(MARKET_UNITS) as MarketUnitKey[]).filter(
    (k) => MARKET_UNITS[k].kilograms != null
  );
}

/* ------------------------------------------------------------------- change */

/**
 * Movement between two prices, as a percentage of the earlier one.
 *
 * Null when there is nothing to compare against — a first sighting has no
 * change, and reporting 0% would claim the price held steady when nobody knows
 * what it was before.
 */
export function changePercent(current: number, previous: number | null): number | null {
  if (previous == null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Which way the arrow points.
 *
 * A band around zero rather than an exact comparison: grain moving by a fifth of
 * a percent has not risen, and an arrow that flickers between weeks on rounding
 * noise teaches people to ignore it.
 */
export function deriveTrend(change: number | null, flatBand = 0.5): MarketTrend {
  if (change == null) return 'new';
  if (Math.abs(change) < flatBand) return 'stable';
  return change > 0 ? 'up' : 'down';
}

/* --------------------------------------------------------------- the series */

/**
 * Reduce raw observations to one current point per series.
 *
 * Takes observations in any order and returns, per series, the newest live
 * price with its movement against the one before it. Superseded rows are
 * dropped first so a correction cannot be compared against the mistake it
 * replaced.
 */
export function latestPerSeries(observations: MarketPriceObservation[]): MarketPricePoint[] {
  const bySeries = new Map<string, MarketPriceObservation[]>();

  for (const o of observations) {
    if (!isLive(o)) continue;
    const key = seriesKey(o.commodityKey, o.marketId);
    const bucket = bySeries.get(key);
    if (bucket) bucket.push(o);
    else bySeries.set(key, [o]);
  }

  const points: MarketPricePoint[] = [];

  for (const bucket of bySeries.values()) {
    // Ascending, so "the one before" is unambiguous whatever order they arrived.
    bucket.sort((a, b) => a.observedAt.toMillis() - b.observedAt.toMillis());
    const current = bucket[bucket.length - 1];
    const previous = bucket.length > 1 ? bucket[bucket.length - 2] : null;
    const change = changePercent(current.priceETB, previous?.priceETB ?? null);

    points.push({
      commodityKey: current.commodityKey,
      marketId: current.marketId,
      zoneId: current.zoneId,
      priceETB: current.priceETB,
      unitKey: current.unitKey,
      observedAt: current.observedAt,
      changePercent: change,
      trend: deriveTrend(change),
      previousPriceETB: previous?.priceETB ?? null,
      observationId: current.observationId,
    });
  }

  return points;
}

/* -------------------------------------------------------------- the guard */

/**
 * How far a price may move from the last one before somebody has to mean it.
 *
 * Thirty percent is wide on purpose. Staples genuinely swing — a harvest lands,
 * a road closes — and a threshold tight enough to catch every typo would stop
 * every real movement too, which trains people to click through the warning
 * without reading it. This is set to catch the order-of-magnitude slip, the
 * 92,000 for 9,200, not to police ordinary volatility.
 */
export const UNUSUAL_MOVE_PERCENT = 30;

export interface PriceEntryAssessment {
  /** False only when there is a previous price and the move exceeds the band. */
  usual: boolean;
  deviationPercent: number | null;
  message?: string;
}

/**
 * Is this price plausible, given the last one in its series?
 *
 * Price systems validate on entry against a band derived from the previous
 * period's quotes, and this is the small version of that. It exists because a
 * mistyped price is not one bad row: it is one bad row, and then a second bad
 * row when the next honest price is measured against it. Exactly the shape of
 * the fuel meter check.
 *
 * A first price cannot be unusual — there is nothing to be unusual against, and
 * refusing it would make the series impossible to start.
 */
export function assessPriceEntry(
  price: number,
  previousPrice: number | null,
  threshold = UNUSUAL_MOVE_PERCENT
): PriceEntryAssessment {
  if (previousPrice == null || previousPrice <= 0) {
    return { usual: true, deviationPercent: null };
  }

  const deviation = ((price - previousPrice) / previousPrice) * 100;
  const rounded = Math.round(deviation * 10) / 10;

  if (Math.abs(deviation) <= threshold) {
    return { usual: true, deviationPercent: rounded };
  }

  return {
    usual: false,
    deviationPercent: rounded,
    message:
      `${price.toLocaleString()} is ${Math.abs(rounded)}% ${
        deviation > 0 ? 'above' : 'below'
      } the last recorded ${previousPrice.toLocaleString()}. ` +
      'Check the figure and the unit, then record it again to confirm.',
  };
}

/* ------------------------------------------------------------- staleness */

/**
 * How long a price stays worth showing.
 *
 * Three weeks. Prices are gathered weekly, so this tolerates a missed round and
 * a late one before the figure stops being current. Past it the price is still
 * shown — hiding it would leave the section emptier than the register actually
 * is — but marked, because the reader's decision depends on knowing the number
 * is old.
 */
export const STALE_AFTER_DAYS = 21;

export function isStale(observedAtMs: number, now = Date.now(), days = STALE_AFTER_DAYS): boolean {
  return now - observedAtMs > days * 24 * 60 * 60 * 1000;
}

/* ------------------------------------------------------- the public shape */

/** `02 Aug 2026`, matching what the public section already renders. */
function formatObservedDate(ms: number): string {
  const d = new Date(ms);
  const month = d.toLocaleString('en-GB', { month: 'short' });
  return `${String(d.getDate()).padStart(2, '0')} ${month} ${d.getFullYear()}`;
}

/**
 * Turn stored observations into the shape the public section already renders.
 *
 * The view model is deliberately not what gets stored. MarketPrice carries a
 * change and a trend as plain fields because that is what a card needs to draw;
 * the register keeps neither, because storing a derived figure is how an arrow
 * ends up pointing the opposite way to the numbers beside it. This is the one
 * place the two meet.
 */
export function toPublicPrices(
  points: MarketPricePoint[],
  now = Date.now()
): PublicMarketPrice[] {
  return points
    .map((p) => {
      const commodity = MARKET_COMMODITY_BY_KEY[p.commodityKey];
      const centre = MARKET_CENTRE_BY_ID[p.marketId];
      const observedAtMs = p.observedAt.toMillis();

      return {
        id: p.observationId,
        commodityKey: p.commodityKey,
        commodity: commodity?.name ?? p.commodityKey,
        market: centre?.name ?? p.marketId,
        zone: CANONICAL_ZONE_METADATA[p.zoneId as CanonicalZoneId]?.displayName ?? p.zoneId,
        unit: MARKET_UNITS[p.unitKey]?.label ?? p.unitKey,
        priceETB: p.priceETB,
        // Zero only when there is genuinely no movement; isFirstPrice is what
        // tells the card not to draw a percentage at all.
        changePercent: p.changePercent ?? 0,
        trend: p.trend === 'new' ? 'stable' : p.trend,
        updatedDate: formatObservedDate(observedAtMs),
        isFirstPrice: p.trend === 'new',
        isStale: isStale(observedAtMs, now),
        observedAtMs,
      } satisfies PublicMarketPrice;
    })
    .sort((a, b) => (b.observedAtMs ?? 0) - (a.observedAtMs ?? 0));
}

/* ----------------------------------------------------------- comparison */

export interface MarketComparisonRow {
  marketId: string;
  zoneId: string;
  priceETB: number;
  observedAtMs: number;
  /** How far above the cheapest market this one is, as a percentage. */
  premiumPercent: number;
  isCheapest: boolean;
  isDearest: boolean;
  isStale: boolean;
}

/**
 * One commodity across every market that has a price for it.
 *
 * This is the comparison that actually changes a decision. A single national
 * average tells a farmer in Shashamane nothing; teff at 9,200 in Adama against
 * 8,600 where they are tells them whether the journey is worth making. It is
 * the core of every market information service worth using.
 *
 * The spread is measured from the cheapest rather than from an average, because
 * the question being asked is "how much more would I get elsewhere", and the
 * answer is relative to somewhere real rather than to a figure no market
 * charges.
 */
export function compareAcrossMarkets(
  points: MarketPricePoint[],
  commodityKey: string,
  now = Date.now()
): MarketComparisonRow[] {
  const forCommodity = points.filter((p) => p.commodityKey === commodityKey);
  if (forCommodity.length === 0) return [];

  const cheapest = Math.min(...forCommodity.map((p) => p.priceETB));
  const dearest = Math.max(...forCommodity.map((p) => p.priceETB));

  return forCommodity
    .map((p) => ({
      marketId: p.marketId,
      zoneId: p.zoneId,
      priceETB: p.priceETB,
      observedAtMs: p.observedAt.toMillis(),
      premiumPercent: cheapest > 0 ? Math.round(((p.priceETB - cheapest) / cheapest) * 1000) / 10 : 0,
      isCheapest: p.priceETB === cheapest,
      // Both flags on a single market is correct rather than a bug: with one
      // price recorded it is simultaneously the highest and the lowest, and
      // saying so is more honest than picking one.
      isDearest: p.priceETB === dearest,
      isStale: isStale(p.observedAt.toMillis(), now),
    }))
    .sort((a, b) => b.priceETB - a.priceETB);
}

/** The live history of one series, newest first, for a detail view. */
export function seriesHistory(
  observations: MarketPriceObservation[],
  commodityKey: string,
  marketId: string
): MarketPriceObservation[] {
  return observations
    .filter((o) => o.commodityKey === commodityKey && o.marketId === marketId && isLive(o))
    .sort((a, b) => b.observedAt.toMillis() - a.observedAt.toMillis());
}
