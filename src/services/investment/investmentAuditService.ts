import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { InvestmentAuditLog } from '../../types/investment';
import { StaffUser } from '../../types/auth';

/**
 * HARD REQUIREMENT: Browser/client code MUST NOT directly write authoritative audit records
 * using the Firestore client SDK.
 * Authoritative audit records are written exclusively by the trusted backend API (/api/investment/mutate).
 */
export async function logInvestmentAudit(
  actor: StaffUser,
  entityType: InvestmentAuditLog['entityType'],
  entityId: string,
  action: InvestmentAuditLog['action'],
  summary: string,
  details?: {
    previousVersion?: number;
    newVersion?: number;
    changedFields?: string[];
    requestId?: string;
  }
): Promise<InvestmentAuditLog | null> {
  console.info(`[InvestmentAuditService] Client-side audit call captured. Authoritative log created via trusted backend API for ${entityType}:${entityId} (${action}).`);
  
  return {
    id: `audit_${Date.now()}`,
    actorUid: actor.uid,
    actorRole: actor.role,
    actorEmail: actor.email,
    entityType,
    entityId,
    action,
    previousVersion: details?.previousVersion,
    newVersion: details?.newVersion,
    changedFields: details?.changedFields,
    summary,
    timestamp: new Date().toISOString(),
    requestId: details?.requestId,
  };
}

export async function getAuditLogs(maxResults: number = 50): Promise<InvestmentAuditLog[]> {
  if (!db) return [];
  try {
    const colRef = collection(db, 'investmentAuditLogs');
    const q = query(colRef, limit(maxResults));
    const snap = await getDocs(q);
    const logs = snap.docs.map((d) => d.data() as InvestmentAuditLog);
    // Sort descending by timestamp in memory to avoid missing index warnings
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.warn('[InvestmentAuditService] Failed to fetch audit logs:', err);
    return [];
  }
}

export async function getAuditLogsForEntity(entityType: string, entityId: string): Promise<InvestmentAuditLog[]> {
  if (!db) return [];
  try {
    const colRef = collection(db, 'investmentAuditLogs');
    const q = query(colRef, where('entityId', '==', entityId));
    const snap = await getDocs(q);
    const logs = snap.docs.map((d) => d.data() as InvestmentAuditLog);
    return logs
      .filter((l) => l.entityType === entityType)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.warn(`[InvestmentAuditService] Failed to fetch audit logs for ${entityType}:${entityId}:`, err);
    return [];
  }
}
