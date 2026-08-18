import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Save,
  X,
  AlertCircle,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  getAllMethodologies,
  saveMethodology,
  deleteMethodology,
} from '../../../services/investment/investmentMethodologyService';
import {
  InvestmentMethodology,
  LifecycleStatus,
  VerificationStatus,
} from '../../../types/investment';
import { MethodologyDetailModal } from '../../../components/admin/investment/MethodologyDetailModal';

type FormMode = 'create' | 'edit';

const emptyForm = () => ({
  methodologyId: '',
  title: '',
  description: '',
  versionLabel: 'v1.0',
  calculationNotes: '',
  limitations: '',
  componentsText: '',
  status: 'published' as LifecycleStatus,
  verificationStatus: 'verified' as VerificationStatus,
});

export function AdminMethodologiesPage() {
  const { staffUser } = useStaffAuthorizationContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<InvestmentMethodology[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [editingVersion, setEditingVersion] = useState<number | undefined>();
  const [editingSourceIds, setEditingSourceIds] = useState<string[]>([]);
  const [viewItem, setViewItem] = useState<InvestmentMethodology | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvestmentMethodology | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const canManage = hasPermission(staffUser, 'investment.datasets.manage') || hasPermission(staffUser, 'investment.edit');
  const canDelete = staffUser?.role === 'superAdmin';

  const searchQuery = searchParams.get('search') || '';
  const verificationFilter = searchParams.get('verificationStatus') || 'all';
  const statusFilter = searchParams.get('status') || 'all';

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllMethodologies();
      setItems(data.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')));
    } catch (err: any) {
      setError(err?.message || 'Failed to load methodologies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value.trim() !== '') next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const filtered = useMemo(() => {
    return items.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !m.title?.toLowerCase().includes(q) &&
          !m.methodologyId?.toLowerCase().includes(q) &&
          !m.description?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (verificationFilter !== 'all' && m.verificationStatus !== verificationFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      return true;
    });
  }, [items, searchQuery, verificationFilter, statusFilter]);

  const openCreate = () => {
    setForm(emptyForm());
    setEditingVersion(undefined);
    setEditingSourceIds([]);
    setFormError(null);
    setFormMode('create');
  };

  const openEdit = (m: InvestmentMethodology) => {
    setForm({
      methodologyId: m.methodologyId,
      title: m.title || '',
      description: m.description || '',
      versionLabel: m.versionLabel || 'v1.0',
      calculationNotes: m.calculationNotes || '',
      limitations: m.limitations || '',
      componentsText: (m.components || [])
        .map((c) => (c.weight != null ? `${c.name}|${c.weight}|${c.description || ''}` : c.name))
        .join('\n'),
      status: (m.status as LifecycleStatus) || 'published',
      verificationStatus: (m.verificationStatus as VerificationStatus) || 'verified',
    });
    setEditingVersion(m.version);
    setEditingSourceIds(Array.isArray(m.sourceIds) ? m.sourceIds : []);
    setViewItem(null);
    setFormError(null);
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
        if (slug) next.methodologyId = `meth_${slug}`;
      }
      return next;
    });
  };

  const parseComponents = (text: string) => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, weightRaw, ...rest] = line.split('|').map((p) => p.trim());
        const weight = weightRaw ? Number(weightRaw) : undefined;
        return {
          name,
          weight: Number.isFinite(weight) ? weight : undefined,
          description: rest.join('|') || undefined,
        };
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUser) return;
    if (!form.title.trim() || !form.methodologyId.trim() || !form.description.trim()) {
      setFormError('Title, ID, and description are required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await saveMethodology(
        staffUser,
        {
          methodologyId: form.methodologyId.trim(),
          title: form.title.trim(),
          description: form.description.trim(),
          versionLabel: form.versionLabel.trim() || 'v1.0',
          calculationNotes: form.calculationNotes.trim() || undefined,
          limitations: form.limitations.trim() || undefined,
          components: parseComponents(form.componentsText),
          sourceIds: editingSourceIds,
          status: form.status,
          verificationStatus: form.verificationStatus,
        },
        editingVersion
      );
      setActionMessage(
        formMode === 'edit'
          ? `Updated methodology “${form.title.trim()}”.`
          : `Created methodology “${form.title.trim()}”.`
      );
      setFormMode(null);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save methodology.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!staffUser || !deleteTarget) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await deleteMethodology(staffUser, deleteTarget.methodologyId, deleteTarget.version);
      setActionMessage(`Deleted methodology “${deleteTarget.title}”.`);
      setDeleteTarget(null);
      setViewItem(null);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to delete. SuperAdmin required.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <span>Investment Methodologies</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Required for suitability and investment-potential datasets. Create published + verified methodologies before attaching them.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Methodology</span>
          </button>
        )}
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex justify-between gap-3">
          <span>{actionMessage}</span>
          <button type="button" className="underline font-semibold" onClick={() => setActionMessage(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filters & Search</span>
          </div>
          {(searchQuery || verificationFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => setSearchParams(new URLSearchParams())}
              className="text-xs font-semibold text-rose-600 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search title or ID..."
              value={searchQuery}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <select
            value={verificationFilter}
            onChange={(e) => updateFilter('verificationStatus', e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <option value="all">All Verification</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="unverified">Unverified</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading methodologies…</div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <BookOpen className="w-8 h-8 mx-auto text-blue-600" />
            <h3 className="text-base font-bold">No methodologies yet.</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Create a verified methodology to unlock suitability and investment-potential dataset publication.
            </p>
            {canManage && (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4" /> Create Methodology
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-semibold text-[10px] tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4">Title & ID</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Components</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((m) => (
                  <tr key={m.methodologyId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setViewItem(m)}
                        className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-700 text-left"
                      >
                        {m.title}
                      </button>
                      <div className="font-mono text-[10px] text-slate-400">{m.methodologyId}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">{m.versionLabel || '—'}</td>
                    <td className="py-3 px-4">{(m.components || []).length}</td>
                    <td className="py-3 px-4 capitalize">{m.verificationStatus}</td>
                    <td className="py-3 px-4 uppercase font-mono text-[10px]">{m.status}</td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      {m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => setViewItem(m)} className="p-1.5 rounded-lg hover:bg-slate-100">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canManage && (
                          <button type="button" onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(m)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewItem && (
        <MethodologyDetailModal
          methodology={viewItem}
          onClose={() => setViewItem(null)}
          onEdit={canManage ? () => openEdit(viewItem) : undefined}
          onDelete={canDelete ? () => setDeleteTarget(viewItem) : undefined}
        />
      )}

      {formMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-700" />
                {formMode === 'edit' ? 'Edit Methodology' : 'Create Methodology'}
              </h3>
              <button type="button" onClick={() => setFormMode(null)} className="p-1 rounded hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Methodology ID *</label>
                <input
                  required
                  disabled={formMode === 'edit'}
                  value={form.methodologyId}
                  onChange={(e) => setForm((p) => ({ ...p, methodologyId: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono disabled:opacity-60 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold">Version label</label>
                  <input
                    value={form.versionLabel}
                    onChange={(e) => setForm((p) => ({ ...p, versionLabel: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as LifecycleStatus }))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Verification</label>
                <select
                  value={form.verificationStatus}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, verificationStatus: e.target.value as VerificationStatus }))
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Components (one per line: name|weight|description)</label>
                <textarea
                  rows={3}
                  placeholder={'Soil suitability|0.4|Agro-ecological score\nMarket access|0.3|'}
                  value={form.componentsText}
                  onChange={(e) => setForm((p) => ({ ...p, componentsText: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono bg-white dark:bg-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Calculation notes</label>
                <textarea
                  rows={2}
                  value={form.calculationNotes}
                  onChange={(e) => setForm((p) => ({ ...p, calculationNotes: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Limitations</label>
                <textarea
                  rows={2}
                  value={form.limitations}
                  onChange={(e) => setForm((p) => ({ ...p, limitations: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setFormMode(null)} className="px-4 py-2 rounded-lg border text-xs font-semibold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {submitting ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-base">Delete methodology permanently?</h3>
            <p className="text-xs text-slate-600">
              Removes <strong>{deleteTarget.title}</strong>. Datasets that require this methodology will fail verification until replaced.
            </p>
            {formError && <p className="text-xs text-rose-600">{formError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-lg border text-xs font-semibold">
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold disabled:opacity-50"
              >
                {submitting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMethodologiesPage;
