import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAlertBySlugForAdmin } from '../../../services/agriculturalAlertService';
import { AgriculturalAlert, toMillis } from '../../../types/agriculturalAlert';
import { useLanguage } from '../../../context/LanguageContext';
import { AlertSeverityBadge } from '../../../components/admin/alerts/AlertSeverityBadge';
import { AlertStatusBadge } from '../../../components/admin/alerts/AlertStatusBadge';
import { AlertActiveStateBadge } from '../../../components/admin/alerts/AlertActiveStateBadge';
import { formatGeographicTarget, formatSubjectTarget } from '../../../components/admin/alerts/AlertsTargetFormatter';
import {
  ArrowLeft,
  Eye,
  Bell,
  MapPin,
  Tag,
  Clock,
  Building2,
  Phone,
  Mail,
  ListChecks,
  ShieldAlert,
} from 'lucide-react';

export const AdminAlertPreviewPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, getLocalizedText, setLanguage } = useLanguage();
  const [alert, setAlert] = useState<AgriculturalAlert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlert() {
      if (!slug) return;
      setLoading(true);
      try {
        const item = await getAlertBySlugForAdmin(slug);
        setAlert(item);
      } catch (err) {
        console.error('Error loading alert for preview:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAlert();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-xs text-slate-500">
        Loading alert preview...
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <p className="text-xs text-slate-500">Alert document not found for slug: /{slug}</p>
        <Link
          to="/admin/alerts"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs"
        >
          Back to Directory
        </Link>
      </div>
    );
  }

  const titleText = getLocalizedText(alert.title) || alert.slug;
  const summaryText = getLocalizedText(alert.summary) || '';
  const bodyText = getLocalizedText(alert.body) || '';
  const officeText = getLocalizedText(alert.sourceOffice) || 'Oromia Agricultural Bureau';

  const effMs = toMillis(alert.effectiveFrom);
  const expMs = toMillis(alert.expiresAt);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 pb-12">
      {/* Top Admin Preview Banner */}
      <div className="p-4 rounded-2xl bg-amber-500 text-slate-950 font-extrabold text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 shrink-0" />
          <span>ADMIN PREVIEW — AGRICULTURAL ALERT (PUBLIC SOURCE-MODE ISOLATED)</span>
        </div>
        <Link
          to="/admin/alerts"
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shrink-0"
        >
          Exit Preview
        </Link>
      </div>

      {/* Language Switcher Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-bold">
          <span>Preview Language:</span>
        </div>
        <div className="flex items-center gap-2">
          {(['om', 'am', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition-colors ${
                language === lang
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {lang === 'om' ? 'Afaan Oromoo' : lang === 'am' ? 'አማርኛ' : 'English'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Alert Preview Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
        {/* Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <AlertSeverityBadge severity={alert.severity} size="md" />
          <AlertStatusBadge status={alert.status} size="md" />
          <AlertActiveStateBadge alert={alert} size="md" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
            {titleText}
          </h1>
          <p className="text-xs font-mono text-slate-400">
            Slug: /{alert.slug} • Version v{alert.version}
          </p>
        </div>

        {/* Summary Callout */}
        {summaryText && (
          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-800/80 text-amber-950 dark:text-amber-100 text-sm font-semibold leading-relaxed">
            {summaryText}
          </div>
        )}

        {/* Full Body Content */}
        <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
          {bodyText}
        </div>

        {/* Recommended Actions */}
        {alert.recommendedActions && alert.recommendedActions.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase">
              <ListChecks className="w-4 h-4 text-emerald-600" />
              <span>Recommended Actions for Farmers & Extension Officers ({alert.recommendedActions.length})</span>
            </div>

            <div className="space-y-2.5">
              {alert.recommendedActions.map((action, idx) => (
                <div
                  key={action.id || idx}
                  className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/60 space-y-1 text-xs"
                >
                  <div className="font-extrabold text-slate-900 dark:text-white">
                    {idx + 1}. {getLocalizedText(action.title)}
                  </div>
                  {action.description && (
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {getLocalizedText(action.description)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Target Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>Geographic Target</span>
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {formatGeographicTarget(alert.geographicTarget, language)}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <Tag className="w-4 h-4 text-sky-500" />
              <span>Subject Target</span>
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {formatSubjectTarget(alert.subjectTarget, language)}
            </p>
          </div>
        </div>

        {/* Source Bureau & Contact Info */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Issuing Office & Public Contact</span>
          </div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{officeText}</p>

          <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 font-mono">
            {alert.contactPhone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{alert.contactPhone}</span>
              </span>
            )}
            {alert.contactEmail && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{alert.contactEmail}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
