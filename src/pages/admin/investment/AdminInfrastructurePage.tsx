import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Layers,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Eye,
  Edit,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Send,
  Globe2,
  EyeOff,
  Archive,
  Trash2,
  AlertTriangle,
  Building,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  getAllFacilities,
  submitFacilityForReview,
  verifyFacility,
  rejectFacility,
  publishFacility,
  unpublishFacility,
  archiveFacility,
  restoreFacility,
  deleteFacility,
} from '../../../services/investment/investmentInfrastructureService';
import {
  InvestmentFacility,
  InfrastructureCategory,
  InvestmentLifecycleStatus,
  VerificationStatus,
  FacilityOperationalStatus,
  CanonicalZoneId,
} from '../../../types/investment';
import {
  CANONICAL_ZONE_IDS,
  CANONICAL_ZONE_METADATA,
} from '../../../features/investment-map/constants/canonicalZones';
import {
  INFRASTRUCTURE_CATEGORIES,
  FacilityCategoryBadge,
} from '../../../components/admin/investment/FacilityCategoryBadge';
import {
  LifecycleStatusBadge,
  VerificationStatusBadge,
  OperationalStatusBadge,
  PublicVisibilityBadge,
} from '../../../components/admin/investment/FacilityStatusBadge';
import {
  FacilityConfirmActionModal,
  FacilityActionType,
} from '../../../components/admin/investment/FacilityConfirmActionModal';

const PAGE_SIZE = 15;

