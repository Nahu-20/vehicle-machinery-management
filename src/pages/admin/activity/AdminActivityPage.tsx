import React, { useState, useEffect } from 'react';
import { useStaffAuthorization } from '../../../hooks/useStaffAuthorization';
import { getAdminAuditLogsPaginated, exportAuditLogsToCSV } from '../../../services/auditService';
import { AdminAuditLog, AdminModule, AuditResult, AuditLogFilters } from '../../../types/audit';
import { StaffRole } from '../../../types/auth';
import { ActivityDetailDrawer } from '../../../components/admin/activity/ActivityDetailDrawer';
import {
  Shield,
  Search,
  Filter,
  RefreshCw,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  Calendar,
  Layers,
} from 'lucide-react';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export const AdminActivityPage: React.FC = () => {
  const { staffUser, hasPermission } = useStaffAuthorization();

  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);
  const [exporting, setExporting] = useState(false);

  // Filters state
  const [moduleFilter, setModuleFilter] = useState<AdminModule | 'all'>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<AuditResult | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');
  const [actorSearch, setActorSearch] = useState<string>('');
  const [targetSearch, setTargetSearch] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [cursorStack, setCursorStack] = useState<(QueryDocumentSnapshot | null)[]>([null]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const canExport = hasPermission('audit.export');
  const canViewAudit = hasPermission('audit.view');

  const fetchLogs = async () => {
    if (!canViewAudit) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const filters: AuditLogFilters = {
        module: moduleFilter,
        action: actionFilter,
        result: resultFilter,
        actorRole: roleFilter,
        actorUid: actorSearch.trim() || undefined,
        targetId: targetSearch.trim() || undefined,
        searchQuery: searchQuery.trim() || undefined,
      };

      const startDoc = cursorStack[page - 1] || null;
      const res = await getAdminAuditLogsPaginated(filters, 25, startDoc);

      setLogs(res.logs);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err: any) {
      console.error('[AdminActivityPage] Error fetching activity audit logs:', err);
      setError('Failed to fetch audit logs from database. Permission denied or database error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter, actionFilter, resultFilter, roleFilter, page]);

  const handleFilterReset = () => {
    setModuleFilter('all');
    setActionFilter('all');
    setResultFilter('all');
    setRoleFilter('all');
    setActorSearch('');
    setTargetSearch('');
    setSearchQuery('');
    setPage(1);
    setCursorStack([null]);
  };

  const handleApplySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setCursorStack([null]);
    fetchLogs();
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

  const handleExportCSV = async () => {
    if (!canExport || !staffUser) return;
    setExporting(true);
    try {
      await exportAuditLogsToCSV(logs, staffUser);
    } catch (err) {
      console.error('[AdminActivityPage] CSV Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Success
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-500/20">
            <Shield className="w-3 h-3 text-amber-500" /> Denied
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-500/20">
            <XCircle className="w-3 h-3 text-rose-500" /> Failed
          </span>
        );
    }
  };

  if (!canViewAudit) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
        <Shield className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          You do not have permission to view global activity audit logs. The <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200">audit.view</code> permission is required.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Global Administrative Activity & Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable administrative action logs covering all Oromia Agricultural Bureau system modules.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Logs</span>
          </button>

          {canExport && (
            <button
              onClick={handleExportCSV}
              disabled={exporting || logs.length === 0}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <form onSubmit={handleApplySearch} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Query */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, title, actor, or slug..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Actor Search */}
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={actorSearch}
              onChange={(e) => setActorSearch(e.target.value)}
              placeholder="Filter by Actor Email/UID..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Search Submit Button */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 transition-colors"
            >
              Apply Search
            </button>
            <button
              type="button"
              onClick={handleFilterReset}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold">
            <Filter className="w-3.5 h-3.5 text-emerald-600" /> Filters:
          </div>

          {/* Module Select */}
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
          >
            <option value="all">All Modules</option>
            <option value="news">News Management</option>
            <option value="staff">Staff Management</option>
            <option value="alerts">Alerts Management</option>
            <option value="market">Market Prices</option>
            <option value="resources">Resources & Manuals</option>
            <option value="achievements">Achievements</option>
            <option value="programs">Programs</option>
            <option value="authentication">Authentication</option>
            <option value="settings">System Settings</option>
            <option value="system">System Core</option>
          </select>

          {/* Action Select */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
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
            <option value="session_started">Session Started</option>
            <option value="session_ended">Session Ended</option>
            <option value="authorization_denied">Authorization Denied</option>
            <option value="staff_created">Staff Account Created</option>
            <option value="role_changed">Role Changed</option>
            <option value="export_generated">Export Generated</option>
          </select>

          {/* Result Select */}
          <select
            value={resultFilter}
            onChange={(e) => {
              setResultFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
          >
            <option value="all">All Results</option>
            <option value="success">Success</option>
            <option value="denied">Denied</option>
            <option value="failed">Failed</option>
          </select>

          {/* Role Select */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
          >
            <option value="all">All Staff Roles</option>
            <option value="superAdmin">Super Admin</option>
            <option value="contentAdmin">Content Admin</option>
            <option value="editor">Editor</option>
            <option value="marketOfficer">Market Officer</option>
            <option value="advisoryOfficer">Advisory Officer</option>
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading activity audit records...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-center">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Info className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No Audit Records Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No administrative audit logs match your selected filter criteria. Try clearing search filters or selecting another module.
          </p>
          <button
            onClick={handleFilterReset}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Module</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Target Entity</th>
                    <th className="p-4">Actor</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Result</th>
                    <th className="p-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {logs.map((log) => {
                    const formattedDate = log.occurredAt
                      ? new Date(log.occurredAt).toLocaleString()
                      : 'N/A';

                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <td className="p-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {formattedDate}
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {log.module}
                          </span>
                        </td>

                        <td className="p-4 font-bold text-slate-900 dark:text-white capitalize">
                          {log.action.replace(/_/g, ' ')}
                        </td>

                        <td className="p-4 max-w-[200px]">
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate" title={log.targetLabel}>
                            {log.targetLabel}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            {log.targetId}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                              {log.actorDisplayName || 'Unknown'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                            {log.actorEmail}
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-mono font-bold text-slate-600 dark:text-slate-300">
                            {log.actorRole}
                          </span>
                        </td>

                        <td className="p-4 whitespace-nowrap">{getResultBadge(log.result)}</td>

                        <td className="p-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-emerald-600" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Showing Page {page} (25 per page)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={page === 1 || loading}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={!hasMore || loading}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Activity Detail Drawer */}
      <ActivityDetailDrawer
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};
