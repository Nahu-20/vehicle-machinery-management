import type { LocalizedText } from '../../../types';
import {
  MARKET_CENTRES,
  MARKET_COMMODITIES,
  MARKET_UNITS,
  type MarketUnitKey,
} from './marketCommodities';

/**
 * Reading a spreadsheet of prices, and refusing the parts that are guesses.
 *
 * A file is the third way into the register, beside the single form and the
 * market round. It exists because prices are often gathered on paper and typed
 * into a spreadsheet before anybody opens this application, and retyping them
 * here is duplicate work and a second chance to make a mistake.
 *
 * The danger a file brings is that a spreadsheet holds free text while the
 * register holds a dictionary. "Teff", "teff (white)" and "White Teff" across
 * three weeks are three series, each too short to say anything — the drift the
 * dictionary exists to prevent, arriving in bulk. So every name is resolved to
 * a key before anything is written, and a name that does not resolve stops that
 * row rather than inventing an entry for it.
 *
 * Everything here is pure. The parsing and the resolving can be tested without
 * a browser, a file, or a project, and the service does the writing.
 */

export const MARKET_CSV_HEADERS = ['market', 'commodity', 'unit', 'price', 'date'] as const;

/* --------------------------------------------------------------- parsing */

/**
 * Split CSV text into records.
 *
 * Hand-written rather than pulled from a library because the format we accept
 * is small and the failure modes we care about are specific: a byte-order mark
 * that Excel writes and that turns the first header into something that matches
 * nothing, quoted fields containing the separator, and the three line endings
 * a file can arrive with. A dependency would bring all of CSV, most of which we
 * would then have to refuse anyway.
 */
export function parseCsv(text: string): string[][] {
  // Excel writes a BOM. Left in place it becomes part of the first header and
  // 'market' silently stops being 'market'.
  const clean = text.replace(/^﻿/, '');

  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < clean.length; i += 1) {
    const c = clean[i];

    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\r') {
      // Swallow; the \n that follows ends the record.
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      field = '';
      row = [];
    } else {
      field += c;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // A trailing newline produces one empty record; so does a blank line left in
  // the middle by someone deleting a row in a spreadsheet.
  return rows.filter((r) => r.some((f) => f.trim() !== ''));
}

/* ------------------------------------------------------------ resolution */

function textForms(value: LocalizedText): string[] {
  if (typeof value === 'string') return [value];
  return [value.om, value.am, value.en].filter((v): v is string => Boolean(v));
}

