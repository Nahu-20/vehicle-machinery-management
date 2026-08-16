import React from 'react';
import { AchievementBeforeAfter, LocalizedText, createEmptyLocalizedText } from '../../../types/achievement';
import { LocalizedTextFields } from '../news/LocalizedTextFields';
import { Columns, Eye } from 'lucide-react';

interface AchievementBeforeAfterBuilderProps {
  beforeAfter: AchievementBeforeAfter | null;
  onChange: (data: AchievementBeforeAfter | null) => void;
}

export const AchievementBeforeAfterBuilder: React.FC<AchievementBeforeAfterBuilderProps> = ({
  beforeAfter,
  onChange,
}) => {
  const isEnabled = beforeAfter !== null;

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      onChange({
        before: createEmptyLocalizedText(),
        after: createEmptyLocalizedText(),
        beforeImage: '',
        afterImage: '',
        beforeDescription: createEmptyLocalizedText(),
        afterDescription: createEmptyLocalizedText(),
      });
    } else {
      onChange(null);
    }
  };

  const handleUpdate = (field: keyof AchievementBeforeAfter, val: any) => {
    if (!beforeAfter) return;
    onChange({
      ...beforeAfter,
      [field]: val,
    });
  };

  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Columns className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Before &amp; After Comparison Analysis</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare baseline status prior to intervention with achieved results after implementation.
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-emerald-600"></div>
          <span className="ml-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {isEnabled && beforeAfter && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* BEFORE COLUMN */}
          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/40 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200/50 dark:border-amber-900/30 pb-2">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                Baseline (Before Intervention)
              </span>
            </div>

            <LocalizedTextFields
              label="Before Status Overview"
              value={beforeAfter.before || createEmptyLocalizedText()}
              onChange={(val) => handleUpdate('before', val)}
              requiredOm={true}
              multiline={true}
              rows={3}
              placeholderOm="Haala duraan ture (Afaan Oromoo)..."
              placeholderAm="ከጣልቃ ገብነቱ በፊት የነበረው ሁኔታ..."
              placeholderEn="Status prior to project implementation..."
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Before Image URL (Optional)
              </label>
              <input
                type="url"
                value={beforeAfter.beforeImage || ''}
                onChange={(e) => handleUpdate('beforeImage', e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>

          {/* AFTER COLUMN */}
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200/50 dark:border-emerald-900/30 pb-2">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Achieved Result (After Implementation)
              </span>
            </div>

            <LocalizedTextFields
              label="After Result Overview"
              value={beforeAfter.after || createEmptyLocalizedText()}
              onChange={(val) => handleUpdate('after', val)}
              requiredOm={true}
              multiline={true}
              rows={3}
              placeholderOm="Gamaaggama fi bu'aa booda..."
              placeholderAm="ከስራው በኋላ የተመዘገበ ውጤት..."
              placeholderEn="Achieved results following implementation..."
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                After Image URL (Optional)
              </label>
              <input
                type="url"
                value={beforeAfter.afterImage || ''}
                onChange={(e) => handleUpdate('afterImage', e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
