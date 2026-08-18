import React from 'react';
import {
  Layers,
  Filter,
  Check,
  Building2,
  X,
} from 'lucide-react';
import { InfrastructureCategory, PublicInvestmentFacility } from '../../../types/investment';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../services/facilityStyleService';

interface InfrastructureFilterControlsProps {
  showInfrastructure: boolean;
  onToggleShowInfrastructure: (show: boolean) => void;
  selectedCategory: InfrastructureCategory | 'all';
  onSelectCategory: (cat: InfrastructureCategory | 'all') => void;
  facilities: PublicInvestmentFacility[];
  isLoading?: boolean;
  className?: string;
}

const CATEGORY_ORDER: InfrastructureCategory[] = [
  'warehouse',
  'cold_storage',
  'processing',
  'irrigation',
  'collection_center',
  'market',
  'livestock_market',
  'input_distribution',
  'laboratory',
  'veterinary',
  'road',
  'electricity',
  'logistics',
  'other',
];

export const InfrastructureFilterControls: React.FC<InfrastructureFilterControlsProps> = ({
  showInfrastructure,
  onToggleShowInfrastructure,
  selectedCategory,
  onSelectCategory,
  facilities = [],
  isLoading = false,
  className = '',
}) => {
  const safeFacilities = Array.isArray(facilities) ? facilities : [];

  // Count facilities by category
  const countsByCategory: Record<string, number> = {};
  safeFacilities.forEach((f) => {
    if (f && f.category) {
      countsByCategory[f.category] = (countsByCategory[f.category] || 0) + 1;
    }
  });

  return (
    <div
      className={`bg-white dark:bg-[#0E241B] rounded-3xl p-5 sm:p-6 border border-[#063D2A]/10 dark:border-emerald-800/30 shadow-sm space-y-4 ${className}`}
    >
      {/* Top row: Toggle switch + active count */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={showInfrastructure}
            onClick={() => onToggleShowInfrastructure(!showInfrastructure)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
              showInfrastructure ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span className="sr-only">Toggle infrastructure facilities layer</span>
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                showInfrastructure ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Infrastructure Facility Layer
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {showInfrastructure
                ? `Displaying verified agricultural facilities (${safeFacilities.length} active in view)`
                : 'Turn on to overlay verified facilities, storage hubs, and processing plants'}
            </p>
          </div>
        </div>

        {showInfrastructure && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{safeFacilities.length} Verified Facilities</span>
            </span>

            {selectedCategory !== 'all' && (
              <button
                onClick={() => onSelectCategory('all')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                title="Clear category filter"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Category</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category Pills (Visible when layer is active) */}
      {showInfrastructure && (
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter by Facility Type:</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* All Categories Button */}
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#063D2A] text-white dark:bg-emerald-600 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>All Facilities</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  selectedCategory === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {facilities.length}
              </span>
            </button>

            {/* Individual Category Buttons */}
            {CATEGORY_ORDER.map((catKey) => {
              const catMeta = CATEGORY_COLORS[catKey];
              const icon = CATEGORY_ICONS[catKey] || '📍';
              const count = countsByCategory[catKey] || 0;
              const isSelected = selectedCategory === catKey;

              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => onSelectCategory(catKey)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-700 text-white dark:bg-emerald-600 shadow-sm ring-2 ring-emerald-500/40'
                      : count > 0
                      ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      : 'bg-slate-50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800/60 opacity-60'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{catMeta.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
