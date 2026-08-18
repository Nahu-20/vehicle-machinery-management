import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  where,
  limit as fsLimit,
  setDoc,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db, isFirebaseDemoMode } from '../../../lib/firebase';
import { logAuditEvent } from '../../../services/auditService';
import type { StaffUser } from '../../../types/auth';
import type { MarketPriceObservation, MarketPricePoint } from '../types/market';
import {
  MARKET_CENTRE_BY_ID,
  MARKET_COMMODITY_BY_KEY,
  type MarketUnitKey,
} from '../constants/marketCommodities';
import {
  assessPriceEntry,
  isLive,
  latestPerSeries,
  toCanonicalUnit,
} from '../constants/marketVocabulary';

/**
 * Recording what a commodity cost, and reading it back.
 *
 * Every figure the market section shows begins as a number somebody copied off a
 * board at a market on a particular morning. The service's job is to make sure
 * that number is in the right scale and against the right series before it
 * becomes a fact, because everything downstream is a comparison and a comparison
 * inherits every error in either half.
 */

export const MARKET_PRICES_COLLECTION = 'marketPrices';

export const isDemoMarket = (): boolean => isFirebaseDemoMode || !db;

/**
 * A price far enough from the last one that somebody should look again.
 *
 * Its own class rather than a plain Error so the page can offer to record it
 * anyway instead of just refusing. The point is a pause, not a prohibition: the
 * price may well be right, and a guard that cannot be overridden is a guard
 * people route around by entering the wrong thing somewhere else.
 */
export class MarketPriceOutlierError extends Error {
  constructor(
    message: string,
    public readonly price: number,
    public readonly previousPrice: number,
    public readonly deviationPercent: number
  ) {
    super(message);
    this.name = 'MarketPriceOutlierError';
  }
}

/** Firestore rejects undefined; optional fields must be dropped, not passed through. */
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

function requireDb() {
  if (!db) {
    throw new Error(
      'Firestore is not configured. Set the VITE_FIREBASE_* values to record prices.'
    );
  }
  return db;
}

/**
 * Prices held only for this browser session.
 *
 * Not a pretend database — a way for the page to be usable before anyone has
 * configured Firebase, and, more importantly, a path that calls exactly the same
 * validation as the live one. A guard that only exists on one side is worse than
 * no guard, because it looks like it works.
 */
const demoObservations: MarketPriceObservation[] = [];

/* ------------------------------------------------------------------ reads */

export async function listObservations(commodityKey?: string): Promise<MarketPriceObservation[]> {
  if (isDemoMarket()) {
    return demoObservations
      .filter((o) => !commodityKey || o.commodityKey === commodityKey)
      .sort((a, b) => b.observedAt.toMillis() - a.observedAt.toMillis());
  }

  const database = requireDb();
  const constraints: QueryConstraint[] = [];
  if (commodityKey) constraints.push(where('commodityKey', '==', commodityKey));
  // Newest first for display. latestPerSeries re-sorts ascending, because the
  // change is measured between neighbours and needs the other order.
  constraints.push(orderBy('observedAt', 'desc'), fsLimit(500));

  const snap = await getDocs(query(collection(database, MARKET_PRICES_COLLECTION), ...constraints));
  return snap.docs.map((d) => ({
    ...(d.data() as MarketPriceObservation),
    observationId: d.id,
  }));
}

/** The current price of everything, with its movement. */
export async function listLatestPrices(): Promise<MarketPricePoint[]> {
  return latestPerSeries(await listObservations());
}

/* ----------------------------------------------------------------- writes */

export interface RecordPriceInput {
  commodityKey: string;
  marketId: string;
  /** As typed, in whatever unit the officer chose. */
  price: number;
  unitKey: MarketUnitKey;
  /** The day it was seen at the market, not the day it was typed. */
  observedAt: Date;
  /**
   * Set once the officer has been shown an unusual-move warning and stands by
   * the figure. Defaults false, so the warning cannot be skipped by accident.
   */
  confirmUnusual?: boolean;
}

/**
 * The newest live price in a series, or null if this is the first.
 *
 * Filtered in memory off the recent observations rather than queried per
 * series. A regional bureau records tens of series a week, so the newest few
 * hundred rows always contain the last price for anything currently tracked,
 * and it avoids making price entry depend on a composite index existing —
 * which, on a project where the rules and indexes are edited by hand, is a
 * dependency worth not having.
 */
export async function previousPriceFor(
  commodityKey: string,
  marketId: string
): Promise<number | null> {
  const observations = await listObservations();
  const series = observations
    .filter((o) => o.commodityKey === commodityKey && o.marketId === marketId && isLive(o))
    .sort((a, b) => b.observedAt.toMillis() - a.observedAt.toMillis());
  return series.length ? series[0].priceETB : null;
}

