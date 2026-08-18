import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FolderDown,
  Plus,
  Search,
  Save,
  X,
  Pencil,
  Trash2,
  Sparkles,
  AlertCircle,
  Upload,
  Loader2,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../context/StaffAuthorizationContext';
import { hasPermission } from '../../lib/permissions';
import {
  getAllResources,
  saveResource,
  deleteResource,
  slugifyResourceTitle,
} from '../../services/resourceService';
import {
  acceptAttrForFormat,
  uploadResourceFile,
} from '../../services/resourceFileUploadService';
import { seedPrototypeResourcesData } from '../../services/resourcePrototypeSeedService';
import {
  countPrototypeResources,
  PROTOTYPE_RESOURCES_SEED_VERSION,
} from '../../data/resourcePrototypeSeedData';
import {
  BureauResource,
  ResourceCategoryId,
  ResourceDocType,
  ResourceFormat,
  ResourceLifecycleStatus,
} from '../../types/resource';

type FormMode = 'create' | 'edit';
type StatusFilter = 'all' | ResourceLifecycleStatus;

const TYPE_OPTIONS: ResourceDocType[] = [
  'calendar',
  'guidance',
  'manual',
  'policy',
  'video',
  'form',
  'research',
  'poster',
];
const FORMAT_OPTIONS: ResourceFormat[] = ['PDF', 'MP4', 'DOCX', 'XLSX', 'ZIP'];
const CATEGORY_OPTIONS: ResourceCategoryId[] = [
  'crop',
  'pest',
  'livestock',
  'irrigation',
  'policy',
  'form',
  'multimedia',
  'ftc',
];

const emptyForm = () => ({
  resourceId: '',
  title: '',
  slug: '',
  summary: '',
  type: 'manual' as ResourceDocType,
  category: 'crop' as ResourceCategoryId,
  format: 'PDF' as ResourceFormat,
  language: 'English / Afaan Oromoo / Amharic',
  fileSize: '',
  downloadUrl: '',
  storagePath: '',
  coverImage: '',
  authorOrOffice: 'Oromia Agricultural Bureau',
  versionLabel: 'v1.0',
  featured: false,
  status: 'draft' as ResourceLifecycleStatus,
  sourceOrganization: 'Oromia Agricultural Bureau',
  sourceNotes: '',
});

