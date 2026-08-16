import React from 'react';
import { Coffee, Wheat, Sprout, Sparkles, BarChart3, Sun, Layers, AlertCircle } from 'lucide-react';
import { CommodityKey, ThematicMetric } from '../types/thematic';
import { SUPPORTED_COMMODITIES, SUPPORTED_METRICS } from '../data/demoThematicData';

export interface ThematicSelectorBarProps {
  selectedCommodity: CommodityKey | null;
  selectedMetric: ThematicMetric;
  onSelectCommodity: (commodity: CommodityKey | null) => void;
  onSelectMetric: (metric: ThematicMetric) => void;
  titleEyebrow?: string;
  isPublic?: boolean;
  isThematicActive?: boolean;
  className?: string;
}

export const ThematicSelectorBar: React.FC<ThematicSelectorBarProps> = ({
  selectedCommodity,
  selectedMetric,
  onSelectCommodity,
  onSelectMetric,
  titleEyebrow = 'AGRICULTURAL POTENTIAL MAP',
  isPublic = false,
  isThematicActive = false,
  className = '',
}) => {
  const getCommodityIcon = (key: CommodityKey) => {
    switch (key) {
      case 'coffee':
        return <Coffee className="w-4 h-4 shrink-0" />;
      case 'wheat':
        return <Wheat className="w-4 h-4 shrink-0" />;
      case 'maize':
        return <Sprout className="w-4 h-4 shrink-0" />;
    }
  };

  const getMetricIcon = (key: ThematicMetric) => {
    switch (key) {
      case 'production':
        return <BarChart3 className="w-4 h-4 shrink-0" />;
      case 'suitability':
        return <Sun className="w-4 h-4 shrink-0" />;
      case 'investment_potential':
        return <Sparkles className="w-4 h-4 shrink-0" />;
    }
  };

  const selectedCommodityObj = SUPPORTED_COMMODITIES.find((c) => c.key === selectedCommodity);

  const getNoDataMessage = () => {
    const label = selectedCommodityObj?.labelEn || 'this commodity';
    if (selectedMetric === 'production') {
      return `Verified production data is not yet available for ${label}.`;
    }
    if (selectedMetric === 'suitability') {
      return `No verified suitability dataset is currently available for ${label}.`;
    }
    return `No verified investment-potential dataset is currently available for ${label}.`;
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 ${className}`}
      aria-label="Agricultural Commodity and Metric Selector"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono block">
            {titleEyebrow}
          </span>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">
            Explore Agricultural Potential
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {isThematicActive ? (
            <span className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Thematic Layer Active</span>
            </span>
          ) : (
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>Base GIS View</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Commodity Selector Group */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
            Product / Commodity
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onSelectCommodity(null)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedCommodity === null
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-2xs font-bold'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All / Default</span>
            </button>

            {SUPPORTED_COMMODITIES.map((c) => {
              const isSelected = selectedCommodity === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => onSelectCommodity(c.key)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-700 text-white dark:bg-emerald-500 dark:text-slate-950 border-emerald-700 dark:border-emerald-400 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30'
                  }`}
                >
                  {getCommodityIcon(c.key)}
                  <span>{c.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Metric Selector Group */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
            View By Metric
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {SUPPORTED_METRICS.map((m) => {
              const isSelected = selectedMetric === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => onSelectMetric(m.key)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-800 text-white dark:bg-emerald-600 dark:text-white border-emerald-800 dark:border-emerald-500 shadow-2xs font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {getMetricIcon(m.key)}
                  <span>{m.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Public Interim Notice Banner when Commodity Selected without Active Dataset */}
      {isPublic && selectedCommodity !== null && !isThematicActive && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-medium">{getNoDataMessage()}</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded text-amber-800 dark:text-amber-300 shrink-0 font-mono">
              Coming When Verified
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
