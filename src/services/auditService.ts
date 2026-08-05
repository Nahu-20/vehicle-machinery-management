import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { AdminAuditLog, AuditLogFilters, AdminModule, AdminAuditAction } from '../types/audit';
import { StaffUser } from '../types/auth';

import { sanitizeSecurityMetadata } from './securityEventCallable';
import { setDoc, runTransaction } from 'firebase/firestore';

const SESSION_STORAGE_KEY = 'admin_dashboard_session_id';

/**
 * Returns or creates a session ID stored in sessionStorage for current browser session.
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  let sid = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
  }
  return sid;
}

/**
 * Log an administrative action to `adminAuditLogs`.
 * Enforces storage-level deduplication via deterministic document IDs.
 * Never throws exceptions or breaks caller execution if audit logging fails.
 */
export async function logAuditEvent(
  input: Omit<AdminAuditLog, 'id' | 'occurredAt'> & { occurredAt?: any }
): Promise<string | null> {
  if (!db) return null;

  try {
    const activeUid = auth?.currentUser?.uid || input.actorUid || 'unknown';
    const sid = getSessionId();

    const eventId = input.eventId || 'evt_' + Math.random().toString(36).substring(2, 9);
    const requestId = input.requestId || 'req_' + Math.random().toString(36).substring(2, 9);

    // Storage-level deterministic document ID for idempotency
    const auditDocId = input.eventId
      ? `evt_${input.eventId}`
      : input.requestId
      ? `req_${input.requestId}_${input.action}`
      : `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const logPayload = {
      actorUid: activeUid,
      actorEmail: input.actorEmail || 'staff@oromiaagri.gov.et',
      actorDisplayName: input.actorDisplayName || 'Staff Member',
      actorRole: input.actorRole || 'staff',
      module: input.module,
      action: input.action,
      result: input.result || 'success',
      targetType: input.targetType || input.module,
      targetId: input.targetId || 'unknown',
      targetLabel: input.targetLabel || input.targetId || 'N/A',
      source: input.source || 'dashboard_ui',
      sessionId: input.sessionId || sid,
      requestId,
      eventId,
      previousStatus: input.previousStatus || null,
      newStatus: input.newStatus || null,
      versionBefore: input.versionBefore ?? null,
      versionAfter: input.versionAfter ?? null,
      changedFields: input.changedFields || [],
      reason: input.reason || null,
      errorCode: input.errorCode || null,
      metadata: sanitizeSecurityMetadata(input.metadata),
      occurredAt: input.occurredAt || serverTimestamp(),
    };

    const docRef = doc(db, 'adminAuditLogs', auditDocId);

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (snap.exists()) {
        // Document already exists - idempotent return
        return;
      }
      transaction.set(docRef, logPayload);
    });

    return auditDocId;
  } catch (err) {
    console.warn('[auditService] Note: Non-blocking audit log creation note:', err);
    return null;
  }
}

/**
 * Fetch paginated audit logs with support for filters.
 */
export async function getAdminAuditLogsPaginated(
  filters: AuditLogFilters = {},
  pageSize = 25,
  cursorDoc: QueryDocumentSnapshot | null = null
): Promise<{ logs: AdminAuditLog[]; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean }> {
  if (!db) return { logs: [], lastDoc: null, hasMore: false };

  try {
    const constraints: any[] = [orderBy('occurredAt', 'desc')];

    if (filters.module && filters.module !== 'all') {
      constraints.unshift(where('module', '==', filters.module));
    }
    if (filters.result && filters.result !== 'all') {
      constraints.unshift(where('result', '==', filters.result));
    }
    if (filters.actorRole && filters.actorRole !== 'all') {
      constraints.unshift(where('actorRole', '==', filters.actorRole));
    }

    if (cursorDoc) {
      constraints.push(startAfter(cursorDoc));
    }

    constraints.push(limit(pageSize + 1));

    const q = query(collection(db, 'adminAuditLogs'), ...constraints);
    const snap = await getDocs(q);

    let rawLogs: AdminAuditLog[] = snap.docs.map((d) => {
      const data = d.data();
      const occurredAtMs = data.occurredAt?.toMillis
        ? data.occurredAt.toMillis()
        : data.occurredAt
        ? new Date(data.occurredAt).getTime()
        : Date.now();

      return {
        id: d.id,
        actorUid: data.actorUid || '',
        actorEmail: data.actorEmail || '',
        actorDisplayName: data.actorDisplayName || '',
        actorRole: data.actorRole || 'staff',
        module: data.module || 'system',
        action: data.action || 'viewed',
        result: data.result || 'success',
        targetType: data.targetType || 'unknown',
        targetId: data.targetId || '',
        targetLabel: data.targetLabel || '',
        source: data.source || 'dashboard_ui',
        sessionId: data.sessionId,
        requestId: data.requestId,
        eventId: data.eventId,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        versionBefore: data.versionBefore,
        versionAfter: data.versionAfter,
        changedFields: data.changedFields || [],
        reason: data.reason,
        errorCode: data.errorCode,
        metadata: data.metadata,
        occurredAt: occurredAtMs,
      };
    });

    // Client-side filtering for search query, targetId, action
    if (filters.action && filters.action !== 'all') {
      rawLogs = rawLogs.filter((l) => l.action === filters.action);
    }
    if (filters.actorUid) {
      const term = filters.actorUid.toLowerCase();
      rawLogs = rawLogs.filter(
        (l) =>
          l.actorUid.toLowerCase().includes(term) ||
          l.actorEmail.toLowerCase().includes(term) ||
          l.actorDisplayName.toLowerCase().includes(term)
      );
    }
    if (filters.targetId) {
      const term = filters.targetId.toLowerCase();
      rawLogs = rawLogs.filter(
        (l) =>
          l.targetId.toLowerCase().includes(term) ||
          l.targetLabel.toLowerCase().includes(term)
      );
    }
    if (filters.searchQuery) {
      const qStr = filters.searchQuery.toLowerCase();
      rawLogs = rawLogs.filter(
        (l) =>
          l.targetLabel.toLowerCase().includes(qStr) ||
          l.targetId.toLowerCase().includes(qStr) ||
          l.actorDisplayName.toLowerCase().includes(qStr) ||
          l.actorEmail.toLowerCase().includes(qStr) ||
          l.action.toLowerCase().includes(qStr)
      );
    }

    const hasMore = rawLogs.length > pageSize;
    const logs = hasMore ? rawLogs.slice(0, pageSize) : rawLogs;
    const lastDoc = snap.docs.length > 0 ? snap.docs[Math.min(pageSize - 1, snap.docs.length - 1)] : null;

    return { logs, lastDoc, hasMore };
  } catch (err) {
    console.error('[auditService] Error querying audit logs:', err);
    return { logs: [], lastDoc: null, hasMore: false };
  }
}

/**
 * Query entity-specific contextual history logs.
 */
export async function getEntityAuditHistory(
  module: AdminModule,
  targetId: string,
  limitCount = 50
): Promise<AdminAuditLog[]> {
  if (!db || !targetId) return [];

  try {
    const cleanId = targetId.trim();
    const q = query(
      collection(db, 'adminAuditLogs'),
      where('module', '==', module),
      where('targetId', '==', cleanId),
      orderBy('occurredAt', 'desc'),
      limit(limitCount)
    );

    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        actorUid: data.actorUid || '',
        actorEmail: data.actorEmail || '',
        actorDisplayName: data.actorDisplayName || '',
        actorRole: data.actorRole || 'staff',
        module: data.module || module,
        action: data.action || 'updated',
        result: data.result || 'success',
        targetType: data.targetType || module,
        targetId: data.targetId || cleanId,
        targetLabel: data.targetLabel || cleanId,
        source: data.source || 'dashboard_ui',
        sessionId: data.sessionId,
        requestId: data.requestId,
        eventId: data.eventId,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        versionBefore: data.versionBefore,
        versionAfter: data.versionAfter,
        changedFields: data.changedFields || [],
        reason: data.reason,
        errorCode: data.errorCode,
        metadata: data.metadata,
        occurredAt: data.occurredAt?.toMillis ? data.occurredAt.toMillis() : data.occurredAt || Date.now(),
      };
    });
  } catch (err) {
    console.warn('[auditService] Error fetching entity audit history:', err);
    return [];
  }
}

/**
 * Export filtered activity records to CSV and record an audit log.
 */
export async function exportAuditLogsToCSV(
  logs: AdminAuditLog[],
  requestingUser: StaffUser
): Promise<void> {
  if (!logs || logs.length === 0) return;

  const headers = [
    'Log ID',
    'Timestamp',
    'Module',
    'Action',
    'Result',
    'Actor Display Name',
    'Actor Email',
    'Actor Role',
    'Actor UID',
    'Target Type',
    'Target ID',
    'Target Label',
    'Previous Status',
    'New Status',
    'Reason',
    'Session ID',
  ];

  const rows = logs.map((log) => [
    `"${log.id}"`,
    `"${log.occurredAt ? new Date(log.occurredAt).toISOString() : ''}"`,
    `"${log.module}"`,
    `"${log.action}"`,
    `"${log.result}"`,
    `"${(log.actorDisplayName || '').replace(/"/g, '""')}"`,
    `"${log.actorEmail}"`,
    `"${log.actorRole}"`,
    `"${log.actorUid}"`,
    `"${log.targetType}"`,
    `"${log.targetId}"`,
    `"${(log.targetLabel || '').replace(/"/g, '""')}"`,
    `"${log.previousStatus || ''}"`,
    `"${log.newStatus || ''}"`,
    `"${(log.reason || '').replace(/"/g, '""')}"`,
    `"${log.sessionId || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `oromia_agri_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Record audit log for export
  await logAuditEvent({
    actorUid: requestingUser.uid,
    actorEmail: requestingUser.email,
    actorDisplayName: requestingUser.displayName,
    actorRole: requestingUser.role,
    module: 'system',
    action: 'export_generated',
    result: 'success',
    targetType: 'audit_export',
    targetId: `export_${Date.now()}`,
    targetLabel: `Exported ${logs.length} audit logs`,
    source: 'dashboard_ui',
    metadata: { exportedCount: logs.length },
  });
}
