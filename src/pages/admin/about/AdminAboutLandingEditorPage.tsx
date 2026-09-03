import React, { useEffect, useState } from 'react';
import { Loader2, Save, CheckCircle } from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  createDefaultOverview,
  getAboutOverviewAdmin,
  saveAboutOverview,
} from '../../../services/aboutCmsService';
import type { AboutOverviewDoc } from '../../../types/about';
import { LocalizedTextTabs } from '../../../components/admin/about/AboutCmsFormBits';

export const AdminAboutLandingEditorPage: React.FC = () => {
  const { staffUser } = useStaffAuthorizationContext();
  const canEdit = hasPermission(staffUser, 'about.edit') || hasPermission(staffUser, 'about.create');
  const canPublish = hasPermission(staffUser, 'about.publish');
  const [docu, setDocu] = useState<AboutOverviewDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    getAboutOverviewAdmin()
      .then((d) => {
        if (d) setDocu(d);
        else {
          const base = createDefaultOverview();
          setDocu({
            ...base,
            createdAt: '',
            createdBy: '',
            updatedAt: '',
            updatedBy: '',
          } as AboutOverviewDoc);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Load failed'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (publish: boolean) => {
    if (!staffUser || !docu || !canEdit) return;
    if (publish && !canPublish) {
      setError('about.publish required');
      return;
    }
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const saved = await saveAboutOverview(
        staffUser,
        { ...docu, status: publish ? 'published' : docu.status || 'draft' },
        docu.version || undefined,
      );
      setDocu(saved);
      setOk(publish ? 'Published' : 'Saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !docu) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 py-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading landing editor…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-extrabold">About landing page</h2>
        <p className="text-sm text-slate-500">
          Status: <strong>{docu.status || 'draft'}</strong> · version {docu.version || 1}
        </p>
      </div>
      {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
      {ok && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{ok}</div>}

      <LocalizedTextTabs label="Eyebrow" value={docu.eyebrow} onChange={(v) => setDocu({ ...docu, eyebrow: v })} requiredHint />
      <LocalizedTextTabs label="Headline" value={docu.headline} onChange={(v) => setDocu({ ...docu, headline: v })} requiredHint />
      <LocalizedTextTabs label="Summary" value={docu.summary} onChange={(v) => setDocu({ ...docu, summary: v })} multiline requiredHint />
      <LocalizedTextTabs label="Primary CTA" value={docu.primaryCtaLabel} onChange={(v) => setDocu({ ...docu, primaryCtaLabel: v })} />
      <label className="block text-xs font-bold text-slate-600">
        Primary CTA href
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm"
          value={docu.primaryCtaHref || ''}
          onChange={(e) => setDocu({ ...docu, primaryCtaHref: e.target.value })}
        />
      </label>
      <LocalizedTextTabs label="Secondary CTA" value={docu.secondaryCtaLabel} onChange={(v) => setDocu({ ...docu, secondaryCtaLabel: v })} />
      <label className="block text-xs font-bold text-slate-600">
        Secondary CTA href
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm"
          value={docu.secondaryCtaHref || ''}
          onChange={(e) => setDocu({ ...docu, secondaryCtaHref: e.target.value })}
        />
      </label>
      <label className="block text-xs font-bold text-slate-600">
        Hero image URL
        <input
          className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm"
          value={docu.heroImageUrl || ''}
          onChange={(e) => setDocu({ ...docu, heroImageUrl: e.target.value })}
        />
      </label>
      <LocalizedTextTabs label="Discover title" value={docu.discoverTitle} onChange={(v) => setDocu({ ...docu, discoverTitle: v })} />
      <LocalizedTextTabs label="Discover subtitle" value={docu.discoverSubtitle} onChange={(v) => setDocu({ ...docu, discoverSubtitle: v })} multiline />

      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Landing sections</p>
        {(docu.sections || []).map((s, idx) => (
          <label key={s.id} className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={s.enabled}
              onChange={(e) => {
                const sections = [...(docu.sections || [])];
                sections[idx] = { ...s, enabled: e.target.checked };
                setDocu({ ...docu, sections });
              }}
            />
            <span className="font-semibold">{s.label}</span>
            <span className="text-xs text-slate-400">order {s.displayOrder}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving || !canEdit}
          onClick={() => save(false)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold px-3 py-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save
        </button>
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
      </div>
    </div>
  );
};
