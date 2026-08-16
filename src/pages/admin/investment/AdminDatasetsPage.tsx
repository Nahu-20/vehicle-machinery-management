import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Database,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  getAllDatasets,
  getDatasetCoverage,
  DatasetCoverage,
} from '../../../services/investment/investmentDatasetService';
import { InvestmentDataset } from '../../../types/investment';

const PAGE_SIZE = 20;

export function AdminDatasetsPage() {
  const { staffUser } = useStaffAuthorizationContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [datasets, setDatasets] = useState<InvestmentDataset[]>([]);
  const [coverageMap, setCoverageMap] = useState<Record<string, DatasetCoverage>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManageDatasets = hasPermission(staffUser, 'investment.datasets.manage');

  // Query Params Filters
  const searchQuery = searchParams.get('search') || '';
  const commodityFilter = searchParams.get('commodity') || 'all';
  const metricFilter = searchParams.get('metric') || 'all';
  const lifecycleFilter = searchParams.get('lifecycleStatus') || 'all';
  const verificationFilter = searchParams.get('verificationStatus') || 'all';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllDatasets();
      setDatasets(data);

      // Asynchronously fetch zone coverage counts for each dataset
      const covs: Record<string, DatasetCoverage> = {};
      await Promise.all(
        data.map(async (ds) => {
          try {
            const cov = await getDatasetCoverage(ds.datasetId);
            covs[ds.datasetId] = cov;
          } catch {
            covs[ds.datasetId] = {
              populatedCount: 0,
              totalZones: 22,
              populatedZoneIds: [],
              missingZoneIds: [],
            };
          }
        })
      );
      setCoverageMap(covs);
    } catch (err: any) {
      setError(err?.message || 'Failed to load datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value.trim() !== '') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1'); // reset page on filter change
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Filter Logic
  const filteredDatasets = useMemo(() => {
    return datasets.filter((ds) => {
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ds.title?.toLowerCase().includes(q);
        const matchesId = ds.datasetId?.toLowerCase().includes(q);
        const matchesDesc = ds.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesId && !matchesDesc) return false;
      }

      if (commodityFilter !== 'all' && ds.commodity !== commodityFilter) return false;
      if (metricFilter !== 'all' && ds.metric !== metricFilter) return false;
      if (lifecycleFilter !== 'all' && ds.lifecycleStatus !== lifecycleFilter) return false;
      if (verificationFilter !== 'all' && ds.verificationStatus !== verificationFilter) return false;

      return true;
    });
  }, [datasets, searchQuery, commodityFilter, metricFilter, lifecycleFilter, verificationFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredDatasets.length / PAGE_SIZE) || 1;
  const paginatedDatasets = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredDatasets.slice(start, start + PAGE_SIZE);
  }, [filteredDatasets, currentPage]);

  const renderVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Unverified
          </span>
        );
    }
  };

  const renderLifecycleBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            Published
          </span>
        );
      case 'review':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
            Under Review
          </span>
        );
      case 'archived':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400">
            Archived
          </span>
        );
      case 'unpublished':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
            Unpublished
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Directory Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>Dataset Directory</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Zone-level agricultural production, yield, suitability and potential statistical datasets.
          </p>
        </div>

        {canManageDatasets && (
          <Link
            to="/admin/investment/datasets/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Dataset</span>
          </Link>
        )}
      </div>

      {/* Filter Control Box */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Filters & Search</span>
          </div>

          {(searchQuery || commodityFilter !== 'all' || metricFilter !== 'all' || lifecycleFilter !== 'all' || verificationFilter !== 'all') && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search title or ID..."
              value={searchQuery}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Commodity Dropdown */}
          <select
            value={commodityFilter}
            onChange={(e) => updateFilter('commodity', e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Commodities</option>
            <option value="coffee">Coffee</option>
            <option value="maize">Maize</option>
            <option value="wheat">Wheat</option>
            <option value="avocado">Avocado</option>
            <option value="sesame">Sesame</option>
            <option value="teff">Teff</option>
            <option value="livestock">Livestock</option>
            <option value="dairy">Dairy</option>
            <option value="horticulture">Horticulture</option>
            <option value="general">General</option>
          </select>

          {/* Metric Dropdown */}
          <select
            value={metricFilter}
            onChange={(e) => updateFilter('metric', e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Metrics</option>
            <option value="production">Production</option>
            <option value="yield">Yield</option>
            <option value="harvested_area">Harvested Area</option>
            <option value="suitability">Suitability Score</option>
            <option value="investment_potential">Investment Potential</option>
            <option value="count">Count</option>
          </select>

          {/* Lifecycle Status Dropdown */}
          <select
            value={lifecycleFilter}
            onChange={(e) => updateFilter('lifecycleStatus', e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Lifecycle States</option>
            <option value="draft">Draft</option>
            <option value="review">Under Review</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
            <option value="archived">Archived</option>
          </select>

          {/* Verification Status Dropdown */}
          <select
            value={verificationFilter}
            onChange={(e) => updateFilter('verificationStatus', e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Verification States</option>
            <option value="unverified">Unverified</option>
            <option value="pending">Pending Review</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Table or Empty State */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse space-y-2">
            <Database className="w-8 h-8 mx-auto text-slate-300 animate-bounce" />
            <p>Loading dataset directory from Firestore...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        ) : filteredDatasets.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No investment datasets yet.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Create a dataset to begin managing zone-level agricultural statistics and GIS thematic overlays.
            </p>
            {canManageDatasets && (
              <div className="pt-2">
                <Link
                  to="/admin/investment/datasets/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Dataset</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Dataset Title & ID</th>
                  <th className="py-3 px-4">Commodity</th>
                  <th className="py-3 px-4">Metric</th>
                  <th className="py-3 px-4">Reference Period</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Lifecycle</th>
                  <th className="py-3 px-4">Zone Coverage</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {paginatedDatasets.map((ds) => {
                  const coverage = coverageMap[ds.datasetId];
                  const popCount = coverage?.populatedCount ?? 0;

                  return (
                    <tr
                      key={ds.datasetId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link
                          to={`/admin/investment/datasets/${ds.datasetId}`}
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400"
                        >
                          {ds.title}
                        </Link>
                        <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {ds.datasetId}
                        </div>
                      </td>

                      <td className="py-3 px-4 capitalize font-medium">{ds.commodity}</td>

                      <td className="py-3 px-4 font-medium capitalize">
                        {ds.metric?.replace('_', ' ')}
                      </td>

                      <td className="py-3 px-4">
                        {ds.referencePeriod?.label || `${ds.referencePeriod?.startYear || 'N/A'}`}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">{ds.unit}</td>

                      <td className="py-3 px-4">{renderVerificationBadge(ds.verificationStatus)}</td>

                      <td className="py-3 px-4">{renderLifecycleBadge(ds.lifecycleStatus)}</td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold font-mono text-[11px] ${
                              popCount === 22
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : popCount > 0
                                ? 'text-blue-700 dark:text-blue-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {popCount} / 22
                          </span>
                          <span className="text-[10px] text-slate-400">zones</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {ds.updatedAt ? new Date(ds.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/investment/datasets/${ds.datasetId}`}
                            className="p-1 rounded text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Inspect Dataset Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer & Pagination */}
        {!loading && filteredDatasets.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Showing{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredDatasets.length)}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {Math.min(currentPage * PAGE_SIZE, filteredDatasets.length)}
              </strong>{' '}
              of <strong className="text-slate-800 dark:text-slate-200">{filteredDatasets.length}</strong>{' '}
              datasets
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String(currentPage - 1));
                  setSearchParams(next);
                }}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-mono font-semibold">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String(currentPage + 1));
                  setSearchParams(next);
                }}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDatasetsPage;
