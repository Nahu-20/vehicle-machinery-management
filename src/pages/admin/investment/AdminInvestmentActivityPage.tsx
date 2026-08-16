import React, { useEffect, useState } from 'react';
import { Clock, Search, Filter, ShieldCheck, RefreshCw } from 'lucide-react';
import { getAuditLogs } from '../../../services/investment/investmentAuditService';
import { InvestmentAuditLog } from '../../../types/investment';

export function AdminInvestmentActivityPage() {
  const [logs, setLogs] = useState<InvestmentAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs(100);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (entityFilter !== 'all' && l.entityType !== entityFilter) return false;
    if (actionFilter !== 'all' && l.action !== actionFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>Authoritative Investment Audit Logs</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable audit record produced exclusively by trusted backend mutations. Client-side SDK direct writes are hard-blocked.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter Box */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span>Filter:</span>
        </div>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          <option value="all">All Entity Types</option>
          <option value="dataset">Dataset</option>
          <option value="zoneProfile">Zone Profile</option>
          <option value="source">Source</option>
          <option value="opportunity">Opportunity</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="mapConfig">Map Config</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="publish">Publish</option>
          <option value="delete">Delete</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse space-y-2">
            <Clock className="w-8 h-8 mx-auto text-slate-300 animate-bounce" />
            <p>Loading authoritative audit history...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 px-6 text-center text-xs text-slate-500">
            No audit log entries matching selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Summary</th>
                  <th className="py-3 px-4">Version</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{log.actorEmail}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">{log.actorRole}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {log.entityType}
                      </span>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">{log.entityId}</div>
                    </td>
                    <td className="py-3 px-4 uppercase font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-400">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{log.summary}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {log.previousVersion !== undefined && log.newVersion !== undefined ? (
                        <span>v{log.previousVersion} → v{log.newVersion}</span>
                      ) : (
                        <span>v{log.newVersion || 1}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminInvestmentActivityPage;