/**
 * Checks shared by both paths, so the demo refuses exactly what the register does.
 *
 * The unit check is the one that earns its place. A price is refused outright
 * when it cannot be expressed in the series' unit, rather than stored in the
 * unit it arrived in, because a series that mixes scales produces comparisons
 * that are wrong without ever looking wrong.
 */
export function validatePrice(input: RecordPriceInput): {
  priceETB: number;
  unitKey: MarketUnitKey;
} {
  const commodity = MARKET_COMMODITY_BY_KEY[input.commodityKey];
  if (!commodity) throw new Error(`${input.commodityKey} is not a commodity in the price list.`);

  const market = MARKET_CENTRE_BY_ID[input.marketId];
  if (!market) throw new Error(`${input.marketId} is not a market centre in the list.`);

  if (!(input.price > 0)) throw new Error('The price must be more than zero.');
  if (!Number.isFinite(input.price)) throw new Error('That is not a price.');

  const observedMs = input.observedAt.getTime();
  if (Number.isNaN(observedMs)) throw new Error('Give the day the price was seen.');
  // A day's grace for timezones; beyond that somebody has typed the wrong year.
  if (observedMs > Date.now() + 24 * 60 * 60 * 1000) {
    throw new Error('That date is in the future — prices are recorded after they are seen.');
  }

  const converted = toCanonicalUnit(input.price, input.unitKey, input.commodityKey);
  if (!converted) {
    throw new Error(
      `A price per ${input.unitKey} cannot be recorded for ${
        typeof commodity.name === 'string' ? commodity.name : commodity.name.en
      }, which is priced per ${commodity.canonicalUnit}.`
    );
  }

  return converted;
}

/**
 * Record a price.
 *
 * A plain create rather than a transaction: an observation is a new fact about a
 * moment, not an edit to a shared row, so there is nothing for two clerks to
 * race over. Two people recording the same market on the same day produces two
 * observations, which is honest — they saw what they saw — and the later one
 * wins the series without erasing the earlier.
 */
export async function recordPrice(input: RecordPriceInput, actor: StaffUser): Promise<string> {
  const { priceETB, unitKey } = validatePrice(input);
  const market = MARKET_CENTRE_BY_ID[input.marketId];

  // Compared after conversion, deliberately. The whole point is to catch the
  // order-of-magnitude slip, and entering 92,000 per quintal and 920 per
  // kilogram are the same mistake wearing different clothes.
  if (!input.confirmUnusual) {
    const previous = await previousPriceFor(input.commodityKey, input.marketId);
    const verdict = assessPriceEntry(priceETB, previous);
    if (!verdict.usual && previous != null && verdict.deviationPercent != null) {
      throw new MarketPriceOutlierError(
        verdict.message ?? 'That price is a long way from the last one.',
        priceETB,
        previous,
        verdict.deviationPercent
      );
    }
  }

  if (isDemoMarket()) {
    const id = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    demoObservations.push({
      observationId: id,
      commodityKey: input.commodityKey,
      marketId: input.marketId,
      zoneId: market.zoneId,
      priceETB,
      unitKey,
      enteredPriceETB: input.price,
      enteredUnitKey: input.unitKey,
      observedAt: Timestamp.fromDate(input.observedAt),
      recordedByUid: actor.uid,
      recordedByName: actor.displayName,
      supersededAt: null,
    });
    return id;
  }

  const database = requireDb();
  const ref = doc(collection(database, MARKET_PRICES_COLLECTION));

  await setDoc(
    ref,
    stripUndefined({
      observationId: ref.id,
      commodityKey: input.commodityKey,
      marketId: input.marketId,
      zoneId: market.zoneId,
      priceETB,
      unitKey,
      enteredPriceETB: input.price,
      enteredUnitKey: input.unitKey,
      observedAt: Timestamp.fromDate(input.observedAt),
      recordedByUid: actor.uid,
      recordedByName: actor.displayName,
      createdAt: serverTimestamp(),
      supersededAt: null,
    })
  );

  await logAuditEvent({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorDisplayName: actor.displayName,
    actorRole: actor.role,
    module: 'market',
    action: 'price_recorded',
    targetType: 'marketPrice',
    targetId: ref.id,
    targetLabel: `${input.commodityKey} @ ${input.marketId} — ${priceETB.toLocaleString()} ETB/${unitKey}`,
    // Worth knowing later which figures somebody overrode a warning to enter.
    // If a price turns out to be wrong, this is the first place to look.
    reason: input.confirmUnusual ? 'Confirmed past the unusual-move warning' : undefined,
  } as any);

  return ref.id;
}
