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
      <div className="bg-[#FAF9F5] min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-white p-8 text-center shadow-lg border border-[#DDE8E1] space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-[#14251D]">Alert Not Found</h2>
          <p className="text-xs text-[#637069]">
            The requested agricultural alert broadcast could not be located or has expired.
          </p>
          <button
            onClick={() => navigate('/alerts')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#063D2A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#087A4B]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('alert_back_btn')}</span>
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
      title: t(alert.titleKey),
      text: t(alert.summaryKey),
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-xs font-black text-red-900 border border-red-300 shadow-xs">
            <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
            <span>{t('alert_severity_critical')}</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-black text-amber-950 border border-amber-300 shadow-xs">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{t('alert_severity_warning')}</span>
          </span>
        );
      case 'advisory':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-black text-[#087A4B] border border-emerald-300 shadow-xs">
            <Info className="h-4 w-4 text-[#087A4B] shrink-0" />
            <span>{t('alert_severity_advisory')}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-black text-blue-950 border border-blue-300 shadow-xs">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <span>{t('alert_severity_info')}</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-8 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <Link
            to="/alerts"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#DDE8E1] px-4 py-2 text-xs font-bold text-[#063D2A] hover:bg-[#EFF8F2] hover:border-[#087A4B] transition-all shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('alert_back_btn')}</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDE8E1] bg-white px-3.5 py-2 text-xs font-bold text-[#14251D] hover:bg-gray-50 shadow-xs"
            >
              <Printer className="h-4 w-4 text-[#087A4B]" />
              <span>{t('alert_print_btn')}</span>
            </button>

            <button
              onClick={handleShare}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#063D2A] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#087A4B] shadow-xs transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4 text-[#D7A928]" />}
              <span>{copied ? 'Copied!' : t('alert_share_btn')}</span>
            </button>
          </div>
        </div>

        {/* Toast Alert Notification */}
        {copied && (
          <div className="rounded-xl bg-emerald-900 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-md animate-in fade-in">
            <span>✓ {t('alert_copy_success')}</span>
            <span className="text-emerald-300 text-[10px]">Copied to Clipboard</span>
          </div>
        )}

        {/* Main Alert Card */}
        <div className="rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-[#DDE8E1] space-y-8 print:shadow-none print:border-none print:p-0">
          
          {/* Header Row */}
          <div className="space-y-4 border-b border-[#DDE8E1] pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {getSeverityBadge(alert.severity)}
                <span className="rounded-full bg-[#EFF8F2] px-3 py-1 text-xs font-extrabold text-[#087A4B] border border-[#DDE8E1] capitalize">
                  {alert.category}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                {alert.status === 'active' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 border border-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {t('alert_status_active')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-gray-600 border border-gray-200">
                    {t('alert_status_expired')}
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-[#14251D] leading-tight tracking-tight">
              {t(alert.titleKey)}
            </h1>

            {/* Metadata bar */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#637069] pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#087A4B]" />
                <strong>{t('alert_issued_date')}</strong> {alert.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-600" />
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
          <div className="rounded-2xl bg-[#EFF8F2] p-5 border border-[#DDE8E1] space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#063D2A] flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#087A4B]" />
              <span>{t('alert_affected_area')} {alert.affectedArea}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-[#14251D] block mb-1">Affected Zones:</span>
                <div className="flex flex-wrap gap-1.5">
                  {alert.affectedZones.map((z) => (
                    <span
                      key={z}
                      className="rounded-lg bg-white px-2.5 py-1 font-bold text-[#063D2A] border border-[#DDE8E1]"
                    >
                      {z}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-[#14251D] block mb-1">Affected Woredas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {alert.affectedWoredas.map((w) => (
                    <span
                      key={w}
                      className="rounded-lg bg-emerald-100/60 px-2.5 py-1 font-semibold text-emerald-900 border border-emerald-200"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Full Description */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#14251D] border-b border-gray-100 pb-2">
              Broadcast Summary & Analysis
            </h3>
            <p className="text-sm sm:text-base text-[#14251D]/90 leading-relaxed font-normal whitespace-pre-line">
              {t(alert.fullDescriptionKey || alert.summaryKey)}
            </p>
          </div>

          {/* Recommended Actions Checklist */}
          {alert.recommendedActions && alert.recommendedActions.length > 0 && (
            <div className="rounded-2xl bg-amber-50/70 p-6 border border-amber-200/80 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-950 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#087A4B]" />
                <span>{t('alert_recommended_actions')}</span>
              </h3>

              <ul className="space-y-3">
                {alert.recommendedActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-amber-950 font-medium">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#087A4B] text-white text-[11px] font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Responsible Office Card */}
          <div className="rounded-2xl bg-[#FAFAF7] p-5 border border-[#DDE8E1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#063D2A] text-[#D7A928]">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#637069] block">
                  {t('alert_responsible_office')}
                </span>
                <strong className="text-sm font-bold text-[#14251D] block">
                  {alert.responsibleOffice}
                </strong>
              </div>
            </div>

            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDE8E1] bg-white px-3.5 py-2 text-xs font-bold text-[#063D2A] hover:bg-[#EFF8F2] hover:border-[#087A4B] transition-all shrink-0"
            >
              <span>Contact Office</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Prototype Demonstration Disclaimer Banner */}
          <div className="rounded-2xl bg-gray-50 p-4 text-xs text-[#637069] border border-gray-200 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-[#D7A928] shrink-0" />
            <div>
              <strong className="text-gray-800 block">Demonstration Content Disclaimer</strong>
              <span>
                {t('alert_demo_notice')}. For real-time emergencies, contact official district extension lines or call <strong>8844</strong>.
              </span>
            </div>
          </div>
        </div>

        {/* Related Alerts Section */}
        {relatedAlerts.length > 0 && (
          <div className="space-y-4 pt-4 print:hidden">
            <h3 className="text-base font-extrabold text-[#063D2A] flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#087A4B]" />
              <span>{t('alert_related_title')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedAlerts.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/alerts/${rel.slug}`}
                  className="group rounded-2xl bg-white p-4 shadow-xs border border-[#DDE8E1] hover:border-[#087A4B] transition-all space-y-2"
                >
                  <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 capitalize">
                    {rel.severity}
                  </span>
                  <h4 className="text-xs font-bold text-[#14251D] group-hover:text-[#087A4B] line-clamp-2">
                    {t(rel.titleKey)}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-[#637069] pt-2 border-t border-gray-100">
                    <span className="truncate max-w-[120px]">{rel.affectedArea}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-[#087A4B]" />
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
