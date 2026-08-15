import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Request, Response } from 'express';

/**
 * Serverless entry point for the chatbot on Vercel.
 *
 * Vercel does not run `server.ts` — there is no long-lived process, so the
 * Express routes defined there never exist in production. Each file in this
 * directory becomes an independent function instead, and `api/chat.ts` maps to
 * POST /api/chat, the same path the browser already calls.
 *
 * This is deliberately a thin adapter rather than a second implementation.
 * `handleChat` only touches `req.body`, `req.headers`, `req.ip` and
 * `res.status().json()`, all of which Vercel's objects provide, so the retrieval
 * and grounding logic stays in one place and keeps being exercised by
 * `npm run test:chat`. Local development still goes through Express.
 *
 * The handler is imported dynamically rather than at module scope so that a
 * resolution failure surfaces as a JSON error from a live function instead of
 * FUNCTION_INVOCATION_FAILED, which reports nothing the caller can act on.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  let handleChat: (req: Request, res: Response) => Promise<void>;
  try {
    ({ handleChat } = await import('../src/server/chat/chatApi.js'));
  } catch (err) {
    // Details go to the function log, not the response: this endpoint is
    // publicly reachable, and module paths and stack frames are not the
    // caller's business. The log is where an operator should look.
    console.error('[api/chat] module load failed:', err);
    res.status(500).json({ error: 'chat unavailable' });
    return;
  }

  // The two request shapes overlap on everything handleChat reads, but they are
  // structurally unrelated types, so the cast is required and is safe here.
  await handleChat(req as unknown as Request, res as unknown as Response);
}
