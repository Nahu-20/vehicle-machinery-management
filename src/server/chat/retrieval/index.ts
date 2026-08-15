import type { LanguageCode } from '../../../types/index.js';
import type { RetrievedDoc } from '../types.js';
import { classifyIntent } from './intent.js';
import { loadFirestoreDocs } from './firestoreSource.js';
import { loadStaticDocs } from './staticSource.js';
import { rankDocs } from './scoring.js';

export { classifyIntent } from './intent.js';
export { tokenize, scoreDoc, rankDocs } from './scoring.js';
export { loadStaticDocs } from './staticSource.js';
export { loadFirestoreDocs } from './firestoreSource.js';

export const DEFAULT_TOP_N = 5;

/**
 * Ceiling on how long Firestore may take before the answer proceeds without it.
 *
 * The Firestore client SDK is offline-first and retries a failed connection
 * indefinitely rather than rejecting. A wrong project id or a network fault would
 * therefore hang every chat request forever instead of degrading. Static content
 * can still carry an answer, so retrieval gives up and continues.
 */
const FIRESTORE_TIMEOUT_MS = Number(process.env.CHAT_FIRESTORE_TIMEOUT_MS || 5000);

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T, label: string): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => {
      console.warn(`[chat] ${label} timed out after ${ms}ms — continuing without it.`);
      resolve(fallback);
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        console.warn(`[chat] ${label} failed:`, (err as Error)?.message ?? err);
        resolve(fallback);
      });
  });
}

/**
 * Find the Bureau content most likely to answer a question.
 *
 * Deliberately AI-free and deterministic: this stage behaves identically whether
 * Gemini or the template composer writes the final answer, which is what makes
 * the composer swappable.
 */
export async function retrieve(
  query: string,
  lang: LanguageCode,
  topN: number = DEFAULT_TOP_N
): Promise<RetrievedDoc[]> {
  const intent = classifyIntent(query);
  if (intent.tokens.length === 0) return [];

  const [firestoreDocs, staticDocs] = await Promise.all([
    withTimeout(loadFirestoreDocs(intent.sourceTypes), FIRESTORE_TIMEOUT_MS, [], 'Firestore retrieval'),
    Promise.resolve(loadStaticDocs(intent.sourceTypes)),
  ]);

  return rankDocs([...firestoreDocs, ...staticDocs], intent.tokens, lang, topN);
}
