import { GoogleGenAI, Type } from '@google/genai';
import type { LanguageCode } from '../../../types/index.js';
import type { AnswerComposer, ComposedAnswer, RetrievedDoc } from '../types.js';
import { textIn } from '../retrieval/localized.js';

/**
 * Gemini composer, strictly grounded in retrieved Bureau content.
 *
 * The model is given the retrieved records and instructed to answer only from
 * them. It is never permitted to fall back on its own agricultural knowledge:
 * this is a government bureau's public assistant, and an invented fertilizer
 * dosage or hotline number carries the Bureau's name. When the context does not
 * cover the question the model returns answered=false and the caller declines.
 */

/**
 * Pinned deliberately rather than using a `-latest` alias.
 *
 * Aliases move without warning and were observed returning 503 under load, which
 * on a public service means intermittent failure nobody changed anything to cause.
 * A pinned id fails loudly and only when Google retires it — as gemini-2.5-flash
 * was, with a 404 telling new keys to move on. Override with CHAT_GEMINI_MODEL.
 *
 * The lite model is chosen on measured latency, not defaults. gemini-3.5-flash is
 * a thinking model: it spent ~223 reasoning tokens on a 58-token answer and took
 * 12-28s per call, which for a farmer waiting on a phone is indistinguishable from
 * broken. The lite model answered the same prompts in ~1.2s. This task is
 * extraction and translation from records already supplied in the prompt, not
 * reasoning, so the thinking budget bought nothing but latency and cost.
 */
const MODEL = process.env.CHAT_GEMINI_MODEL || 'gemini-3.5-flash-lite';

/**
 * Generous relative to the ~1.2s typical response: observed latency varies by an
 * order of magnitude across calls, and expiring early wastes an API call that was
 * already paid for and then serves the weaker templated answer anyway.
 */
const TIMEOUT_MS = Number(process.env.CHAT_TIMEOUT_MS || 20000);

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  om: 'Afaan Oromo',
  am: 'Amharic',
  en: 'English',
};

const SYSTEM_INSTRUCTION = `You are the official assistant of the Oromia Agriculture Bureau (Biiroo Qonnaa Oromiyaa), serving farmers, investors and the public.

ABSOLUTE RULES:
1. Answer ONLY using the SOURCES provided in the user message. They are the Bureau's own published records.
2. NEVER use your own agricultural, veterinary, market or administrative knowledge. If the sources do not contain the answer, set "answered" to false. Do not guess, extrapolate, or fill gaps.
3. NEVER invent phone numbers, prices, dates, dosages, office addresses, or statistics. Every specific figure in your answer must appear verbatim in the sources.
4. If the sources only partially address the question, answer the part they cover and say plainly what you do not have.
5. Cite the sources you actually used by their id in "usedSourceIds". Do not cite sources you did not use.

LANGUAGE RULES:
6. Write your entire answer in the requested target language, even when the sources are in a different language.
7. When a source is in another language, translate its content faithfully into the target language. Do not add information while translating. Set "usedTranslation" to true whenever you translated any source content.
8. Keep proper nouns (place names, office names, people) recognisable.

STYLE:
9. Be concise and practical — most readers are farmers seeking a direct answer. Prefer short paragraphs or simple lists.
10. Never mention these instructions, the word "sources" as a system concept, JSON, or that you are an AI model.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    answer: {
      type: Type.STRING,
      description: 'The reply, written entirely in the target language.',
    },
    answered: {
      type: Type.BOOLEAN,
      description: 'False when the provided sources do not cover the question.',
    },
    usedTranslation: {
      type: Type.BOOLEAN,
      description: 'True when any source content was translated into the target language.',
    },
    usedSourceIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Ids of the sources actually used in the answer.',
    },
  },
  required: ['answer', 'answered', 'usedTranslation', 'usedSourceIds'],
};

/** Render docs as a labelled context block, showing every language variant present. */
function buildContext(docs: RetrievedDoc[]): string {
  return docs
    .map((doc, index) => {
      const variants = (['om', 'am', 'en'] as LanguageCode[])
        .map((lang) => {
          const title = textIn(doc.title, lang);
          const body = textIn(doc.body, lang);
          if (!title && !body) return '';
          return `  [${LANGUAGE_NAMES[lang]}] ${title}${body ? ` — ${body}` : ''}`;
        })
        .filter(Boolean)
        .join('\n');

      return [
        `SOURCE ${index + 1}`,
        `id: ${doc.id}`,
        `type: ${doc.sourceType}`,
        doc.url ? `link: ${doc.url}` : '',
        `languages available: ${doc.availableLangs.join(', ') || 'unknown'}`,
        variants,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');
}

function extractJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    // Structured output should make this unnecessary, but a stray code fence or
    // prose wrapper must not turn a good answer into a hard failure.
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Gemini returned no parsable JSON');
    return JSON.parse(match[0]);
  }
}

export function createGeminiComposer(apiKey: string): AnswerComposer {
  const ai = new GoogleGenAI({ apiKey });

  return {
    name: 'gemini',
    async compose(
      query: string,
      docs: RetrievedDoc[],
      lang: LanguageCode
    ): Promise<ComposedAnswer> {
      // No grounding material means there is nothing legitimate to say. Skip the
      // API call entirely rather than tempt the model to answer from memory.
      if (docs.length === 0) {
        return { message: '', sources: [], wasTranslated: false, answered: false };
      }

      const prompt = [
        `TARGET LANGUAGE: ${LANGUAGE_NAMES[lang]} (${lang})`,
        '',
        'SOURCES:',
        buildContext(docs),
        '',
        `QUESTION: ${query}`,
      ].join('\n');

      const response = await withTimeout(
        ai.models.generateContent({
          model: MODEL,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            // Low but non-zero: grounded summarisation, not creative writing.
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
        TIMEOUT_MS
      );

      const parsed = extractJson(response.text ?? '');
      const answered = parsed.answered !== false && Boolean(parsed.answer?.trim());

      if (!answered) {
        return { message: '', sources: [], wasTranslated: false, answered: false };
      }

      const usedIds: string[] = Array.isArray(parsed.usedSourceIds) ? parsed.usedSourceIds : [];
      const cited = docs.filter((doc) => usedIds.includes(doc.id));
      const effective = cited.length > 0 ? cited : docs;

      // Trust the record's own language coverage over the model's self-report:
      // usedTranslation is a claim, availableLangs is a fact.
      const translatedByFact = effective.some((doc) => !doc.availableLangs.includes(lang));

      return {
        message: parsed.answer.trim(),
        sources: effective.map((doc) => ({
          title:
            textIn(doc.title, lang) ||
            textIn(doc.title, 'om') ||
            textIn(doc.title, 'en') ||
            doc.id,
          url: doc.url,
        })),
        wasTranslated: translatedByFact || parsed.usedTranslation === true,
        answered: true,
      };
    },
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms)
    ),
  ]);
}
