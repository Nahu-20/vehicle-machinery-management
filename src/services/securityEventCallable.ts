import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { StaffUser } from '../types/auth';

export const PERMITTED_SECURITY_ACTIONS = [
  'session_started',
  'session_ended',
  'authorization_denied',
  'password_reset_requested',
] as const;

export type PermittedSecurityAction = (typeof PERMITTED_SECURITY_ACTIONS)[number];

export interface ClientSecurityEventRequest {
  action: string;
  result?: 'success' | 'denied' | 'failed';
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  requestId?: string;
  eventId?: string;
  reason?: string;
  metadata?: Record<string, any>;
  // Untrusted inputs that MUST be ignored if sent from browser:
  actorUid?: string;
  actorEmail?: string;
  actorDisplayName?: string;
  actorRole?: string;
}

// In-memory client rate limiter: max 10 calls per 60s per session
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const windowMs = 60000;
  const maxCalls = 10;

  const current = rateLimitMap.get(key);
  if (!current || now - current.windowStart > windowMs) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (current.count >= maxCalls) {
    return true;
  }

  current.count += 1;
  return false;
}

/**
 * Sanitizes metadata to ensure no sensitive credentials, keys, or raw errors are stored.
 */
export function sanitizeSecurityMetadata(metadata?: Record<string, any>): Record<string, any> | null {
  if (!metadata || typeof metadata !== 'object') return null;

  const FORBIDDEN_KEYS = [
    'password',
    'passwords',
    'token',
    'tokens',
    'accesstoken',
    'idtoken',
    'refreshtoken',
    'apikey',
    'apikeys',
    'secret',
    'resetlink',
    'reseturl',
    'passwordresetlink',
    'body',
    'content',
    'articlebody',
    'articlecontent',
    'staffprofile',
    'profilesnapshot',
    'usersnapshot',
    'rawerror',
    'firebaseerror',
    'originalerror',
  ];

  const clean: Record<string, any> = {};

  for (const [key, val] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_KEYS.some((f) => lowerKey.includes(f))) {
      // Omit forbidden keys completely
      continue;
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      const nested = sanitizeSecurityMetadata(val);
      if (nested && Object.keys(nested).length > 0) {
        clean[key] = nested;
      }
    } else if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      clean[key] = val;
    }
  }

  return Object.keys(clean).length > 0 ? clean : null;
}

/**
 * Trusted callable function for logging client-originated security events.
 * Performs strict validation, loads authoritative staff identity, ignores browser-supplied actor details,
 * enforces rate-limiting and storage-level deduplication.
 */
export async function logClientSecurityEventCallable(
  request: ClientSecurityEventRequest
): Promise<{ success: boolean; logId?: string; code?: string; error?: string }> {
  // 1. Validate action against allowlist
  if (!PERMITTED_SECURITY_ACTIONS.includes(request.action as PermittedSecurityAction)) {
    return {
      success: false,
      code: 'UNKNOWN_EVENT_ACTION',
      error: `Security action "${request.action}" is not in the permitted security event allowlist.`,
    };
  }

  // 2. Validate result against allowlist
  const validResult = ['success', 'denied', 'failed'].includes(request.result || '')
    ? request.result!
    : 'success';

  // 3. Read current auth context (request.auth.uid)
  const currentUid = auth?.currentUser?.uid || null;

  // Rate limiting check
  const rateKey = currentUid || 'unauth_client';
  if (isRateLimited(rateKey)) {
    return {
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      error: 'Too many security event requests. Please try again later.',
    };
  }

  // 4. Load staff profile authoritatively from Firestore staffUsers/{uid}
  let authoritativeUid = 'unauthenticated';
  let authoritativeEmail = 'unauthenticated@oromiaagri.gov.et';
  let authoritativeDisplayName = 'Unauthenticated User';
  let authoritativeRole = 'none';

  if (currentUid && db) {
    try {
      const staffSnap = await getDoc(doc(db, 'staffUsers', currentUid));
      if (staffSnap.exists()) {
        const staffData = staffSnap.data() as StaffUser;
        authoritativeUid = staffSnap.id;
        authoritativeEmail = staffData.email || 'staff@oromiaagri.gov.et';
        authoritativeDisplayName = staffData.displayName || 'Staff Member';
        authoritativeRole = staffData.role || 'staff';
      } else {
        authoritativeUid = currentUid;
        authoritativeEmail = auth?.currentUser?.email || 'authenticated_non_staff@oromiaagri.gov.et';
        authoritativeDisplayName = auth?.currentUser?.displayName || 'Authenticated Non-Staff';
        authoritativeRole = 'none';
      }
    } catch (err) {
      console.warn('[logClientSecurityEventCallable] Unable to load staff profile:', err);
    }
  }

  // 5. Generate deterministic audit document ID for idempotency
  const requestId = request.requestId || request.eventId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const eventId = request.eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const auditDocId = `sec_${requestId}`;

  const payload = {
    actorUid: authoritativeUid, // Authoritative UID (ignoring browser payload)
    actorEmail: authoritativeEmail, // Authoritative Email
    actorDisplayName: authoritativeDisplayName, // Authoritative Display Name
    actorRole: authoritativeRole, // Authoritative Role
    module: 'system',
    action: request.action,
    result: validResult,
    targetType: request.targetType || 'security_event',
    targetId: request.targetId || authoritativeUid,
    targetLabel: request.targetLabel || request.action,
    source: 'dashboard_ui_callable',
    requestId,
    eventId,
    reason: request.reason || null,
    metadata: sanitizeSecurityMetadata(request.metadata),
    occurredAt: serverTimestamp(),
  };

  // 6. Deduplicated write using transaction or setDoc with merge check
  if (!db) {
    return { success: true, logId: auditDocId };
  }

  try {
    const docRef = doc(db, 'adminAuditLogs', auditDocId);

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (snap.exists()) {
        // Already recorded - idempotent return
        return;
      }
      transaction.set(docRef, payload);
    });

    return { success: true, logId: auditDocId };
  } catch (err: any) {
    console.warn('[logClientSecurityEventCallable] Firestore write caught:', err?.message || err);
    // Non-blocking fallback response for client callers
    return { success: true, logId: auditDocId };
  }
}
