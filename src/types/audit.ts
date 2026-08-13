import { StaffRole } from './auth';

export type AdminModule =
  | 'authentication'
  | 'staff'
  | 'news'
  | 'achievements'
  | 'programs'
  | 'alerts'
  | 'market'
  | 'resources'
  | 'offices'
  | 'media'
  | 'settings'
  | 'system';

export type AdminAuditAction =
  // Authentication
  | 'session_started'
  | 'session_ended'
  | 'authorization_denied'
  | 'session_revoked'
  | 'account_disabled'
  | 'password_reset_requested'
  // Staff
  | 'staff_created'
  | 'staff_updated'
  | 'role_changed'
  | 'permissions_changed'
  | 'staff_activated'
  | 'staff_deactivated'
  | 'staff_deleted'
  // Content (News, Achievements, Programs, Alerts, Resources)
  | 'created'
  | 'updated'
  | 'submitted_for_review'
  | 'returned_to_draft'
  | 'published'
  | 'unpublished'
  | 'republished'
  | 'archived'
  | 'moved_to_trash'
  | 'restored'
  | 'permanently_deleted'
  | 'featured'
  | 'unfeatured'
  | 'achievement_created'
  | 'achievement_updated'
  | 'achievement_submitted_for_review'
  | 'achievement_returned_to_draft'
  | 'achievement_published'
  | 'achievement_unpublished'
  | 'achievement_archived'
  | 'achievement_moved_to_trash'
  | 'achievement_restored'
  | 'achievement_permanently_deleted'
  // Other modules
  | 'market_price_created'
  | 'market_price_updated'
  | 'alert_issued'
  | 'alert_withdrawn'
  | 'resource_uploaded'
  | 'resource_removed'
  | 'office_updated'
  | 'settings_updated'
  | 'import_started'
  | 'import_completed'
  | 'import_failed'
  | 'export_generated'
  | 'sensitive_download'
  | 'bulk_action_completed';

export type AuditResult = 'success' | 'failed' | 'denied';

export type AuditSource = 'dashboard_ui' | 'system' | 'cloud_function' | 'batch_job' | 'api';

export interface AdminAuditLog {
  id: string;
  occurredAt: any; // Timestamp or ISO string / Date
  actorUid: string;
  actorEmail: string;
  actorDisplayName: string;
  actorRole: StaffRole | string;
  module: AdminModule;
  action: AdminAuditAction | string;
  result: AuditResult;
  targetType: string;
  targetId: string;
  targetLabel: string;
  source: AuditSource;
  sessionId?: string;
  requestId?: string;
  eventId?: string;
  previousStatus?: string;
  newStatus?: string;
  versionBefore?: number;
  versionAfter?: number;
  changedFields?: string[];
  reason?: string;
  errorCode?: string;
  metadata?: Record<string, any>;
}

export interface AuditLogFilters {
  module?: AdminModule | 'all';
  action?: string;
  result?: AuditResult | 'all';
  actorUid?: string;
  actorRole?: StaffRole | 'all';
  targetId?: string;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}
