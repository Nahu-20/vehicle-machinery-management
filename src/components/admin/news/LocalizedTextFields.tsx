import React, { useState } from 'react';
import { LocalizedText } from '../../../types/news';
import { Globe, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LocalizedTextFieldsProps {
  label: string;
  value: LocalizedText;
  onChange: (newValue: LocalizedText) => void;
  multiline?: boolean;
  rows?: number;
  requiredOm?: boolean;
  placeholderOm?: string;
  placeholderAm?: string;
  placeholderEn?: string;
  helpText?: string;
}

export const LocalizedTextFields: React.FC<LocalizedTextFieldsProps> = ({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  requiredOm = false,
  placeholderOm = 'Afaan Oromootiin barreessi...',
  placeholderAm = 'በአማርኛ ጻፍ...',
  placeholderEn = 'Type in English...',
  helpText,
}) => {
  const [activeLang, setActiveLang] = useState<'om' | 'am' | 'en'>('om');

  const updateLanguageValue = (lang: 'om' | 'am' | 'en', text: string) => {
    onChange({
      ...value,
      [lang]: text,
    });
  };

  const isOmFilled = Boolean(value.om && value.om.trim());
  const isAmFilled = Boolean(value.am && value.am.trim());
  const isEnFilled = Boolean(value.en && value.en.trim());

  return (
    <div className="space-y-2 bg-slate-50/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{label}</span>
          {requiredOm && <span className="text-red-500 font-bold">*</span>}
        </label>

        {/* Language Tabs Selector */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveLang('om')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all ${
              activeLang === 'om'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>OM</span>
            {isOmFilled ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-200" />
            ) : requiredOm ? (
              <AlertCircle className="w-3 h-3 text-amber-300" />
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setActiveLang('am')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all ${
              activeLang === 'am'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>AM</span>
            {isAmFilled ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-200" />
            ) : (
              <span className="text-[9px] opacity-60">(Optional)</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveLang('en')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all ${
              activeLang === 'en'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>EN</span>
            {isEnFilled ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-200" />
            ) : (
              <span className="text-[9px] opacity-60">(Optional)</span>
            )}
          </button>
        </div>
      </div>

      {/* Input Field based on active language tab */}
      <div>
        {multiline ? (
          <textarea
            rows={rows}
            value={value[activeLang] || ''}
            onChange={(e) => updateLanguageValue(activeLang, e.target.value)}
            placeholder={
              activeLang === 'om'
                ? placeholderOm
                : activeLang === 'am'
                ? placeholderAm
                : placeholderEn
            }
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
        ) : (
          <input
            type="text"
            value={value[activeLang] || ''}
            onChange={(e) => updateLanguageValue(activeLang, e.target.value)}
            placeholder={
              activeLang === 'om'
                ? placeholderOm
                : activeLang === 'am'
                ? placeholderAm
                : placeholderEn
            }
            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
        <span>{helpText || `Editing language: ${activeLang.toUpperCase()}`}</span>
        {!isOmFilled && requiredOm && (
          <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Afaan Oromo text required
          </span>
        )}
      </div>
    </div>
  );
};
