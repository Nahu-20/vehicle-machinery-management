import React from 'react';
import { AchievementMetric, LocalizedText, createEmptyLocalizedText } from '../../../types/achievement';
import { LocalizedTextFields } from '../news/LocalizedTextFields';
import { BarChart3, Plus, Trash2, MoveUp, MoveDown } from 'lucide-react';

interface AchievementMetricsBuilderProps {
  metrics: AchievementMetric[];
  onChange: (metrics: AchievementMetric[]) => void;
}

export const AchievementMetricsBuilder: React.FC<AchievementMetricsBuilderProps> = ({
  metrics,
  onChange,
}) => {
  const handleAddMetric = () => {
    const newMetric: AchievementMetric = {
      id: `met_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: createEmptyLocalizedText(),
      value: '',
      unit: createEmptyLocalizedText(),
      description: createEmptyLocalizedText(),
    };
    onChange([...metrics, newMetric]);
  };

  const handleRemoveMetric = (index: number) => {
    onChange(metrics.filter((_, i) => i !== index));
  };

  const handleMoveMetric = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= metrics.length) return;
    const updated = [...metrics];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange(updated);
  };

  const handleUpdate = (index: number, field: keyof AchievementMetric, val: any) => {
    const updated = metrics.map((m, i) => (i === index ? { ...m, [field]: val } : m));
    onChange(updated);
  };

  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Impact Metrics Builder ({metrics.length})</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Define quantifiable key performance indicators and statistics for this achievement.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddMetric}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Impact Metric</span>
        </button>
      </div>

      {metrics.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            No impact metrics configured. Click &quot;Add Impact Metric&quot; to add key stats.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div
              key={metric.id}
              className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Metric #{index + 1}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveMetric(index, 'up')}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === metrics.length - 1}
                    onClick={() => handleMoveMetric(index, 'down')}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveMetric(index)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Value / Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={metric.value}
                    onChange={(e) => handleUpdate(index, 'value', e.target.value)}
                    placeholder="e.g. 150,000 or 92%"
                    className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <LocalizedTextFields
                    label="Metric Label"
                    value={metric.label || createEmptyLocalizedText()}
                    onChange={(label) => handleUpdate(index, 'label', label)}
                    requiredOm={true}
                    placeholderOm="Fakkeenya: Hectara Jallisamaa..."
                    placeholderAm="ለምሳሌ፡ የመስኖ መሬት በሄክታር..."
                    placeholderEn="e.g. Hectares Irrigated..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LocalizedTextFields
                  label="Unit of Measurement (Optional)"
                  value={metric.unit || createEmptyLocalizedText()}
                  onChange={(unit) => handleUpdate(index, 'unit', unit)}
                  placeholderOm="Hectara / Qonnaan Bulaa..."
                  placeholderAm="ሄክታር / አርሶ አደር..."
                  placeholderEn="Hectares / Farmers..."
                />

                <LocalizedTextFields
                  label="Description / Context (Optional)"
                  value={metric.description || createEmptyLocalizedText()}
                  onChange={(description) => handleUpdate(index, 'description', description)}
                  placeholderOm="Ibsa dabalataa..."
                  placeholderAm="ተጨማሪ ማብራሪያ..."
                  placeholderEn="Additional metric context..."
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
