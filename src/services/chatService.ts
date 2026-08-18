export interface ChatRequest {
  message: string;
  language: 'om' | 'am' | 'en';
  conversationId?: string;
}

export interface ChatSource {
  title: string;
  url?: string;
}

export interface ChatResponse {
  message: string;
  conversationId?: string;
  sources?: ChatSource[];
  /** True when the answer drew on records that have no text in the user's language. */
  wasTranslated?: boolean;
  /** False when nothing in the Bureau's records covered the question. */
  answered?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  status?: 'sending' | 'sent' | 'failed';
  sources?: ChatSource[];
  wasTranslated?: boolean;
}

/**
 * Chat Service
 * ------------
 * Thin client for POST /api/chat. All retrieval, grounding and language handling
 * happen server-side (src/server/chat/) — the browser never sees an API key and
 * never decides what content an answer may draw on.
 */
const CHAT_ENDPOINT = '/api/chat';

const NETWORK_ERROR: Record<'om' | 'am' | 'en', string> = {
  om: 'Sarara interneetii wajjin rakkoon jira. Maaloo irra deebiin yaalaa.',
  am: 'የግንኙነት ችግር አጋጥሟል። እባክዎ እንደገና ይሞክሩ።',
  en: 'Connection problem. Please try again.',
};

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const language = request.language || 'om';

  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: request.message,
        language,
        conversationId: request.conversationId,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // The server sends a localized, user-safe message with its error codes
      // (validation, rate limit, internal); prefer it over a generic string.
      return {
        message: data?.message || NETWORK_ERROR[language],
        sources: [],
        answered: false,
      };
    }

    return {
      message: data?.message ?? '',
      conversationId: data?.conversationId ?? request.conversationId,
      sources: Array.isArray(data?.sources) ? data.sources : [],
      wasTranslated: data?.wasTranslated === true,
      answered: data?.answered !== false,
    };
  } catch (err) {
    console.warn('[chat] Request failed:', err);
    return {
      message: NETWORK_ERROR[language],
      sources: [],
      answered: false,
    };
  }
}
