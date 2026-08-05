import React from 'react';
import { AdminAuditLog } from '../../../types/audit';
import {
  X,
  User,
  Clock,
  Shield,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Tag,
  Key,
  Layers,
  HelpCircle,
  Code,
  Terminal,
} from 'lucide-react';

interface ActivityDetailDrawerProps {
  log: AdminAuditLog | null;
  onClose: () => void;
}

export const ActivityDetailDrawer: React.FC<ActivityDetailDrawerProps> = ({ log, onClose }) => {
  if (!log) return null;

  const formattedDate = log.occurredAt
    ? new Date(log.occurredAt).toLocaleString()
    : 'N/A';
  const isoDate = log.occurredAt
    ? new Date(log.occurredAt).toISOString()
    : 'N/A';

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Success
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Shield className="w-3.5 h-3.5" /> Access Denied
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Operation Failed
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-emerald-600 text-white font-mono">
                {log.module}
              </span>
              {getResultBadge(log.result)}
            </div>
            <h2 id="drawer-title" className="text-lg font-black text-slate-900 dark:text-white capitalize">
              {log.action.replace(/_/g, ' ')}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* Section: Actor Identity */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-500" /> Staff Actor Identity
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Display Name</div>
                <div className="font-bold text-slate-900 dark:text-white">{log.actorDisplayName || 'N/A'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Staff Role</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 uppercase font-mono">
                  {log.actorRole}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Email Address</div>
                <div className="font-mono text-slate-700 dark:text-slate-300 truncate">{log.actorEmail}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Firebase UID</div>
                <div className="font-mono text-slate-500 text-[11px] truncate">{log.actorUid}</div>
              </div>
            </div>
          </div>

          {/* Section: Target Entity */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-500" /> Target Entity Information
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Target Type</div>
                <div className="font-bold capitalize text-slate-900 dark:text-white">{log.targetType}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Target ID / Slug</div>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">{log.targetId}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Target Label / Title</div>
                <div className="font-bold text-slate-800 dark:text-slate-200">{log.targetLabel}</div>
              </div>
            </div>
          </div>

          {/* Section: Transitions & Revisions */}
          {(log.previousStatus || log.newStatus || log.versionBefore !== undefined || log.versionAfter !== undefined || (log.changedFields && log.changedFields.length > 0)) && (
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-500" /> State Transitions & Revisions
              </h3>

              {log.previousStatus || log.newStatus ? (
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400">Status:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-bold uppercase">{log.previousStatus || 'N/A'}</span>
                  <span>→</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold uppercase">{log.newStatus || 'N/A'}</span>
                </div>
              ) : null}

              {log.versionBefore !== undefined || log.versionAfter !== undefined ? (
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400">Version:</span>
                  <span className="font-bold">v{log.versionBefore ?? '?'}</span>
                  <span>→</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">v{log.versionAfter ?? '?'}</span>
                </div>
              ) : null}

              {log.changedFields && log.changedFields.length > 0 && (
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono mb-1">Changed Fields</div>
                  <div className="flex flex-wrap gap-1">
                    {log.changedFields.map((field) => (
                      <span key={field} className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reason / Error Code */}
          {(log.reason || log.errorCode) && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-2">
              <h3 className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Additional Notes & Error Logs
              </h3>
              {log.errorCode && (
                <div className="font-mono text-amber-800 dark:text-amber-300 font-bold">
                  Code: {log.errorCode}
                </div>
              )}
              {log.reason && (
                <p className="text-slate-700 dark:text-slate-300 italic">"{log.reason}"</p>
              )}
            </div>
          )}

          {/* Safe Metadata Viewer */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-slate-300">
              <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-emerald-400" /> Safe Event Metadata
              </h3>
              <pre className="font-mono text-[11px] overflow-x-auto text-emerald-400/90 p-3 bg-slate-900 rounded-xl border border-slate-800/80">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* System Telemetry Metadata */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-[11px] font-mono text-slate-500">
            <div className="flex justify-between">
              <span>Log ID:</span>
              <span className="text-slate-700 dark:text-slate-300">{log.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Local Timestamp:</span>
              <span className="text-slate-700 dark:text-slate-300">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span>ISO 8601:</span>
              <span className="text-slate-700 dark:text-slate-300">{isoDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Source Channel:</span>
              <span className="text-slate-700 dark:text-slate-300">{log.source}</span>
            </div>
            {log.sessionId && (
              <div className="flex justify-between">
                <span>Session ID:</span>
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{log.sessionId}</span>
              </div>
            )}
            {log.requestId && (
              <div className="flex justify-between">
                <span>Request ID:</span>
                <span className="text-slate-700 dark:text-slate-300">{log.requestId}</span>
              </div>
            )}
            {log.eventId && (
              <div className="flex justify-between">
                <span>Event ID:</span>
                <span className="text-slate-700 dark:text-slate-300">{log.eventId}</span>
              </div>
            )}
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
