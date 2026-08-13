import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { hasPermission } from '../../../lib/permissions';
import {
  getAdminAlertsPaginated,
  submitAlertForReview,
  returnAlertToDraft,
  publishAlert,
  unpublishAlert,
  archiveAlert,
  moveAlertToTrash,
  seedInitialAlertsToFirestore,
  ADMIN_ALERT_PAGE_SIZE,
  AlertFilterOptions,
} from '../../../services/agriculturalAlertService';
import {
  AgriculturalAlert,
  AlertStatus,
  AlertSeverity,
  AlertCategory,
  AlertServiceError,
} from '../../../types/agriculturalAlert';
import { QueryDocumentSnapshot } from 'firebase/firestore';

import { AlertSeverityBadge } from '../../../components/admin/alerts/AlertSeverityBadge';
import { AlertStatusBadge } from '../../../components/admin/alerts/AlertStatusBadge';
import { AlertActiveStateBadge } from '../../../components/admin/alerts/AlertActiveStateBadge';
import { AlertTrashConfirmModal } from '../../../components/admin/alerts/AlertTrashConfirmModal';
import { AlertVersionConflictModal } from '../../../components/admin/alerts/AlertVersionConflictModal';
import { AlertDetailDrawer } from '../../../components/admin/alerts/AlertDetailDrawer';
import { AlertHistoryDrawer } from '../../../components/admin/alerts/AlertHistoryDrawer';
import { formatGeographicTarget, formatSubjectTarget } from '../../../components/admin/alerts/AlertsTargetFormatter';

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
  Bell,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Pin,
  Award,
  Calendar,
  Building2,
  MapPin,
  Tag,
  Clock,
  Radio,
} from 'lucide-react';

const ALLOWED_STATUSES: AlertStatus[] = [
  'draft',
  'review',
  'published',
  'unpublished',
  'expired',
  'archived',
  'trashed',
];

const ALLOWED_SEVERITIES: AlertSeverity[] = [
  'info',
  'advisory',
  'warning',
  'critical',
];

const ALLOWED_CATEGORIES: AlertCategory[] = [
  'weather',
  'pest',
  'crop-disease',
  'livestock-disease',
  'input-supply',
  'irrigation',
  'market',
  'food-safety',
  'emergency',
  'general',
];

const CATEGORY_LABELS: Record<AlertCategory, { om: string; am: string; en: string }> = {
  weather: { om: 'Haala Qilleensaa', am: 'የአየር ሁኔታ', en: 'Weather Alert' },
  pest: { om: 'Awwaannisa / Hoomaa', am: 'የተባይ ማስጠንቀቂያ', en: 'Pest Infestation' },
  'crop-disease': { om: 'Dhibee Midhaanii', am: 'የሰብል በሽታ', en: 'Crop Disease' },
  'livestock-disease': { om: 'Dhibee Beeyladaa', am: 'የእንስሳት በሽታ', en: 'Livestock Disease' },
  'input-supply': { om: 'Galtee Qonnaa', am: 'የግብርና ግብአት አቅርቦት', en: 'Input Supply' },
  irrigation: { om: 'Misooma Jallisii', am: 'የመስኖ ልማት', en: 'Irrigation' },
  market: { om: 'Haala Gabaa', am: 'የገበያ ሁኔታ', en: 'Market Advisory' },
  'food-safety': { om: 'Nageenya Nyataaa', am: 'የምግብ ደህንነት', en: 'Food Safety' },
  emergency: { om: 'Balaa Ariifachiisaa', am: 'ድንገተኛ አደጋ', en: 'Emergency Warning' },
  general: { om: 'Akeekkachiisa Waliigalaa', am: 'አጠቃላይ ምክር', en: 'General Advisory' },
};

