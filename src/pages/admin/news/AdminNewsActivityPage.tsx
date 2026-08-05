import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGeneralNewsAuditLogsPaginated } from '../../../services/newsService';
import { NewsAuditLog } from '../../../types/news';
import {
  History,
  ArrowLeft,
  User,
  Clock,
  FileText,
  Loader2,
  Filter,
  Search,
  CheckCircle2,
  EyeOff,
  Archive,
  Trash2,
  RotateCcw,
  RefreshCw,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export const AdminNewsActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<NewsAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchSlug, setSearchSlug] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);
  const [cursorStack, setCursorStack] = useState<(QueryDocumentSnapshot | null)[]>([null]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const startDoc = cursorStack[page - 1] || null;
      const res = await getGeneralNewsAuditLogsPaginated(
        { action: actionFilter, searchSlug },
        20,
        startDoc
      );
      setLogs(res.logs);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err: any) {
      console.error('Error fetching global news activity logs:', err);
      setError('Failed to fetch activity logs from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter, searchSlug, page]);

  const handleActionChange = (val: string) => {
    setActionFilter(val);
    setPage(1);
    setCursorStack([null]);
  };

  const handleSlugChange = (val: string) => {
    setSearchSlug(val);
    setPage(1);
    setCursorStack([null]);
  };

  const handleNextPage = () => {
    if (hasMore && lastDoc) {
      setCursorStack((prev) => [...prev, lastDoc]);
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setCursorStack((prev) => prev.slice(0, prev.length - 1));
      setPage((prev) => prev - 1);
    }
  };

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
            <Clock className="w-3 h-3 text-amber-500" /> Submitted Review
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
    <div className="space-y-6">
      {/* Header Banner */}
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
              <span>Administrative News Activity History</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable server audit log tracking staff actions across news articles.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" /> Refresh Activity
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchSlug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="Search by article slug..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={actionFilter}
              onChange={(e) => handleActionChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Actions</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="submitted_for_review">Submitted for Review</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
              <option value="archived">Archived</option>
              <option value="moved_to_trash">Moved to Trash</option>
              <option value="restored">Restored</option>
              <option value="permanently_deleted">Permanently Deleted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Activity Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading activity history...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-center">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Info className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">No Activity Logs Found</h3>
          <p className="text-xs text-slate-500">
            No audit records match the current filter criteria.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Action</th>
                    <th className="p-4">Article Slug</th>
                    <th className="p-4">Actor</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {logs.map((log) => {
                    const formattedDate = log.occurredAt
                      ? new Date(log.occurredAt).toLocaleString()
                      : 'N/A';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">{getActionBadge(log.action)}</td>

                        <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                          /{log.articleSlug}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {log.actorDisplayName || 'Unknown'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({log.actorEmail || log.actorUid})
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-mono font-bold text-slate-600 dark:text-slate-300">
                            {log.actorRole}
                          </span>
                        </td>

                        <td className="p-4 text-slate-500 font-mono text-[11px]">
                          {formattedDate}
                        </td>

                        <td className="p-4 text-right">
                          <Link
                            to={`/admin/news/${log.articleSlug}/history`}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors inline-flex items-center gap-1"
                          >
                            <History className="w-3 h-3" /> History
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Showing Page {page}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={page === 1 || loading}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={!hasMore || loading}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#075D3A] hover:bg-emerald-800 text-white disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
