import React, { useEffect, useState } from 'react';
import { getEntityAuditHistory } from '../../../services/auditService';
import { AdminAuditLog } from '../../../types/audit';
import { History, Clock, ShieldCheck, User, X, ExternalLink } from 'lucide-react';

interface AlertHistoryDrawerProps {
  slug: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AlertHistoryDrawer: React.FC<AlertHistoryDrawerProps> = ({
  slug,
  isOpen,
  onClose,
}) => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      if (!isOpen || !slug) return;
      setLoading(true);
      try {
        const history = await getEntityAuditHistory('alerts', slug);
        if (isMounted) setLogs(history);
      } catch (err) {
        console.error('Error fetching alert audit history:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchHistory();
    return () => { isMounted = false; };
  }, [slug, isOpen]);

  if (!isOpen || !slug) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Alert Audit & Security History
              </h2>
              <p className="text-xs font-mono text-slate-500">
                Target: /{slug}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              Loading security audit history for /{slug}...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500">
              No audit log entries recorded for this alert slug yet.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const occurredDate = log.occurredAt
                  ? typeof log.occurredAt === 'object' && 'toDate' in log.occurredAt
                    ? log.occurredAt.toDate()
                    : new Date(log.occurredAt)
                  : new Date();

                return (
                  <div
                    key={log.id}
                    className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 capitalize">
                          {log.action}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${
                            log.result === 'success'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {log.result}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{occurredDate.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <strong>{log.actorDisplayName || log.actorEmail}</strong> ({log.actorRole})
                      </span>
                      {log.versionAfter !== null && log.versionAfter !== undefined && (
                        <span className="font-mono">v{log.versionBefore ?? 0} &rarr; v{log.versionAfter}</span>
                      )}
                    </div>

                    {log.reason && (
                      <p className="text-[11px] italic text-slate-500 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                        Reason: "{log.reason}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <a
            href={`/admin/history?module=alerts&targetId=${slug}`}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>View in Global Activity Log</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
