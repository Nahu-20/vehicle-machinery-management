import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Save,
  X,
  AlertCircle,
  Database,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  getAllSources,
  createSource,
  updateSource,
  deleteSource,
  getDatasetsUsingSource,
} from '../../../services/investment/investmentSourceService';
import { InvestmentSource, LifecycleStatus, VerificationStatus } from '../../../types/investment';
import { SourceDetailModal } from '../../../components/admin/investment/SourceDetailModal';

type FormMode = 'create' | 'edit';

const emptyForm = () => ({
  sourceId: '',
  title: '',
  organization: 'Oromia Agriculture Bureau',
  documentTitle: '',
  publicationDate: new Date().toISOString().slice(0, 10),
  referencePeriod: '',
  url: '',
  methodologyNotes: '',
  license: '',
  status: 'published' as LifecycleStatus,
  verificationStatus: 'verified' as VerificationStatus,
});

export function AdminSourcesPage() {
  const { staffUser } = useStaffAuthorizationContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sources, setSources] = useState<InvestmentSource[]>([]);
  const [datasetsCountMap, setDatasetsCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [editingVersion, setEditingVersion] = useState<number | undefined>(undefined);
  const [viewSource, setViewSource] = useState<InvestmentSource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvestmentSource | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const canManageSources = hasPermission(staffUser, 'investment.sources.manage');
  const canDelete = staffUser?.role === 'superAdmin';

  const searchQuery = searchParams.get('search') || '';
  const verificationFilter = searchParams.get('verificationStatus') || 'all';
  const statusFilter = searchParams.get('status') || 'all';

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSources();
      setSources(data.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')));

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

  const resetFilters = () => setSearchParams(new URLSearchParams());

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

  const openCreate = () => {
    setForm(emptyForm());
    setEditingVersion(undefined);
    setFormError(null);
    setFormMode('create');
  };

  const openEdit = (src: InvestmentSource) => {
    setForm({
      sourceId: src.sourceId,
      title: src.title || '',
      organization: src.organization || '',
      documentTitle: src.documentTitle || '',
      publicationDate: src.publicationDate || '',
      referencePeriod: src.referencePeriod || '',
      url: src.url || '',
      methodologyNotes: src.methodologyNotes || '',
      license: src.license || '',
      status: (src.status as LifecycleStatus) || 'published',
      verificationStatus: (src.verificationStatus as VerificationStatus) || 'verified',
    });
    setEditingVersion(src.version);
    setFormError(null);
    setViewSource(null);
    setFormMode('edit');
  };

  const handleTitleChange = (val: string) => {
    setForm((prev) => {
      const next = { ...prev, title: val };
      if (formMode === 'create') {
        const slug = val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        if (slug) next.sourceId = `src_${slug}`;
      }
      return next;
    });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUser) return;
    if (!form.title.trim() || !form.sourceId.trim()) {
      setFormError('Title and Source ID are required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        sourceId: form.sourceId.trim(),
        title: form.title.trim(),
        organization: form.organization.trim(),
        documentTitle: form.documentTitle.trim() || form.title.trim(),
        publicationDate: form.publicationDate,
        referencePeriod: form.referencePeriod.trim(),
        url: form.url.trim() || undefined,
        methodologyNotes: form.methodologyNotes.trim() || undefined,
        license: form.license.trim() || undefined,
        status: form.status,
        verificationStatus: form.verificationStatus,
      };

      if (formMode === 'edit') {
        await updateSource(staffUser, payload, editingVersion);
        setActionMessage(`Updated source “${payload.title}”.`);
      } else {
        await createSource(staffUser, payload);
        setActionMessage(`Created source “${payload.title}”.`);
      }

      setFormMode(null);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save source.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!staffUser || !deleteTarget) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await deleteSource(staffUser, deleteTarget.sourceId, deleteTarget.version);
      setActionMessage(`Deleted source “${deleteTarget.title}”.`);
      setDeleteTarget(null);
      setViewSource(null);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to delete source. SuperAdmin permission required.');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-700 dark:text-purple-400" />
            <span>Investment Data Sources</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View, create, edit, and (superAdmin) permanently delete provenance records used by datasets and facilities.
          </p>
        </div>

        {canManageSources && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Source</span>
          </button>
        )}
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3">
          <span>{actionMessage}</span>
          <button type="button" onClick={() => setActionMessage(null)} className="font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-purple-600" />
            <span>Filters & Search</span>
          </div>
          {(searchQuery || verificationFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
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
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="unpublished">Unpublished</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300 animate-bounce" />
            <p>Loading source directory from Firestore...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 dark:text-rose-400">{error}</div>
        ) : filteredSources.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No investment data sources yet.</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Sources provide provenance for datasets and facilities. Create published + verified sources before attaching them.
            </p>
            {canManageSources && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={openCreate}
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
                  <th className="py-3 px-4">Datasets</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredSources.map((src) => {
                  const dsCount = datasetsCountMap[src.sourceId] ?? 0;
                  return (
                    <tr key={src.sourceId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => setViewSource(src)}
                          className="text-left font-bold text-slate-900 dark:text-slate-100 hover:text-purple-700 dark:hover:text-purple-300"
                        >
                          {src.title}
                        </button>
                        <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{src.sourceId}</div>
                      </td>
                      <td className="py-3 px-4 font-medium">{src.organization}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        <div>{src.publicationDate || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400">{src.referencePeriod}</div>
                      </td>
                      <td className="py-3 px-4">{renderVerificationBadge(src.verificationStatus)}</td>
                      <td className="py-3 px-4 uppercase font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        {src.status || '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold font-mono">
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          <Database className="w-3 h-3 text-purple-600" />
                          <span>{dsCount}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {src.updatedAt ? new Date(src.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="View"
                            onClick={() => setViewSource(src)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canManageSources && (
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => openEdit(src)}
                              className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              title="Delete (SuperAdmin)"
                              onClick={() => setDeleteTarget(src)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {viewSource && (
        <SourceDetailModal
          source={viewSource}
          onClose={() => setViewSource(null)}
          onEdit={canManageSources ? () => openEdit(viewSource) : undefined}
          onDelete={canDelete ? () => setDeleteTarget(viewSource) : undefined}
        />
      )}

      {formMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-700" />
                <span>{formMode === 'edit' ? 'Edit Data Source' : 'Create Data Source'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setFormMode(null)}
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

            <form onSubmit={handleSubmitForm} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Source Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
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
                  disabled={formMode === 'edit'}
                  value={form.sourceId}
                  onChange={(e) => setForm((p) => ({ ...p, sourceId: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Organization</label>
                  <input
                    type="text"
                    required
                    value={form.organization}
                    onChange={(e) => setForm((p) => ({ ...p, organization: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Publication Date</label>
                  <input
                    type="date"
                    required
                    value={form.publicationDate}
                    onChange={(e) => setForm((p) => ({ ...p, publicationDate: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Document Title</label>
                <input
                  type="text"
                  value={form.documentTitle}
                  onChange={(e) => setForm((p) => ({ ...p, documentTitle: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Reference Period</label>
                <input
                  type="text"
                  required
                  value={form.referencePeriod}
                  onChange={(e) => setForm((p) => ({ ...p, referencePeriod: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Lifecycle Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as LifecycleStatus }))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="unpublished">Unpublished</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Verification</label>
                  <select
                    value={form.verificationStatus}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, verificationStatus: e.target.value as VerificationStatus }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="unverified">Unverified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">URL / Document Link</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.url}
                  onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">License</label>
                <input
                  type="text"
                  value={form.license}
                  onChange={(e) => setForm((p) => ({ ...p, license: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Methodology Notes</label>
                <textarea
                  rows={2}
                  value={form.methodologyNotes}
                  onChange={(e) => setForm((p) => ({ ...p, methodologyNotes: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Public map provenance requires <strong>published</strong> + <strong>verified</strong>. Defaults are set for new sources.
              </p>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFormMode(null)}
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
                  <span>{submitting ? 'Saving...' : formMode === 'edit' ? 'Save Changes' : 'Save Source'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Delete source permanently?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This removes <strong>{deleteTarget.title}</strong> ({deleteTarget.sourceId}). Datasets that still reference it
              may fail verification until you detach the source. SuperAdmin only.
            </p>
            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">{formError}</div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setFormError(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {submitting ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSourcesPage;
