import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { hasPermission } from '../../../lib/permissions';
import {
  getAdminAchievementsPaginated,
  submitAchievementForReview,
  returnAchievementToDraft,
  publishAchievement,
  unpublishAchievement,
  archiveAchievement,
  moveAchievementToTrash,
  restoreAchievementFromTrash,
  permanentlyDeleteAchievement,
} from '../../../services/achievementService';
import {
  Achievement,
  AchievementStatus,
  AchievementCategory,
  AchievementFilterOptions,
  AchievementServiceError,
} from '../../../types/achievement';
import { QueryDocumentSnapshot } from 'firebase/firestore';

import { AchievementStatusBadge } from '../../../components/admin/achievements/AchievementStatusBadge';
import { TrashConfirmModal } from '../../../components/admin/achievements/TrashConfirmModal';
import { RestoreConfirmModal } from '../../../components/admin/achievements/RestoreConfirmModal';
import { PermanentDeleteConfirmModal } from '../../../components/admin/achievements/PermanentDeleteConfirmModal';
import { VersionConflictModal } from '../../../components/admin/achievements/VersionConflictModal';
import { AchievementDetailDrawer } from '../../../components/admin/achievements/AchievementDetailDrawer';

import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Edit,
  Eye,
  ExternalLink,
  Send,
  RotateCcw,
  CheckCircle2,
  EyeOff,
  Archive,
  Trash2,
  History,
  Award,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Star,
  Info,
  Calendar,
  Building2,
  Tag,
} from 'lucide-react';

const ALLOWED_STATUSES: AchievementStatus[] = [
  'draft',
  'review',
  'published',
  'unpublished',
  'archived',
  'trashed',
];

const ALLOWED_CATEGORIES: AchievementCategory[] = [
  'productivity',
  'irrigation',
  'livestock',
  'extension',
  'mechanization',
  'natural-resources',
  'market-access',
  'youth-and-women',
  'other',
];

const CATEGORY_LABELS: Record<AchievementCategory, { om: string; am: string; en: string }> = {
  productivity: { om: 'Oomishtummaa Qonnaa', am: 'የግብርና ምርታማነት', en: 'Agricultural Productivity' },
  irrigation: { om: 'Misooma Jallisii', am: 'የመስኖ ልማት', en: 'Irrigation Development' },
  livestock: { om: 'Beeylada & Fayyaa', am: 'እንስሳትና የእንስሳት ጤና', en: 'Livestock & Animal Health' },
  extension: { om: 'Tajaajila Ekstensionii', am: 'የግብርና ኤክስቴንሽን', en: 'Farmer Extension' },
  mechanization: { om: 'Mekaanayizeeshinii', am: 'የግብርና ሜካናይዜሽን', en: 'Mechanization' },
  'natural-resources': { om: 'Qabeenya Uumamaa', am: 'የተፈጥሮ ሀብት ጥበቃ', en: 'Natural Resources' },
  'market-access': { om: 'Dhaqqabamummaa Gabaa', am: 'የገበያ ትስስር', en: 'Market Access' },
  'youth-and-women': { om: 'Dargagoota & Dubartoota', am: 'የወጣቶችና ሴቶች አቅም', en: 'Youth & Women Empowerment' },
  other: { om: 'Milkaa’ina Waliigalaa', am: 'ሌሎች ስኬቶች', en: 'General Achievement' },
};

