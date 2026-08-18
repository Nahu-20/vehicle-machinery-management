import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Layers,
} from 'lucide-react';
import { InvestmentFacility, InvestmentSource } from '../../../types/investment';
import { isCanonicalZoneId } from '../../../features/investment-map/constants/canonicalZones';

interface FacilityReadinessPanelProps {
  facility: Partial<InvestmentFacility>;
  attachedSources: InvestmentSource[];
  className?: string;
}

export function FacilityReadinessPanel({
  facility,
  attachedSources,
  className = '',
}: FacilityReadinessPanelProps) {
  // Title Check: at least one title defined
  const hasTitle =
    Boolean(facility.title?.en?.trim()) ||
    Boolean(facility.title?.om?.trim()) ||
    Boolean(facility.title?.am?.trim());

  // Zone Check: valid canonical zone
  const hasValidZone = Boolean(facility.zoneId && isCanonicalZoneId(facility.zoneId));

  // Category Check
  const hasCategory = Boolean(facility.category);

  // Location & Precision Check
  const precision = facility.locationPrecision || 'exact';
  const hasValidLocation =
    precision === 'zone_centroid'
      ? hasValidZone // zone_centroid does not require point coordinates
      : Boolean(
          facility.coordinates &&
            typeof facility.coordinates.lat === 'number' &&
            Number.isFinite(facility.coordinates.lat) &&
            facility.coordinates.lat >= -90 &&
            facility.coordinates.lat <= 90 &&
            typeof facility.coordinates.lng === 'number' &&
            Number.isFinite(facility.coordinates.lng) &&
            facility.coordinates.lng >= -180 &&
            facility.coordinates.lng <= 180
        );

  // Operational Status Check
  const hasOperationalStatus = Boolean(facility.operationalStatus);

  // Source Dependency Checks
  const hasSources = attachedSources.length > 0;
  const allSourcesVerified =
    hasSources && attachedSources.every((s) => s.verificationStatus === 'verified');

  // Overall readiness states
  const readyForReview =
    hasTitle && hasValidZone && hasCategory && hasValidLocation && hasOperationalStatus && hasSources;

  const isVerified = facility.verificationStatus === 'verified';
  const isInReview = facility.lifecycleStatus === 'review';
  const isPublished = facility.lifecycleStatus === 'published';
  const isRejected = facility.verificationStatus === 'rejected';

  const readyForPublish = isInReview && isVerified && allSourcesVerified;

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs text-xs space-y-3.5 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <h4 className="font-bold text-slate-900 dark:text-slate-100">
            Governance & Review Readiness
          </h4>
        </div>

        {isPublished ? (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Published Live
          </span>
        ) : readyForPublish ? (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Ready to Publish
          </span>
        ) : isInReview && !isVerified && !isRejected ? (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Under Verification
          </span>
        ) : isRejected ? (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Rejection Action Required
          </span>
        ) : readyForReview ? (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Ready for Review
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Incomplete Draft
          </span>
        )}
      </div>

      {/* Checklist items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span>Facility Title (Multilingual)</span>
          {hasTitle ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Valid
            </span>
          ) : (
            <span className="text-rose-500 flex items-center gap-1 font-semibold text-[11px]">
              <XCircle className="w-3.5 h-3.5" /> Missing
            </span>
          )}
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span>Canonical 22-Zone Assignment</span>
          {hasValidZone ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Valid
            </span>
          ) : (
            <span className="text-rose-500 flex items-center gap-1 font-semibold text-[11px]">
              <XCircle className="w-3.5 h-3.5" /> Required
            </span>
          )}
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span>Category & Asset Classification</span>
          {hasCategory ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Set
            </span>
          ) : (
            <span className="text-rose-500 flex items-center gap-1 font-semibold text-[11px]">
              <XCircle className="w-3.5 h-3.5" /> Required
            </span>
          )}
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span>
            Location Precision & Coordinates{' '}
            {precision === 'zone_centroid' && (
              <span className="text-[10px] text-slate-400 font-mono">(Centroid)</span>
            )}
          </span>
          {hasValidLocation ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Valid
            </span>
          ) : (
            <span className="text-rose-500 flex items-center gap-1 font-semibold text-[11px]">
              <XCircle className="w-3.5 h-3.5" /> Coordinates Required
            </span>
          )}
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span>Authoritative Source Attached</span>
          {hasSources ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> {attachedSources.length} Attached
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold text-[11px]">
              <AlertCircle className="w-3.5 h-3.5" /> None (Req. for Review)
            </span>
          )}
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span>Source Verification Status</span>
          {!hasSources ? (
            <span className="text-slate-400 text-[11px]">N/A (No source)</span>
          ) : allSourcesVerified ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" /> All Verified
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5" /> Unverified Sources
            </span>
          )}
        </div>
      </div>

      {/* Governance Explanatory Notice */}
      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
        <p>
          <strong className="text-slate-700 dark:text-slate-300">Policy Rules:</strong> Drafts can be saved without a source. Submitting for Review requires all core fields and at least one source. Verification and Publication require all referenced data sources to be verified.
        </p>
      </div>
    </div>
  );
}
