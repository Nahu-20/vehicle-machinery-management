import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Save, X, Archive, Send, CheckCircle } from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  listAboutAdmin,
  saveAboutEntity,
  setAboutEntityStatus,
  slugifyAbout,
} from '../../../services/aboutCmsService';
import type { AboutCmsStatus, AboutLocalizedText } from '../../../types/about';
import { emptyLocalized } from '../../../types/about';
import { LocalizedTextTabs, statusBadge } from '../../../components/admin/about/AboutCmsFormBits';

type EntityKey =
  | 'history'
  | 'mandate'
  | 'leaders'
  | 'messages'
  | 'departments'
  | 'statistics'
  | 'partners'
  | 'documents'
  | 'serviceChain'
  | 'stakeholders';

interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'localized' | 'localizedLong' | 'checkbox' | 'url';
  options?: string[];
}

interface AdminAboutEntityPageProps {
  entity: EntityKey;
  title: string;
  description: string;
  fields: FieldConfig[];
  buildNew: () => Record<string, unknown> & { id: string; status: AboutCmsStatus };
  getLabel: (row: Record<string, unknown>) => string;
  requirePublishPermission?: boolean;
}

export const AdminAboutEntityPage: React.FC<AdminAboutEntityPageProps> = ({
  entity,
  title,
  description,
  fields,
  buildNew,
  getLabel,
  requirePublishPermission = true,
}) => {
  const { staffUser } = useStaffAuthorizationContext();
  const canEdit = hasPermission(staffUser, 'about.edit') || hasPermission(staffUser, 'about.create');
  const canPublish = hasPermission(staffUser, 'about.publish');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | AboutCmsStatus>('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAboutAdmin<Record<string, unknown>>(entity);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!query.trim()) return true;
      return getLabel(r).toLowerCase().includes(query.trim().toLowerCase());
    });
  }, [rows, statusFilter, query, getLabel]);

  const save = async (publish = false) => {
    if (!staffUser || !editing) return;
    if (publish && requirePublishPermission && !canPublish) {
      setError('You need about.publish permission to publish.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...editing,
        status: publish ? 'published' : (editing.status as AboutCmsStatus) || 'draft',
      };
      await saveAboutEntity(staffUser, entity, payload as never, {
        expectedVersion: editing.version as number | undefined,
        label: getLabel(payload),
      });
      setEditing(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const transition = async (id: string, status: AboutCmsStatus) => {
    if (!staffUser) return;
    if ((status === 'published') && !canPublish) {
      setError('You need about.publish permission.');
      return;
    }
    try {
      await setAboutEntityStatus(staffUser, entity, id, status, id);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status update failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing(buildNew())}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold px-3 py-2"
          >
            <Plus className="h-3.5 w-3.5" /> New draft
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm w-full sm:w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="review">In review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-sm px-3 py-2">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-8">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500">
          No records yet. Create a <strong>draft</strong> — do not publish until OAB verifies the content.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((row) => (
                <tr key={String(row.id)}>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{getLabel(row)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadge(String(row.status))}`}>
                      {String(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{String(row.displayOrder ?? 0)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {row.updatedAt ? new Date(String(row.updatedAt)).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {canEdit && (
                        <button type="button" className="text-xs font-bold text-emerald-700" onClick={() => setEditing(row)}>
                          Edit
                        </button>
                      )}
                      {canEdit && row.status === 'draft' && (
                        <button type="button" className="text-xs font-bold text-blue-700" onClick={() => transition(String(row.id), 'review')}>
                          Submit
                        </button>
                      )}
                      {canPublish && row.status !== 'published' && (
                        <button type="button" className="text-xs font-bold text-emerald-700" onClick={() => transition(String(row.id), 'published')}>
                          Publish
                        </button>
                      )}
                      {canPublish && row.status === 'published' && (
                        <button type="button" className="text-xs font-bold text-slate-600" onClick={() => transition(String(row.id), 'archived')}>
                          Archive
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

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-white">Edit record</h3>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            {fields.map((f) => {
              if (f.type === 'localized' || f.type === 'localizedLong') {
                const loc = (editing[f.key] as AboutLocalizedText) || emptyLocalized();
                return (
                  <LocalizedTextTabs
                    key={f.key}
                    label={f.label}
                    value={loc}
                    multiline={f.type === 'localizedLong'}
                    requiredHint
                    onChange={(v) => setEditing({ ...editing, [f.key]: v })}
                  />
                );
              }
              if (f.type === 'checkbox') {
                return (
                  <label key={f.key} className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={Boolean(editing[f.key])}
                      onChange={(e) => setEditing({ ...editing, [f.key]: e.target.checked })}
                    />
                    {f.label}
                  </label>
                );
              }
              if (f.type === 'select') {
                return (
                  <label key={f.key} className="block text-xs font-bold text-slate-600">
                    {f.label}
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                      value={String(editing[f.key] ?? '')}
                      onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    >
                      {(f.options || []).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              }
              return (
                <label key={f.key} className="block text-xs font-bold text-slate-600">
                  {f.label}
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-normal"
                    value={String(editing[f.key] ?? '')}
                    onChange={(e) => {
                      const val = f.type === 'number' ? Number(e.target.value) : e.target.value;
                      const next = { ...editing, [f.key]: val };
                      if (f.key === 'name' || f.key === 'title') {
                        // optional slug sync handled by pages that include slug field
                      }
                      if (f.key === 'slug' && typeof val === 'string') {
                        next.slug = slugifyAbout(val);
                      }
                      setEditing(next);
                    }}
                  />
                </label>
              );
            })}

            <label className="block text-xs font-bold text-slate-600">
              Display order
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                value={Number(editing.displayOrder || 0)}
                onChange={(e) => setEditing({ ...editing, displayOrder: Number(e.target.value) })}
              />
            </label>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={saving || !canEdit}
                onClick={() => save(false)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold px-3 py-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save draft
              </button>
              {canEdit && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setEditing({ ...editing, status: 'review' });
                    void save(false).then(() => transition(String(editing.id), 'review'));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 text-blue-800 text-xs font-bold px-3 py-2"
                >
                  <Send className="h-3.5 w-3.5" /> Submit review
                </button>
              )}
              {canPublish && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => save(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold px-3 py-2"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Publish
                </button>
              )}
              {canPublish && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => transition(String(editing.id), 'archived')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2"
                >
                  <Archive className="h-3.5 w-3.5" /> Archive
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
