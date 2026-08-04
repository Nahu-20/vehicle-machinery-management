export interface AuditLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  timestamp: any;
  metadata?: Record<string, unknown>;
}
