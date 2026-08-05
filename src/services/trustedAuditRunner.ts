import { StaffUser, Permission } from '../types/auth';
import { logAuditEvent } from './auditService';
import { AdminModule, AdminAuditAction, AuditResult } from '../types/audit';

export interface AuditedMutationOptions<T> {
  staffUser: StaffUser | null;
  requiredPermission?: Permission;
  module: AdminModule;
  action: AdminAuditAction | string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  previousStatus?: string;
  newStatus?: string;
  versionBefore?: number;
  versionAfter?: number;
  mutation: () => Promise<T>;
  getMetadata?: (result: T) => Record<string, any> | undefined;
  reason?: string;
}

export function requireAuthenticatedStaff(staffUser: StaffUser | null): StaffUser {
  if (!staffUser || !staffUser.uid) {
    throw new Error('Authentication required: Unauthenticated access attempt.');
  }
  return staffUser;
}

export function requireActiveStaff(staffUser: StaffUser | null): StaffUser {
  const user = requireAuthenticatedStaff(staffUser);
  if (!user.active) {
    throw new Error('Authorization denied: Staff account is inactive.');
  }
  return user;
}

export function requirePermission(staffUser: StaffUser | null, permission?: Permission): StaffUser {
  const user = requireActiveStaff(staffUser);
  if (permission) {
    const { hasPermission } = require('../auth/permissions');
    if (!hasPermission(user, permission)) {
      throw new Error(`Permission denied: Missing required permission "${permission}".`);
    }
  }
  return user;
}

/**
 * Executes a mutation with guaranteed audit logging for success, failure, or permission denials.
 */
export async function executeAuditedMutation<T>(options: AuditedMutationOptions<T>): Promise<T> {
  const {
    staffUser,
    requiredPermission,
    module,
    action,
    targetType,
    targetId,
    targetLabel,
    previousStatus,
    newStatus,
    versionBefore,
    versionAfter,
    mutation,
    getMetadata,
    reason,
  } = options;

  let activeUser: StaffUser | null = staffUser;

  try {
    // 1. Check permissions & active state
    activeUser = requirePermission(staffUser, requiredPermission);

    // 2. Perform actual data operation
    const result = await mutation();

    // 3. Log success audit record
    await logAuditEvent({
      actorUid: activeUser.uid,
      actorEmail: activeUser.email,
      actorDisplayName: activeUser.displayName,
      actorRole: activeUser.role,
      module,
      action,
      result: 'success',
      targetType,
      targetId,
      targetLabel,
      source: 'dashboard_ui',
      previousStatus,
      newStatus,
      versionBefore,
      versionAfter,
      reason,
      metadata: getMetadata ? getMetadata(result) : undefined,
    });

    return result;
  } catch (error: any) {
    // Determine if denial or failure
    const isDenial =
      error?.message?.includes('Permission denied') ||
      error?.message?.includes('Authorization denied') ||
      error?.message?.includes('Authentication required');

    const resultStatus: AuditResult = isDenial ? 'denied' : 'failed';

    // Log failure/denial audit record without breaking original error
    if (activeUser) {
      await logAuditEvent({
        actorUid: activeUser.uid || 'unknown',
        actorEmail: activeUser.email || 'unknown',
        actorDisplayName: activeUser.displayName || 'Staff User',
        actorRole: activeUser.role || 'unknown',
        module,
        action,
        result: resultStatus,
        targetType,
        targetId,
        targetLabel,
        source: 'dashboard_ui',
        reason: reason || error?.message,
        errorCode: error?.code || 'MUTATION_ERROR',
        metadata: { errorMessage: error?.message || String(error) },
      });
    }

    throw error;
  }
}
