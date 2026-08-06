export interface FirebaseEnvConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  firebaseStorageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const getEnvVar = (metaVal: string | undefined, key: string): string => {
  if (metaVal && metaVal.trim()) return metaVal.trim();
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key]!.trim();
  }
  return '';
};

export const getFirebaseConfig = (): FirebaseEnvConfig | null => {
  const apiKey = getEnvVar(import.meta.env?.VITE_FIREBASE_API_KEY, 'VITE_FIREBASE_API_KEY');
  const authDomain = getEnvVar(import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN, 'VITE_FIREBASE_AUTH_DOMAIN');
  const projectId = getEnvVar(import.meta.env?.VITE_FIREBASE_PROJECT_ID, 'VITE_FIREBASE_PROJECT_ID');
  const rawStorageBucket = getEnvVar(import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET, 'VITE_FIREBASE_STORAGE_BUCKET');
  const messagingSenderId = getEnvVar(import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID, 'VITE_FIREBASE_MESSAGING_SENDER_ID');
  const appId = getEnvVar(import.meta.env?.VITE_FIREBASE_APP_ID, 'VITE_FIREBASE_APP_ID');

  if (!apiKey || !authDomain || !projectId || !appId) {
    return null;
  }

  const effectiveStorageBucket = rawStorageBucket || `${projectId}.appspot.com`;

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: effectiveStorageBucket,
    firebaseStorageBucket: effectiveStorageBucket,
    messagingSenderId,
    appId,
  };
};

export const isFirebaseConfigured = (): boolean => {
  return getFirebaseConfig() !== null;
};

export const isStorageConfigured = (): boolean => {
  const config = getFirebaseConfig();
  return Boolean(config && config.firebaseStorageBucket && config.firebaseStorageBucket.length > 0);
};

export const getFirebaseConfigStatus = (): {
  configured: boolean;
  missingKeys: string[];
} => {
  const keys: Record<string, string> = {
    VITE_FIREBASE_API_KEY: getEnvVar(import.meta.env?.VITE_FIREBASE_API_KEY, 'VITE_FIREBASE_API_KEY'),
    VITE_FIREBASE_AUTH_DOMAIN: getEnvVar(import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN, 'VITE_FIREBASE_AUTH_DOMAIN'),
    VITE_FIREBASE_PROJECT_ID: getEnvVar(import.meta.env?.VITE_FIREBASE_PROJECT_ID, 'VITE_FIREBASE_PROJECT_ID'),
    VITE_FIREBASE_STORAGE_BUCKET: getEnvVar(import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET, 'VITE_FIREBASE_STORAGE_BUCKET'),
    VITE_FIREBASE_MESSAGING_SENDER_ID: getEnvVar(import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID, 'VITE_FIREBASE_MESSAGING_SENDER_ID'),
    VITE_FIREBASE_APP_ID: getEnvVar(import.meta.env?.VITE_FIREBASE_APP_ID, 'VITE_FIREBASE_APP_ID'),
  };

  const missingKeys = Object.entries(keys)
    .filter(([_, val]) => !val || val === '')
    .map(([key]) => key);

  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
};
