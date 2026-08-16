import React from 'react';
import { CommodityKey, ThematicClass, ThematicMetric } from '../types/thematic';
import { SUPPORTED_COMMODITIES, SUPPORTED_METRICS } from '../data/demoThematicData';
import { THEMATIC_CLASS_LABELS, getThematicColor, getMetricLegendRanges } from '../services/thematicService';
import { Info } from 'lucide-react';

export interface MapLegendProps {
  selectedCommodity: CommodityKey | null;
  selectedMetric: ThematicMetric;
  className?: string;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  selectedCommodity,
  selectedMetric,
  className = '',
}) => {
  const commodityObj = SUPPORTED_COMMODITIES.find((c) => c.key === selectedCommodity);
  const metricObj = SUPPORTED_METRICS.find((m) => m.key === selectedMetric);

  const classes: ThematicClass[] = ['very_high', 'high', 'moderate', 'low', 'very_low', 'no_data'];

  if (!selectedCommodity) {
    return (
      <div className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs shadow-xs space-y-2 text-slate-600 dark:text-slate-400 ${className}`}>
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-xs">
          <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Administrative Zone Boundaries</span>
        </div>
        <p className="text-[11px] leading-tight">
          Select a product (Coffee, Wheat, Maize) above to display thematic agricultural distribution and statistical quantiles.
        </p>
      </div>
    );
  }

  const rangeLabels = getMetricLegendRanges(selectedCommodity, selectedMetric);

  return (
    <div
      className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-xs shadow-xs space-y-3 ${className}`}
      aria-label="Thematic Map Legend"
    >
      <div className="space-y-0.5 border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-extrabold text-slate-900 dark:text-slate-50 text-xs uppercase tracking-tight flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
            <span>{commodityObj?.labelEn} — {metricObj?.labelEn}</span>
          </span>
          <span className="text-[10px] font-mono bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
            DEMO
          </span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
          {metricObj?.description}
        </p>
      </div>

      {/* Color Swatch Scale & Active DEMO Ranges */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
          <span>{selectedMetric === 'production' ? 'Production Quintiles' : 'Score Thresholds'}</span>
          <span>Active DEMO Ranges</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          {classes.map((cls) => {
            const lightColors = getThematicColor(cls, false);
            const label = THEMATIC_CLASS_LABELS[cls];
            const rangeStr = rangeLabels[cls];

            return (
              <div key={cls} className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-1 sm:border-none sm:pb-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded shrink-0 border border-slate-900/10 dark:border-white/20 shadow-2xs"
                    style={{
                      backgroundColor: lightColors.legendColor,
                    }}
                    title={`${label} (${cls})`}
                  ></span>
                  <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {label}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                  {rangeStr}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend Metadata Context Footer */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1 text-[10px] font-mono text-slate-600 dark:text-slate-400">
        <div className="flex items-center justify-between">
          <span>Classification:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {selectedMetric === 'production'
              ? 'Development quantile classification'
              : 'Development score classification'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Methodology:</span>
          <span className="font-bold text-amber-700 dark:text-amber-400">
            {selectedMetric === 'production'
              ? 'Synthetic demonstration ranges, not official OAB thresholds'
              : 'Not an approved OAB methodology'}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 pt-1">
          <span>Verification:</span>
          <span className="font-bold text-slate-700 dark:text-slate-300">DEMO / Unverified</span>
        </div>
      </div>
    </div>
  );
};

