import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEntityAuditHistory } from '../../../services/auditService';
import { AdminAuditLog } from '../../../types/audit';
import { ArrowLeft, History, Clock, ShieldCheck, User, Tag } from 'lucide-react';

export const AdminAchievementHistoryPage: React.FC = () => {
  const { achievementSlug } = useParams<{ achievementSlug: string }>();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      if (!achievementSlug) return;
      setLoading(true);
      try {
        const historyLogs = await getEntityAuditHistory('achievements', achievementSlug);
        if (isMounted) setLogs(historyLogs);
      } catch (err) {
        console.error('Error fetching achievement audit logs:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchHistory();
    return () => { isMounted = false; };
  }, [achievementSlug]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
        <div className="flex items-center justify-between">
          <Link
            to="/admin/achievements"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </Link>

          <a
            href={`/admin/history?module=achievements&targetId=${achievementSlug}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            View in Global Security Audit Log
          </a>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 dark:text-white text-base">
                  Audit & Version History
                </h1>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Target: /{achievementSlug}
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
              No audit log entries recorded for this achievement slug yet.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 capitalize">
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

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {log.occurredAt
                        ? new Date(log.occurredAt).toLocaleString()
                        : 'Unknown Time'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>Actor:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {log.actorDisplayName || log.actorEmail || 'System'} ({log.actorRole})
                      </strong>
                    </div>

                    {log.previousStatus && log.newStatus && (
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>Status Transition:</span>
                        <strong className="text-slate-900 dark:text-white capitalize">
                          {log.previousStatus} &rarr; {log.newStatus}
                        </strong>
                      </div>
                    )}
                  </div>

                  {log.reason && (
                    <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 text-[11px]">
                      <strong>Reason:</strong> {log.reason}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-3 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                    <span>Source: {log.source}</span>
                    {log.versionBefore !== undefined && log.versionAfter !== undefined && (
                      <span>Version: v{log.versionBefore} &rarr; v{log.versionAfter}</span>
                    )}
                    {log.requestId && <span>ReqID: {log.requestId}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
};