export const AdminAchievementListPage: React.FC = () => {
  const { staffUser } = useAuth();
  const { language, getLocalizedText } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // Permission checks
  const canView = hasPermission(staffUser, 'achievement.view');
  const canCreate = hasPermission(staffUser, 'achievement.create');
  const canEdit = hasPermission(staffUser, 'achievement.edit');
  const canReview = hasPermission(staffUser, 'achievement.review');
  const canPublish =
    hasPermission(staffUser, 'achievement.publish') ||
    staffUser?.role === 'contentAdmin' ||
    staffUser?.role === 'superAdmin';
  const canTrash = hasPermission(staffUser, 'achievement.trash');
  const canRestore = hasPermission(staffUser, 'achievement.restore');
  const canDelete =
    staffUser?.role === 'superAdmin' || hasPermission(staffUser, 'achievement.delete');

  // URL State & Filters
  const rawStatus = searchParams.get('status');
  const rawCategory = searchParams.get('category');
  const rawSearch = searchParams.get('q') || '';

  const initialStatus: AchievementStatus | 'all' =
    rawStatus && ALLOWED_STATUSES.includes(rawStatus as AchievementStatus)
      ? (rawStatus as AchievementStatus)
      : 'all';

  const initialCategory: AchievementCategory | 'all' =
    rawCategory && ALLOWED_CATEGORIES.includes(rawCategory as AchievementCategory)
      ? (rawCategory as AchievementCategory)
      : 'all';

  const [statusFilter, setStatusFilter] = useState<AchievementStatus | 'all'>(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState<AchievementCategory | 'all'>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(rawSearch);

  // Pagination State
  const [pageSize] = useState<number>(20);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [cursorStack, setCursorStack] = useState<(QueryDocumentSnapshot | null)[]>([null]);

  // Query Result State
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [currentLastDoc, setCurrentLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [indexDiagnostic, setIndexDiagnostic] = useState<string | null>(null);

  // Action locking & active items
  const [processingSlugs, setProcessingSlugs] = useState<Set<string>>(new Set());
  const [activeDropdownSlug, setActiveDropdownSlug] = useState<string | null>(null);

  // Modals & Drawer State
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [trashModalItem, setTrashModalItem] = useState<Achievement | null>(null);
  const [restoreModalItem, setRestoreModalItem] = useState<Achievement | null>(null);
  const [permanentDeleteModalItem, setPermanentDeleteModalItem] = useState<Achievement | null>(null);
  const [versionConflictItem, setVersionConflictItem] = useState<Achievement | null>(null);

  // Sync state changes with URL query parameters
  const updateUrlParams = (st: AchievementStatus | 'all', cat: AchievementCategory | 'all', q: string) => {
    const params = new URLSearchParams();
    if (st !== 'all') params.set('status', st);
    if (cat !== 'all') params.set('category', cat);
    if (q.trim()) params.set('q', q.trim());
    setSearchParams(params, { replace: true });
  };

  // Main fetch function
  const fetchAchievements = useCallback(
    async (
      st: AchievementStatus | 'all',
      cat: AchievementCategory | 'all',
      q: string,
      page: number,
      cursor: QueryDocumentSnapshot | null
    ) => {
      setLoading(true);
      setError(null);
      setIndexDiagnostic(null);

      const filterOpts: AchievementFilterOptions = {
        status: st !== 'all' ? st : undefined,
        category: cat !== 'all' ? cat : undefined,
        searchQuery: q.trim() || undefined,
      };

      try {
        const result = await getAdminAchievementsPaginated(
          filterOpts,
          pageSize,
          cursor,
          page
        );

        setAchievements(result.achievements);
        setTotalCount(result.totalCount);
        setHasMore(result.hasMore);
        setCurrentLastDoc(result.lastDoc);
      } catch (err: any) {
        console.error('[AdminAchievementListPage] Fetch error:', err);
        if (err?.code === 'INDEX_REQUIRED' || err?.message?.includes('index')) {
          setIndexDiagnostic(err?.message || 'Firestore composite index required for this combination of filters.');
        } else {
          setError(err?.message || 'Failed to load achievements directory.');
        }
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  // Initial load and filter change trigger
  useEffect(() => {
    const currentCursor = cursorStack[pageNumber - 1] || null;
    fetchAchievements(statusFilter, categoryFilter, searchQuery, pageNumber, currentCursor);
  }, [fetchAchievements, statusFilter, categoryFilter, searchQuery, pageNumber, cursorStack]);

  // Handle filter changes (Reset pagination)
  const handleStatusFilterChange = (newStatus: AchievementStatus | 'all') => {
    setStatusFilter(newStatus);
    setPageNumber(1);
    setCursorStack([null]);
    updateUrlParams(newStatus, categoryFilter, searchQuery);
  };

  const handleCategoryFilterChange = (newCat: AchievementCategory | 'all') => {
    setCategoryFilter(newCat);
    setPageNumber(1);
    setCursorStack([null]);
    updateUrlParams(statusFilter, newCat, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPageNumber(1);
    setCursorStack([null]);
    updateUrlParams(statusFilter, categoryFilter, searchQuery);
  };

  const handleRefresh = () => {
    const currentCursor = cursorStack[pageNumber - 1] || null;
    fetchAchievements(statusFilter, categoryFilter, searchQuery, pageNumber, currentCursor);
  };

  // Pagination Controls
  const handleNextPage = () => {
    if (!hasMore || !currentLastDoc) return;
    const nextCursorStack = [...cursorStack];
    nextCursorStack[pageNumber] = currentLastDoc;
    setCursorStack(nextCursorStack);
    setPageNumber((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (pageNumber <= 1) return;
    setPageNumber((prev) => prev - 1);
  };

  // Action Locking Helper
  const setProcessing = (slug: string, isProcessing: boolean) => {
    setProcessingSlugs((prev) => {
      const next = new Set(prev);
      if (isProcessing) next.add(slug);
      else next.delete(slug);
      return next;
    });
  };

  // Wrapper to execute lifecycle actions with locking & version error handling
  const executeLifecycleAction = async (
    achievement: Achievement,
    actionFn: () => Promise<any>
  ) => {
    if (processingSlugs.has(achievement.slug)) return;
    setProcessing(achievement.slug, true);
    setActiveDropdownSlug(null);

    try {
      const res = await actionFn();
      if (res && res.success === false) {
        if (res.code === 'VERSION_CONFLICT') {
          setVersionConflictItem(achievement);
        } else {
          alert(`Action failed: ${res.error || 'Unknown error'}`);
        }
      } else {
        // Reload current page on success
        handleRefresh();
      }
    } catch (err: any) {
      if (err instanceof AchievementServiceError && err.code === 'VERSION_CONFLICT') {
        setVersionConflictItem(achievement);
      } else {
        alert(`Error executing action: ${err?.message || 'Operation failed'}`);
      }
    } finally {
      setProcessing(achievement.slug, false);
    }
  };

  // Lifecycle Action Handlers
  const handleSubmitForReview = (item: Achievement) => {
    if (!staffUser) return;
    executeLifecycleAction(item, () =>
      submitAchievementForReview(item.slug, staffUser, item.version)
    );
  };

  const handleReturnToDraft = (item: Achievement) => {
    if (!staffUser) return;
    executeLifecycleAction(item, () =>
      returnAchievementToDraft(item.slug, staffUser, item.version)
    );
  };

  const handlePublish = (item: Achievement) => {
    if (!staffUser) return;
    executeLifecycleAction(item, () =>
      publishAchievement(item.slug, staffUser, item.version)
    );
  };

  const handleUnpublish = (item: Achievement) => {
    if (!staffUser) return;
    executeLifecycleAction(item, () =>
      unpublishAchievement(item.slug, staffUser, item.version)
    );
  };

  const handleArchive = (item: Achievement) => {
    if (!staffUser) return;
    executeLifecycleAction(item, () =>
      archiveAchievement(item.slug, staffUser, item.version)
    );
  };

  const handleConfirmTrash = async (reason: string) => {
    if (!trashModalItem || !staffUser) return;
    await executeLifecycleAction(trashModalItem, () =>
      moveAchievementToTrash(trashModalItem.slug, reason, staffUser, trashModalItem.version)
    );
    setTrashModalItem(null);
  };

  const handleConfirmRestore = async () => {
    if (!restoreModalItem || !staffUser) return;
    await executeLifecycleAction(restoreModalItem, () =>
      restoreAchievementFromTrash(restoreModalItem.slug, staffUser, restoreModalItem.version)
    );
    setRestoreModalItem(null);
  };

  const handleConfirmPermanentDelete = async () => {
    if (!permanentDeleteModalItem || !staffUser) return;
    await executeLifecycleAction(permanentDeleteModalItem, () =>
      permanentlyDeleteAchievement(permanentDeleteModalItem.slug, staffUser, permanentDeleteModalItem.version)
    );
    setPermanentDeleteModalItem(null);
  };

  if (!canView) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Permission Denied</h2>
        <p className="text-xs text-slate-500">
          You do not have the required <code className="font-mono">achievement.view</code> permission to access the achievement directory.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 pb-12">
        {/* Header Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white">
                  Achievement Management
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {totalCount} Total
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official Bureau Impact Portfolio, Extension Milestones & Metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/achievements/trash"
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Trash View</span>
            </Link>

            {canCreate && (
              <Link
                to="/admin/achievements/new"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>New Achievement</span>
              </Link>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="md:col-span-5 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, summary, office, creator..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              />
            </form>

            {/* Status Filter */}
            <div className="md:col-span-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium capitalize"
              >
                <option value="all">All Statuses</option>
                {ALLOWED_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="md:col-span-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryFilterChange(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              >
                <option value="all">All Categories</option>
                {ALLOWED_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]?.[language] || CATEGORY_LABELS[cat]?.en || cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <div className="md:col-span-1 flex items-center justify-end">
              <button
                onClick={handleRefresh}
                title="Refresh Directory"
                className="p-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {searchQuery && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-[11px] text-amber-800 dark:text-amber-300">
              <Info className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                Search filter is active for loaded query results. Clear search text to restore standard indexed cursor pagination.
              </span>
            </div>
          )}
        </div>

        {/* Index Diagnostic Warning */}
        {indexDiagnostic && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold">Firestore Index Diagnostic Required:</strong>
              <p className="text-amber-800 dark:text-amber-300">{indexDiagnostic}</p>
            </div>
          </div>
        )}

        {/* Generic Error Notice */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-xs text-red-900 dark:text-red-200 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Section */}
        {loading ? (
          <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-emerald-500 animate-spin" />
            <p className="text-xs font-semibold text-slate-500">
              Loading achievement records from Firestore...
            </p>
          </div>
        ) : achievements.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <Award className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Achievements Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No achievement records matched your current filter criteria or search query.
            </p>
            {(statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setSearchQuery('');
                  updateUrlParams('all', 'all', '');
                }}
                className="mt-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View (md and above) */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-4">Achievement</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Achievement Date</th>
                    <th className="p-4">Updated</th>
                    <th className="p-4">Updated By</th>
                    <th className="p-4 text-center">Version</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {achievements.map((item) => {
                    const isProcessing = processingSlugs.has(item.slug);
                    const isDropdownOpen = activeDropdownSlug === item.slug;

                    return (
                      <tr
                        key={item.slug}
                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                          isProcessing ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {/* Title & Slug */}
                        <td className="p-4 max-w-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs line-clamp-1">
                              {item.featured && (
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                              )}
                              <span>{getLocalizedText(item.title) || item.slug}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono line-clamp-1">
                              /{item.slug}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium capitalize">
                            {item.category}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-4 whitespace-nowrap">
                          <AchievementStatusBadge status={item.status} size="sm" />
                        </td>

                        {/* Achievement Date */}
                        <td className="p-4 whitespace-nowrap text-slate-500">
                          {item.achievementDate || 'N/A'}
                        </td>

                        {/* Updated Date */}
                        <td className="p-4 whitespace-nowrap text-slate-500">
                          {item.updatedAt
                            ? new Date(
                                typeof item.updatedAt === 'number'
                                  ? item.updatedAt
                                  : item.updatedAt.seconds
                                  ? item.updatedAt.seconds * 1000
                                  : Date.parse(item.updatedAt) || Date.now()
                              ).toLocaleDateString()
                            : 'N/A'}
                        </td>

                        {/* Updated By */}
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.updatedByName || item.updatedByEmail || 'Staff'}
                          </span>
                        </td>

                        {/* Version */}
                        <td className="p-4 text-center font-mono text-slate-400">
                          v{item.version || 1}
                        </td>

                        {/* Row Actions */}
                        <td className="p-4 text-right relative whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedAchievement(item);
                                setIsDetailDrawerOpen(true);
                              }}
                              title="Inspect Details"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() =>
                                setActiveDropdownSlug(isDropdownOpen ? null : item.slug)
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Action Dropdown Menu */}
                          {isDropdownOpen && (
                            <div
                              className="absolute right-4 top-12 z-40 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 text-left text-xs animate-in fade-in zoom-in-95 duration-150"
                              onMouseLeave={() => setActiveDropdownSlug(null)}
                            >
                              {/* Inspect Drawer */}
                              <button
                                onClick={() => {
                                  setSelectedAchievement(item);
                                  setIsDetailDrawerOpen(true);
                                  setActiveDropdownSlug(null);
                                }}
                                className="w-full px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 font-medium"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                Inspect Details
                              </button>

                              {/* Edit */}
                              {canEdit && item.status !== 'trashed' && (
                                <Link
                                  to={`/admin/achievements/${item.slug}/edit`}
                                  className="w-full px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 font-medium"
                                >
                                  <Edit className="w-3.5 h-3.5 text-blue-500" />
                                  Edit Record
                                </Link>
                              )}

                              {/* Preview */}
                              <Link
                                to={`/admin/achievements/${item.slug}/preview`}
                                className="w-full px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 font-medium"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                Preview
                              </Link>

                              {/* View Public Page */}
                              {item.status === 'published' && (
                                <a
                                  href={`/achievements/${item.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full px-3 py-2 rounded-xl text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors flex items-center gap-2 font-medium"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  View Public Page
                                </a>
                              )}

                              {/* Submit for Review */}
                              {(item.status === 'draft' || item.status === 'review') && (canReview || canEdit) && (
                                <button
                                  onClick={() => handleSubmitForReview(item)}
                                  className="w-full px-3 py-2 rounded-xl text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors flex items-center gap-2 font-medium"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  Submit for Review
                                </button>
                              )}

                              {/* Return to Draft */}
                              {(item.status === 'review' || item.status === 'unpublished' || item.status === 'archived') && canEdit && (
                                <button
                                  onClick={() => handleReturnToDraft(item)}
                                  className="w-full px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 font-medium"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Return to Draft
                                </button>
                              )}

                              {/* Publish */}
                              {canPublish && item.status !== 'published' && item.status !== 'trashed' && (
                                <button
                                  onClick={() => handlePublish(item)}
                                  className="w-full px-3 py-2 rounded-xl text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors flex items-center gap-2 font-medium"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Publish
                                </button>
                              )}

                              {/* Unpublish */}
                              {canPublish && item.status === 'published' && (
                                <button
                                  onClick={() => handleUnpublish(item)}
                                  className="w-full px-3 py-2 rounded-xl text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors flex items-center gap-2 font-medium"
                                >
                                  <EyeOff className="w-3.5 h-3.5" />
                                  Unpublish
                                </button>
                              )}

                              {/* Archive */}
                              {canPublish && item.status !== 'archived' && item.status !== 'trashed' && (
                                <button
                                  onClick={() => handleArchive(item)}
                                  className="w-full px-3 py-2 rounded-xl text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors flex items-center gap-2 font-medium"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                  Archive
                                </button>
                              )}

                              {/* Trash */}
                              {canTrash && item.status !== 'trashed' && (
                                <button
                                  onClick={() => {
                                    setTrashModalItem(item);
                                    setActiveDropdownSlug(null);
                                  }}
                                  className="w-full px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors flex items-center gap-2 font-medium border-t border-slate-100 dark:border-slate-800 mt-1 pt-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Move to Trash
                                </button>
                              )}

                              {/* Restore (if trashed) */}
                              {item.status === 'trashed' && canRestore && (
                                <button
                                  onClick={() => {
                                    setRestoreModalItem(item);
                                    setActiveDropdownSlug(null);
                                  }}
                                  className="w-full px-3 py-2 rounded-xl text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors flex items-center gap-2 font-medium"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Restore from Trash
                                </button>
                              )}

                              {/* Permanent Delete (if trashed) */}
                              {item.status === 'trashed' && canDelete && (
                                <button
                                  onClick={() => {
                                    setPermanentDeleteModalItem(item);
                                    setActiveDropdownSlug(null);
                                  }}
                                  className="w-full px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors flex items-center gap-2 font-bold"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Permanently Delete
                                </button>
                              )}

                              {/* View Audit History */}
                              <Link
                                to={`/admin/achievements/${item.slug}/history`}
                                className="w-full px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 font-medium border-t border-slate-100 dark:border-slate-800 mt-1 pt-2"
                              >
                                <History className="w-3.5 h-3.5" />
                                Audit History
                              </Link>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards View (below md) */}
            <div className="md:hidden space-y-3">
              {achievements.map((item) => (
                <div
                  key={item.slug}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <AchievementStatusBadge status={item.status} size="sm" />
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          v{item.version || 1}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                        {getLocalizedText(item.title) || item.slug}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-400">/{item.slug}</p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedAchievement(item);
                        setIsDetailDrawerOpen(true);
                      }}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Category:</span>
                      <strong className="text-slate-800 dark:text-slate-200 capitalize">
                        {item.category}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Updated By:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {item.updatedByName || item.updatedByEmail || 'Staff'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      to={`/admin/achievements/${item.slug}/preview`}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                    >
                      Preview Record &rarr;
                    </Link>

                    {canEdit && item.status !== 'trashed' && (
                      <Link
                        to={`/admin/achievements/${item.slug}/edit`}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 font-medium">
                Page {pageNumber} &bull; Showing {achievements.length} records
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={pageNumber <= 1 || loading}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-bold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <button
                  onClick={handleNextPage}
                  disabled={!hasMore || loading}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-bold"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Detail Drawer */}
      <AchievementDetailDrawer
        achievement={selectedAchievement}
        isOpen={isDetailDrawerOpen}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedAchievement(null);
        }}
        canEdit={canEdit}
      />

      <TrashConfirmModal
        isOpen={!!trashModalItem}
        achievementTitle={
          trashModalItem ? getLocalizedText(trashModalItem.title) || trashModalItem.slug : ''
        }
        achievementSlug={trashModalItem?.slug || ''}
        currentStatus={trashModalItem?.status || 'draft'}
        onClose={() => setTrashModalItem(null)}
        onConfirm={handleConfirmTrash}
      />

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
        onRefresh={handleRefresh}
      />
    </>
  );
};