export const AdminAlertListPage: React.FC = () => {
  const { staffUser } = useAuth();
  const { language, getLocalizedText } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // Permissions
  const canView = hasPermission(staffUser, 'alert.view');
  const canCreate = hasPermission(staffUser, 'alert.create');
  const canEdit = hasPermission(staffUser, 'alert.edit');
  const canReview = hasPermission(staffUser, 'alert.review');
  const canPublish =
    hasPermission(staffUser, 'alert.publish') ||
    staffUser?.role === 'contentAdmin' ||
    staffUser?.role === 'superAdmin';
  const canTrash = hasPermission(staffUser, 'alert.trash');

  // URL Filters State
  const rawStatus = searchParams.get('status');
  const rawSeverity = searchParams.get('severity');
  const rawCategory = searchParams.get('category');
  const rawWindow = searchParams.get('window');
  const rawSearch = searchParams.get('q') || '';

  const initialStatus: AlertStatus | 'all' =
    rawStatus && ALLOWED_STATUSES.includes(rawStatus as AlertStatus)
      ? (rawStatus as AlertStatus)
      : 'all';

  const initialSeverity: AlertSeverity | 'all' =
    rawSeverity && ALLOWED_SEVERITIES.includes(rawSeverity as AlertSeverity)
      ? (rawSeverity as AlertSeverity)
      : 'all';

  const initialCategory: AlertCategory | 'all' =
    rawCategory && ALLOWED_CATEGORIES.includes(rawCategory as AlertCategory)
      ? (rawCategory as AlertCategory)
      : 'all';

  const initialWindow: 'all' | 'active' | 'scheduled' | 'expired_natural' =
    rawWindow === 'active' || rawWindow === 'scheduled' || rawWindow === 'expired_natural'
      ? rawWindow
      : 'all';

  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>(initialStatus);
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>(initialSeverity);
  const [categoryFilter, setCategoryFilter] = useState<AlertCategory | 'all'>(initialCategory);
  const [windowFilter, setWindowFilter] = useState<'all' | 'active' | 'scheduled' | 'expired_natural'>(initialWindow);
  const [searchQuery, setSearchQuery] = useState(rawSearch);

  // Pagination State
  const [alerts, setAlerts] = useState<AgriculturalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCursorStack, setPageCursorStack] = useState<(QueryDocumentSnapshot | null)[]>([null]);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Action Menu & Drawers
  const [activeMenuSlug, setActiveMenuSlug] = useState<string | null>(null);
  const [detailAlert, setDetailAlert] = useState<AgriculturalAlert | null>(null);
  const [historySlug, setHistorySlug] = useState<string | null>(null);
  const [trashTargetAlert, setTrashTargetAlert] = useState<AgriculturalAlert | null>(null);
  const [isTrashing, setIsTrashing] = useState(false);
  const [isVersionConflictOpen, setIsVersionConflictOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Keep URL in sync with filter changes
  useEffect(() => {
    const params: Record<string, string> = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (severityFilter !== 'all') params.severity = severityFilter;
    if (categoryFilter !== 'all') params.category = categoryFilter;
    if (windowFilter !== 'all') params.window = windowFilter;
    if (searchQuery.trim()) params.q = searchQuery.trim();
    setSearchParams(params, { replace: true });
  }, [statusFilter, severityFilter, categoryFilter, windowFilter, searchQuery, setSearchParams]);

  // Fetch paginated alerts
  const fetchAlerts = useCallback(async (cursorDoc: QueryDocumentSnapshot | null = null, pageNum: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const filters: AlertFilterOptions = {
        status: statusFilter,
        severity: severityFilter,
        category: categoryFilter,
        window: windowFilter,
        searchQuery: searchQuery.trim(),
      };

      const result = await getAdminAlertsPaginated(filters, ADMIN_ALERT_PAGE_SIZE, cursorDoc, pageNum, staffUser);
      setAlerts(result.alerts);
      setHasMore(result.hasMore);
      setTotalCount(result.totalCount);

      // Keep lastDoc in cursor stack
      setPageCursorStack((prev) => {
        const next = [...prev];
        next[pageNum] = result.lastDoc;
        return next;
      });
    } catch (err: any) {
      console.error('Error fetching admin alerts:', err);
      setError(err?.message || 'Failed to load agricultural alerts.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter, categoryFilter, windowFilter, searchQuery, staffUser]);

  const handleSeedDemoAlerts = async () => {
    if (!staffUser) return;
    setIsSeeding(true);
    try {
      const count = await seedInitialAlertsToFirestore(staffUser);
      if (count > 0) {
        await fetchAlerts(null, 1);
      } else {
        alert('Demo alerts already seeded or collection contains existing records.');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to seed demo alerts.');
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    setPageCursorStack([null]);
    fetchAlerts(null, 1);
  }, [statusFilter, severityFilter, categoryFilter, windowFilter, searchQuery, fetchAlerts]);

  const handleNextPage = () => {
    if (!hasMore) return;
    const nextCursor = pageCursorStack[currentPage];
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchAlerts(nextCursor, nextPage);
  };

  const handlePrevPage = () => {
    if (currentPage <= 1) return;
    const prevPage = currentPage - 1;
    const prevCursor = pageCursorStack[prevPage - 1] || null;
    setCurrentPage(prevPage);
    fetchAlerts(prevCursor, prevPage);
  };

  const handleRefresh = () => {
    const currentCursor = pageCursorStack[currentPage - 1] || null;
    fetchAlerts(currentCursor, currentPage);
  };

  // Lifecycle Mutations
  const handleLifecycleAction = async (
    alertItem: AgriculturalAlert,
    actionFn: (slug: string, expectedVersion: number, actor: any, reason?: string) => Promise<any>,
    actionName: string,
    reason?: string
  ) => {
    if (!staffUser) return;
    setActionInProgress(`${alertItem.slug}-${actionName}`);
    try {
      await actionFn(alertItem.slug, alertItem.version, staffUser, reason);
      handleRefresh();
      setActiveMenuSlug(null);
    } catch (err: any) {
      if (err instanceof AlertServiceError && err.code === 'VERSION_CONFLICT') {
        setIsVersionConflictOpen(true);
      } else {
        console.error(`Error performing ${actionName}:`, err);
        setError(err?.message || `Failed to execute ${actionName}.`);
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConfirmTrash = async (reason?: string) => {
    if (!trashTargetAlert || !staffUser) return;
    setIsTrashing(true);
    try {
      await moveAlertToTrash(trashTargetAlert.slug, staffUser, trashTargetAlert.version, reason);
      setTrashTargetAlert(null);
      handleRefresh();
    } catch (err: any) {
      if (err instanceof AlertServiceError && err.code === 'VERSION_CONFLICT') {
        setTrashTargetAlert(null);
        setIsVersionConflictOpen(true);
      } else {
        alert(err?.message || 'Failed to trash alert.');
      }
    } finally {
      setIsTrashing(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setSeverityFilter('all');
    setCategoryFilter('all');
    setWindowFilter('all');
    setSearchQuery('');
  };

  const isFilterActive =
    statusFilter !== 'all' ||
    severityFilter !== 'all' ||
    categoryFilter !== 'all' ||
    windowFilter !== 'all' ||
    searchQuery.trim() !== '';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-7 h-7 text-amber-500 shrink-0" />
              <span>Agricultural Alerts & Advisories</span>
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Publish pest swarm advisories, emergency weather alerts, and regional agricultural updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(staffUser?.role === 'superAdmin' || staffUser?.role === 'contentAdmin') && (
            <button
              onClick={handleSeedDemoAlerts}
              disabled={isSeeding}
              className="px-3.5 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-2 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors shadow-sm disabled:opacity-50"
              title="Explicitly seed development demo alerts into Firestore"
            >
              <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>{isSeeding ? 'Seeding...' : 'Seed Demo Alerts'}</span>
            </button>
          )}

          <Link
            to="/admin/alerts/trash"
            className="px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Trash Bin</span>
          </Link>

          {canCreate ? (
            <Link
              to="/admin/alerts/new"
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Alert</span>
            </Link>
          ) : (
            <button
              disabled
              className="px-4 py-2.5 rounded-xl bg-slate-300 dark:bg-slate-800 text-slate-500 font-bold text-xs flex items-center gap-2 cursor-not-allowed opacity-60"
              title="Requires alert.create permission"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Alert</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, summary, slug, source office, or author..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Statuses</option>
              {ALLOWED_STATUSES.map((st) => (
                <option key={st} value={st}>
                  Status: {st}
                </option>
              ))}
            </select>

            {/* Operational Window Dropdown */}
            <select
              value={windowFilter}
              onChange={(e) => setWindowFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Time Windows</option>
              <option value="active">Operational: Active Now</option>
              <option value="scheduled">Operational: Scheduled</option>
              <option value="expired_natural">Operational: Expired Natural</option>
            </select>

            {/* Severity Dropdown */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Severities</option>
              {ALLOWED_SEVERITIES.map((sev) => (
                <option key={sev} value={sev}>
                  Severity: {sev}
                </option>
              ))}
            </select>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Categories</option>
              {ALLOWED_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]?.[language] || cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-bold rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
              >
                Reset Filters
              </button>
            )}

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh Alert List"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Alert List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="font-bold underline text-rose-700 dark:text-rose-300"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Loading agricultural alerts directory...
            </p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 w-16 h-16 mx-auto flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60">
              <Bell className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                No Agricultural Alerts Found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isFilterActive
                  ? 'No alerts match your search or filter parameters. Try resetting your filters.'
                  : 'No active or draft agricultural alerts exist in the system yet.'}
              </p>
            </div>
            {isFilterActive ? (
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Clear Filters
              </button>
            ) : (
              (staffUser?.role === 'superAdmin' || staffUser?.role === 'contentAdmin') && (
                <button
                  onClick={handleSeedDemoAlerts}
                  disabled={isSeeding}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md transition-colors disabled:opacity-50"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>{isSeeding ? 'Seeding Demo Data...' : 'Seed Development Demo Alerts'}</span>
                </button>
              )
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Alert Title & Target</th>
                  <th className="px-4 py-4">Severity</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Status & Operational</th>
                  <th className="px-4 py-4">Version & Attribution</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {alerts.map((alertItem) => {
                  const titleText = getLocalizedText(alertItem.title) || alertItem.slug;
                  const isMenuOpen = activeMenuSlug === alertItem.slug;

                  return (
                    <tr
                      key={alertItem.slug}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Title & Target Column */}
                      <td className="px-6 py-4 max-w-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDetailAlert(alertItem)}
                            className="font-extrabold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 text-xs text-left leading-snug line-clamp-2 transition-colors"
                          >
                            {titleText}
                          </button>
                          {alertItem.pinned && (
                            <Pin className="w-3.5 h-3.5 text-indigo-500 shrink-0" title="Pinned Alert" />
                          )}
                          {alertItem.featured && (
                            <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Featured Alert" />
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{formatGeographicTarget(alertItem.geographicTarget, language)}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-sky-500 shrink-0" />
                            <span>{formatSubjectTarget(alertItem.subjectTarget, language)}</span>
                          </span>
                        </div>
                      </td>

                      {/* Severity Column */}
                      <td className="px-4 py-4 shrink-0">
                        <AlertSeverityBadge severity={alertItem.severity} size="sm" />
                      </td>

                      {/* Category Column */}
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300 font-medium">
                        {CATEGORY_LABELS[alertItem.category]?.[language] || alertItem.category}
                      </td>

                      {/* Status & Operational Column */}
                      <td className="px-4 py-4 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <AlertStatusBadge status={alertItem.status} size="sm" />
                          <AlertActiveStateBadge alert={alertItem} size="sm" />
                        </div>
                      </td>

                      {/* Version & Attribution Column */}
                      <td className="px-4 py-4 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                        <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          v{alertItem.version}
                        </div>
                        <div className="truncate max-w-[140px]" title={alertItem.updatedByEmail}>
                          {alertItem.updatedByName || alertItem.updatedByEmail || 'Staff'}
                        </div>
                      </td>

                      {/* Action Menu Column */}
                      <td className="px-6 py-4 text-right relative">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setDetailAlert(alertItem)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Full Alert Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              setActiveMenuSlug(isMenuOpen ? null : alertItem.slug)
                            }
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="More Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Action Dropdown Menu */}
                        {isMenuOpen && (
                          <div
                            className="absolute right-6 top-12 z-30 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 text-left text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link
                              to={`/admin/alerts/${alertItem.slug}/preview`}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                              onClick={() => setActiveMenuSlug(null)}
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                              <span>Preview Alert</span>
                            </Link>

                            {canEdit && (
                              <Link
                                to={`/admin/alerts/${alertItem.slug}/edit`}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                                onClick={() => setActiveMenuSlug(null)}
                              >
                                <Edit className="w-3.5 h-3.5 text-blue-500" />
                                <span>Edit Alert</span>
                              </Link>
                            )}

                            <button
                              onClick={() => {
                                setHistorySlug(alertItem.slug);
                                setActiveMenuSlug(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                            >
                              <History className="w-3.5 h-3.5 text-purple-500" />
                              <span>Audit History</span>
                            </button>

                            <hr className="my-1 border-slate-100 dark:border-slate-800" />

                            {/* Lifecycle Transitions */}
                            {alertItem.status === 'draft' && canEdit && (
                              <button
                                onClick={() =>
                                  handleLifecycleAction(
                                    alertItem,
                                    submitAlertForReview,
                                    'submit_for_review'
                                  )
                                }
                                disabled={actionInProgress === `${alertItem.slug}-submit_for_review`}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 font-bold"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Submit for Review</span>
                              </button>
                            )}

                            {alertItem.status === 'review' && canEdit && (
                              <button
                                onClick={() =>
                                  handleLifecycleAction(
                                    alertItem,
                                    returnAlertToDraft,
                                    'return_to_draft'
                                  )
                                }
                                disabled={actionInProgress === `${alertItem.slug}-return_to_draft`}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Return to Draft</span>
                              </button>
                            )}

                            {(alertItem.status === 'review' || alertItem.status === 'draft') && canPublish && (
                              <button
                                onClick={() =>
                                  handleLifecycleAction(alertItem, publishAlert, 'publish')
                                }
                                disabled={actionInProgress === `${alertItem.slug}-publish`}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 font-bold"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Publish Alert</span>
                              </button>
                            )}

                            {alertItem.status === 'published' && canPublish && (
                              <button
                                onClick={() =>
                                  handleLifecycleAction(alertItem, unpublishAlert, 'unpublish')
                                }
                                disabled={actionInProgress === `${alertItem.slug}-unpublish`}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/60 font-semibold"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Unpublish Alert</span>
                              </button>
                            )}

                            {(alertItem.status === 'published' || alertItem.status === 'unpublished') && canEdit && (
                              <button
                                onClick={() =>
                                  handleLifecycleAction(alertItem, archiveAlert, 'archive')
                                }
                                disabled={actionInProgress === `${alertItem.slug}-archive`}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/60 font-semibold"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                <span>Archive Alert</span>
                              </button>
                            )}

                            {canTrash && (
                              <button
                                onClick={() => {
                                  setTrashTargetAlert(alertItem);
                                  setActiveMenuSlug(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 font-bold"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Move to Trash</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Page <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> • Displaying {alerts.length} item(s)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1 || loading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNextPage}
              disabled={!hasMore || loading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
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

      <AlertTrashConfirmModal
        alert={trashTargetAlert}
        isOpen={!!trashTargetAlert}
        onClose={() => setTrashTargetAlert(null)}
        onConfirm={handleConfirmTrash}
        isSubmitting={isTrashing}
      />

      <AlertVersionConflictModal
        isOpen={isVersionConflictOpen}
        onClose={() => setIsVersionConflictOpen(false)}
        onRefresh={handleRefresh}
      />
    </div>
  );
};
