import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Firestore, initializeFirestore, getFirestore } from 'firebase/firestore';

/**
 * Firestore access for the chatbot, using the public web configuration.
 *
 * Deliberately the *client* SDK rather than firebase-admin, reading the same
 * VITE_FIREBASE_* values the website uses.
 *
 * Why: the bot only ever retrieves published content, and firestore.rules already
 * grants anonymous read of published newsArticles, agriculturalAlerts,
 * achievements and investmentOpportunities. A service-account key would grant far
 * more than that — admin credentials bypass security rules entirely — so using one
 * here would mean holding a powerful secret to do a job that needs no privilege at
 * all. It also removes the deployment dependency on distributing that key.
 *
 * The upshot is defence in depth: the queries filter to published content, and
 * Firebase independently refuses anything else. A bug in the filter cannot leak a
 * draft tender or a retracted advisory.
 *
 * These values are not secrets. Firebase web config is embedded in the JavaScript
 * of every Firebase site; access is decided by rules, not by possession of it.
 */

const APP_NAME = 'oab-chat-reader';

export interface PublicFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

function readEnv(key: string): string {
  return (process.env[key] || '').trim();
}

/** The web config, or null when it has not been provided. */
export function getPublicFirebaseConfig(): PublicFirebaseConfig | null {
  const apiKey = readEnv('VITE_FIREBASE_API_KEY');
  const authDomain = readEnv('VITE_FIREBASE_AUTH_DOMAIN');
  const projectId = readEnv('VITE_FIREBASE_PROJECT_ID');
  const appId = readEnv('VITE_FIREBASE_APP_ID');

  // Matches the client's own requirement in src/config/env.ts: these four are the
  // minimum Firestore needs. Bucket and sender id are optional for reads.
  if (!apiKey || !authDomain || !projectId || !appId) return null;

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET') || undefined,
    messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || undefined,
    appId,
  };
}

let cached: Firestore | null = null;
let initFailed = false;

/**
 * Firestore handle, or null when unconfigured or unreachable.
 *
 * Named app instance so it cannot collide with any other Firebase app in the
 * process. Never throws — callers degrade to static content instead.
 */
export function getPublicFirestore(): Firestore | null {
  if (cached) return cached;
  if (initFailed) return null;

  const config = getPublicFirebaseConfig();
  if (!config) return null;

  try {
    const existing = getApps().find((a) => a.name === APP_NAME);
    const app: FirebaseApp = existing ?? initializeApp(config, APP_NAME);

    try {
      // Long polling auto-detection keeps this working from a server process and
      // from behind proxies, where the default WebChannel transport can stall.
      cached = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      });
    } catch {
      cached = getFirestore(app);
    }

    console.log(`[chat] Firestore connected to project '${config.projectId}' (public read access).`);
    return cached;
  } catch (err) {
    initFailed = true;
    console.warn('[chat] Firestore initialization failed:', (err as Error)?.message);
    return null;
  }
}

/** Test seam — clears the memoized app so env changes take effect. */
export function resetPublicFirestore(): void {
  cached = null;
  initFailed = false;
}
