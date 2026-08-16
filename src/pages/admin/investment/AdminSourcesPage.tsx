import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  RotateCcw,
  ExternalLink,
  Save,
  X,
  AlertCircle,
  Database,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  getAllSources,
  createSource,
  getDatasetsUsingSource,
} from '../../../services/investment/investmentSourceService';
import { InvestmentSource, InvestmentDataset } from '../../../types/investment';

export function AdminSourcesPage() {
  const { staffUser } = useStaffAuthorizationContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sources, setSources] = useState<InvestmentSource[]>([]);
  const [datasetsCountMap, setDatasetsCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State for Create Source
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('Oromia Agriculture Bureau');
  const [documentTitle, setDocumentTitle] = useState('');
  const [publicationDate, setPublicationDate] = useState('2024-06-30');
  const [referencePeriod, setReferencePeriod] = useState('2024 Meher Season');
  const [url, setUrl] = useState('');
  const [methodologyNotes, setMethodologyNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canManageSources = hasPermission(staffUser, 'investment.sources.manage');

  // Filters
  const searchQuery = searchParams.get('search') || '';
  const verificationFilter = searchParams.get('verificationStatus') || 'all';
  const statusFilter = searchParams.get('status') || 'all';

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSources();
      setSources(data);

      // Compute dataset linkage counts for each source
      const cntMap: Record<string, number> = {};
      await Promise.all(
        data.map(async (src) => {
          try {
            const dsList = await getDatasetsUsingSource(src.sourceId);
            cntMap[src.sourceId] = dsList.length;
          } catch {
            cntMap[src.sourceId] = 0;
          }
        })
      );
      setDatasetsCountMap(cntMap);
    } catch (err: any) {
      setError(err?.message || 'Failed to load sources.');
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
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const filteredSources = useMemo(() => {
    return sources.filter((s) => {
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const mTitle = s.title?.toLowerCase().includes(q);
        const mOrg = s.organization?.toLowerCase().includes(q);
        const mId = s.sourceId?.toLowerCase().includes(q);
        if (!mTitle && !mOrg && !mId) return false;
      }

      if (verificationFilter !== 'all' && s.verificationStatus !== verificationFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;

      return true;
    });
  }, [sources, searchQuery, verificationFilter, statusFilter]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (slug) {
      setSourceId(`src_${slug}`);
    }
  };

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUser) return;
    if (!title.trim() || !sourceId.trim()) {
      setFormError('Title and Source ID are required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await createSource(staffUser, {
        sourceId: sourceId.trim(),
        title: title.trim(),
        organization: organization.trim(),
        documentTitle: documentTitle.trim() || title.trim(),
        publicationDate,
        referencePeriod,
        url: url.trim() || undefined,
        methodologyNotes: methodologyNotes.trim() || undefined,
        verificationStatus: 'verified', // staff created sources are verified by default
      });

      setShowCreateModal(false);
      // Reset modal fields
      setTitle('');
      setSourceId('');
      setUrl('');
      setMethodologyNotes('');
      // Reload list
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create source.');
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-700 dark:text-purple-400" />
            <span>Investment Data Sources Directory</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Institutional provenance, methodology notes, publication records, and license authority.
          </p>
        </div>

        {canManageSources && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Source</span>
          </button>
        )}
      </div>

      {/* Filter Box */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-purple-600" />
            <span>Filters & Search</span>
          </div>

          {(searchQuery || verificationFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, org or ID..."
              value={searchQuery}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <select
            value={verificationFilter}
            onChange={(e) => updateFilter('verificationStatus', e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All Verification States</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="unverified">Unverified</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Directory Table or Empty State */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300 animate-bounce" />
            <p>Loading source directory from Firestore...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No investment data sources yet.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Sources provide provenance for datasets, methodologies and opportunities.
            </p>
            {canManageSources && (
              <div className="pt-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Source</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Source Title & ID</th>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Publication / Period</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Datasets Using Source</th>
                  <th className="py-3 px-4">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredSources.map((src) => {
                  const dsCount = datasetsCountMap[src.sourceId] ?? 0;

                  return (
                    <tr
                      key={src.sourceId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {src.title}
                        </span>
                        <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {src.sourceId}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium">{src.organization}</td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        <div>{src.publicationDate || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400">{src.referencePeriod}</div>
                      </td>

                      <td className="py-3 px-4">{renderVerificationBadge(src.verificationStatus)}</td>

                      <td className="py-3 px-4 uppercase font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        {src.status || 'active'}
                      </td>

                      <td className="py-3 px-4 font-semibold font-mono">
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          <Database className="w-3 h-3 text-purple-600" />
                          <span>{dsCount} datasets</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {src.updatedAt ? new Date(src.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Source Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-700" />
                <span>Create Data Source Record</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSource} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Source Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oromia Bureau of Agriculture Annual Report 2024"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Source ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. src_oromia_agri_annual_2024"
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Organization
                  </label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    required
                    value={publicationDate}
                    onChange={(e) => setPublicationDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Reference Period
                </label>
                <input
                  type="text"
                  required
                  value={referencePeriod}
                  onChange={(e) => setReferencePeriod(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">URL / Document Link</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Methodology Notes</label>
                <textarea
                  rows={2}
                  placeholder="Brief sampling notes or data collection methodology..."
                  value={methodologyNotes}
                  onChange={(e) => setMethodologyNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Saving...' : 'Save Source'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSourcesPage;
