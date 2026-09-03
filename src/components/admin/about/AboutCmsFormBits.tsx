import React, { useState } from 'react';
import type { AboutLocalizedText } from '../../../types/about';
import { emptyLocalized } from '../../../types/about';

type Lang = 'om' | 'am' | 'en';

interface LocalizedFieldsProps {
  value: AboutLocalizedText;
  onChange: (next: AboutLocalizedText) => void;
  fields: Array<{ key: 'title' | 'body' | 'custom'; label: string; multiline?: boolean; get: () => string; set: (v: string) => void }>;
}

/** Simple OM / EN / AM tab switcher for a localized string map. */
export const LocalizedTextTabs: React.FC<{
  value?: AboutLocalizedText;
  onChange: (v: AboutLocalizedText) => void;
  label: string;
  multiline?: boolean;
  requiredHint?: boolean;
}> = ({ value, onChange, label, multiline, requiredHint }) => {
  const [lang, setLang] = useState<Lang>('om');
  const current = value || emptyLocalized();
  const missing = !current.om?.trim() || !current.en?.trim() || !current.am?.trim();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {label}
          {requiredHint && missing && (
            <span className="ml-2 text-[10px] font-semibold text-amber-600">Missing translation</span>
          )}
          {!missing && requiredHint && (
            <span className="ml-2 text-[10px] font-semibold text-emerald-600">Complete</span>
          )}
        </label>
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-[10px] font-extrabold">
          {(['om', 'en', 'am'] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`px-2.5 py-1 uppercase ${
                lang === l
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      {multiline ? (
        <textarea
          rows={4}
          value={current[lang] || ''}
          onChange={(e) => onChange({ ...current, [lang]: e.target.value })}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
        />
      ) : (
        <input
          type="text"
          value={current[lang] || ''}
          onChange={(e) => onChange({ ...current, [lang]: e.target.value })}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
        />
      )}
    </div>
  );
};

export function statusBadge(status: string): string {
  switch (status) {
    case 'published':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'review':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'draft':
      return 'bg-amber-100 text-amber-900 border-amber-200';
    case 'archived':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

// silence unused if tree-shaken
void (null as unknown as LocalizedFieldsProps);
