import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { mockAlerts } from '../data/mockData';
import { AgriculturalAlert, AlertSeverity } from '../types';
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  Info,
  Calendar,
  MapPin,
  Printer,
  Share2,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Check,
  Bell,
  Layers,
  PhoneCall,
  Download,
} from 'lucide-react';

export const AlertDetailPage: React.FC = () => {
  const { alertSlug } = useParams<{ alertSlug: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);

  // Find alert by slug or id fallback
  const alert = mockAlerts.find(
    (a) => a.slug === alertSlug || a.id === alertSlug
  );

  if (!alert) {
    return (
      <div className="bg-[#F6F7F3] dark:bg-[#0A110D] min-h-[70vh] flex items-center justify-center p-6 text-[#111310] dark:text-white">
        <div className="max-w-md w-full rounded-3xl bg-white dark:bg-[#111613] p-8 text-center shadow-lg border border-[#E2EFE0] dark:border-white/10 space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-white/10 text-red-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-[#0A1912] dark:text-white">Advisory Notice Not Found</h2>
          <p className="text-xs text-[#56635B] dark:text-white/60">
            The requested early warning advisory broadcast could not be located or has expired.
          </p>
          <button
            onClick={() => navigate('/alerts')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#075B36] hover:bg-[#054629] px-5 py-2.5 text-xs font-black text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Alerts Portal</span>
          </button>
        </div>
      </div>
    );
  }

  // Related active alerts
  const relatedAlerts = mockAlerts
    .filter((a) => a.id !== alert.id && a.status === 'active')
    .slice(0, 3);

  const handleShare = async () => {
    const shareData = {
      title: t(alert.titleKey) || alert.slug,
      text: t(alert.summaryKey),
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 text-red-700 dark:text-red-400 px-4 py-1.5 text-xs font-black border border-red-500/30 shadow-xs">
            <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
            <span>{t('alert_severity_critical')}</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 px-4 py-1.5 text-xs font-black border border-amber-500/30 shadow-xs">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{t('alert_severity_warning')}</span>
          </span>
        );
      case 'advisory':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 text-[#075B36] dark:text-[#A3E635] px-4 py-1.5 text-xs font-black border border-emerald-500/30 shadow-xs">
            <Info className="h-4 w-4 text-[#075B36] dark:text-[#A3E635] shrink-0" />
            <span>{t('alert_severity_advisory')}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 text-blue-800 dark:text-blue-300 px-4 py-1.5 text-xs font-black border border-blue-500/30 shadow-xs">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <span>{t('alert_severity_info')}</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-[#F6F7F3] dark:bg-[#0A110D] min-h-screen py-8 text-[#111310] dark:text-white transition-colors duration-200 print:bg-white print:py-0 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Top Action Bar & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <Link
            to="/alerts"
            className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-[#111613] border border-[#E2EFE0] dark:border-white/10 px-4 py-2 text-xs font-bold text-[#075B36] dark:text-[#A3E635] hover:bg-[#F0F7EE] dark:hover:bg-white/15 transition-all shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Alerts</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-white dark:bg-[#111613] px-3.5 py-2 text-xs font-bold text-[#0A1912] dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 shadow-2xs"
            >
              <Printer className="h-4 w-4 text-[#075B36] dark:text-[#A3E635]" />
              <span>Print Bulletin</span>
            </button>

            <button
              onClick={handleShare}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#075B36] hover:bg-[#054629] px-3.5 py-2 text-xs font-black text-white shadow-2xs transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-[#A3E635]" /> : <Share2 className="h-4 w-4 text-[#A3E635]" />}
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>

            <a
              href="tel:8888"
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-3.5 py-2 text-xs font-black text-white shadow-2xs transition-colors"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Dial 8888</span>
            </a>
          </div>
        </div>

        {/* Main Alert Card */}
        <div className="rounded-3xl bg-white dark:bg-[#111613] p-6 sm:p-10 shadow-sm border border-[#E2EFE0] dark:border-white/10 space-y-8 print:shadow-none print:border-none print:p-0">
          
          {/* Header Row */}
          <div className="space-y-4 border-b border-[#EDF4EC] dark:border-white/10 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {getSeverityBadge(alert.severity)}
                <span className="rounded-full bg-[#F0F7EE] dark:bg-white/10 px-3 py-1 text-xs font-extrabold text-[#075B36] dark:text-[#A3E635] border border-[#D5E8D0] dark:border-white/10 capitalize">
                  {alert.category}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                {alert.status === 'active' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-white/10 px-3 py-1 text-[#075B36] dark:text-[#A3E635] border border-emerald-200 dark:border-white/10">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {t('alert_status_active')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-white/10 px-3 py-1 text-gray-600 dark:text-white/60 border border-gray-200">
                    {t('alert_status_expired')}
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0A1912] dark:text-white leading-tight tracking-tight">
              {t(alert.titleKey)}
            </h1>

            {/* Metadata bar */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#56635B] dark:text-white/70 pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#075B36] dark:text-[#A3E635]" />
                <strong>{t('alert_issued_date')}</strong> {alert.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <strong>{t('alert_expiration_date')}</strong> {alert.expirationDate}
              </span>
              {alert.updatedDate && (
                <>
                  <span>•</span>
                  <span>{t('alert_updated_date')} {alert.updatedDate}</span>
                </>
              )}
            </div>
          </div>

          {/* Affected Areas Section */}
          <div className="rounded-2xl bg-[#F0F7EE] dark:bg-white/5 p-5 sm:p-6 border border-[#D5E8D0] dark:border-white/10 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#075B36] dark:text-[#A3E635] flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#075B36] dark:text-[#A3E635]" />
              <span>{t('alert_affected_area')} {alert.affectedArea}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-[#0A1912] dark:text-white block mb-1">Affected Zones:</span>
                <div className="flex flex-wrap gap-1.5">
                  {alert.affectedZones.map((z) => (
                    <span
                      key={z}
                      className="rounded-lg bg-white dark:bg-white/10 px-2.5 py-1 font-bold text-[#075B36] dark:text-[#A3E635] border border-[#D5E8D0] dark:border-white/10"
                    >
                      {z}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-[#0A1912] dark:text-white block mb-1">Affected Woredas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {alert.affectedWoredas.map((w) => (
                    <span
                      key={w}
                      className="rounded-lg bg-emerald-100/60 dark:bg-white/10 px-2.5 py-1 font-semibold text-emerald-900 dark:text-white"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Full Description / Technical Analysis */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#0A1912] dark:text-white border-b border-[#EDF4EC] dark:border-white/10 pb-2">
              Official Early Warning Broadcast & Technical Analysis
            </h3>
            <p className="text-sm sm:text-base text-[#3E4D43] dark:text-white/90 leading-relaxed font-normal whitespace-pre-line">
              {t(alert.fullDescriptionKey || alert.summaryKey)}
            </p>
          </div>

          {/* Recommended Actions Checklist */}
          {alert.recommendedActions && alert.recommendedActions.length > 0 && (
            <div className="rounded-2xl bg-amber-500/10 p-6 border border-amber-500/30 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#075B36] dark:text-[#A3E635]" />
                <span>Mandated First 48-Hour Protocol for Farmers & DAs</span>
              </h3>

              <div className="space-y-2.5">
                {alert.recommendedActions.map((action, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 bg-white dark:bg-[#181F1B] p-3.5 rounded-xl border border-amber-200 dark:border-white/10 text-xs sm:text-sm text-[#0A1912] dark:text-white font-medium"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#075B36] text-[#A3E635] text-[11px] font-black mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Responsible Office Card */}
          <div className="rounded-2xl bg-[#F9FCF8] dark:bg-white/5 p-5 border border-[#EDF4EC] dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#075B36] text-[#A3E635]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#56635B] dark:text-white/60 block">
                  {t('alert_responsible_office')}
                </span>
                <strong className="text-sm font-bold text-[#0A1912] dark:text-white block">
                  {alert.responsibleOffice}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="tel:8888"
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-black transition-all shadow-2xs"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Call Hotline 8888</span>
              </a>

              <Link
                to="/about#offices"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D5E8D0] dark:border-white/10 bg-white dark:bg-white/10 px-3.5 py-2 text-xs font-bold text-[#075B36] dark:text-[#A3E635] hover:bg-[#F0F7EE] transition-all"
              >
                <span>Woreda Desks</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Related Active Bulletins */}
        {relatedAlerts.length > 0 && (
          <div className="space-y-4 pt-4 print:hidden">
            <h3 className="text-base font-extrabold text-[#0A1912] dark:text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#075B36] dark:text-[#A3E635]" />
              <span>Related Active Early Warning Broadcasts</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedAlerts.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/alerts/${rel.slug}`}
                  className="group rounded-2xl bg-white dark:bg-[#111613] p-5 shadow-2xs border border-[#E2EFE0] dark:border-white/10 hover:border-[#075B36] dark:hover:border-[#A3E635] transition-all space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <span className="inline-block rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-400 capitalize">
                      {rel.severity}
                    </span>
                    <h4 className="text-xs font-bold text-[#0A1912] dark:text-white group-hover:text-[#075B36] dark:group-hover:text-[#A3E635] line-clamp-2">
                      {t(rel.titleKey)}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#56635B] dark:text-white/60 pt-2 border-t border-[#EDF4EC] dark:border-white/10">
                    <span className="truncate max-w-[120px]">{rel.affectedArea}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635]" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
