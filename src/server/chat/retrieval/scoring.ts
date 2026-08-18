import type { LanguageCode } from '../../../types/index.js';
import type { RetrievedDoc } from '../types.js';
import { allText, textIn } from './localized.js';

/**
 * Function words that carry no retrieval signal.
 *
 * Without this, short common words match as substrings almost everywhere —
 * "for" inside "Forms", "in" inside "Intelligence" and "planting" — which made
 * every query match every document and turned unanswerable questions into
 * confident-looking lists of unrelated records.
 */
const STOPWORDS: ReadonlySet<string> = new Set([
  // English
  'the', 'and', 'for', 'are', 'was', 'were', 'what', 'when', 'where', 'which',
  'who', 'how', 'why', 'can', 'you', 'your', 'our', 'his', 'her', 'its', 'this',
  'that', 'these', 'those', 'with', 'from', 'into', 'about', 'there', 'here',
  'have', 'has', 'had', 'does', 'did', 'not', 'but', 'all', 'any', 'get', 'got',
  'please', 'tell', 'need', 'want', 'would', 'could', 'should', 'much', 'many',
  // Afaan Oromo
  'kan', 'akka', 'irra', 'irratti', 'keessatti', 'keessan', 'keenya', 'isaa',
  'ittiin', 'maal', 'eessa', 'yoom', 'akkam', 'jira', 'jiru', 'dha', 'fi',
  'ykn', 'garuu', 'hunda', 'baayee', 'natti', 'anaaf', 'maaloo',
  // Amharic
  'እና', 'ነው', 'ናቸው', 'ላይ', 'ውስጥ', 'ግን', 'ወይም', 'እንዴት', 'ምንድን', 'የት',
  'መቼ', 'ማን', 'ለምን', 'እባክዎ', 'አለ', 'የለም', 'ሁሉ', 'ብዙ', 'ጋር', 'ስለ',
]);

/**
 * Length thresholds must be script-aware.
 *
 * Each Ge'ez character is a whole syllable, so Amharic words are far shorter in
 * codepoints than their Latin-script equivalents — "ዋጋ" (price) and "ዘር" (seed)
 * are two characters. A single Latin-tuned minimum silently discarded the most
 * common Amharic search terms.
 */
const GEEZ = /[ሀ-፿]/;

function isGeez(token: string): boolean {
  return GEEZ.test(token);
}

function minTokenLength(token: string): number {
  return isGeez(token) ? 2 : 3;
}

/**
 * Minimum token length allowed to match as a substring rather than a whole word.
 *
 * Longer tokens match loosely so Afaan Oromo and Amharic inflections still hit
 * ("qamadii" inside "qamadiin"); shorter ones must match a whole word, which is
 * what stops incidental collisions inside unrelated words ("for" in "Forms").
 */
function substringMinLength(token: string): number {
  return isGeez(token) ? 3 : 4;
}

/**
 * Split text into comparable tokens.
 *
 * \p{L} keeps Ge'ez script intact, so Amharic queries tokenize the same way
 * Latin-script Afaan Oromo and English ones do.
 */
export function tokenize(input: string): string[] {
  return (input || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= minTokenLength(token) && !STOPWORDS.has(token));
}

/**
 * A document word found inside the query token.
 *
 * The checks above only ever look for the query token inside the document, which
 * assumes the stored form is the longer one. Both other languages here break that
 * assumption in opposite directions: Amharic attaches particles as prefixes, so
 * "የበቆሎ" ("of maize") carries "በቆሎ" and shares no prefix with it, while Afaan
 * Oromo marks case with suffixes, so "gatiin" extends "gatii". In each the query
 * token is longer than the stored word, and no amount of forward substring
 * matching will find it.
 *
 * Restricted to words already long enough to match loosely, and to words
 * genuinely shorter than the token, so this stays an affix rule rather than a
 * second, weaker way for any short word to match anything.
 */
/**
 * How much a query token may exceed a stored word and still count as inflection.
 *
 * Without a bound this rule is just substring matching wearing a hat: "phone"
 * appears in every office record and sits inside "xylophone", so an unbounded
 * version matched five documents for a query of three invented words. A genuine
 * affix is short — the Afaan Oromo nominative is one letter, Amharic particles
 * are a single character — so the leftover is what separates inflection from
 * coincidence.
 */
const MAX_AFFIX_LATIN = 3;
const MAX_AFFIX_GEEZ = 1;

