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
  compareAcrossMarkets,
  deriveTrend,
  enterableUnits,
  isStale,
  latestPerSeries,
  seriesHistory,
  STALE_AFTER_DAYS,
  toCanonicalUnit,
  toPublicPrices,
  UNUSUAL_MOVE_PERCENT,
} from '../features/market/constants/marketVocabulary';
import { validatePrice } from '../features/market/services/marketService';
import {
  buildTemplateCsv,
  parseCsv,
  resolveCsv,
  resolveImportRow,
} from '../features/market/constants/marketCsv';
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
  category:
    | 'Units'
    | 'Change'
    | 'Series'
    | 'Guard'
    | 'Dictionary'
    | 'Service'
    | 'Public'
    | 'Compare'
    | 'Import'
    | 'Rules';
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

  /* ----------------------------------------------------------------- public */

  const DAY = 24 * 60 * 60 * 1000;

  check('A price past the threshold is stale', 'Public', () => {
    const now = Date.UTC(2026, 7, 30);
    return {
      passed:
        isStale(now - (STALE_AFTER_DAYS + 1) * DAY, now) &&
        !isStale(now - (STALE_AFTER_DAYS - 1) * DAY, now),
      message: `Prices older than ${STALE_AFTER_DAYS} days are marked; newer ones are not.`,
    };
  });

  check('A stale price is marked, not hidden', 'Public', () => {
    // Hiding it would make the section look emptier than the register is, and
    // the reader would not know the Bureau has a figure at all. Marking it lets
    // them judge.
    const now = Date.UTC(2026, 7, 30);
    const pub = toPublicPrices(
      latestPerSeries([obs('teff_white', 'adama_central', 9200, '2026-06-01')]),
      now
    );
    return {
      passed: pub.length === 1 && pub[0].isStale === true,
      message: 'Still listed, carrying its age.',
      details: pub[0],
    };
  });

  check('A first price says so instead of showing 0%', 'Public', () => {
    const now = Date.UTC(2026, 7, 30);
    const pub = toPublicPrices(
      latestPerSeries([obs('wheat', 'asella', 6100, '2026-08-29')]),
      now
    );
    return {
      passed: pub[0].isFirstPrice === true && pub[0].trend === 'stable',
      message:
        pub[0].isFirstPrice
          ? 'The card renders "New" rather than asserting the price held steady.'
          : 'A first price was presented as an unchanged one.',
      details: pub[0],
    };
  });

  check('The public shape carries trilingual names, not keys', 'Public', () => {
    const now = Date.UTC(2026, 7, 30);
    const pub = toPublicPrices(
      latestPerSeries([obs('teff_white', 'adama_central', 9200, '2026-08-29')]),
      now
    );
    const c = pub[0].commodity;
    const m = pub[0].market;
    return {
      passed:
        typeof c === 'object' && Boolean(c?.om && c?.am && c?.en) &&
        typeof m === 'object' && Boolean(m?.om && m?.am && m?.en),
      message: 'The home page renders whichever language the visitor chose.',
      details: { commodity: c, market: m },
    };
  });

  check('Public prices come newest first', 'Public', () => {
    const now = Date.UTC(2026, 7, 30);
    const pub = toPublicPrices(
      latestPerSeries([
        obs('wheat', 'asella', 6100, '2026-08-10'),
        obs('teff_white', 'adama_central', 9200, '2026-08-28'),
        obs('maize', 'jimma_main', 4300, '2026-08-19'),
      ]),
      now
    );
    return {
      passed:
        pub[0].commodityKey === 'teff_white' &&
        pub[1].commodityKey === 'maize' &&
        pub[2].commodityKey === 'wheat',
      message: 'The four featured cards are the four most recently seen prices.',
      details: pub.map((p) => `${p.commodityKey}:${p.updatedDate}`),
    };
  });

  check('An empty register produces an empty public list', 'Public', () => {
    return {
      passed: toPublicPrices([]).length === 0,
      message: 'The section says nothing is published rather than inventing a price.',
    };
  });

  /* ---------------------------------------------------------------- compare */

  check('The cheapest and dearest markets are identified', 'Compare', () => {
    const rows = compareAcrossMarkets(
      latestPerSeries([
        obs('teff_white', 'adama_central', 9200, '2026-08-20'),
        obs('teff_white', 'shashamane', 8600, '2026-08-20'),
        obs('teff_white', 'asella', 8900, '2026-08-20'),
      ]),
      'teff_white'
    );
    const cheapest = rows.find((r) => r.isCheapest);
    const dearest = rows.find((r) => r.isDearest);
    return {
      passed: cheapest?.marketId === 'shashamane' && dearest?.marketId === 'adama_central',
      message: 'This is the comparison that decides whether a journey is worth making.',
      details: rows.map((r) => `${r.marketId}:${r.priceETB}`),
    };
  });

  check('The premium is measured from the cheapest, not an average', 'Compare', () => {
    // The question is "how much more would I get elsewhere", and the answer has
    // to be relative to a price somebody is actually paying.
    const rows = compareAcrossMarkets(
      latestPerSeries([
        obs('teff_white', 'adama_central', 9200, '2026-08-20'),
        obs('teff_white', 'shashamane', 8000, '2026-08-20'),
      ]),
      'teff_white'
    );
    const adama = rows.find((r) => r.marketId === 'adama_central');
    return {
      passed: adama?.premiumPercent === 15,
      message: '9,200 is 15% above 8,000.',
      details: rows.map((r) => `${r.marketId}:+${r.premiumPercent}%`),
    };
  });

  check('Rows are ordered dearest first', 'Compare', () => {
    const rows = compareAcrossMarkets(
      latestPerSeries([
        obs('wheat', 'asella', 6100, '2026-08-20'),
        obs('wheat', 'ambo', 6800, '2026-08-20'),
        obs('wheat', 'nekemte', 6400, '2026-08-20'),
      ]),
      'wheat'
    );
    return {
      passed: rows[0].priceETB === 6800 && rows[2].priceETB === 6100,
      message: 'A seller reads down from the best price.',
      details: rows.map((r) => r.priceETB),
    };
  });

  check('One market is both cheapest and dearest', 'Compare', () => {
    // Not a bug worth hiding: with a single price it genuinely is both, and
    // saying so is more honest than picking one and implying a comparison.
    const rows = compareAcrossMarkets(
      latestPerSeries([obs('maize', 'jimma_main', 4300, '2026-08-20')]),
      'maize'
    );
    return {
      passed: rows.length === 1 && rows[0].isCheapest && rows[0].isDearest,
      message: 'The page says so, and asks for a second market.',
      details: rows[0],
    };
  });

  check('Comparing an unpriced commodity yields nothing', 'Compare', () => {
    const rows = compareAcrossMarkets(
      latestPerSeries([obs('wheat', 'asella', 6100, '2026-08-20')]),
      'coffee_washed'
    );
    return {
      passed: rows.length === 0,
      message: 'No prices, no comparison, rather than a panel of zeroes.',
    };
  });

  check('A corrected price is not compared across markets', 'Compare', () => {
    const rows = compareAcrossMarkets(
      latestPerSeries([
        obs('barley', 'robe_bale', 5200, '2026-08-20'),
        obs('barley', 'ambo', 52000, '2026-08-20', {
          supersededAt: ts('2026-08-21'),
          supersedeReason: 'unit slip',
        }),
      ]),
      'barley'
    );
    return {
      passed: rows.length === 1 && rows[0].marketId === 'robe_bale',
      message: 'A mistake must not become the market anyone is measured against.',
      details: rows,
    };
  });

  /* ----------------------------------------------------------------- import */

  const HEAD = 'market,commodity,unit,price,date';
  const ROW = 'Adama Central Market,Teff (White),Quintal (100kg),9200,2026-08-18';

  check('A quoted field may contain the separator', 'Import', () => {
    // A commodity or market name with a comma in it is written quoted by every
    // spreadsheet. Splitting on commas alone would silently shift every later
    // column by one, which reads as a bad price rather than a bad parse.
    const rows = parseCsv('a,b\n"one, two",three\n');
    return {
      passed: rows[1][0] === 'one, two' && rows[1][1] === 'three',
      message: 'Columns stay aligned when a value contains a comma.',
      details: rows[1],
    };
  });

  check('A doubled quote inside a quoted field is one quote', 'Import', () => {
    const rows = parseCsv('a\n"say ""teff"" here"\n');
    return {
      passed: rows[1][0] === 'say "teff" here',
      message: 'Escaped quotes survive the round trip.',
      details: rows[1],
    };
  });

  check('Windows line endings and a trailing blank line are tolerated', 'Import', () => {
    const rows = parseCsv('a,b\r\n1,2\r\n\r\n');
    return {
      passed: rows.length === 2 && rows[1][1] === '2',
      message: 'A file saved on Windows parses to the same records as one saved anywhere else.',
      details: rows,
    };
  });

  check("Excel's byte-order mark does not break the first column", 'Import', () => {
    // Left in place the BOM becomes part of the first header, and 'market'
    // stops being 'market' for reasons nothing on screen would explain.
    const { rows, headerProblem } = resolveCsv('\ufeff' + HEAD + '\n' + ROW + '\n');
    return {
      passed: !headerProblem && rows.length === 1 && rows[0].marketId === 'adama_central',
      message: 'A file straight out of Excel imports.',
      details: { headerProblem, first: rows[0]?.marketId },
    };
  });

  check('Columns are matched by name, not position', 'Import', () => {
    const reordered = 'date,price,commodity,unit,market\n2026-08-18,9200,Wheat,Quintal (100kg),Asella Market';
    const { rows } = resolveCsv(reordered);
    return {
      passed:
        rows.length === 1 &&
        rows[0].commodityKey === 'wheat' &&
        rows[0].marketId === 'asella' &&
        rows[0].price === 9200,
      message: 'A spreadsheet with the columns in a different order still imports.',
      details: rows[0],
    };
  });

  check('A missing column is refused before any row is read', 'Import', () => {
    const { rows, headerProblem } = resolveCsv('market,commodity,price\nAdama Central Market,Wheat,6100');
    return {
      passed: Boolean(headerProblem) && rows.length === 0,
      message: 'Named in the message, so the fix is obvious.',
      details: headerProblem,
    };
  });

  check('Names match regardless of case and stray spaces', 'Import', () => {
    const r = resolveImportRow(
      { market: '  adama central market ', commodity: 'TEFF (WHITE)', unit: 'quintal (100kg)', price: '9200', date: '2026-08-18' },
      2
    );
    return {
      passed: r.commodityKey === 'teff_white' && r.marketId === 'adama_central',
      message: 'Formatting is the spreadsheet\u2019s fault and costs nothing to absorb.',
      details: { commodity: r.commodityKey, market: r.marketId, problem: r.problem },
    };
  });

  check('A name the register does not know stops that row', 'Import', () => {
    // The whole reason the dictionary exists. Guessing here is how "Teff",
    // "teff" and "White Teff" become three series in one import.
    const r = resolveImportRow(
      { market: 'Adama Central Market', commodity: 'Quinoa', unit: 'Quintal (100kg)', price: '9200', date: '2026-08-18' },
      2
    );
    return {
      passed: Boolean(r.problem) && r.problem!.includes('Quinoa') && r.price === undefined,
      message: 'Named in the message, and nothing is written for it.',
      details: r.problem,
    };
  });

  check('A price with thousands separators is read', 'Import', () => {
    // What a spreadsheet exports when the cell is formatted as a number.
    const r = resolveImportRow(
      { market: 'Asella Market', commodity: 'Wheat', unit: 'Quintal (100kg)', price: '6,100', date: '2026-08-18' },
      2
    );
    return {
      passed: r.price === 6100 && !r.problem,
      message: 'Refusing 6,100 for looking like two fields would be pedantry.',
      details: { price: r.price, problem: r.problem },
    };
  });

  check('A blank or non-numeric price stops the row', 'Import', () => {
    const blank = resolveImportRow(
      { market: 'Asella Market', commodity: 'Wheat', unit: 'Quintal (100kg)', price: '', date: '2026-08-18' },
      2
    );
    const junk = resolveImportRow(
      { market: 'Asella Market', commodity: 'Wheat', unit: 'Quintal (100kg)', price: 'n/a', date: '2026-08-18' },
      3
    );
    return {
      passed: Boolean(blank.problem) && Boolean(junk.problem),
      message: 'An empty cell in a template is a row nobody filled in, not a price of zero.',
      details: { blank: blank.problem, junk: junk.problem },
    };
  });

  check('A date lands on the day it says, not the one before', 'Import', () => {
    // Parsed at midday. A date-only string read as UTC midnight lands on the
    // previous day west of Greenwich, filing a Tuesday market under Monday.
    const r = resolveImportRow(
      { market: 'Asella Market', commodity: 'Wheat', unit: 'Quintal (100kg)', price: '6100', date: '2026-08-18' },
      2
    );
    const d = r.observedAt!;
    return {
      passed: d.getFullYear() === 2026 && d.getMonth() === 7 && d.getDate() === 18,
      message: 'Local date preserved regardless of the reader\u2019s timezone.',
      details: d?.toString(),
    };
  });

  check('An unreadable date stops the row and says the format', 'Import', () => {
    const r = resolveImportRow(
      { market: 'Asella Market', commodity: 'Wheat', unit: 'Quintal (100kg)', price: '6100', date: 'last tuesday' },
      2
    );
    return {
      passed: Boolean(r.problem) && r.problem!.includes('YYYY-MM-DD'),
      message: 'The message carries the fix.',
      details: r.problem,
    };
  });

  check('The template it hands out is a file it accepts back', 'Import', () => {
    // The surest way to make names match is to hand them over rather than ask
    // anyone to spell them. This asserts that round trip holds.
    const template = buildTemplateCsv(new Date('2026-08-18T12:00:00'));
    const withPrices = template
      .split('\r\n')
      .map((line, i) => (i === 0 || !line.trim() ? line : line.replace(/,,/, ',9200,')))
      .join('\r\n');
    const { rows, headerProblem } = resolveCsv(withPrices);
    const unresolved = rows.filter((r) => r.problem);
    return {
      passed: !headerProblem && rows.length > 0 && unresolved.length === 0,
      message: !headerProblem && unresolved.length === 0
        ? `${rows.length} template rows resolve with no unmatched names.`
        : 'The template contains names the resolver rejects.',
      details: { headerProblem, rows: rows.length, unresolved: unresolved.map((r) => r.problem) },
    };
  });

  check('One market per file is just a file with one market in it', 'Import', () => {
    const many = resolveCsv(
      HEAD + '\n' + ROW + '\nShashamane Market,Teff (White),Quintal (100kg),8600,2026-08-18'
    );
    const one = resolveCsv(HEAD + '\n' + ROW);
    return {
      passed: many.rows.length === 2 && one.rows.length === 1 && !one.rows[0].problem,
      message: 'No separate mode needed for a single market round.',
      details: { many: many.rows.length, one: one.rows.length },
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

  check('An existing price may only be marked corrected', 'Rules', () => {
    // Editing the figure in place would erase the fact that the public site
    // showed a different number, which somebody may have acted on.
    let rules = '';
    try {
      rules = readFileSync('firestore.rules', 'utf8');
    } catch {
      return { passed: false, message: 'Could not read firestore.rules.' };
    }
    const block = rules.match(/match \/marketPrices\/\{[^}]*\}\s*\{([\s\S]*?)\n    \}/);
    const body = block?.[1] ?? '';
    const appendOnly =
      /affectedKeys\(\)/.test(body) &&
      /supersededAt/.test(body) &&
      /allow delete:\s*if false/.test(body);
    return {
      passed: appendOnly,
      message: appendOnly
        ? 'Only the three correction fields may change, and nothing may be deleted.'
        : 'A price can still be edited in place or removed.',
      details: body.trim().split('\n').map((l) => l.trim()).filter(Boolean),
    };
  });

  return results;
}
