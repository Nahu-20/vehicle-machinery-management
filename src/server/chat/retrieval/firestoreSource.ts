import {
  collection,
  query,
  where,
  orderBy,
  limit as fsLimit,
  getDocs,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import type { LocalizedText } from '../../../types/index.js';
import type { ChatSourceType, RetrievedDoc } from '../types.js';
import { langsPresent } from './localized.js';
import { getPublicFirebaseConfig, getPublicFirestore } from './publicFirestore.js';

type Draft = Omit<RetrievedDoc, 'score'>;

/**
 * Reads published Bureau content from Firestore.
 *
 * SECURITY: every query filters to published/active status. Drafts, items in
 * review, unpublished, archived and trashed content must never reach the chatbot,
 * which serves anonymous public users. A draft tender disclosed early, or a
 * retracted pest advisory resurfaced, is a real incident for a government bureau.
 *
 * firestore.rules enforces the same restriction independently, so this filter is
 * the inner of two layers rather than the only one.
 */

/** Firestore Timestamp | ISO string | Date | millis -> epoch millis. */
function toMillis(value: any): number | undefined {
  if (!value) return undefined;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

/** Flatten a content-block array into searchable text per language. */
function blocksToText(blocks: any): LocalizedText {
  if (!Array.isArray(blocks)) return {};
  const out: { om: string; am: string; en: string } = { om: '', am: '', en: '' };

  const absorb = (value: any) => {
    if (!value) return;
    if (typeof value === 'string') {
      out.om += ` ${value}`;
      return;
    }
    if (typeof value === 'object') {
      for (const lang of ['om', 'am', 'en'] as const) {
        if (typeof value[lang] === 'string') out[lang] += ` ${value[lang]}`;
      }
    }
  };

  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    absorb(block.content);
    absorb(block.title);
    if (Array.isArray(block.items)) block.items.forEach(absorb);
  }

  return { om: out.om.trim(), am: out.am.trim(), en: out.en.trim() };
}

/** Run a query, returning [] rather than throwing when the collection is unusable. */
async function fetchDocs(
  collectionName: string,
  constraints: QueryConstraint[]
): Promise<{ id: string; data: any }[]> {
  const db = getPublicFirestore();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, collectionName), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
}

const PER_COLLECTION_LIMIT = 40;

async function fetchNews(limit: number): Promise<Draft[]> {
  const rows = await fetchDocs('newsArticles', [
    where('status', '==', 'published'),
    where('publishedAt', '<=', Timestamp.now()),
    orderBy('publishedAt', 'desc'),
    fsLimit(limit),
  ]);

  return rows.map(({ id, data }) => {
    const body = blocksToText(data.content);
    return {
      id,
      sourceType: 'news' as ChatSourceType,
      title: data.title ?? {},
      body: data.excerpt ?? body,
      url: `/news/${data.slug ?? id}`,
      availableLangs: langsPresent(data.title, data.excerpt, body),
      publishedAt: toMillis(data.publishedAt),
    };
  });
}

async function fetchAlerts(limit: number): Promise<Draft[]> {
  const rows = await fetchDocs('agriculturalAlerts', [
    where('status', '==', 'published'),
    fsLimit(limit),
  ]);

  const now = Date.now();

  return rows
    .map((row) => ({ ...row, expiresAt: toMillis(row.data.expiresAt) }))
    // An expired advisory is worse than none — it can send a farmer to act on a
    // pest warning that lapsed months ago.
    .filter(({ expiresAt }) => !expiresAt || expiresAt > now)
    .map(({ id, data }) => {
      const actions = Array.isArray(data.recommendedActions)
        ? blocksToText(data.recommendedActions)
        : {};
      return {
        id,
        sourceType: 'alert' as ChatSourceType,
        title: data.title ?? {},
        body: data.body ?? data.summary ?? actions,
        url: `/alerts/${data.slug ?? id}`,
        availableLangs: langsPresent(data.title, data.summary, data.body),
        publishedAt: toMillis(data.effectiveFrom),
      };
    });
}

async function fetchAchievements(limit: number): Promise<Draft[]> {
  const rows = await fetchDocs('achievements', [
    where('status', '==', 'published'),
    fsLimit(limit),
  ]);

  return rows.map(({ id, data }) => {
    const body = blocksToText(data.content);
    return {
      id,
      sourceType: 'achievement' as ChatSourceType,
      title: data.title ?? {},
      body: data.summary ?? body,
      url: `/achievements/${data.slug ?? id}`,
      availableLangs: langsPresent(data.title, data.summary, body),
      publishedAt: toMillis(data.achievementDate ?? data.publishedAt),
    };
  });
}

async function fetchInvestment(limit: number): Promise<Draft[]> {
  const rows = await fetchDocs('investmentOpportunities', [
    where('lifecycleStatus', '==', 'published'),
    fsLimit(limit),
  ]);

  return rows.map(({ id, data }) => {
    // Investment opportunities store plain strings rather than LocalizedText;
    // they are authored in English only.
    const title: LocalizedText = { en: data.title ?? '' };
    const body: LocalizedText = {
      en: [data.summary, data.description, data.opportunityType, data.responsibleOffice]
        .filter(Boolean)
        .join('. '),
    };
    return {
      id,
      sourceType: 'investment' as ChatSourceType,
      title,
      body,
      url: '/investment',
      availableLangs: langsPresent(title, body),
      publishedAt: toMillis(data.publishedAt ?? data.createdAt),
    };
  });
}

const FETCHERS: Record<string, (limit: number) => Promise<Draft[]>> = {
  news: fetchNews,
  alert: fetchAlerts,
  achievement: fetchAchievements,
  investment: fetchInvestment,
};

let warnedUnconfigured = false;

/** Whether the web configuration needed to reach Firestore is present. */
export function isFirestoreConfigured(): boolean {
  if (getPublicFirebaseConfig()) return true;

  if (!warnedUnconfigured) {
    warnedUnconfigured = true;
    console.warn(
      '[chat] VITE_FIREBASE_* not set — Firestore content (news, alerts, achievements, ' +
        'investment) is unavailable. Answers will use static content only. Add the six ' +
        'VITE_FIREBASE_* values from Firebase Console > Project settings > Your apps.'
    );
  }
  return false;
}

/** Test seam — allows the unconfigured warning to be emitted again. */
export function resetFirestoreAvailability(): void {
  warnedUnconfigured = false;
}

/**
 * Firestore content matching the requested source types.
 *
 * A failing collection (missing composite index, rules rejection, network) degrades
 * that one source to empty rather than failing the whole answer — the static
 * sources can still carry the reply.
 */
export async function loadFirestoreDocs(sourceTypes: ChatSourceType[]): Promise<Draft[]> {
  if (!isFirestoreConfigured()) return [];

  const wanted = sourceTypes.filter((type) => type in FETCHERS);
  if (wanted.length === 0) return [];

  const results = await Promise.allSettled(
    wanted.map((type) => FETCHERS[type](PER_COLLECTION_LIMIT))
  );

  const docs: Draft[] = [];
  for (const [index, result] of results.entries()) {
    if (result.status === 'fulfilled') {
      docs.push(...result.value);
    } else {
      console.warn(
        `[chat] Firestore source '${wanted[index]}' failed:`,
        (result.reason as Error)?.message ?? result.reason
      );
    }
  }
  return docs;
}
