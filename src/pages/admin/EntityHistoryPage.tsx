import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { getEntityAuditHistory } from '../../services/auditService';
import { AdminAuditLog, AdminModule } from '../../types/audit';
import { ActivityDetailDrawer } from '../../components/admin/activity/ActivityDetailDrawer';
import {
  History,
  ArrowLeft,
  User,
  Clock,
  Loader2,
  RefreshCw,
  Info,
  Layers,
  CheckCircle2,
  XCircle,
  Shield,
  Eye,
} from 'lucide-react';

interface EntityHistoryPageProps {
  moduleOverride?: AdminModule;
}

export const EntityHistoryPage: React.FC<EntityHistoryPageProps> = ({ moduleOverride }) => {
  const { entityId, slug, uid } = useParams<{ entityId?: string; slug?: string; uid?: string }>();
  const [searchParams] = useSearchParams();

  const targetId = (entityId || slug || uid || searchParams.get('targetId') || '').trim();
  const module: AdminModule = moduleOverride || (searchParams.get('module') as AdminModule) || 'news';

  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  const fetchHistory = async () => {
    if (!targetId) return;
    setLoading(true);
    setError(null);
    try {
      const historyLogs = await getEntityAuditHistory(module, targetId, 50);
      setLogs(historyLogs);
    } catch (err) {
      console.error('[EntityHistoryPage] Error loading entity history:', err);
      setError('Failed to load entity audit history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [module, targetId]);

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'success':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-mono">SUCCESS</span>;
      case 'denied':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-mono">DENIED</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-mono">FAILED</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              <span>Contextual Audit History</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold uppercase text-[10px] text-slate-700 dark:text-slate-300">
              {module}
            </span>
            <span>Target ID: {targetId || 'N/A'}</span>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh History</span>
        </button>
      </div>

      {/* Audit Timeline */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading audit timeline...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-center">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Info className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Audit History Found</h3>
          <p className="text-xs text-slate-500">
            No administrative action logs have been recorded for target "{targetId}" in module "{module}".
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-6 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" /> Audit Timeline Records ({logs.length})
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {logs.map((log) => {
              const formattedDate = log.occurredAt
                ? new Date(log.occurredAt).toLocaleString()
                : 'N/A';

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-500 group-hover:scale-125 transition-transform" />

                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white capitalize">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        {getResultBadge(log.result)}
                        {log.versionAfter && (
                          <span className="text-xs font-mono font-bold text-slate-500">v{log.versionAfter}</span>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" /> {formattedDate}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 pt-1">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.actorDisplayName || 'Unknown'}</span>
                        <span className="text-slate-400 font-mono text-[11px]">({log.actorEmail})</span>
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] uppercase font-mono font-extrabold text-slate-600 dark:text-slate-300">
                          {log.actorRole}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-emerald-600" /> Details
                      </button>
                    </div>

                    {log.reason && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        Reason: "{log.reason}"
                      </p>
                    )}

                    {log.previousStatus && log.newStatus && log.previousStatus !== log.newStatus && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1 font-mono">
                        <span>Status Transition:</span>
                        <span className="uppercase font-bold text-slate-700 dark:text-slate-300">{log.previousStatus}</span>
                        <span>→</span>
                        <span className="uppercase font-bold text-emerald-600 dark:text-emerald-400">{log.newStatus}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <ActivityDetailDrawer
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};
