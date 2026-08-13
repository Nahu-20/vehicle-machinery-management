import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { hasPermission } from '../../../lib/permissions';
import {
  getAdminAlertsPaginated,
  restoreAlert,
  permanentlyDeleteAlert,
} from '../../../services/agriculturalAlertService';
import { AgriculturalAlert, AlertServiceError } from '../../../types/agriculturalAlert';

import { AlertSeverityBadge } from '../../../components/admin/alerts/AlertSeverityBadge';
import { AlertRestoreConfirmModal } from '../../../components/admin/alerts/AlertRestoreConfirmModal';
import { AlertPermanentDeleteConfirmModal } from '../../../components/admin/alerts/AlertPermanentDeleteConfirmModal';
import { AlertVersionConflictModal } from '../../../components/admin/alerts/AlertVersionConflictModal';
import { AlertDetailDrawer } from '../../../components/admin/alerts/AlertDetailDrawer';
import { AlertHistoryDrawer } from '../../../components/admin/alerts/AlertHistoryDrawer';
import { formatGeographicTarget } from '../../../components/admin/alerts/AlertsTargetFormatter';

import {
  ArrowLeft,
  Trash2,
  RotateCcw,
  RefreshCw,
  Eye,
  History,
  ShieldAlert,
  MapPin,
  AlertTriangle,
} from 'lucide-react';

export const AdminAlertTrashPage: React.FC = () => {
  const { staffUser } = useAuth();
  const { language, getLocalizedText } = useLanguage();

  const canRestore = hasPermission(staffUser, 'alert.restore');
  const canDelete =
    staffUser?.role === 'superAdmin' || hasPermission(staffUser, 'alert.delete');

  const [trashedAlerts, setTrashedAlerts] = useState<AgriculturalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailAlert, setDetailAlert] = useState<AgriculturalAlert | null>(null);
  const [historySlug, setHistorySlug] = useState<string | null>(null);
  const [restoreTargetAlert, setRestoreTargetAlert] = useState<AgriculturalAlert | null>(null);
  const [deleteTargetAlert, setDeleteTargetAlert] = useState<AgriculturalAlert | null>(null);

  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVersionConflictOpen, setIsVersionConflictOpen] = useState(false);

  const fetchTrashedAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminAlertsPaginated({ status: 'trashed' }, 50, null, 1, staffUser);
      setTrashedAlerts(result.alerts);
    } catch (err: any) {
      console.error('Error fetching trashed alerts:', err);
      setError(err?.message || 'Failed to load trashed alerts bin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrashedAlerts();
  }, [fetchTrashedAlerts]);

  const handleConfirmRestore = async () => {
    if (!restoreTargetAlert || !staffUser) return;
    setIsRestoring(true);
    try {
      await restoreAlert(restoreTargetAlert.slug, staffUser, restoreTargetAlert.version);
      setRestoreTargetAlert(null);
      fetchTrashedAlerts();
    } catch (err: any) {
      if (err instanceof AlertServiceError && err.code === 'VERSION_CONFLICT') {
        setRestoreTargetAlert(null);
        setIsVersionConflictOpen(true);
      } else {
        alert(err?.message || 'Failed to restore alert.');
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!deleteTargetAlert || !staffUser) return;
    setIsDeleting(true);
    try {
      await permanentlyDeleteAlert(deleteTargetAlert.slug, staffUser, deleteTargetAlert.version);
      setDeleteTargetAlert(null);
      fetchTrashedAlerts();
    } catch (err: any) {
      if (err instanceof AlertServiceError && err.code === 'VERSION_CONFLICT') {
        setDeleteTargetAlert(null);
        setIsVersionConflictOpen(true);
      } else {
        alert(err?.message || 'Failed to permanently delete alert.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/admin/alerts"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Active Directory
          </Link>

          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Trash2 className="w-7 h-7 text-rose-500 shrink-0" />
            <span>Alert Trash Bin</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View trashed agricultural alerts, restore accidentally deleted items, or permanently remove obsolete warnings.
          </p>
        </div>

        <button
          onClick={fetchTrashedAlerts}
          disabled={loading}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Bin</span>
        </button>
      </div>

      {/* Main Trashed Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchTrashedAlerts} className="font-bold underline">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Loading trashed agricultural alerts...
            </p>
          </div>
        ) : trashedAlerts.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 w-16 h-16 mx-auto flex items-center justify-center border border-rose-200/60 dark:border-rose-800/60">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Trash Bin is Empty
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No trashed agricultural alerts exist in storage.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Trashed Alert Title</th>
                  <th className="px-4 py-4">Severity</th>
                  <th className="px-4 py-4">Target Region</th>
                  <th className="px-4 py-4">Restorable State</th>
                  <th className="px-4 py-4">Trashed By</th>
                  <th className="px-6 py-4 text-right">Trash Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {trashedAlerts.map((alertItem) => {
                  const titleText = getLocalizedText(alertItem.title) || alertItem.slug;
                  const prevStatus = alertItem.statusBeforeTrash || 'draft';

                  return (
                    <tr key={alertItem.slug} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 max-w-sm space-y-1">
                        <button
                          onClick={() => setDetailAlert(alertItem)}
                          className="font-extrabold text-slate-900 dark:text-white hover:text-amber-600 text-xs text-left line-clamp-2"
                        >
                          {titleText}
                        </button>
                        <p className="font-mono text-[11px] text-slate-400">
                          /{alertItem.slug} (v{alertItem.version})
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <AlertSeverityBadge severity={alertItem.severity} size="sm" />
                      </td>

                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{formatGeographicTarget(alertItem.geographicTarget, language)}</span>
                        </span>
                      </td>

                      <td className="px-4 py-4 uppercase font-bold text-slate-700 dark:text-slate-300">
                        Restore to: <span className="text-emerald-600 dark:text-emerald-400">{prevStatus}</span>
                      </td>

                      <td className="px-4 py-4 text-[11px] text-slate-500">
                        {alertItem.updatedByName || alertItem.updatedByEmail || 'Staff'}
                      </td>

                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setDetailAlert(alertItem)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setHistorySlug(alertItem.slug)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Audit History"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {canRestore && (
                          <button
                            onClick={() => setRestoreTargetAlert(alertItem)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900 inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => setDeleteTargetAlert(alertItem)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold hover:bg-rose-100 dark:hover:bg-rose-900 inline-flex items-center gap-1"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Delete Permanently</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AlertDetailDrawer
        alert={detailAlert}
        isOpen={!!detailAlert}
        onClose={() => setDetailAlert(null)}
      />

      <AlertHistoryDrawer
        slug={historySlug}
        isOpen={!!historySlug}
        onClose={() => setHistorySlug(null)}
      />

      <AlertRestoreConfirmModal
        alert={restoreTargetAlert}
        isOpen={!!restoreTargetAlert}
        onClose={() => setRestoreTargetAlert(null)}
        onConfirm={handleConfirmRestore}
        isSubmitting={isRestoring}
      />

      <AlertPermanentDeleteConfirmModal
        alert={deleteTargetAlert}
        isOpen={!!deleteTargetAlert}
        onClose={() => setDeleteTargetAlert(null)}
        onConfirm={handleConfirmPermanentDelete}
        isSubmitting={isDeleting}
      />

      <AlertVersionConflictModal
        isOpen={isVersionConflictOpen}
        onClose={() => setIsVersionConflictOpen(false)}
        onRefresh={fetchTrashedAlerts}
      />
    </div>
  );
};
