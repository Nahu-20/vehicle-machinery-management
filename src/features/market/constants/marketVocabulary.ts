import type { MarketPriceObservation, MarketPricePoint, MarketTrend } from '../types/market';
import {
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
