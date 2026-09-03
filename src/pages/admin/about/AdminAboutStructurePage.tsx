import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Save, X } from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import { listAboutAdmin, saveOrgNode, setAboutEntityStatus } from '../../../services/aboutCmsService';
import type { AboutOrgNode, AboutOrgNodeType } from '../../../types/about';
import { emptyLocalized } from '../../../types/about';
import { LocalizedTextTabs, statusBadge } from '../../../components/admin/about/AboutCmsFormBits';

const TYPES: AboutOrgNodeType[] = [
  'government',
  'bureau',
  'bureau-head',
  'deputy',
  'directorate',
  'department',
  'zone',
  'woreda',
  'kebele',
  'extension',
  'farmer',
  'other',
];

export const AdminAboutStructurePage: React.FC = () => {
  const { staffUser } = useStaffAuthorizationContext();
  const canManage = hasPermission(staffUser, 'about.structure.manage') || hasPermission(staffUser, 'about.edit');
  const canPublish = hasPermission(staffUser, 'about.publish');
  const [nodes, setNodes] = useState<AboutOrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AboutOrgNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setNodes(await listAboutAdmin<AboutOrgNode>('org'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const byParent = useMemo(() => {
    const map = new Map<string | null, AboutOrgNode[]>();
    nodes.forEach((n) => {
      const key = n.parentId;
      const list = map.get(key) || [];
      list.push(n);
      map.set(key, list);
    });
    map.forEach((list) => list.sort((a, b) => a.displayOrder - b.displayOrder));
    return map;
  }, [nodes]);

  const renderTree = (parentId: string | null, depth = 0): React.ReactNode => {
    const children = byParent.get(parentId) || [];
    return children.map((n) => (
      <li key={n.id} className="list-none">
        <div
          className="flex items-center gap-2 py-1.5 text-sm"
          style={{ paddingLeft: depth * 16 }}
        >
          <span className="font-semibold text-slate-900 dark:text-white">
            {(n.title as { en?: string })?.en || n.id}
          </span>
          <span className="text-[10px] text-slate-400">{n.type}</span>
          <span className={`text-[10px] font-bold border rounded-full px-1.5 ${statusBadge(n.status)}`}>
            {n.status}
          </span>
          {canManage && (
            <button type="button" className="text-xs font-bold text-emerald-700" onClick={() => setEditing(n)}>
              Edit
            </button>
          )}
        </div>
        <ul>{renderTree(n.id, depth + 1)}</ul>
      </li>
    ));
  };

  const save = async () => {
    if (!staffUser || !editing || !canManage) return;
    setSaving(true);
    setError(null);
    try {
      await saveOrgNode(staffUser, editing, editing.version);
      setEditing(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">Organizational structure</h2>
          <p className="text-sm text-slate-500">
            Hierarchical editor. Cycles are rejected. Prefer archive over delete.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 text-white text-xs font-bold px-3 py-2"
            onClick={() =>
              setEditing({
                id: crypto.randomUUID?.() || `org_${Date.now()}`,
                parentId: null,
                title: emptyLocalized('New node'),
                type: 'other',
                active: true,
                isPlaceholder: true,
                status: 'draft',
                displayOrder: nodes.length + 1,
                version: 1,
                createdAt: '',
                createdBy: '',
                updatedAt: '',
                updatedBy: '',
              })
            }
          >
            <Plus className="h-3.5 w-3.5" /> Add node
          </button>
        )}
      </div>

      {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}

      {loading ? (
        <div className="flex gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : nodes.length === 0 ? (
        <p className="text-sm text-slate-500 border border-dashed rounded-xl p-8 text-center">
          No organization nodes yet. Add a root node as a draft until OAB verifies the hierarchy.
        </p>
      ) : (
        <ul className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">{renderTree(null)}</ul>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between">
              <h3 className="font-extrabold">Edit node</h3>
              <button type="button" onClick={() => setEditing(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <LocalizedTextTabs label="Title" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} requiredHint />
            <label className="block text-xs font-bold">
              Type
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={editing.type}
                onChange={(e) => setEditing({ ...editing, type: e.target.value as AboutOrgNodeType })}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold">
              Parent
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                value={editing.parentId || ''}
                onChange={(e) => setEditing({ ...editing, parentId: e.target.value || null })}
              >
                <option value="">(root)</option>
                {nodes
                  .filter((n) => n.id !== editing.id)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {(n.title as { en?: string })?.en || n.id}
                    </option>
                  ))}
              </select>
            </label>
            <LocalizedTextTabs
              label="Description"
              value={editing.description || emptyLocalized()}
              onChange={(v) => setEditing({ ...editing, description: v })}
              multiline
            />
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
              />
              Active
            </label>
            <div className="flex gap-2">
              <button type="button" disabled={saving} onClick={() => save()} className="inline-flex gap-1 items-center rounded-lg bg-slate-800 text-white text-xs font-bold px-3 py-2">
                <Save className="h-3.5 w-3.5" /> Save
              </button>
              {canPublish && (
                <button
                  type="button"
                  className="text-xs font-bold text-emerald-700"
                  onClick={async () => {
                    if (!staffUser) return;
                    await setAboutEntityStatus(staffUser, 'org', editing.id, 'published', editing.title.en);
                    setEditing(null);
                    await reload();
                  }}
                >
                  Publish
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