/** Lower-cased, collapsed whitespace, so trailing spaces from a cell do not matter. */
function normalise(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildLookup(entries: { key: string; names: LocalizedText }[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const { key, names } of entries) {
    map.set(normalise(key), key);
    for (const form of textForms(names)) map.set(normalise(form), key);
  }
  return map;
}

const COMMODITY_LOOKUP = buildLookup(
  MARKET_COMMODITIES.map((c) => ({ key: c.commodityKey, names: c.name }))
);
const MARKET_LOOKUP = buildLookup(
  MARKET_CENTRES.map((m) => ({ key: m.marketId, names: m.name }))
);
const UNIT_LOOKUP = buildLookup(
  (Object.keys(MARKET_UNITS) as MarketUnitKey[]).map((k) => ({
    key: k,
    names: MARKET_UNITS[k].label,
  }))
);

export interface ImportRowInput {
  market: string;
  commodity: string;
  unit: string;
  price: string;
  date: string;
}

export interface ResolvedImportRow {
  /** 1-based line in the file, so a problem can be pointed at. */
  line: number;
  raw: ImportRowInput;
  marketId?: string;
  commodityKey?: string;
  unitKey?: MarketUnitKey;
  price?: number;
  observedAt?: Date;
  /** Present when the row cannot be written. Written for the person, not the log. */
  problem?: string;
}

/**
 * Turn one file row into something the service will accept, or say why not.
 *
 * Deliberately strict about names and forgiving about formatting. A stray space
 * or a different capitalisation is the spreadsheet's fault and costs nothing to
 * absorb; a name that is not in the dictionary is a decision nobody has made
 * yet, and guessing at it is how two series become one.
 */
export function resolveImportRow(raw: ImportRowInput, line: number): ResolvedImportRow {
  const out: ResolvedImportRow = { line, raw };

  const marketId = MARKET_LOOKUP.get(normalise(raw.market ?? ''));
  if (!marketId) {
    out.problem = raw.market?.trim()
      ? `"${raw.market.trim()}" is not a market centre in the list.`
      : 'No market centre given.';
    return out;
  }
  out.marketId = marketId;

  const commodityKey = COMMODITY_LOOKUP.get(normalise(raw.commodity ?? ''));
  if (!commodityKey) {
    out.problem = raw.commodity?.trim()
      ? `"${raw.commodity.trim()}" is not a commodity in the price list.`
      : 'No commodity given.';
    return out;
  }
  out.commodityKey = commodityKey;

  const unitKey = UNIT_LOOKUP.get(normalise(raw.unit ?? '')) as MarketUnitKey | undefined;
  if (!unitKey) {
    out.problem = raw.unit?.trim()
      ? `"${raw.unit.trim()}" is not a unit the register uses.`
      : 'No unit given.';
    return out;
  }
  out.unitKey = unitKey;

  // Thousands separators are what a spreadsheet exports when a cell is
  // formatted as a number, and refusing 9,200 for looking like two fields
  // would be pedantry.
  const priceText = (raw.price ?? '').trim().replace(/,/g, '');
  if (!priceText) {
    out.problem = 'No price given.';
    return out;
  }
  const price = Number(priceText);
  if (!Number.isFinite(price) || price <= 0) {
    out.problem = `"${raw.price.trim()}" is not a price.`;
    return out;
  }
  out.price = price;

  const dateText = (raw.date ?? '').trim();
  if (!dateText) {
    out.problem = 'No date given.';
    return out;
  }
  // Anchored to midday rather than midnight. A date-only string parsed as UTC
  // midnight lands on the previous day for anyone west of Greenwich, which
  // would quietly file a Tuesday market under Monday.
  const observedAt = new Date(`${dateText}T12:00:00`);
  if (Number.isNaN(observedAt.getTime())) {
    out.problem = `"${dateText}" is not a date. Use YYYY-MM-DD.`;
    return out;
  }
  out.observedAt = observedAt;

  return out;
}

/** Parse a whole file into resolved rows, headers matched by name not position. */
export function resolveCsv(text: string): {
  rows: ResolvedImportRow[];
  headerProblem?: string;
} {
  const records = parseCsv(text);
  if (records.length === 0) return { rows: [], headerProblem: 'The file is empty.' };

  const header = records[0].map((h) => normalise(h));
  const missing = MARKET_CSV_HEADERS.filter((h) => !header.includes(h));
  if (missing.length) {
    return {
      rows: [],
      headerProblem: `The first row must name the columns. Missing: ${missing.join(', ')}.`,
    };
  }

  // By name, so a column order that differs from the template still works and
  // extra columns a spreadsheet carries along are ignored rather than fatal.
  const at = (record: string[], name: string) => record[header.indexOf(name)] ?? '';

  return {
    rows: records.slice(1).map((record, i) =>
      resolveImportRow(
        {
          market: at(record, 'market'),
          commodity: at(record, 'commodity'),
          unit: at(record, 'unit'),
          price: at(record, 'price'),
          date: at(record, 'date'),
        },
        i + 2
      )
    ),
  };
}

/* -------------------------------------------------------------- template */

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function english(value: LocalizedText): string {
  return typeof value === 'string' ? value : value.en ?? value.om ?? value.am ?? '';
}

/**
 * A file that already has the right names in it.
 *
 * The surest way to make names match the dictionary is to hand them over rather
 * than ask anyone to spell them. One row per commodity for the first market,
 * dated today, with the price column left empty: fill it in, duplicate the
 * block for other markets, upload.
 */
export function buildTemplateCsv(today = new Date()): string {
  const day = today.toISOString().slice(0, 10);
  const market = english(MARKET_CENTRES[0].name);

  const lines = [MARKET_CSV_HEADERS.join(',')];
  for (const c of MARKET_COMMODITIES) {
    lines.push(
      [
        csvCell(market),
        csvCell(english(c.name)),
        csvCell(english(MARKET_UNITS[c.canonicalUnit].label)),
        '',
        day,
      ].join(',')
    );
  }
  // A BOM, because Excel opens a UTF-8 file without one as mojibake and the
  // Amharic and Afaan Oromo names are the first thing to break.
  return '﻿' + lines.join('\r\n') + '\r\n';
}
