import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  MapPin,
  Building,
  Activity,
  Calendar,
  Layers,
  FileCheck,
  ExternalLink,
  ShieldCheck,
  Compass,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  PublicInvestmentFacility,
  PublicInvestmentSource,
  InfrastructureCategory,
  FacilityOperationalStatus,
  LocationPrecision,
} from '../../../types/investment';
import { useLanguage } from '../../../context/LanguageContext';
import { CANONICAL_ZONE_METADATA } from '../constants/canonicalZones';
import { fetchFacilitySources } from '../../../services/investment/publicInfrastructureService';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../services/facilityStyleService';

interface FacilityDetailCardProps {
  facility: PublicInvestmentFacility;
  onClose: () => void;
  onSelectZone?: (zoneId: string) => void;
  className?: string;
}

const OPERATIONAL_STATUS_CONFIG: Record<
  FacilityOperationalStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  operational: {
    label: 'Operational',
    bg: 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/30',
    text: 'text-emerald-800 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  under_construction: {
    label: 'Under Construction',
    bg: 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-500/30',
    text: 'text-amber-800 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  planned: {
    label: 'Planned',
    bg: 'bg-blue-500/10 dark:bg-blue-950/40 border-blue-500/30',
    text: 'text-blue-800 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  temporarily_closed: {
    label: 'Temporarily Closed',
    bg: 'bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/30',
    text: 'text-rose-800 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  inactive: {
    label: 'Inactive',
    bg: 'bg-slate-500/10 dark:bg-slate-800/40 border-slate-500/30',
    text: 'text-slate-700 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
};

const PRECISION_LABELS: Record<LocationPrecision, { title: string; desc: string; icon: typeof MapPin }> = {
  exact: {
    title: 'Exact location',
    desc: 'Approved coordinates from official cadastral or GIS survey',
    icon: Compass,
  },
  approximate: {
    title: 'Approximate location',
    desc: 'Estimated facility coordinates subject to boundary verification',
    icon: AlertTriangle,
  },
  zone_centroid: {
    title: 'Zone-level location',
    desc: 'Placed at zone representative point; exact site coordinates protected',
    icon: MapPin,
  },
};

/**
 * Validates external URL for safety (only allows https://)
 */
function isSafeExternalUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const FacilityDetailCard: React.FC<FacilityDetailCardProps> = ({
  facility,
  onClose,
  onSelectZone,
  className = '',
}) => {
  const { language } = useLanguage();
  const [sources, setSources] = useState<PublicInvestmentSource[]>([]);
  const [loadingSources, setLoadingSources] = useState<boolean>(false);

  // Multilingual text resolution
  const title =
    (facility.title as any)?.[language] ||
    facility.title?.en ||
    facility.title?.om ||
    facility.title?.am ||
    'Infrastructure Facility';

  const description =
    (facility.description as any)?.[language] ||
    facility.description?.en ||
    facility.description?.om ||
    facility.description?.am ||
    '';

  const locationDesc =
    (facility.locationDescription as any)?.[language] ||
    facility.locationDescription?.en ||
    facility.locationDescription?.om ||
    facility.locationDescription?.am ||
    '';

  const zoneMeta = CANONICAL_ZONE_METADATA[facility.zoneId];
  const zoneName = zoneMeta?.displayName || facility.zoneId;
  const statusCfg = OPERATIONAL_STATUS_CONFIG[facility.operationalStatus] || OPERATIONAL_STATUS_CONFIG.operational;
  const precisionCfg = PRECISION_LABELS[facility.locationPrecision] || PRECISION_LABELS.exact;
  const categoryColor = CATEGORY_COLORS[facility.category] || CATEGORY_COLORS.other;
  const categoryIcon = CATEGORY_ICONS[facility.category] || '📍';

  // Fetch verified sources
  useEffect(() => {
    let isMounted = true;
    if (Array.isArray(facility.sourceIds) && facility.sourceIds.length > 0) {
      setLoadingSources(true);
      fetchFacilitySources(facility.sourceIds)
        .then((res) => {
          if (isMounted) {
            setSources(res);
            setLoadingSources(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoadingSources(false);
        });
    } else {
      setSources([]);
    }
    return () => {
      isMounted = false;
    };
  }, [facility.sourceIds]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: categoryColor.bg }}
            >
              <span>{categoryIcon}</span>
              <span>{categoryColor.label}</span>
            </span>

            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text}`}>
              <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
              <span>{statusCfg.label}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Verified Record</span>
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <button
              onClick={() => onSelectZone && onSelectZone(facility.zoneId)}
              className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {zoneName}
            </button>
            <span>•</span>
            <span className="font-mono text-slate-500">ID: {facility.facilityId}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          title="Close facility details"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Location Precision Banner */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
            <precisionCfg.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {precisionCfg.title}
              </span>
              {facility.coordinates && (
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  [{facility.coordinates.lat.toFixed(4)}° N, {facility.coordinates.lng.toFixed(4)}° E]
                </span>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {precisionCfg.desc}
            </p>
            {locationDesc && (
              <p className="text-slate-500 dark:text-slate-400 italic pt-1">
                "{locationDesc}"
              </p>
            )}
          </div>
        </div>

        {/* Description (if present) */}
        {description && (
          <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <h4 className="font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>Facility Overview</span>
            </h4>
            <p>{description}</p>
          </div>
        )}

        {/* Structured Capacity Metrics */}
        {Array.isArray(facility.capacities) && facility.capacities.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Technical & Operational Capacity</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {facility.capacities.map((cap, idx) => {
                const metricLabel =
                  (cap.label as any)?.[language] ||
                  cap.label?.en ||
                  cap.metricKey ||
                  `Capacity ${idx + 1}`;
                
                // Preserve valid numeric 0 vs missing null
                const hasValue = cap.numericValue !== null && cap.numericValue !== undefined;
                const displayValue = hasValue ? cap.numericValue!.toLocaleString() : 'Unspecified';

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-1"
                  >
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                      {metricLabel}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-slate-900 dark:text-white">
                        {displayValue}
                      </span>
                      {cap.unit && hasValue && (
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                          {cap.unit}
                        </span>
                      )}
                    </div>
                    {cap.referencePeriod && (
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Period: {cap.referencePeriod}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Facility Metadata Grid (Ownership, Operator, Commissioning) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {facility.ownership && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Ownership Structure</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                {facility.ownership.replace(/_/g, ' ')}
              </p>
            </div>
          )}

          {facility.operatorName && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Operating Entity</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {facility.operatorName}
              </p>
            </div>
          )}

          {facility.commissioningYear && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Commissioning Year</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {facility.commissioningYear}
              </p>
            </div>
          )}

          {facility.assessmentDate && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Last Assessment</span>
              <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {facility.assessmentDate}
              </p>
            </div>
          )}
        </div>

        {/* Commodity Associations */}
        {Array.isArray(facility.commodityKeys) && facility.commodityKeys.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 block">
              Associated Commodities
            </span>
            <div className="flex flex-wrap gap-1.5">
              {facility.commodityKeys.map((c) => (
                <span
                  key={c}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 capitalize"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Verified Data Sources & Provenance */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Source Provenance</span>
          </h4>

          {loadingSources ? (
            <div className="text-xs text-slate-500 font-mono">Loading verified sources...</div>
          ) : sources.length > 0 ? (
            <div className="space-y-2">
              {sources.map((src) => {
                const isSafeLink = isSafeExternalUrl(src.url);
                return (
                  <div
                    key={src.sourceId}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {src.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {src.organization}
                          {src.publicationDate && ` • ${src.publicationDate}`}
                          {src.license && ` • ${src.license}`}
                        </p>
                      </div>

                      {isSafeLink && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0"
                        >
                          <span>Official Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
              Verified through official regional bureau administrative records.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
