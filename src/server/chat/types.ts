import type { LanguageCode, LocalizedText } from '../../types/index.js';

/**
 * Content categories the retrieval layer can route a question to.
 * Each maps to one or more concrete content sources.
 */
export type ChatSourceType =
  | 'news'
  | 'alert'
  | 'achievement'
  | 'investment'
  | 'marketPrice'
  | 'office'
  | 'service'
  | 'program'
  | 'publication';

/**
 * A single piece of Bureau content, normalized across Firestore collections and
 * the static content in src/data/mockData.ts so the composer never needs to know
 * where an answer came from.
 */
export interface RetrievedDoc {
  id: string;
  sourceType: ChatSourceType;
  title: LocalizedText;
  body: LocalizedText;
  /** Site-relative link, surfaced to the user as a citation. */
  url?: string;
  /**
   * Languages this record genuinely exists in. Only Afaan Oromo is mandatory for
   * staff, so this is frequently ['om'] alone — it drives the machine-translation
   * label shown to Amharic and English users.
   */
  availableLangs: LanguageCode[];
  /** Epoch millis. Used for the recency boost on news and alerts. */
  publishedAt?: number;
  score: number;
}

export interface ChatIntent {
  sourceTypes: ChatSourceType[];
  /** Query tokens, normalized and lowercased. */
  tokens: string[];
}

export interface ChatCitation {
  title: string;
  url?: string;
}

export interface ComposedAnswer {
  message: string;
  sources: ChatCitation[];
  /** True when a cited record had no text in the user's language. */
  wasTranslated: boolean;
  /** False when grounding found nothing — the bot declined rather than guessed. */
  answered: boolean;
}

/**
 * The seam between retrieval and generation.
 *
 * Retrieval is identical whether or not an LLM writes the answer, so swapping
 * Gemini for deterministic templates is an env var (CHAT_COMPOSER), not a
 * rewrite. The template implementation also serves as the runtime fallback when
 * Gemini is keyless, rate-limited or down.
 */
export interface AnswerComposer {
  readonly name: 'gemini' | 'template';
  compose(
    query: string,
    docs: RetrievedDoc[],
    lang: LanguageCode
  ): Promise<ComposedAnswer>;
}
