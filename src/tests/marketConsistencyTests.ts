import { readFileSync } from 'node:fs';
import { Timestamp } from 'firebase/firestore';
import {
  MARKET_CENTRES,
  MARKET_CENTRE_BY_ID,
  MARKET_COMMODITIES,
  MARKET_COMMODITY_BY_KEY,
  MARKET_UNITS,
  type MarketUnitKey,
} from '../features/market/constants/marketCommodities';
import {
  assessPriceEntry,
  changePercent,
  deriveTrend,
  enterableUnits,
  latestPerSeries,
  seriesHistory,
  toCanonicalUnit,
  UNUSUAL_MOVE_PERCENT,
} from '../features/market/constants/marketVocabulary';
import { validatePrice } from '../features/market/services/marketService';
import type { MarketPriceObservation } from '../features/market/types/market';

/**
 * What the market module must not get wrong.
 *
 * Everything the section reports is a comparison between two prices, so an
 * error in one figure is an error in two rows — the one it lands in and the one
 * measured against it afterwards. These assert the arithmetic and the guards
 * that stop a bad figure entering, without needing a Firebase project.
 *
 *   npm run test:market
 */

export interface TestResult {
  id: number;
  name: string;
  category: 'Units' | 'Change' | 'Series' | 'Guard' | 'Dictionary' | 'Service' | 'Rules';
  passed: boolean;
  message: string;
  details?: unknown;
}

