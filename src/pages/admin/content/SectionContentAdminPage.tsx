import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2, Send, Undo2, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  listContentAdmin,
  saveContentEntry,
  setContentStatus,
  deleteContentEntry,
  slugifyContent,
} from '../../../services/contentCmsService';
import {
  CONTENT_SECTION_IDS,
  emptyContentEntry,
  type ContentEntry,
  type ContentSectionId,
  type NewContentEntry,
} from '../../../types/content';
import type { AboutCmsStatus } from '../../../types/about';
import { TOPICS_BY_SECTION } from '../../../data/contentTopics';

/**
 * One screen for the four sections of the Bureau's IA that are CMS-backed.
 * They share a shape, so they share an editor; the section picker just
 * changes which topics are on offer.
 */

const SECTION_LABEL: Record<ContentSectionId, string> = {
  initiatives: 'Agricultural Initiatives',
  plans: 'Plans, Programs & Projects',
  opportunities: 'Opportunities & Engagement',
  resources: 'Resource & Statistics',
  field: 'Homepage Photographs',
};

/**
 * Field photographs reuse title/summary/body as place/crop/season, so the
 * three inputs are relabelled when that section is selected.
 */
const FIELD_LABELS = { title: 'Place', summary: 'Crop', body: 'Season' } as const;
const DEFAULT_LABELS = { title: 'Title', summary: 'Summary', body: 'Body' } as const;

const STATUS_STYLE: Record<AboutCmsStatus, string> = {
  draft: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  review: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  published: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  archived: 'bg-white/5 text-slate-400 border-slate-200 dark:border-slate-700',
};

const inputClass =
  'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-600 dark:focus:border-[#74d62c] focus:outline-none';
const labelClass = 'block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5';

