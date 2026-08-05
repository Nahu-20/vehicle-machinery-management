export interface FirebaseEnvConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  firebaseStorageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const getFirebaseConfig = (): FirebaseEnvConfig | null => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
  const rawStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || '';
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();

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
    messagingSenderId: messagingSenderId || '',
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
  const keys: Record<string, string | undefined> = {
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
  };

  const missingKeys = Object.entries(keys)
    .filter(([_, val]) => !val || val === '')
    .map(([key]) => key);

  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
};
