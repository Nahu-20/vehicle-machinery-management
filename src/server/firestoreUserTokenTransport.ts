/**
 * Firestore REST transport using a verified Firebase ID token.
 * Used when Admin SDK credentials (ADC) are unavailable so mutations can still
 * persist under the caller's staff identity (requires matching Firestore rules).
 */

function projectId(): string {
  return (
    process.env.VITE_FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    'oromia-agriculture-dev'
  );
}

/** Build a Firestore document resource path (collections + docs as separate segments). */
export function firestoreDocumentPath(collectionPath: string, docId: string): string {
  const segments = [
    ...collectionPath.split('/').filter(Boolean),
    ...String(docId).split('/').filter(Boolean),
  ];
  if (segments.length < 2 || segments.length % 2 !== 0) {
    throw new Error(
      `Invalid Firestore document path: "${collectionPath}/${docId}" (must have even number of segments)`
    );
  }
  return segments.map(encodeURIComponent).join('/');
}

function docUrl(collection: string, docId: string): string {
  return `https://firestore.googleapis.com/v1/projects/${projectId()}/databases/(default)/documents/${firestoreDocumentPath(collection, docId)}`;
}

function encodeValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((v) => encodeValue(v)) } };
  }
  if (typeof value === 'object') {
    return { mapValue: { fields: toFirestoreFields(value as Record<string, unknown>) } };
  }
  return { stringValue: String(value) };
}

function toFirestoreFields(data: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    fields[key] = encodeValue(value);
  }
  return fields;
}

function decodeValue(value: any): unknown {
  if (!value || typeof value !== 'object') return null;
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) {
    return (value.arrayValue?.values || []).map((v: any) => decodeValue(v));
  }
  if ('mapValue' in value) {
    return fromFirestoreFields(value.mapValue?.fields || {});
  }
  return null;
}

function fromFirestoreFields(fields: Record<string, any>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields || {})) {
    out[key] = decodeValue(value);
  }
  return out;
}

export async function userTokenGetDoc(
  collection: string,
  docId: string,
  idToken: string
): Promise<{ exists: boolean; data: () => any }> {
  const res = await fetch(docUrl(collection, docId), {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (res.status === 404) {
    return { exists: false, data: () => null };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`USER_TOKEN_GET_FAILED:${res.status}:${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as { fields?: Record<string, any> };
  const decoded = fromFirestoreFields(json.fields || {});
  return { exists: true, data: () => decoded };
}

export async function userTokenSetDoc(
  collection: string,
  docId: string,
  data: Record<string, unknown>,
  idToken: string
): Promise<void> {
  const fields = toFirestoreFields(data);
  const fieldPaths = Object.keys(fields);
  const url = docUrl(collection, docId);
  // PATCH creates or updates. Include updateMask so omitted fields are left intact on update.
  const qs =
    fieldPaths.length > 0
      ? `?${fieldPaths.map((p) => `updateMask.fieldPaths=${encodeURIComponent(p)}`).join('&')}`
      : '';

  const res = await fetch(`${url}${qs}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `USER_TOKEN_SET_FAILED:${res.status}:${firestoreDocumentPath(collection, docId)}:${text.slice(0, 400)}`
    );
  }
}

export async function userTokenDeleteDoc(
  collection: string,
  docId: string,
  idToken: string
): Promise<void> {
  const res = await fetch(docUrl(collection, docId), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (res.status === 404) return;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`USER_TOKEN_DELETE_FAILED:${res.status}:${text.slice(0, 200)}`);
  }
}
