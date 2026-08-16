import React from 'react';
import { MapPin, Compass, Sparkles, Database } from 'lucide-react';

export interface ZoneProfileEmptyStateProps {
  className?: string;
}

export const ZoneProfileEmptyState: React.FC<ZoneProfileEmptyStateProps> = ({
  className = '',
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-xs transition-colors duration-200 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400 shadow-xs">
        <Compass className="w-7 h-7" />
      </div>

      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-2">
        Explore Oromia
      </h2>

      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed mb-6">
        Select a zone on the map to view its future agricultural investment profile.
      </p>

      <div className="w-full max-w-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5 space-y-2 text-left">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Decision Support Architecture</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
          Zone profiles will combine verified production, infrastructure, opportunities and source information.
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2 text-[11px] font-mono text-slate-400 dark:text-slate-500">
        <MapPin className="w-3.5 h-3.5" />
        <span>22 ADM2 Candidate Polygons Available</span>
      </div>
    </div>
  );
};
