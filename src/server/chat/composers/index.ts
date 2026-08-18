import type { AnswerComposer } from '../types.js';
import { templateComposer, composeFromTemplate } from './templateComposer.js';
import { createGeminiComposer } from './geminiComposer.js';

export { templateComposer, composeFromTemplate, composeDecline } from './templateComposer.js';
export { createGeminiComposer } from './geminiComposer.js';

let cached: AnswerComposer | null = null;

/**
 * Pick the composer from CHAT_COMPOSER ('gemini' | 'template').
 *
 * Defaults to gemini when a key is present and template otherwise, so a missing
 * GEMINI_API_KEY degrades the bot to deterministic answers instead of breaking
 * it. Switching modes permanently is this one env var — retrieval is unaffected
 * either way.
 */
export function getComposer(): AnswerComposer {
  if (cached) return cached;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const requested = (process.env.CHAT_COMPOSER || '').trim().toLowerCase();

  if (requested === 'template') {
    cached = templateComposer;
  } else if (!apiKey) {
    if (requested === 'gemini') {
      console.warn('[chat] CHAT_COMPOSER=gemini but GEMINI_API_KEY is unset — using templates.');
    }
    cached = templateComposer;
  } else {
    cached = createGeminiComposer(apiKey);
  }

  console.log(`[chat] Answer composer: ${cached.name}`);
  return cached;
}

/** Test seam — clears the memoized composer so env changes take effect. */
export function resetComposerCache(): void {
  cached = null;
}