export function AdminInfrastructurePage() {
  const { staffUser } = useStaffAuthorizationContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [facilities, setFacilities] = useState<InvestmentFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Active mutation states
  const [processingFacilityIds, setProcessingFacilityIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedFacilityForAction, setSelectedFacilityForAction] = useState<{
    facility: InvestmentFacility;
    action: FacilityActionType;
  } | null>(null);

  // Permissions
  const canEdit =
    hasPermission(staffUser, 'investment.edit') ||
    hasPermission(staffUser, 'investment.datasets.manage');
  const canVerify = hasPermission(staffUser, 'investment.verify');
  const canPublish = hasPermission(staffUser, 'investment.publish');

  // Filter Query Params
  const searchQuery = searchParams.get('search') || '';
  const zoneFilter = searchParams.get('zone') || 'all';
  const categoryFilter = searchParams.get('category') || 'all';
  const lifecycleFilter = searchParams.get('lifecycleStatus') || 'all';
  const verificationFilter = searchParams.get('verificationStatus') || 'all';
  const operationalFilter = searchParams.get('operationalStatus') || 'all';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllFacilities();
      setFacilities(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load infrastructure records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update query params helper
  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all' || value === '') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Filtered & Paginated records
  const filteredFacilities = useMemo(() => {
    return facilities.filter((fac) => {
      const id = fac.facilityId || fac.recordId || '';
      const titleEn = fac.title?.en || '';
      const titleOm = fac.title?.om || '';
      const titleAm = fac.title?.am || '';
      const operator = fac.operatorName || '';
      const locDesc = fac.locationDescription?.en || '';

      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          id.toLowerCase().includes(q) ||
          titleEn.toLowerCase().includes(q) ||
          titleOm.toLowerCase().includes(q) ||
          titleAm.toLowerCase().includes(q) ||
          operator.toLowerCase().includes(q) ||
          locDesc.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Zone filter
      if (zoneFilter !== 'all' && fac.zoneId !== zoneFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all') {
        const normCat = fac.category === 'cold-storage' ? 'cold_storage' : fac.category;
        if (normCat !== categoryFilter) return false;
      }

      // Lifecycle filter
      if (lifecycleFilter !== 'all') {
        const normLife = fac.lifecycleStatus || 'draft';
        if (normLife !== lifecycleFilter) return false;
      }

      // Verification filter
      if (verificationFilter !== 'all') {
        const normVer = fac.verificationStatus || 'pending';
        if (normVer !== verificationFilter) return false;
      }

      // Operational filter
      if (operationalFilter !== 'all') {
        const normOp = fac.operationalStatus || 'operational';
        if (normOp !== operationalFilter) return false;
      }

      return true;
    });
  }, [
    facilities,
    searchQuery,
    zoneFilter,
    categoryFilter,
    lifecycleFilter,
    verificationFilter,
    operationalFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredFacilities.length / PAGE_SIZE));
  const paginatedFacilities = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredFacilities.slice(start, start + PAGE_SIZE);
  }, [filteredFacilities, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const next = new URLSearchParams(searchParams);
    next.set('page', String(newPage));
    setSearchParams(next);
  };

  // Quick Action execution
  const handleQuickActionConfirm = async (payload?: { reason?: string }) => {
    if (!staffUser || !selectedFacilityForAction) return;

    const { facility, action } = selectedFacilityForAction;
    const fId = facility.facilityId || facility.recordId || '';
    const curVersion = facility.version;

    setSelectedFacilityForAction(null);
    setActionSuccess(null);
    setError(null);

    setProcessingFacilityIds((prev) => new Set(prev).add(fId));

    try {
      let updated: InvestmentFacility | null = null;

      switch (action) {
        case 'submit_review':
          updated = await submitFacilityForReview(staffUser, fId, curVersion);
          setActionSuccess(`Submitted "${facility.title?.en || fId}" for review.`);
          break;
        case 'verify':
          updated = await verifyFacility(staffUser, fId, curVersion);
          setActionSuccess(`Verified "${facility.title?.en || fId}".`);
          break;
        case 'reject':
          updated = await rejectFacility(
            staffUser,
            fId,
            payload?.reason || 'Corrections required',
            curVersion
          );
          setActionSuccess(`Rejected "${facility.title?.en || fId}" with feedback.`);
          break;
        case 'publish':
          updated = await publishFacility(staffUser, fId, curVersion);
          setActionSuccess(`Published "${facility.title?.en || fId}" live.`);
          break;
        case 'unpublish':
          updated = await unpublishFacility(staffUser, fId, curVersion);
          setActionSuccess(`Unpublished "${facility.title?.en || fId}". Record is now editable.`);
          break;
        case 'archive':
          updated = await archiveFacility(staffUser, fId, curVersion);
          setActionSuccess(`Archived "${facility.title?.en || fId}".`);
          break;
        case 'restore':
          updated = await restoreFacility(staffUser, fId, curVersion);
          setActionSuccess(`Restored "${facility.title?.en || fId}" to draft.`);
          break;
        case 'delete':
          await deleteFacility(staffUser, fId);
          setActionSuccess(`Permanently deleted facility "${fId}".`);
          setFacilities((prev) =>
            prev.filter((f) => (f.facilityId || f.recordId) !== fId)
          );
          return;
      }

      if (updated) {
        setFacilities((prev) =>
          prev.map((f) =>
            (f.facilityId || f.recordId) === fId ? updated! : f
          )
        );
      }
    } catch (err: any) {
      setError(err?.message || `Failed to execute action "${action}".`);
    } finally {
      setProcessingFacilityIds((prev) => {
        const next = new Set(prev);
        next.delete(fId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>Infrastructure Facilities Directory</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage physical agricultural assets across Oromia’s 22 canonical zones with authoritative source provenance.
          </p>
        </div>

        {canEdit && (
          <Link
            to="/admin/investment/infrastructure/new"
            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Infrastructure Facility
          </Link>
        )}
      </div>

      {/* Success / Error Alerts */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-500 hover:text-emerald-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search title, operator, location, ID..."
              value={searchQuery}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Zone */}
          <div>
            <select
              value={zoneFilter}
              onChange={(e) => updateFilter('zone', e.target.value)}
              className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">All Zones (22)</option>
              {CANONICAL_ZONE_IDS.map((z) => (
                <option key={z} value={z}>
                  {CANONICAL_ZONE_METADATA[z]?.displayName || z}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {INFRASTRUCTURE_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label.en}
                </option>
              ))}
            </select>
          </div>

          {/* Lifecycle Status */}
          <div>
            <select
              value={lifecycleFilter}
              onChange={(e) => updateFilter('lifecycleStatus', e.target.value)}
              className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">All Lifecycle</option>
              <option value="draft">Draft</option>
              <option value="review">In Review</option>
              <option value="published">Published Live</option>
              <option value="unpublished">Unpublished</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Verification Status */}
          <div>
            <select
              value={verificationFilter}
              onChange={(e) => updateFilter('verificationStatus', e.target.value)}
              className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">All Verification</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>
            Showing <strong>{filteredFacilities.length}</strong> of <strong>{facilities.length}</strong> facilities
          </span>

          {(searchQuery ||
            zoneFilter !== 'all' ||
            categoryFilter !== 'all' ||
            lifecycleFilter !== 'all' ||
            verificationFilter !== 'all' ||
            operationalFilter !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Directory Table / Empty State */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500 space-y-3">
            <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Loading infrastructure facilities from database...
            </p>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {facilities.length === 0
                  ? 'No Infrastructure Facilities Registered'
                  : 'No Facilities Match Filters'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {facilities.length === 0
                  ? 'Register agro-processing parks, cold storage units, warehouses, and irrigation schemes to support investment map analytics.'
                  : 'Try clearing your filter parameters or search terms to view other registered facilities.'}
              </p>
            </div>

            {facilities.length === 0 && canEdit ? (
              <Link
                to="/admin/investment/infrastructure/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Add First Facility
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Facility & ID</th>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Physical Asset</th>
                  <th className="py-3 px-4">CMS Lifecycle</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Public Gate</th>
                  <th className="py-3 px-4">Sources</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {paginatedFacilities.map((fac) => {
                  const id = fac.facilityId || fac.recordId || '';
                  const title =
                    fac.title?.en || fac.title?.om || fac.title?.am || id;
                  const zoneMeta = CANONICAL_ZONE_METADATA[fac.zoneId as CanonicalZoneId];
                  const isProcessing = processingFacilityIds.has(id);
                  const isLegacy = !fac.lifecycleStatus;
                  const sourceCount = fac.sourceIds?.length || 0;

                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Title & ID */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="space-y-0.5">
                          <Link
                            to={`/admin/investment/infrastructure/${id}`}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 block leading-snug truncate"
                            title={title}
                          >
                            {title}
                          </Link>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] text-slate-400">
                              {id}
                            </span>
                            {isLegacy && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Legacy Record — Migration Required
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Zone */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {zoneMeta?.displayName || fac.zoneId}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {zoneMeta?.pcode || 'ET04'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <FacilityCategoryBadge category={fac.category} />
                      </td>

                      {/* Operational Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <OperationalStatusBadge status={fac.operationalStatus} />
                      </td>

                      {/* Lifecycle Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <LifecycleStatusBadge status={fac.lifecycleStatus} />
                      </td>

                      {/* Verification Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <VerificationStatusBadge status={fac.verificationStatus} />
                      </td>

                      {/* Public Gate */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <PublicVisibilityBadge
                          lifecycleStatus={fac.lifecycleStatus}
                          verificationStatus={fac.verificationStatus}
                        />
                      </td>

                      {/* Sources */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {sourceCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {sourceCount} Source{sourceCount === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">
                            0 (Draft)
                          </span>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/investment/infrastructure/${id}`}
                            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
                          >
                            Open
                          </Link>

                          {/* Quick Lifecycle Action Buttons */}
                          {fac.lifecycleStatus === 'draft' && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                setSelectedFacilityForAction({
                                  facility: fac,
                                  action: 'submit_review',
                                })
                              }
                              className="p-1 rounded text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/60 cursor-pointer disabled:opacity-50"
                              title="Submit for Review"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {fac.lifecycleStatus === 'review' && canVerify && fac.verificationStatus !== 'verified' && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                setSelectedFacilityForAction({
                                  facility: fac,
                                  action: 'verify',
                                })
                              }
                              className="p-1 rounded text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/60 cursor-pointer disabled:opacity-50"
                              title="Verify Record"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {fac.lifecycleStatus === 'review' && canPublish && fac.verificationStatus === 'verified' && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                setSelectedFacilityForAction({
                                  facility: fac,
                                  action: 'publish',
                                })
                              }
                              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer disabled:opacity-50"
                              title="Publish Live"
                            >
                              <Globe2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {fac.lifecycleStatus === 'published' && canPublish && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                setSelectedFacilityForAction({
                                  facility: fac,
                                  action: 'unpublish',
                                })
                              }
                              className="p-1 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 cursor-pointer disabled:opacity-50"
                              title="Unpublish to Edit"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredFacilities.length > PAGE_SIZE && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Quick Row Actions */}
      {selectedFacilityForAction && (
        <FacilityConfirmActionModal
          isOpen={Boolean(selectedFacilityForAction)}
          actionType={selectedFacilityForAction.action}
          facilityTitle={
            selectedFacilityForAction.facility.title?.en ||
            selectedFacilityForAction.facility.facilityId ||
            selectedFacilityForAction.facility.recordId ||
            'Facility'
          }
          facilityId={
            selectedFacilityForAction.facility.facilityId ||
            selectedFacilityForAction.facility.recordId ||
            ''
          }
          isProcessing={processingFacilityIds.has(
            selectedFacilityForAction.facility.facilityId ||
              selectedFacilityForAction.facility.recordId ||
              ''
          )}
          onConfirm={handleQuickActionConfirm}
          onClose={() => setSelectedFacilityForAction(null)}
        />
      )}
    </div>
  );
}

export default AdminInfrastructurePage;
