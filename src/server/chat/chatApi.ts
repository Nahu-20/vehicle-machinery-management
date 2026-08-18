import { Request, Response } from 'express';
import type { LanguageCode } from '../../types/index.js';
import { retrieve } from './retrieval/index.js';
import { getComposer, composeFromTemplate, composeDecline } from './composers/index.js';
import type { ComposedAnswer } from './types.js';

const VALID_LANGS: LanguageCode[] = ['om', 'am', 'en'];

const MAX_MESSAGE_LENGTH = Number(process.env.CHAT_MAX_MESSAGE_LENGTH || 500);
const RATE_LIMIT_MAX = Number(process.env.CHAT_RATE_LIMIT_PER_HOUR || 20);
const RATE_WINDOW_MS = 60 * 60 * 1000;

/**
 * Per-IP rate limiting, best effort only.
 *
 * In-memory and therefore per-process. Against the Express server that is a
 * real limit. On serverless it is not: each cold invocation starts with an empty
 * map, so the ceiling applies per warm instance rather than per hour, and a
 * caller who spreads requests out can exceed RATE_LIMIT_MAX by a wide margin.
 *
 * This is worth stating plainly because the endpoint spends money on every call.
 * It raises the cost of casual abuse and does nothing against deliberate abuse.
 * A real limit needs shared state — Vercel KV, Upstash, or any Redis — keyed the
 * same way; only the storage below changes.
 *
 * The message length cap is the defence that does hold everywhere, being stateless.
 */
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((at) => now - at < RATE_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(ip, recent);
    return true;
  }

  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic sweep so the map cannot grow without bound.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((at) => now - at >= RATE_WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

const DECLINE: Record<LanguageCode, string> = {
  om: 'Dhiifama, gaaffiin keessan yeroo ampaa deebisuu hin dandeenye. Maaloo irra deebiin yaalaa.',
  am: 'ይቅርታ፣ ጥያቄዎን አሁን መመለስ አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
  en: 'Sorry — that request could not be handled right now. Please try again.',
};

const RATE_LIMIT_MESSAGE: Record<LanguageCode, string> = {
  om: 'Gaaffii baayee ergitaniittu. Maaloo daqiiqaa muraasa booda irra deebiin yaalaa.',
  am: 'በጣም ብዙ ጥያቄዎች ልከዋል። እባክዎ ከጥቂት ደቂቃዎች በኋላ እንደገና ይሞክሩ።',
  en: 'Too many requests. Please try again in a few minutes.',
};

/**
 * POST /api/chat
 *
 * Runs entirely server-side so GEMINI_API_KEY never reaches the browser.
 * Retrieval always runs first; the composer only ever sees content that was
 * actually found, which is what keeps answers grounded.
 */
export async function handleChat(req: Request, res: Response): Promise<void> {
  const body = req.body ?? {};
  const rawMessage = typeof body.message === 'string' ? body.message.trim() : '';
  const lang: LanguageCode = VALID_LANGS.includes(body.language) ? body.language : 'om';

  if (!rawMessage) {
    res.status(400).json({ error: 'message is required', message: DECLINE[lang] });
    return;
  }

  if (rawMessage.length > MAX_MESSAGE_LENGTH) {
    res.status(413).json({
      error: `message exceeds ${MAX_MESSAGE_LENGTH} characters`,
      message: DECLINE[lang],
    });
    return;
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
  if (rateLimited(ip)) {
    res.status(429).json({ error: 'rate limit exceeded', message: RATE_LIMIT_MESSAGE[lang] });
    return;
  }

  try {
    const docs = await retrieve(rawMessage, lang);

    const composer = getComposer();
    let answer: ComposedAnswer;

    try {
      answer = await composer.compose(rawMessage, docs, lang);

      // A composer that returns answered=false has judged that the retrieved
      // records do not cover the question. That judgment is the whole point of
      // grounding it, so it must not be overridden here: re-composing the same
      // near-miss records as an answer is exactly the guessing this assistant
      // exists to prevent. Decline, and offer the near misses as related links.
      if (!answer.answered) {
        answer = composeDecline(docs, lang);
      }
    } catch (err) {
      // Distinct from the case above. Here nothing judged anything — Gemini was
      // keyless, rate-limited, timed out or errored — so the retrieved records
      // are the best available answer and templates render them deterministically
      // rather than failing the farmer entirely.
      console.warn('[chat] Composer failed, falling back to templates:', (err as Error)?.message);
      answer = composeFromTemplate(rawMessage, docs, lang);
    }

    res.json({
      message: answer.message,
      sources: answer.sources,
      wasTranslated: answer.wasTranslated,
      answered: answer.answered,
      conversationId: typeof body.conversationId === 'string' ? body.conversationId : undefined,
    });
  } catch (err) {
    console.error('[chat] Request failed:', err);
    res.status(500).json({ error: 'internal error', message: DECLINE[lang] });
  }
}
