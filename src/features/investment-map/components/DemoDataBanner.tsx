import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { DEMO_DATA_DISCLAIMER } from '../data/demoThematicData';

export interface DemoDataBannerProps {
  className?: string;
}

export const DemoDataBanner: React.FC<DemoDataBannerProps> = ({ className = '' }) => {
  return (
    <div
      role="alert"
      className={`bg-amber-500/15 dark:bg-amber-950/50 border-2 border-amber-500/40 dark:border-amber-500/50 rounded-2xl p-3.5 sm:p-4 text-amber-950 dark:text-amber-200 shadow-2xs ${className}`}
    >
      <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-xs uppercase tracking-wider bg-amber-500/30 text-amber-950 dark:text-amber-100 px-2 py-0.5 rounded border border-amber-500/50">
                {DEMO_DATA_DISCLAIMER.TITLE}
              </span>
              <span className="text-xs text-amber-900/90 dark:text-amber-200/90 font-medium">
                {DEMO_DATA_DISCLAIMER.SUBTITLE}
              </span>
            </div>
            <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80">
              Values on this map are generated synthetic development fixtures for system prototyping and must not be cited as official figures.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-mono bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 text-amber-900 dark:text-amber-200 self-end sm:self-auto font-bold">
          <Info className="w-3.5 h-3.5" />
          <span>DATA STATUS: DEMO</span>
        </div>
      </div>
    </div>
  );
};