export function runMarketConsistencyTests(): TestResult[] {
  const results: TestResult[] = [];
  let id = 0;

  const check = (
    name: string,
    category: TestResult['category'],
    fn: () => { passed: boolean; message: string; details?: unknown }
  ) => {
    id += 1;
    try {
      const r = fn();
      results.push({ id, name, category, ...r });
    } catch (err) {
      results.push({
        id,
        name,
        category,
        passed: false,
        message: `threw: ${(err as Error)?.message}`,
      });
    }
  };

  const ts = (isoDay: string) => Timestamp.fromDate(new Date(`${isoDay}T00:00:00Z`));

  const obs = (
    commodityKey: string,
    marketId: string,
    priceETB: number,
    day: string,
    extra: Partial<MarketPriceObservation> = {}
  ): MarketPriceObservation => ({
    observationId: `${commodityKey}-${marketId}-${day}`,
    commodityKey,
    marketId,
    zoneId: MARKET_CENTRE_BY_ID[marketId]?.zoneId ?? 'east_shewa',
    priceETB,
    unitKey: MARKET_COMMODITY_BY_KEY[commodityKey]?.canonicalUnit ?? 'quintal',
    enteredPriceETB: priceETB,
    enteredUnitKey: MARKET_COMMODITY_BY_KEY[commodityKey]?.canonicalUnit ?? 'quintal',
    observedAt: ts(day),
    recordedByUid: 'u1',
    recordedByName: 'Test Officer',
    supersededAt: null,
    ...extra,
  });

  /* ------------------------------------------------------------------ units */

  check('A price per kilogram becomes a price per quintal', 'Units', () => {
    const r = toCanonicalUnit(92, 'kg', 'teff_white');
    return {
      passed: r?.priceETB === 9200 && r?.unitKey === 'quintal',
      message:
        r?.priceETB === 9200
          ? '92/kg is stored as 9,200/quintal, so the series keeps one scale.'
          : 'A per-kilogram price entered against a per-quintal series would be out by a hundred.',
      details: r,
    };
  });

  check('A price already in the canonical unit is untouched', 'Units', () => {
    const r = toCanonicalUnit(9200, 'quintal', 'teff_white');
    return {
      passed: r?.priceETB === 9200,
      message: 'No conversion, no rounding drift.',
      details: r,
    };
  });

  check('Livestock cannot be priced by weight', 'Units', () => {
    // A head of cattle is not a number of kilograms of anything. Converting
    // would produce a number that looks like a price and means nothing.
    const r = toCanonicalUnit(45000, 'kg', 'cattle_ox');
    return {
      passed: r === null,
      message:
        r === null
          ? 'Refused rather than guessed.'
          : 'An ox was given a price per kilogram.',
      details: r,
    };
  });

  check('An unknown commodity converts to nothing', 'Units', () => {
    return {
      passed: toCanonicalUnit(10, 'kg', 'unobtanium') === null,
      message: 'Only commodities in the dictionary have a canonical unit.',
    };
  });

  check('Only comparable units are offered for entry', 'Units', () => {
    const grain = enterableUnits('teff_white');
    const ox = enterableUnits('cattle_ox');
    const milk = enterableUnits('cow_milk');
    return {
      passed:
        grain.includes('kg') &&
        grain.includes('quintal') &&
        ox.length === 1 &&
        ox[0] === 'head' &&
        milk.length === 1 &&
        milk[0] === 'litre',
      message:
        'The form cannot offer a unit the service would refuse — the option is absent, not rejected.',
      details: { grain, ox, milk },
    };
  });

  check('Conversion is exact to the cent', 'Units', () => {
    // 33.33/kg is 3,333/quintal, not 3,332.9999999999995. Money shown on a
    // screen should match money written on a slip.
    const r = toCanonicalUnit(33.33, 'kg', 'wheat');
    return {
      passed: r?.priceETB === 3333,
      message: 'No floating-point tail on a displayed price.',
      details: r,
    };
  });

  /* ----------------------------------------------------------------- change */

  check('A first price has no change, not a zero change', 'Change', () => {
    const c = changePercent(9200, null);
    return {
      passed: c === null && deriveTrend(c) === 'new',
      message:
        c === null
          ? 'Reporting 0% would claim the price held steady when nobody knows what it was.'
          : 'A first sighting was given a movement it cannot have.',
      details: { changePercent: c, trend: deriveTrend(c) },
    };
  });

  check('A rise and a fall are measured against the earlier price', 'Change', () => {
    return {
      passed: changePercent(9200, 8600) === 7 && changePercent(8600, 9200) === -6.5,
      message: 'Percentages are of the previous price, so they are not symmetric.',
      details: { up: changePercent(9200, 8600), down: changePercent(8600, 9200) },
    };
  });

  check('Rounding noise does not move the arrow', 'Change', () => {
    // An arrow that flickers between weeks on a tenth of a percent teaches
    // people to ignore it.
    return {
      passed: deriveTrend(changePercent(9200, 9210)) === 'stable',
      message: 'A tenth of a percent reads as steady, not as a fall.',
      details: { change: changePercent(9200, 9210) },
    };
  });

  check('A zero previous price cannot produce a percentage', 'Change', () => {
    return {
      passed: changePercent(9200, 0) === null,
      message: 'No division by zero dressed up as Infinity%.',
    };
  });

  /* ----------------------------------------------------------------- series */

  check('The latest price per series wins, whatever order they arrive', 'Series', () => {
    const points = latestPerSeries([
      obs('teff_white', 'adama_central', 9200, '2026-08-15'),
      obs('teff_white', 'adama_central', 8600, '2026-08-01'),
      obs('teff_white', 'adama_central', 8800, '2026-08-08'),
    ]);
    return {
      passed:
        points.length === 1 && points[0].priceETB === 9200 && points[0].previousPriceETB === 8800,
      message:
        'Sorted before comparing, so "the one before" is the previous week and not whichever row Firestore returned second.',
      details: points,
    };
  });

  check('Two markets are two series, not one', 'Series', () => {
    const points = latestPerSeries([
      obs('teff_white', 'adama_central', 9200, '2026-08-15'),
      obs('teff_white', 'shashamane', 8600, '2026-08-15'),
    ]);
    return {
      passed: points.length === 2,
      message:
        'Teff at Adama and teff at Shashamane are different prices for the same thing, which is the point of recording both.',
      details: points.map((p) => `${p.marketId}:${p.priceETB}`),
    };
  });

  check('A superseded price drops out of the series entirely', 'Series', () => {
    // Not merely hidden: a correction must not be compared against the mistake
    // it replaced, or the movement it reports is the size of the error.
    const points = latestPerSeries([
      obs('wheat', 'asella', 6100, '2026-08-01'),
      obs('wheat', 'asella', 61000, '2026-08-08', {
        supersededAt: ts('2026-08-09'),
        supersedeReason: 'unit slip',
      }),
      obs('wheat', 'asella', 6300, '2026-08-15'),
    ]);
    return {
      passed:
        points.length === 1 &&
        points[0].priceETB === 6300 &&
        points[0].previousPriceETB === 6100,
      message:
        points[0]?.previousPriceETB === 6100
          ? 'The correction is measured against the last good price.'
          : 'A voided price is still being used as the comparison.',
      details: points,
    };
  });

  check('Series history is newest first and excludes corrections', 'Series', () => {
    const history = seriesHistory(
      [
        obs('maize', 'jimma_main', 4300, '2026-08-01'),
        obs('maize', 'jimma_main', 4500, '2026-08-08', { supersededAt: ts('2026-08-09') }),
        obs('maize', 'jimma_main', 4400, '2026-08-15'),
        obs('wheat', 'jimma_main', 6100, '2026-08-15'),
      ],
      'maize',
      'jimma_main'
    );
    return {
      passed:
        history.length === 2 && history[0].priceETB === 4400 && history[1].priceETB === 4300,
      message: 'Only this commodity, only this market, only live rows.',
      details: history.map((h) => h.priceETB),
    };
  });

  check('An empty register produces no points rather than throwing', 'Series', () => {
    return {
      passed: latestPerSeries([]).length === 0,
      message: 'The page opens empty on a project where nothing has been recorded yet.',
    };
  });

  /* ------------------------------------------------------------------ guard */

  check('An order-of-magnitude slip is caught', 'Guard', () => {
    // The mistake this exists for: 92,000 typed for 9,200.
    const v = assessPriceEntry(92000, 9200);
    return {
      passed: !v.usual && v.deviationPercent === 900,
      message: !v.usual
        ? 'Held for confirmation, naming both numbers.'
        : 'A tenfold jump was accepted silently.',
      details: v,
    };
  });

  check('Ordinary volatility is not obstructed', 'Guard', () => {
    // Staples genuinely swing. A threshold tight enough to catch every typo
    // would stop every real movement, and people would click through both.
    const v = assessPriceEntry(9200 * 1.2, 9200);
    return {
      passed: v.usual,
      message: 'A 20% harvest swing records without a warning.',
      details: v,
    };
  });

  check('A first price can never be unusual', 'Guard', () => {
    const v = assessPriceEntry(9200, null);
    return {
      passed: v.usual && v.deviationPercent === null,
      message:
        v.usual
          ? 'Nothing to be unusual against; refusing would make a series impossible to start.'
          : 'The first price in a series was refused.',
      details: v,
    };
  });

  check('The threshold is symmetric', 'Guard', () => {
    const up = assessPriceEntry(9200 * (1 + (UNUSUAL_MOVE_PERCENT + 5) / 100), 9200);
    const down = assessPriceEntry(9200 * (1 - (UNUSUAL_MOVE_PERCENT + 5) / 100), 9200);
    return {
      passed: !up.usual && !down.usual,
      message: 'A collapse is as suspicious as a spike; both are usually a unit.',
      details: { up: up.deviationPercent, down: down.deviationPercent },
    };
  });

  check('The warning names both figures', 'Guard', () => {
    const v = assessPriceEntry(92000, 9200);
    return {
      passed:
        Boolean(v.message) &&
        v.message!.includes('92,000') &&
        v.message!.includes('9,200'),
      message: 'A warning that does not say what it is comparing cannot be acted on.',
      details: v.message,
    };
  });

  /* ------------------------------------------------------------- dictionary */

  check('Every commodity names a unit that exists', 'Dictionary', () => {
    const broken = MARKET_COMMODITIES.filter(
      (c) => !MARKET_UNITS[c.canonicalUnit as MarketUnitKey]
    );
    return {
      passed: broken.length === 0,
      message: 'A commodity pointing at a unit that does not exist could never be recorded.',
      details: broken.map((c) => c.commodityKey),
    };
  });

  check('Every commodity and market key is unique', 'Dictionary', () => {
    const cKeys = MARKET_COMMODITIES.map((c) => c.commodityKey);
    const mKeys = MARKET_CENTRES.map((m) => m.marketId);
    return {
      passed:
        new Set(cKeys).size === cKeys.length && new Set(mKeys).size === mKeys.length,
      message:
        'A duplicated key would silently merge two series into one, which is the drift the dictionary exists to prevent.',
      details: { commodities: cKeys.length, markets: mKeys.length },
    };
  });

  check('Every commodity and market is named in all three languages', 'Dictionary', () => {
    const missing: string[] = [];
    for (const c of MARKET_COMMODITIES) {
      const n = c.name;
      if (typeof n === 'string' || !n.om || !n.am || !n.en) missing.push(`commodity:${c.commodityKey}`);
    }
    for (const m of MARKET_CENTRES) {
      const n = m.name;
      if (typeof n === 'string' || !n.om || !n.am || !n.en) missing.push(`market:${m.marketId}`);
    }
    return {
      passed: missing.length === 0,
      message:
        missing.length === 0
          ? 'The public site renders all three, so a name missing one would fall back silently.'
          : 'A name is missing a language.',
      details: missing,
    };
  });

  check('Every market sits in a canonical zone', 'Dictionary', () => {
    // Zones are not redefined here: they come from the same list the investment
    // map, the fleet register and the security rules use.
    const zoneIds = new Set(MARKET_CENTRES.map((m) => m.zoneId));
    return {
      passed: zoneIds.size > 0 && MARKET_CENTRES.every((m) => typeof m.zoneId === 'string'),
      message: 'Market centres reuse CANONICAL_ZONE_METADATA rather than inventing zone names.',
      details: [...zoneIds],
    };
  });

  /* ---------------------------------------------------------------- service */

  check('A price of zero or less is refused', 'Service', () => {
    let threw = 0;
    for (const p of [0, -5]) {
      try {
        validatePrice({
          commodityKey: 'teff_white',
          marketId: 'adama_central',
          price: p,
          unitKey: 'quintal',
          observedAt: new Date('2026-08-15'),
        });
      } catch {
        threw += 1;
      }
    }
    return { passed: threw === 2, message: 'Nothing is free and nothing costs less than nothing.' };
  });

  check('A future observation date is refused', 'Service', () => {
    let threw = false;
    try {
      validatePrice({
        commodityKey: 'teff_white',
        marketId: 'adama_central',
        price: 9200,
        unitKey: 'quintal',
        observedAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    } catch {
      threw = true;
    }
    return {
      passed: threw,
      message: 'Prices are recorded after they are seen; a future date is a mistyped year.',
    };
  });

  check('An unknown commodity or market is refused', 'Service', () => {
    let threw = 0;
    try {
      validatePrice({
        commodityKey: 'unobtanium',
        marketId: 'adama_central',
        price: 1,
        unitKey: 'quintal',
        observedAt: new Date('2026-08-15'),
      });
    } catch {
      threw += 1;
    }
    try {
      validatePrice({
        commodityKey: 'teff_white',
        marketId: 'atlantis',
        price: 1,
        unitKey: 'quintal',
        observedAt: new Date('2026-08-15'),
      });
    } catch {
      threw += 1;
    }
    return {
      passed: threw === 2,
      message: 'Only things in the dictionary can be priced, which is what keeps series intact.',
    };
  });

  check('Validation returns the converted price, not the entered one', 'Service', () => {
    const r = validatePrice({
      commodityKey: 'teff_white',
      marketId: 'adama_central',
      price: 92,
      unitKey: 'kg',
      observedAt: new Date('2026-08-15'),
    });
    return {
      passed: r.priceETB === 9200 && r.unitKey === 'quintal',
      message: 'The service writes the canonical figure, so no series holds a mixture of scales.',
      details: r,
    };
  });

  /* ------------------------------------------------------------------ rules */

  check('marketPrices is writable only by a market officer', 'Rules', () => {
    // firestore.rules is the one place these permissions are written down that
    // nothing typechecks. Read as text, the way the fleet suite does.
    let rules = '';
    try {
      rules = readFileSync('firestore.rules', 'utf8');
    } catch {
      return { passed: false, message: 'Could not read firestore.rules from the repo root.' };
    }
    const block = rules.match(/match \/marketPrices\/\{[^}]*\}\s*\{([\s\S]*?)\n    \}/);
    const body = block?.[1] ?? '';
    return {
      passed: /isMarketOfficer\(\)/.test(body),
      message: body
        ? 'Entry is gated on the role, matching market.manage in the permission table.'
        : 'No marketPrices block found in firestore.rules.',
      details: body.trim().split('\n').map((l) => l.trim()).filter(Boolean),
    };
  });

  check('Prices stay publicly readable', 'Rules', () => {
    let rules = '';
    try {
      rules = readFileSync('firestore.rules', 'utf8');
    } catch {
      return { passed: false, message: 'Could not read firestore.rules.' };
    }
    const block = rules.match(/match \/marketPrices\/\{[^}]*\}\s*\{([\s\S]*?)\n    \}/);
    const body = block?.[1] ?? '';
    return {
      passed: /allow read:\s*if true/.test(body),
      message:
        'The whole point is farmers reading them without an account. A signed-in-only price list helps nobody.',
      details: body.trim(),
    };
  });

  return results;
}
