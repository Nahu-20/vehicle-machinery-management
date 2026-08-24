import React, { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import { getAboutSettings, saveAboutSettings, listAboutAdmin } from '../../../services/aboutCmsService';
import type { AboutPageSettings, AboutLeadershipMessage } from '../../../types/about';
import { LocalizedTextTabs } from '../../../components/admin/about/AboutCmsFormBits';
import { emptyLocalized } from '../../../types/about';

export const AdminAboutSettingsPage: React.FC = () => {
  const { staffUser } = useStaffAuthorizationContext();
  const canEdit = hasPermission(staffUser, 'about.edit') || hasPermission(staffUser, 'about.publish');
  const [settings, setSettings] = useState<AboutPageSettings | null>(null);
  const [messages, setMessages] = useState<AboutLeadershipMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAboutSettings(), listAboutAdmin<AboutLeadershipMessage>('messages')])
      .then(([s, m]) => {
        setSettings(
          s ||
            ({
              id: 'main',
              status: 'published',
              version: 1,
              displayOrder: 0,
              landingSectionIds: [],
              featuredHistoryIds: [],
              featuredStatisticIds: [],
              featuredDepartmentIds: [],
              navRouteIds: [],
              featuredMessageId: null,
              createdAt: '',
              createdBy: '',
              updatedAt: '',
              updatedBy: '',
            } as AboutPageSettings),
        );
        setMessages(m);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Load failed'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!staffUser || !settings || !canEdit) return;
    setSaving(true);
    setError(null);
    try {
      const next = await saveAboutSettings(staffUser, settings);
      setSettings(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex gap-2 text-sm text-slate-500 py-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-extrabold">About page settings</h2>
        <p className="text-sm text-slate-500">Featured content and SEO metadata for About pages.</p>
      </div>
      {error && <div className="text-sm text-rose-700">{error}</div>}

      <label className="block text-xs font-bold">
        Featured leadership message
        <select
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          value={settings.featuredMessageId || ''}
          onChange={(e) => setSettings({ ...settings, featuredMessageId: e.target.value || null })}
        >
          <option value="">(none / auto)</option>
          {messages
            .filter((m) => m.status === 'published')
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.title?.en || m.id}
              </option>
            ))}
        </select>
      </label>

      <LocalizedTextTabs
        label="Meta title"
        value={settings.metaTitle || emptyLocalized()}
        onChange={(v) => setSettings({ ...settings, metaTitle: v })}
      />
      <LocalizedTextTabs
        label="Meta description"
        value={settings.metaDescription || emptyLocalized()}
        onChange={(v) => setSettings({ ...settings, metaDescription: v })}
        multiline
      />
      <label className="block text-xs font-bold">
        Social image URL
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          value={settings.socialImageUrl || ''}
          onChange={(e) => setSettings({ ...settings, socialImageUrl: e.target.value })}
        />
      </label>

      <button
        type="button"
        disabled={saving || !canEdit}
        onClick={() => save()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold px-3 py-2 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        Save settings
      </button>
    </div>
  );
};