function statusBadgeClass(status: ResourceLifecycleStatus): string {
  switch (status) {
    case 'published':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'draft':
      return 'bg-amber-100 text-amber-900 border-amber-200';
    case 'archived':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export const ResourcesManagementPage: React.FC = () => {
  const { staffUser } = useStaffAuthorizationContext();
  const canManage = hasPermission(staffUser, 'resources.manage');
  const canDelete = staffUser?.role === 'superAdmin' || staffUser?.role === 'contentAdmin';
  const canSeed =
    canManage && (staffUser?.role === 'superAdmin' || staffUser?.role === 'contentAdmin');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resources, setResources] = useState<BureauResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [editingVersion, setEditingVersion] = useState<number | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setResources(await getAllResources());
    } catch (err: any) {
      setError(err?.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!staffUser || !canSeed || seeding) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('seedResources') !== '1') return;
    let cancelled = false;
    (async () => {
      setSeeding(true);
      try {
        const result = await seedPrototypeResourcesData(staffUser);
        if (cancelled) return;
        setActionMessage(result.message);
        await load();
        params.delete('seedResources');
        window.history.replaceState(
          {},
          '',
          `${window.location.pathname}${params.toString() ? `?${params}` : ''}`
        );
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Seed failed');
      } finally {
        if (!cancelled) setSeeding(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [staffUser, canSeed]);

  const statusCounts = useMemo(() => {
    const counts = { all: resources.length, draft: 0, published: 0, archived: 0 };
    for (const r of resources) {
      if (r.status === 'draft') counts.draft += 1;
      else if (r.status === 'published') counts.published += 1;
      else if (r.status === 'archived') counts.archived += 1;
    }
    return counts;
  }, [resources]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return resources.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.format.toLowerCase().includes(q)
      );
    });
  }, [resources, searchQuery, statusFilter]);

  const openCreate = () => {
    setForm(emptyForm());
    setEditingVersion(undefined);
    setFormError(null);
    setUploadProgress(0);
    setFormMode('create');
  };

  const openEdit = (r: BureauResource) => {
    setForm({
      resourceId: r.resourceId,
      title: r.title,
      slug: r.slug,
      summary: r.summary,
      type: r.type,
      category: r.category,
      format: r.format,
      language: r.language,
      fileSize: r.fileSize || '',
      downloadUrl: r.downloadUrl || '',
      storagePath: r.storagePath || '',
      coverImage: r.coverImage || '',
      authorOrOffice: r.authorOrOffice || '',
      versionLabel: r.versionLabel || '',
      featured: r.featured,
      status: r.status,
      sourceOrganization: r.sourceOrganization || '',
      sourceNotes: r.sourceNotes || '',
    });
    setEditingVersion(r.version);
    setFormError(null);
    setUploadProgress(0);
    setFormMode('edit');
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !canManage) return;

    const resourceId =
      form.resourceId ||
      `res_${slugifyResourceTitle(form.title || file.name).replace(/-/g, '_').slice(0, 48)}` ||
      `res_${Date.now()}`;

    setUploading(true);
    setUploadProgress(0);
    setFormError(null);
    try {
      const result = await uploadResourceFile(resourceId, file, form.format, setUploadProgress);
      setForm((p) => ({
        ...p,
        resourceId,
        downloadUrl: result.downloadUrl,
        storagePath: result.storagePath,
        fileSize: result.fileSizeLabel,
      }));
      setActionMessage(`Uploaded ${result.fileName}`);
    } catch (err: any) {
      setFormError(err?.message || 'Upload failed. You can still paste an external URL.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUser || !canManage) return;
    const title = form.title.trim();
    if (!title || !form.summary.trim()) {
      setFormError('Title and summary are required.');
      return;
    }
    if (form.status === 'published') {
      const url = form.downloadUrl.trim();
      if (!url || url === '#') {
        setFormError('Upload a file or set a download URL before publishing.');
        return;
      }
    }

    const slug = form.slug || slugifyResourceTitle(title);
    const resourceId =
      formMode === 'edit'
        ? form.resourceId
        : form.resourceId || `res_${slug.replace(/-/g, '_').slice(0, 48)}`;

    setSubmitting(true);
    setFormError(null);
    try {
      await saveResource(
        staffUser,
        {
          resourceId,
          slug,
          title,
          summary: form.summary.trim(),
          type: form.type,
          category: form.category,
          format: form.format,
          language: form.language,
          fileSize: form.fileSize || undefined,
          downloadUrl: form.downloadUrl || '#',
          storagePath: form.storagePath || undefined,
          coverImage: form.coverImage || undefined,
          authorOrOffice: form.authorOrOffice || undefined,
          versionLabel: form.versionLabel || undefined,
          featured: form.featured,
          status: form.status,
          sourceOrganization: form.sourceOrganization || undefined,
          sourceNotes: form.sourceNotes || undefined,
        },
        editingVersion
      );
      setActionMessage(`${formMode === 'create' ? 'Created' : 'Updated'} ${resourceId}`);
      setFormMode(null);
      await load();
    } catch (err: any) {
      setFormError(err?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (r: BureauResource) => {
    if (!canDelete) return;
    if (!window.confirm(`Delete "${r.title}" permanently?`)) return;
    try {
      await deleteResource(r.resourceId);
      setActionMessage(`Deleted ${r.resourceId}`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Delete failed');
    }
  };

  const handleSeed = async () => {
    if (!staffUser || !canSeed) return;
    const stats = countPrototypeResources();
    if (
      !window.confirm(
        `Seed ${stats.total} source-attributed Resources & Manuals (${PROTOTYPE_RESOURCES_SEED_VERSION})?\n\n` +
          `• ${stats.openPublicPdfs} open public PDFs (FAO/IFPRI)\n` +
          `• ${stats.oboaPrototypes} OBoA investment/extension manuals\n` +
          `• ${stats.sources} named sources`
      )
    ) {
      return;
    }
    setSeeding(true);
    try {
      const result = await seedPrototypeResourcesData(staffUser);
      setActionMessage(result.message);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  const statusTabs: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: `All (${statusCounts.all})` },
    { id: 'draft', label: `Draft (${statusCounts.draft})` },
    { id: 'published', label: `Published (${statusCounts.published})` },
    { id: 'archived', label: `Archived (${statusCounts.archived})` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderDown className="w-7 h-7 text-emerald-600" />
            <span>Resources & Manuals</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Draft, upload, and publish extension calendars, field guides, forms, and investment corridor manuals.
            Seed pack: {PROTOTYPE_RESOURCES_SEED_VERSION} ({countPrototypeResources().total} docs).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canSeed && (
            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${seeding ? 'animate-pulse' : ''}`} />
              <span>{seeding ? 'Seeding…' : 'Seed source-attributed pack'}</span>
            </button>
          )}
          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add resource</span>
            </button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-4 py-3 text-sm">
          {actionMessage}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {formMode && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">
              {formMode === 'create' ? 'Create resource' : `Edit ${form.resourceId}`}
            </h2>
            <button type="button" onClick={() => setFormMode(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>
          {formError && (
            <div className="flex gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-xs space-y-1">
              <span className="font-semibold">Title</span>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((p) => ({
                    ...p,
                    title,
                    slug: formMode === 'create' ? slugifyResourceTitle(title) : p.slug,
                    resourceId:
                      formMode === 'create'
                        ? `res_${slugifyResourceTitle(title).replace(/-/g, '_').slice(0, 48)}`
                        : p.resourceId,
                  }));
                }}
                required
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold">Status</span>
              <select
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value as ResourceLifecycleStatus }))
                }
              >
                {(['draft', 'published', 'archived'] as ResourceLifecycleStatus[]).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500">
                Draft and archived stay off the public /resources page.
              </span>
            </label>

            <div className="md:col-span-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-emerald-900">File upload (Firebase Storage)</p>
                  <p className="text-[10px] text-emerald-800/80">
                    PDF, DOCX, XLSX, ZIP, or MP4 · max 80 MB · public download after save
                  </p>
                </div>
                <button
                  type="button"
                  disabled={uploading || !canManage}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{uploading ? `Uploading ${uploadProgress}%` : 'Upload file'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={acceptAttrForFormat(form.format)}
                  onChange={handleFilePick}
                />
              </div>
              {form.storagePath && (
                <p className="text-[10px] font-mono text-slate-600 break-all">{form.storagePath}</p>
              )}
            </div>

            <label className="text-xs space-y-1 md:col-span-2">
              <span className="font-semibold">Download URL</span>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-mono"
                placeholder="Filled by upload, or paste an external URL"
                value={form.downloadUrl}
                onChange={(e) => setForm((p) => ({ ...p, downloadUrl: e.target.value }))}
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold">Type</span>
              <select
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as ResourceDocType }))}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold">Category</span>
              <select
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value as ResourceCategoryId }))
                }
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold">Format</span>
              <select
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.format}
                onChange={(e) => setForm((p) => ({ ...p, format: e.target.value as ResourceFormat }))}
              >
                {FORMAT_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold">File size label</span>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                placeholder="e.g. 4.2 MB"
                value={form.fileSize}
                onChange={(e) => setForm((p) => ({ ...p, fileSize: e.target.value }))}
              />
            </label>
            <label className="text-xs space-y-1 md:col-span-2">
              <span className="font-semibold">Summary</span>
              <textarea
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 min-h-[72px]"
                value={form.summary}
                onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                required
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold">Author / office</span>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.authorOrOffice}
                onChange={(e) => setForm((p) => ({ ...p, authorOrOffice: e.target.value }))}
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold">Version label</span>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.versionLabel}
                onChange={(e) => setForm((p) => ({ ...p, versionLabel: e.target.value }))}
              />
            </label>
            <label className="text-xs flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))}
              />
              <span className="font-semibold">Featured on public Resources page</span>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormMode(null)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 text-white disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {submitting ? 'Saving…' : form.status === 'published' ? 'Save & publish' : 'Save draft'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white dark:bg-slate-950 text-slate-600 border-slate-200 dark:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="font-bold text-xs text-slate-700 dark:text-slate-300">
              Official publications ({filtered.length})
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                placeholder="Search title, category, format…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading resources…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-2">
            <p>No resources match this filter.</p>
            <p>Use Seed prototype resources or Add resource.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Document title</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Format</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Downloads</th>
                  <th className="px-6 py-3.5">Size</th>
                  <th className="px-6 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filtered.map((res) => (
                  <tr key={res.resourceId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {res.title}
                      {res.featured && (
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-amber-700">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 uppercase text-slate-500">{res.category}</td>
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{res.format}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass(res.status)}`}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 tabular-nums">
                      {(res.downloadsCount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{res.fileSize || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => openEdit(res)}
                            className="p-1.5 rounded-lg hover:bg-slate-100"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(res)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                            title="Delete"
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
    </div>
  );
};

export default ResourcesManagementPage;
