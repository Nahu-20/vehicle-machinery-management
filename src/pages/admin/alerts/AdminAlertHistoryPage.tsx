import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEntityAuditHistory } from '../../../services/auditService';
import { AdminAuditLog } from '../../../types/audit';
import { ArrowLeft, History, Clock, User, ExternalLink } from 'lucide-react';

export const AdminAlertHistoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      if (!slug) return;
      setLoading(true);
      try {
        const historyLogs = await getEntityAuditHistory('alerts', slug);
        if (isMounted) setLogs(historyLogs);
      } catch (err) {
        console.error('Error fetching alert audit logs:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchHistory();
    return () => { isMounted = false; };
  }, [slug]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          to="/admin/alerts"
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </Link>

        <a
          href={`/admin/history?module=alerts&targetId=${slug}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <History className="w-3.5 h-3.5" />
          View in Global Security Audit Log
        </a>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-200 dark:border-amber-800">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white text-base">
                Alert Audit & Version History
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Target: /{slug}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {logs.length} Events Logged
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-medium">
            Loading security audit history...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500">
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
                  className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 capitalize">
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
                      <Clock className="w-3.5 h-3.5" />
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
    </div>
  );
};