export const SectionContentAdminPage: React.FC = () => {
  const { staffUser } = useAuth();
  const { t } = useLanguage();

  const [section, setSection] = useState<ContentSectionId>('initiatives');
  const [entries, setEntries] = useState<ContentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<NewContentEntry | null>(null);

  const topics = useMemo(() => TOPICS_BY_SECTION[section] ?? [], [section]);
  const isFieldSection = section === 'field';
  const labels = isFieldSection ? FIELD_LABELS : DEFAULT_LABELS;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await listContentAdmin(section));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load entries.');
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const startNew = () => {
    setDraft(emptyContentEntry(section, topics[0]?.id ?? ''));
    setError(null);
  };

  const save = async (status: AboutCmsStatus) => {
    if (!staffUser || !draft) return;
    const titleEn = draft.title.en.trim();
    if (!titleEn) {
      setError('An English title is required — it names the entry everywhere else.');
      return;
    }
    if (section === 'field' && !draft.imageUrl?.trim()) {
      setError('A photograph URL is required for a homepage photograph.');
      return;
    }
    const slug = draft.slug.trim() || slugifyContent(titleEn);
    setBusyId('draft');
    try {
      await saveContentEntry(staffUser, {
        ...draft,
        id: draft.id || `${section}-${slug}-${Date.now().toString(36)}`,
        slug,
        status,
      } as ContentEntry);
      setDraft(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setBusyId(null);
    }
  };

  const changeStatus = async (entry: ContentEntry, status: AboutCmsStatus) => {
    if (!staffUser) return;
    setBusyId(entry.id);
    try {
      await setContentStatus(staffUser, entry.id, status);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change status.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (entry: ContentEntry) => {
    if (!staffUser) return;
    setBusyId(entry.id);
    try {
      await deleteContentEntry(staffUser, entry.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove entry.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Section Content</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            The four sections of the Bureau's navigation that are filled in from here.
            Published entries appear on the public site; drafts never do.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          disabled={topics.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 dark:bg-[#74d62c] px-4 py-2.5 text-sm font-bold text-white dark:text-[#070908] hover:bg-emerald-700 dark:hover:bg-[#8be63a] disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> New entry
        </button>
      </header>

      <div className="flex flex-wrap gap-2">
        {CONTENT_SECTION_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setSection(id);
              setDraft(null);
            }}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              section === id
                ? 'border-emerald-600 dark:border-[#74d62c] bg-emerald-600/10 dark:bg-[#74d62c]/15 text-emerald-700 dark:text-[#74d62c]'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:text-white'
            }`}
          >
            {SECTION_LABEL[id]}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {draft && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">New entry · {SECTION_LABEL[section]}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="topic">Topic</label>
              <select
                id="topic"
                className={inputClass}
                value={draft.topicId}
                onChange={(e) => setDraft({ ...draft, topicId: e.target.value })}
              >
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {t(topic.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="order">Display order</label>
              <input
                id="order"
                type="number"
                className={inputClass}
                value={draft.displayOrder}
                onChange={(e) => setDraft({ ...draft, displayOrder: Number(e.target.value) || 0 })}
              />
            </div>
          </div>

          {(['en', 'om', 'am'] as const).map((lang) => (
            <div key={lang} className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor={`title-${lang}`}>
                  {labels.title} ({lang}){lang === 'en' && ' *'}
                </label>
                <input
                  id={`title-${lang}`}
                  className={inputClass}
                  value={draft.title[lang]}
                  onChange={(e) =>
                    setDraft({ ...draft, title: { ...draft.title, [lang]: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={`summary-${lang}`}>
                  {labels.summary} ({lang})
                </label>
                <input
                  id={`summary-${lang}`}
                  className={inputClass}
                  value={draft.summary[lang]}
                  onChange={(e) =>
                    setDraft({ ...draft, summary: { ...draft.summary, [lang]: e.target.value } })
                  }
                />
              </div>
            </div>
          ))}

          {isFieldSection && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {(['en', 'om', 'am'] as const).map((lang) => (
                  <div key={`season-${lang}`}>
                    <label className={labelClass} htmlFor={`season-${lang}`}>
                      {labels.body} ({lang})
                    </label>
                    <input
                      id={`season-${lang}`}
                      className={inputClass}
                      placeholder={lang === 'en' ? 'Meher 2018 E.C.' : ''}
                      value={draft.body[lang]}
                      onChange={(e) =>
                        setDraft({ ...draft, body: { ...draft.body, [lang]: e.target.value } })
                      }
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className={labelClass} htmlFor="photo">Photograph URL *</label>
                <input
                  id="photo"
                  className={inputClass}
                  placeholder="https://… or an uploaded media URL"
                  value={draft.imageUrl ?? ''}
                  onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value || null })}
                />
                {draft.imageUrl && (
                  <img
                    src={draft.imageUrl}
                    alt=""
                    className="mt-3 h-40 w-full max-w-sm rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                  />
                )}
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Published photographs replace the bundled homepage images. With none
                  published, the site falls back to the images shipped with it.
                </p>
              </div>
            </>
          )}

          <div className={`grid gap-4 sm:grid-cols-3 ${isFieldSection ? 'hidden' : ''}`}>
            <div>
              <label className={labelClass} htmlFor="url">Link (optional)</label>
              <input
                id="url"
                className={inputClass}
                placeholder="https://"
                value={draft.externalUrl ?? ''}
                onChange={(e) => setDraft({ ...draft, externalUrl: e.target.value || null })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="from">Effective from</label>
              <input
                id="from"
                type="date"
                className={inputClass}
                value={draft.effectiveDate ?? ''}
                onChange={(e) => setDraft({ ...draft, effectiveDate: e.target.value || null })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="until">Expires</label>
              <input
                id="until"
                type="date"
                className={inputClass}
                value={draft.expiresAt ?? ''}
                onChange={(e) => setDraft({ ...draft, expiresAt: e.target.value || null })}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => void save('draft')}
              disabled={busyId === 'draft'}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              {busyId === 'draft' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save as draft
            </button>
            <button
              type="button"
              onClick={() => void save('published')}
              disabled={busyId === 'draft'}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 dark:bg-[#74d62c] px-4 py-2.5 text-sm font-bold text-white dark:text-[#070908] hover:bg-emerald-700 dark:hover:bg-[#8be63a] disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Publish
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <p className="flex items-center gap-2 p-6 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : entries.length === 0 ? (
          <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
            Nothing filed under {SECTION_LABEL[section]} yet. The public page shows its topic
            list until entries are published here.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {entries.map((entry) => {
              const topic = topics.find((tp) => tp.id === entry.topicId);
              return (
                <li key={entry.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900 dark:text-white">
                      {entry.title?.en || entry.slug}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {topic ? t(topic.labelKey) : entry.topicId}
                      {entry.expiresAt && ` · expires ${entry.expiresAt}`}
                      {entry.updatedByName && ` · last edited by ${entry.updatedByName}`}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${STATUS_STYLE[entry.status]}`}
                  >
                    {entry.status}
                  </span>

                  {entry.externalUrl && (
                    <a
                      href={entry.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-[#74d62c]"
                      aria-label="Open link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  {entry.status !== 'published' ? (
                    <button
                      type="button"
                      onClick={() => void changeStatus(entry, 'published')}
                      disabled={busyId === entry.id}
                      className="rounded-lg bg-emerald-600/10 dark:bg-[#74d62c]/15 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-[#74d62c] hover:bg-emerald-600/20 dark:hover:bg-[#74d62c]/25 disabled:opacity-50"
                    >
                      Publish
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void changeStatus(entry, 'draft')}
                      disabled={busyId === entry.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white disabled:opacity-50"
                    >
                      <Undo2 className="h-3.5 w-3.5" /> Unpublish
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void remove(entry)}
                    disabled={busyId === entry.id}
                    className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:text-red-400 disabled:opacity-50"
                    aria-label={entry.status === 'published' ? 'Archive entry' : 'Delete draft'}
                    title={entry.status === 'published' ? 'Archive' : 'Delete draft'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};
