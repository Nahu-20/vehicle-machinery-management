import type { LanguageCode } from '../../../types/index.js';
import { FARMER_HOTLINE } from '../../../constants.js';
import type { AnswerComposer, ComposedAnswer, RetrievedDoc } from '../types.js';
import { textIn } from '../retrieval/localized.js';

/**
 * Deterministic, zero-cost composer.
 *
 * Serves two roles: the CHAT_COMPOSER=template mode, and the runtime fallback
 * whenever Gemini is keyless, rate-limited, timing out or erroring. A farmer
 * hotline has to answer even when an external API does not, so this path takes
 * no network calls and cannot fail.
 *
 * It never writes prose of its own about agriculture — it only presents the
 * retrieved records, which keeps it as strictly grounded as the Gemini path.
 */

interface Phrases {
  intro: string;
  noResults: string;
  translatedNote: string;
  hotline: string;
  more: string;
}

const PHRASES: Record<LanguageCode, Phrases> = {
  om: {
    intro: 'Gaaffii keessaniif odeeffannoo armaan gadii Biiroo Qonnaa Oromiyaa irraa argameera:',
    noResults:
      'Dhiifama, gaaffii keessaniif odeeffannoo quunnamsiisu kuusaa ragaa keenya keessatti hin argamne.',
    translatedNote:
      'Yaadannoo: qabiyyeen kun afaan biraatiin barreeffame; hiikkaan kompiitaraan godhame.',
    hotline: `Gargaarsa dabalataaf sarara bilisaa ${FARMER_HOTLINE} irratti bilbilaa.`,
    more: 'Odeeffannoo guutuu link armaan gadii irratti argattu.',
  },
  am: {
    intro: 'ለጥያቄዎ የሚከተለው መረጃ ከኦሮሚያ ግብርና ቢሮ ተገኝቷል፦',
    noResults: 'ይቅርታ፣ ለጥያቄዎ የሚመለከት መረጃ በመረጃ ቋታችን ውስጥ አልተገኘም።',
    translatedNote: 'ማሳሰቢያ፡ ይህ ይዘት በሌላ ቋንቋ የተጻፈ ሲሆን በማሽን የተተረጎመ ነው።',
    hotline: `ለተጨማሪ እገዛ በነጻ ስልክ ቁጥር ${FARMER_HOTLINE} ይደውሉ።`,
    more: 'ሙሉ መረጃውን ከሚከተለው አገናኝ ያገኛሉ።',
  },
  en: {
    intro: 'Here is what the Oromia Agriculture Bureau has on record for your question:',
    noResults:
      'Sorry — nothing in our records covers that question.',
    translatedNote:
      'Note: this content was written in another language and has been machine-translated.',
    hotline: `For further help, call the toll-free hotline ${FARMER_HOTLINE}.`,
    more: 'Full details are available at the link below.',
  },
};

/** Trim to a sentence boundary where possible, so excerpts do not cut mid-word. */
function excerpt(text: string, maxLength = 320): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('። '));
  return (lastStop > maxLength * 0.5 ? cut.slice(0, lastStop + 1) : cut.trimEnd()) + '…';
}

/** Best available text for a doc, preferring the user's language. */
function bestText(doc: RetrievedDoc, lang: LanguageCode): { text: string; translated: boolean } {
  const native = textIn(doc.body, lang) || textIn(doc.title, lang);
  if (native) return { text: native, translated: false };

  for (const fallback of ['om', 'en', 'am'] as LanguageCode[]) {
    const text = textIn(doc.body, fallback) || textIn(doc.title, fallback);
    if (text) return { text, translated: true };
  }
  return { text: '', translated: false };
}

export function composeFromTemplate(
  _query: string,
  docs: RetrievedDoc[],
  lang: LanguageCode
): ComposedAnswer {
  const phrases = PHRASES[lang] ?? PHRASES.om;

  if (docs.length === 0) {
    return {
      message: `${phrases.noResults} ${phrases.hotline}`,
      sources: [],
      wasTranslated: false,
      answered: false,
    };
  }

  let wasTranslated = false;
  const lines: string[] = [phrases.intro];
  const sources: { title: string; url?: string }[] = [];

  for (const doc of docs) {
    const { text, translated } = bestText(doc, lang);
    if (!text) continue;
    // availableLangs is the authoritative record of what a document was actually
    // authored in. Checking only the body would miss the common case where a
    // record has language-neutral details (a phone number, a price) but an
    // untranslated Afaan Oromo title — which the reader still sees untranslated.
    if (translated || !doc.availableLangs.includes(lang)) wasTranslated = true;

    const heading =
      textIn(doc.title, lang) ||
      textIn(doc.title, 'om') ||
      textIn(doc.title, 'en') ||
      textIn(doc.title, 'am');

    lines.push(heading ? `• ${heading}: ${excerpt(text)}` : `• ${excerpt(text)}`);
    sources.push({ title: heading || doc.id, url: doc.url });
  }

  if (sources.length === 0) {
    return {
      message: `${phrases.noResults} ${phrases.hotline}`,
      sources: [],
      wasTranslated: false,
      answered: false,
    };
  }

  if (wasTranslated) lines.push(phrases.translatedNote);
  lines.push(phrases.hotline);

  return {
    message: lines.join('\n\n'),
    sources,
    wasTranslated,
    answered: true,
  };
}

export const templateComposer: AnswerComposer = {
  name: 'template',
  async compose(query, docs, lang) {
    return composeFromTemplate(query, docs, lang);
  },
};

/**
 * A grounded decline that still points somewhere useful.
 *
 * Used when a composer has judged that the retrieved records do not answer the
 * question. That judgment must survive: re-running composeFromTemplate here
 * would format the same near-miss records as though they were the answer, which
 * is precisely the guessing this assistant exists to avoid.
 *
 * Retrieved records are still returned as sources. The UI renders them under
 * "Related Information", which is an honest description of a near miss — the
 * reader can follow one if it happens to help, without being told it answers
 * their question.
 */
export function composeDecline(
  docs: RetrievedDoc[],
  lang: LanguageCode
): ComposedAnswer {
  const phrases = PHRASES[lang] ?? PHRASES.om;

  const sources = docs
    .slice(0, 3)
    .map((doc) => ({
      title:
        textIn(doc.title, lang) ||
        textIn(doc.title, 'om') ||
        textIn(doc.title, 'en') ||
        textIn(doc.title, 'am') ||
        doc.id,
      url: doc.url,
    }))
    .filter((source) => source.title);

  return {
    message: `${phrases.noResults} ${phrases.hotline}`,
    sources,
    wasTranslated: false,
    answered: false,
  };
}