function maxAffixLength(token: string): number {
  return isGeez(token) ? MAX_AFFIX_GEEZ : MAX_AFFIX_LATIN;
}

function containsDocWord(eligibleWords: readonly string[], token: string): boolean {
  const maxAffix = maxAffixLength(token);
  for (const word of eligibleWords) {
    const affixLength = token.length - word.length;
    if (affixLength <= 0 || affixLength > maxAffix) continue;
    // Edges only. An affix attaches to the front or the back of a stem; a stored
    // word buried mid-token is a collision, not a grammatical form.
    if (token.startsWith(word) || token.endsWith(word)) return true;
  }
  return false;
}

function matches(
  haystack: string,
  wordSet: Set<string>,
  eligibleWords: readonly string[],
  token: string
): boolean {
  if (wordSet.has(token)) return true;
  if (token.length >= substringMinLength(token) && haystack.includes(token)) return true;
  return containsDocWord(eligibleWords, token);
}

function wordsOf(text: string): Set<string> {
  return new Set(text.split(/[^\p{L}\p{N}]+/u).filter(Boolean));
}

/**
 * Words from a field that are long enough to be matched as an affix stem.
 *
 * Computed once per field rather than per token: the token loop below runs this
 * over every document, and rebuilding the filtered list each time turned a cheap
 * scan into a quadratic one.
 */
function eligibleStems(wordSet: Set<string>): string[] {
  return [...wordSet].filter((word) => word.length >= substringMinLength(word));
}

const RECENCY_BOOSTED: ReadonlySet<string> = new Set(['news', 'alert']);
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Score a document against the query tokens.
 *
 * Matching runs over all three language fields, not just the user's, so an
 * Afaan Oromo record can still be matched by an English query that shares
 * proper nouns or numbers ("Adama", "2017"). Matches in the user's own language
 * are weighted higher, and a title hit counts for more than a body hit.
 */
export function scoreDoc(
  doc: Omit<RetrievedDoc, 'score'>,
  tokens: string[],
  lang: LanguageCode
): number {
  if (tokens.length === 0) return 0;

  const nativeTitle = textIn(doc.title, lang).toLowerCase();
  const nativeBody = textIn(doc.body, lang).toLowerCase();
  const anyTitle = allText(doc.title).toLowerCase();
  const anyBody = allText(doc.body).toLowerCase();

  const nativeTitleWords = wordsOf(nativeTitle);
  const nativeBodyWords = wordsOf(nativeBody);
  const anyTitleWords = wordsOf(anyTitle);
  const anyBodyWords = wordsOf(anyBody);

  const nativeTitleStems = eligibleStems(nativeTitleWords);
  const nativeBodyStems = eligibleStems(nativeBodyWords);
  const anyTitleStems = eligibleStems(anyTitleWords);
  const anyBodyStems = eligibleStems(anyBodyWords);

  let score = 0;
  for (const token of tokens) {
    if (matches(nativeTitle, nativeTitleWords, nativeTitleStems, token)) score += 6;
    else if (matches(anyTitle, anyTitleWords, anyTitleStems, token)) score += 4;

    if (matches(nativeBody, nativeBodyWords, nativeBodyStems, token)) score += 2;
    else if (matches(anyBody, anyBodyWords, anyBodyStems, token)) score += 1;
  }

  if (score === 0) return 0;

  // Normalize so long documents do not win purely by containing more words.
  score = score / Math.sqrt(tokens.length);

  if (RECENCY_BOOSTED.has(doc.sourceType) && doc.publishedAt) {
    const ageDays = (Date.now() - doc.publishedAt) / DAY_MS;
    if (ageDays < 30) score *= 1.5;
    else if (ageDays < 90) score *= 1.2;
  }

  return score;
}

/**
 * Weakly-matching documents are dropped relative to the best match.
 *
 * Asking for one specific office should not return five, each matching only the
 * word "Phone" in a field label. Padding an answer with near-misses makes a
 * grounded reply look authoritative about things it never addressed.
 */
const RELATIVE_SCORE_FLOOR = 0.5;

export function rankDocs(
  docs: Omit<RetrievedDoc, 'score'>[],
  tokens: string[],
  lang: LanguageCode,
  limit: number
): RetrievedDoc[] {
  const scored = docs
    .map((doc) => ({ ...doc, score: scoreDoc(doc, tokens, lang) }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return [];

  const floor = scored[0].score * RELATIVE_SCORE_FLOOR;
  return scored.filter((doc) => doc.score > floor).slice(0, limit);
}
