import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { hasPermission } from '../../../lib/permissions';
import {
  getAdminAchievementsPaginated,
  restoreAchievementFromTrash,
  permanentlyDeleteAchievement,
} from '../../../services/achievementService';
import { Achievement, AchievementServiceError } from '../../../types/achievement';

import { RestoreConfirmModal } from '../../../components/admin/achievements/RestoreConfirmModal';
import { PermanentDeleteConfirmModal } from '../../../components/admin/achievements/PermanentDeleteConfirmModal';
import { VersionConflictModal } from '../../../components/admin/achievements/VersionConflictModal';

import {
  Trash2,
  ArrowLeft,
  RotateCcw,
  RefreshCw,
  History,
  AlertTriangle,
  Clock,
  User,
  ShieldCheck,
} from 'lucide-react';

export const AdminAchievementTrashPage: React.FC = () => {
  const { staffUser } = useAuth();
  const { getLocalizedText } = useLanguage();

  const canView = hasPermission(staffUser, 'achievement.view');
  const canRestore = hasPermission(staffUser, 'achievement.restore');
  const canDelete =
    staffUser?.role === 'superAdmin' || hasPermission(staffUser, 'achievement.delete');

  const [trashedAchievements, setTrashedAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [restoreModalItem, setRestoreModalItem] = useState<Achievement | null>(null);
  const [permanentDeleteModalItem, setPermanentDeleteModalItem] = useState<Achievement | null>(null);
  const [versionConflictItem, setVersionConflictItem] = useState<Achievement | null>(null);

  const [processingSlugs, setProcessingSlugs] = useState<Set<string>>(new Set());

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminAchievementsPaginated({ status: 'trashed' }, 50, null, 1);
      setTrashedAchievements(res.achievements);
    } catch (err: any) {
      setError(err?.message || 'Error fetching trashed achievements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const setProcessing = (slug: string, isProcessing: boolean) => {
    setProcessingSlugs((prev) => {
      const next = new Set(prev);
      if (isProcessing) next.add(slug);
      else next.delete(slug);
      return next;
    });
  };

  const handleConfirmRestore = async () => {
    if (!restoreModalItem || !staffUser) return;
    setProcessing(restoreModalItem.slug, true);
    try {
      const res = await restoreAchievementFromTrash(
        restoreModalItem.slug,
        staffUser,
        restoreModalItem.version
      );
      if (res.success) {
        setRestoreModalItem(null);
        fetchTrash();
      } else if (res.code === 'VERSION_CONFLICT') {
        setVersionConflictItem(restoreModalItem);
      } else {
        alert(res.error || 'Restore failed');
      }
    } catch (err: any) {
      if (err instanceof AchievementServiceError && err.code === 'VERSION_CONFLICT') {
        setVersionConflictItem(restoreModalItem);
      } else {
        alert(err?.message || 'Restore failed');
      }
    } finally {
      setProcessing(restoreModalItem.slug, false);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!permanentDeleteModalItem || !staffUser) return;
    setProcessing(permanentDeleteModalItem.slug, true);
    try {
      const res = await permanentlyDeleteAchievement(
        permanentDeleteModalItem.slug,
        staffUser,
        permanentDeleteModalItem.version
      );
      if (res.success) {
        setPermanentDeleteModalItem(null);
        fetchTrash();
      } else if (res.code === 'VERSION_CONFLICT') {
        setVersionConflictItem(permanentDeleteModalItem);
      } else {
        alert(res.error || 'Permanent deletion failed');
      }
    } catch (err: any) {
      if (err instanceof AchievementServiceError && err.code === 'VERSION_CONFLICT') {
        setVersionConflictItem(permanentDeleteModalItem);
      } else {
        alert(err?.message || 'Permanent deletion failed');
      }
    } finally {
      setProcessing(permanentDeleteModalItem.slug, false);
    }
  };

  if (!canView) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Permission Denied</h2>
        <p className="text-xs text-slate-500">
          You do not have the required <code className="font-mono">achievement.view</code> permission.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 max-w-5xl mx-auto py-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Link
            to="/admin/achievements"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Active Achievements
          </Link>

          <button
            onClick={fetchTrash}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Trash
          </button>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-950 shadow-sm flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Achievements Trash Bin
              </h1>
              <p className="text-xs text-slate-500">
                Manage soft-deleted achievement records. Items can be restored or permanently removed.
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-mono">
            {trashedAchievements.length} Trashed Items
          </span>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-xs text-red-900 dark:text-red-200 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-8 h-8 mx-auto text-rose-500 animate-spin" />
            <p className="text-xs text-slate-500 font-semibold mt-2">Loading trashed items...</p>
          </div>
        ) : trashedAchievements.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <Trash2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Trash is Empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no trashed achievement records in Firestore.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trashedAchievements.map((item) => {
              const isProcessing = processingSlugs.has(item.slug);

              return (
                <div
                  key={item.slug}
                  className={`p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 ${
                    isProcessing ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900">
                          TRASHED
                        </span>
                        {item.statusBeforeTrash && (
                          <span className="text-[11px] text-slate-400 capitalize font-mono">
                            Previous Status: {item.statusBeforeTrash}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">
                          v{item.version || 1}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {getLocalizedText(item.title) || item.slug}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">/{item.slug}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {canRestore && (
                        <button
                          onClick={() => setRestoreModalItem(item)}
                          disabled={isProcessing}
                          className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restore
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => setPermanentDeleteModalItem(item)}
                          disabled={isProcessing}
                          className="px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Permanently
                        </button>
                      )}

                      <Link
                        to={`/admin/achievements/${item.slug}/history`}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Audit History"
                      >
                        <History className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Trashed By:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {item.trashedByName || item.trashedByEmail || 'Staff'}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Trashed At:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {item.trashedAt
                          ? new Date(
                              typeof item.trashedAt === 'number'
                                ? item.trashedAt
                                : item.trashedAt.seconds
                                ? item.trashedAt.seconds * 1000
                                : Date.parse(item.trashedAt) || Date.now()
                            ).toLocaleString()
                          : 'Unknown'}
                      </strong>
                    </div>
                  </div>

                  {item.trashReason && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      <strong>Reason for trashing:</strong> {item.trashReason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RestoreConfirmModal
        isOpen={!!restoreModalItem}
        achievementTitle={
          restoreModalItem ? getLocalizedText(restoreModalItem.title) || restoreModalItem.slug : ''
        }
        achievementSlug={restoreModalItem?.slug || ''}
        statusBeforeTrash={restoreModalItem?.statusBeforeTrash}
        onClose={() => setRestoreModalItem(null)}
        onConfirm={handleConfirmRestore}
      />

      <PermanentDeleteConfirmModal
        isOpen={!!permanentDeleteModalItem}
        achievementTitle={
          permanentDeleteModalItem
            ? getLocalizedText(permanentDeleteModalItem.title) || permanentDeleteModalItem.slug
            : ''
        }
        achievementSlug={permanentDeleteModalItem?.slug || ''}
        onClose={() => setPermanentDeleteModalItem(null)}
        onConfirm={handleConfirmPermanentDelete}
      />

      <VersionConflictModal
        isOpen={!!versionConflictItem}
        achievementTitle={
          versionConflictItem
            ? getLocalizedText(versionConflictItem.title) || versionConflictItem.slug
            : ''
        }
        achievementSlug={versionConflictItem?.slug || ''}
        onClose={() => setVersionConflictItem(null)}
        onRefresh={fetchTrash}
      />
    </>
  );
};
