import React, { useState, useMemo } from 'react';
import {
  Search,
  Building,
  MapPin,
  Compass,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import {
  PublicInvestmentFacility,
  InfrastructureCategory,
} from '../../../types/investment';
import { useLanguage } from '../../../context/LanguageContext';
import { CANONICAL_ZONE_METADATA } from '../constants/canonicalZones';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../services/facilityStyleService';

interface PublicFacilityListPanelProps {
  facilities: PublicInvestmentFacility[];
  selectedFacilityId?: string | null;
  onSelectFacility: (facilityId: string) => void;
  selectedZoneId?: string | null;
  selectedCategory: InfrastructureCategory | 'all';
  onClearZoneFilter?: () => void;
  className?: string;
}

export const PublicFacilityListPanel: React.FC<PublicFacilityListPanelProps> = ({
  facilities,
  selectedFacilityId,
  onSelectFacility,
  selectedZoneId,
  selectedCategory,
  onClearZoneFilter,
  className = '',
}) => {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      // Category filter
      if (selectedCategory !== 'all' && f.category !== selectedCategory) {
        return false;
      }
      // Zone filter
      if (selectedZoneId && f.zoneId !== selectedZoneId) {
        return false;
      }
      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const titleEn = f.title?.en?.toLowerCase() || '';
        const titleOm = f.title?.om?.toLowerCase() || '';
        const titleAm = f.title?.am?.toLowerCase() || '';
        const operator = f.operatorName?.toLowerCase() || '';
        const zoneMeta = CANONICAL_ZONE_METADATA[f.zoneId];
        const zoneName = (zoneMeta?.displayName || f.zoneId).toLowerCase();

        return (
          titleEn.includes(query) ||
          titleOm.includes(query) ||
          titleAm.includes(query) ||
          operator.includes(query) ||
          zoneName.includes(query)
        );
      }
      return true;
    });
  }, [facilities, selectedCategory, selectedZoneId, searchTerm]);

  const activeZoneMeta = selectedZoneId ? CANONICAL_ZONE_METADATA[selectedZoneId] : null;

  return (
    <div
      className={`bg-white dark:bg-[#0E241B] rounded-3xl p-5 sm:p-6 border border-[#063D2A]/10 dark:border-emerald-800/30 shadow-sm space-y-4 ${className}`}
    >
      {/* Header with Title & Active Filter Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <h3 className="text-base font-extrabold text-[#063D2A] dark:text-white tracking-tight">
              Verified Infrastructure Directory
            </h3>
          </div>
          <p className="text-xs text-[#4E5E53] dark:text-emerald-100/80 mt-0.5">
            Browse registered and verified agricultural infrastructure assets across Oromia
          </p>
        </div>

        <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono">
          {filteredFacilities.length} {filteredFacilities.length === 1 ? 'Asset' : 'Assets'}
        </span>
      </div>

      {/* Zone Filter Pill (if a zone is active) */}
      {selectedZoneId && activeZoneMeta && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Filtered to <strong>{activeZoneMeta.displayName}</strong></span>
          </div>
          {onClearZoneFilter && (
            <button
              onClick={onClearZoneFilter}
              className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold text-[11px] cursor-pointer"
            >
              Show All Zones
            </button>
          )}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by facility name, operator, or zone..."
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Facilities List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {filteredFacilities.length > 0 ? (
          filteredFacilities.map((facility) => {
            const isSelected = facility.facilityId === selectedFacilityId;
            const title =
              (facility.title as any)?.[language] ||
              facility.title?.en ||
              facility.title?.om ||
              facility.title?.am ||
              'Facility';
            const catMeta = CATEGORY_COLORS[facility.category] || CATEGORY_COLORS.other;
            const icon = CATEGORY_ICONS[facility.category] || '📍';
            const zoneMeta = CANONICAL_ZONE_METADATA[facility.zoneId];
            const zoneName = zoneMeta?.displayName || facility.zoneId;

            return (
              <button
                key={facility.facilityId}
                type="button"
                onClick={() => onSelectFacility(facility.facilityId)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 shadow-xs ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-xs text-white"
                    style={{ backgroundColor: catMeta.bg }}
                  >
                    <span>{icon}</span>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {title}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {zoneName}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{facility.operationalStatus.replace(/_/g, ' ')}</span>
                      {facility.locationPrecision === 'zone_centroid' && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 dark:text-amber-400 font-mono">Zone Centroid</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isSelected ? 'text-emerald-600 translate-x-0.5' : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              </button>
            );
          })
        ) : (
          <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 space-y-2">
            <Building className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No verified infrastructure facilities match this filter.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Try adjusting your category selection or clearing the search query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
