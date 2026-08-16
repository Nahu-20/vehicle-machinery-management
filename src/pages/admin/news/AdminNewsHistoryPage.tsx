import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { getNewsAuditLogsBySlug, getAdminNewsArticlesPaginated } from '../../../services/newsService';
import { getEntityAuditHistory } from '../../../services/auditService';
import { NewsArticle, NewsAuditLog } from '../../../types/news';
import { NewsStatusBadge } from '../../../components/admin/news/NewsStatusBadge';
import {
  History,
  ArrowLeft,
  User,
  Clock,
  FileText,
  Loader2,
  AlertCircle,
  Tag,
  Building2,
  CheckCircle2,
  EyeOff,
  Archive,
  Trash2,
  RotateCcw,
  RefreshCw,
  Info,
} from 'lucide-react';

export const AdminNewsHistoryPage: React.FC = () => {
  const { newsSlug } = useParams<{ newsSlug: string }>();
  const { getLocalizedText } = useLanguage();

  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [logs, setLogs] = useState<NewsAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cleanSlug = (newsSlug || '').trim().toLowerCase();

  const loadHistory = async () => {
    if (!cleanSlug) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch article
      const artRes = await getAdminNewsArticlesPaginated({ searchQuery: cleanSlug }, 10);
      const found = artRes.articles.find((a) => a.slug === cleanSlug);
      if (found) {
        setArticle(found);
      }

      // Fetch audit logs from global adminAuditLogs first, fall back to legacy if empty
      const globalLogs = await getEntityAuditHistory('news', cleanSlug, 50);
      if (globalLogs.length > 0) {
        setLogs(
          globalLogs.map((g) => ({
            id: g.id,
            articleSlug: g.targetId,
            articleTitle: { om: g.targetLabel, am: g.targetLabel, en: g.targetLabel },
            action: g.action as any,
            actorUid: g.actorUid,
            actorEmail: g.actorEmail,
            actorDisplayName: g.actorDisplayName,
            actorRole: g.actorRole as any,
            previousStatus: g.previousStatus as any,
            newStatus: g.newStatus as any,
            versionBefore: g.versionBefore,
            versionAfter: g.versionAfter,
            reason: g.reason,
            occurredAt: g.occurredAt,
          }))
        );
      } else {
        const logRes = await getNewsAuditLogsBySlug(cleanSlug, 50);
        setLogs(logRes.logs);
      }
    } catch (err: any) {
      console.error('Error loading article audit history:', err);
      setError('Failed to load audit history from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [cleanSlug]);

  const titleStr = article ? getLocalizedText(article.title) : cleanSlug;

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'created':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <FileText className="w-3 h-3 text-slate-500" /> Created
          </span>
        );
      case 'updated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
            <Clock className="w-3 h-3 text-blue-500" /> Updated
          </span>
        );
      case 'submitted_for_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            <Clock className="w-3 h-3 text-amber-500" /> Submitted for Review
          </span>
        );
      case 'published':
      case 'republished':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {action === 'republished' ? 'Republished' : 'Published'}
          </span>
        );
      case 'unpublished':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
            <EyeOff className="w-3 h-3 text-rose-500" /> Unpublished
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <Archive className="w-3 h-3 text-gray-500" /> Archived
          </span>
        );
      case 'moved_to_trash':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300">
            <Trash2 className="w-3 h-3 text-red-600" /> Moved to Trash
          </span>
        );
      case 'restored':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
            <RotateCcw className="w-3 h-3 text-blue-600" /> Restored
          </span>
        );
      case 'permanently_deleted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-950 text-red-200">
            <Trash2 className="w-3 h-3 text-red-400" /> Permanently Deleted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/admin/news"
              className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              <span>Article Audit History</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            /{cleanSlug}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* Article Overview Card */}
      {article && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <NewsStatusBadge status={article.status} />
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                {article.category}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                Version {article.version || 1}
              </span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {titleStr}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/admin/news/${article.slug}/edit`}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors"
            >
              Edit Article
            </Link>
          </div>
        </div>
      )}

      {/* Audit Timeline */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading audit history...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-center">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Info className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Audit Records Found</h3>
          <p className="text-xs text-slate-500">
            No administrative action logs have been recorded for this article slug yet.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-6 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" /> Immutable Event Audit Records ({logs.length})
          </h3>

          <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {logs.map((log) => {
              const formattedDate = log.occurredAt
                ? new Date(log.occurredAt).toLocaleString()
                : 'N/A';

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-500 group-hover:scale-125 transition-transform" />

                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getActionBadge(log.action)}
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {log.versionAfter ? `v${log.versionAfter}` : ''}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 pt-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.actorDisplayName || 'Unknown'}</span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({log.actorEmail || log.actorUid})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] uppercase font-mono font-extrabold text-slate-600 dark:text-slate-300">
                        {log.actorRole}
                      </span>
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
    </div>
  );
};
