import React from 'react';
import { AgriculturalAlert, toMillis } from '../../../types/agriculturalAlert';
import { useLanguage } from '../../../context/LanguageContext';
import { AlertSeverityBadge } from './AlertSeverityBadge';
import { AlertStatusBadge } from './AlertStatusBadge';
import { AlertActiveStateBadge } from './AlertActiveStateBadge';
import { formatGeographicTarget, formatSubjectTarget } from './AlertsTargetFormatter';
import {
  X,
  MapPin,
  Tag,
  Clock,
  Calendar,
  Building2,
  Phone,
  Mail,
  ShieldAlert,
  ListChecks,
  UserCheck,
  Award,
  Pin,
  ExternalLink,
} from 'lucide-react';

interface AlertDetailDrawerProps {
  alert: AgriculturalAlert | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AlertDetailDrawer: React.FC<AlertDetailDrawerProps> = ({
  alert,
  isOpen,
  onClose,
}) => {
  const { language, getLocalizedText } = useLanguage();

  if (!isOpen || !alert) return null;

  const titleText = getLocalizedText(alert.title) || alert.slug;
  const summaryText = getLocalizedText(alert.summary) || 'N/A';
  const bodyText = getLocalizedText(alert.body) || 'N/A';
  const officeText = getLocalizedText(alert.sourceOffice) || 'Oromia Agricultural Bureau';

  const effMs = toMillis(alert.effectiveFrom);
  const expMs = toMillis(alert.expiresAt);
  const updatedMs = toMillis(alert.updatedAt);
  const publishedMs = toMillis(alert.publishedAt);

  const formattedEff = effMs ? new Date(effMs).toLocaleString() : 'N/A';
  const formattedExp = expMs ? new Date(expMs).toLocaleString() : 'No expiry set (Open-ended)';
  const formattedUpdated = updatedMs ? new Date(updatedMs).toLocaleString() : 'N/A';
  const formattedPublished = publishedMs ? new Date(publishedMs).toLocaleString() : 'Not published yet';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-drawer-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/80 dark:bg-slate-950/80">
          <div className="space-y-2 max-w-[85%]">
            <div className="flex items-center gap-2 flex-wrap">
              <AlertSeverityBadge severity={alert.severity} size="sm" />
              <AlertStatusBadge status={alert.status} size="sm" />
              <AlertActiveStateBadge alert={alert} size="sm" />
              {alert.pinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Pin className="w-3 h-3" /> Pinned
                </span>
              )}
              {alert.featured && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <Award className="w-3 h-3" /> Featured
                </span>
              )}
            </div>
            <h2
              id="alert-drawer-title"
              className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug"
            >
              {titleText}
            </h2>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Slug: /{alert.slug} • Version v{alert.version}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close detail drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* Summary */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <h3 className="font-bold uppercase text-[11px] text-slate-500 dark:text-slate-400">
              Summary
            </h3>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              {summaryText}
            </p>
          </div>

          {/* Full Body */}
          <div className="space-y-2">
            <h3 className="font-bold uppercase text-[11px] text-slate-500 dark:text-slate-400">
              Full Body Details
            </h3>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
              {bodyText}
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
              <ListChecks className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="uppercase text-[11px] text-slate-500 dark:text-slate-400">
                Recommended Farmer Actions ({alert.recommendedActions?.length || 0})
              </h3>
            </div>

            {!alert.recommendedActions || alert.recommendedActions.length === 0 ? (
              <p className="p-3 text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-950/40 rounded-xl">
                No recommended actions configured.
              </p>
            ) : (
              <div className="space-y-2">
                {alert.recommendedActions.map((action, idx) => (
                  <div
                    key={action.id || idx}
                    className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 space-y-1"
                  >
                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                      {idx + 1}. {getLocalizedText(action.title)}
                    </div>
                    {action.description && (
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                        {getLocalizedText(action.description)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Targeting Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>Geographic Target</span>
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {formatGeographicTarget(alert.geographicTarget, language)}
              </p>
              {alert.geographicTarget && !alert.geographicTarget.regionWide && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pt-1">
                  {alert.geographicTarget.zones?.length > 0 && (
                    <p><strong className="text-slate-700 dark:text-slate-300">Zones:</strong> {alert.geographicTarget.zones.join(', ')}</p>
                  )}
                  {alert.geographicTarget.woredas?.length > 0 && (
                    <p><strong className="text-slate-700 dark:text-slate-300">Woredas:</strong> {alert.geographicTarget.woredas.join(', ')}</p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <Tag className="w-4 h-4 text-sky-500" />
                <span>Subject Target</span>
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {formatSubjectTarget(alert.subjectTarget, language)}
              </p>
              {alert.subjectTarget && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pt-1">
                  {alert.subjectTarget.crops?.length > 0 && (
                    <p><strong className="text-slate-700 dark:text-slate-300">Crops:</strong> {alert.subjectTarget.crops.join(', ')}</p>
                  )}
                  {alert.subjectTarget.livestock?.length > 0 && (
                    <p><strong className="text-slate-700 dark:text-slate-300">Livestock:</strong> {alert.subjectTarget.livestock.join(', ')}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Source Office & Public Contact */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Issuing Bureau Office & Contact</span>
            </div>

            <p className="font-semibold text-slate-800 dark:text-slate-200">{officeText}</p>

            <div className="flex flex-wrap gap-4 text-[11px] text-slate-600 dark:text-slate-400">
              {alert.contactPhone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{alert.contactPhone}</span>
                </div>
              )}
              {alert.contactEmail && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{alert.contactEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps & Version Info */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Lifecycle Window & Attribution</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-slate-400 block uppercase font-bold">Effective From:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{formattedEff}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold">Expires At:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{formattedExp}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold">Last Updated:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{formattedUpdated}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold">Published At:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{formattedPublished}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>Updated by: <strong className="text-slate-700 dark:text-slate-300">{alert.updatedByName || alert.updatedByEmail || 'Staff'}</strong></span>
              <span className="font-mono font-bold">Version {alert.version}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
