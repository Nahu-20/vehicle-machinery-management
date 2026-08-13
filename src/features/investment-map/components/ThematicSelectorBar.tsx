import React from 'react';
import { Coffee, Wheat, Sprout, Sparkles, BarChart3, Sun, Layers } from 'lucide-react';
import { CommodityKey, ThematicMetric } from '../types/thematic';
import { SUPPORTED_COMMODITIES, SUPPORTED_METRICS } from '../data/demoThematicData';

export interface ThematicSelectorBarProps {
  selectedCommodity: CommodityKey | null;
  selectedMetric: ThematicMetric;
  onSelectCommodity: (commodity: CommodityKey | null) => void;
  onSelectMetric: (metric: ThematicMetric) => void;
  titleEyebrow?: string;
  className?: string;
}

export const ThematicSelectorBar: React.FC<ThematicSelectorBarProps> = ({
  selectedCommodity,
  selectedMetric,
  onSelectCommodity,
  onSelectMetric,
  titleEyebrow = 'AGRICULTURAL INVESTMENT FILTER',
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
          {selectedCommodity ? (
            <span className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Thematic Layer Active</span>
            </span>
          ) : (
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg">
              Neutral Zone Map
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
    </div>
  );
};
