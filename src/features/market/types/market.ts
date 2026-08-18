import type { Timestamp } from 'firebase/firestore';
import type { MarketUnitKey } from '../constants/marketCommodities';

/**
 * A price sighting.
 *
 * One document per observation, never overwritten. That is the whole design.
 *
 * The obvious alternative — one row per commodity and market, updated each week
 * — throws away the previous number, and the previous number is the only thing
 * that makes `changePercent` and `trend` mean anything. Systems that store the
 * trend as a typed-in field end up with an arrow pointing up beside a price that
 * fell, because the two are maintained by different hands on different days.
 *
 * Keeping every sighting costs one document a week per series and makes the
 * change, the direction and the whole price history derivable rather than
 * asserted. It is the same reasoning as the fuel log: record what was seen, work
 * out what it means.
 */
export interface MarketPriceObservation {
  observationId: string;

  /** Which series this belongs to. Together these two are the series key. */
  commodityKey: string;
  marketId: string;

  /** Carried for querying and display; derived from the market centre. */
  zoneId: string;

  /**
   * The price, always in the commodity's canonical unit.
   *
   * What the officer typed may have been per kilogram; the service converts
   * before writing so a series is never a mixture of scales.
   */
  priceETB: number;
  unitKey: MarketUnitKey;

  /** What was actually entered, kept so a conversion can be audited or undone. */
  enteredPriceETB: number;
  enteredUnitKey: MarketUnitKey;

  /** The day the price was seen at the market, not the day it was typed in. */
  observedAt: Timestamp;

  recordedByUid: string;
  recordedByName: string;
  createdAt?: Timestamp | null;

  /**
   * Set when a later entry corrects this one. A superseded observation stays
   * visible and drops out of every figure, rather than being edited away.
   */
  supersededAt?: Timestamp | null;
  supersededByUid?: string | null;
  supersedeReason?: string | null;
}

/** A series' latest price with the movement since the one before it. */
export interface MarketPricePoint {
  commodityKey: string;
  marketId: string;
  zoneId: string;
  priceETB: number;
  unitKey: MarketUnitKey;
  observedAt: Timestamp;
  /** Null when there is no earlier observation to compare against. */
  changePercent: number | null;
  trend: MarketTrend;
  previousPriceETB: number | null;
  observationId: string;
}

export type MarketTrend = 'up' | 'down' | 'stable' | 'new';
