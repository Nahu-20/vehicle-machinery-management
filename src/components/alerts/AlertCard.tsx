import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { AgriculturalAlert, AlertSeverity, AlertCategory } from '../../types';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronRight,
  Share2,
  PhoneCall,
  Sparkles,
  Layers,
  Check,
  Building2,
  ExternalLink,
} from 'lucide-react';

interface AlertCardProps {
  alert: AgriculturalAlert;
  onOpenModal: (alert: AgriculturalAlert) => void;
  index: number;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onOpenModal, index }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const getSeverityStyle = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          ribbon: 'bg-red-500',
          badgeBg: 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30',
          icon: ShieldAlert,
          iconColor: 'text-red-600 dark:text-red-400',
          cardBorder: 'hover:border-red-500/50',
          accentBg: 'bg-red-950/20 text-red-300',
        };
      case 'warning':
        return {
          ribbon: 'bg-amber-500',
          badgeBg: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30',
          icon: AlertTriangle,
          iconColor: 'text-amber-600 dark:text-amber-400',
          cardBorder: 'hover:border-amber-500/50',
          accentBg: 'bg-amber-950/20 text-amber-300',
        };
      case 'advisory':
        return {
          ribbon: 'bg-[#075B36] dark:bg-[#A3E635]',
          badgeBg: 'bg-emerald-500/10 text-[#075B36] dark:text-[#A3E635] border border-emerald-500/30',
          icon: Info,
          iconColor: 'text-[#075B36] dark:text-[#A3E635]',
          cardBorder: 'hover:border-[#075B36]/50 dark:hover:border-[#A3E635]/50',
          accentBg: 'bg-emerald-950/20 text-emerald-300',
        };
      default:
        return {
          ribbon: 'bg-blue-500',
          badgeBg: 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/30',
          icon: Info,
          iconColor: 'text-blue-600 dark:text-blue-400',
          cardBorder: 'hover:border-blue-500/50',
          accentBg: 'bg-blue-950/20 text-blue-300',
        };
    }
  };

  const style = getSeverityStyle(alert.severity);
  const Icon = style.icon;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/alerts/${alert.slug}`;
    if (navigator.share) {
      navigator.share({
        title: t(alert.titleKey) || alert.slug,
        text: t(alert.summaryKey),
        url: shareUrl,
      }).catch(() => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isCritical = alert.severity === 'critical';

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-3xl bg-white dark:bg-[#111613] p-6 sm:p-7 border border-[#E2EFE0] dark:border-white/10 ${style.cardBorder} transition-all duration-300 shadow-xs hover:shadow-xl space-y-6 overflow-hidden`}
    >
      {/* Top Left Severity Indicator Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${style.ribbon}`} />

      <div className="space-y-4 pt-1">
        {/* Header Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDF4EC] dark:border-white/5 pb-3">
          <div className="flex items-center gap-2">
            {/* Severity Pill */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${style.badgeBg}`}>
              {isCritical && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
              )}
              <Icon className="h-3.5 w-3.5" />
              <span>{t(`alert_severity_${alert.severity}`) || alert.severity}</span>
            </span>

            {/* Category Pill */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0F7EE] dark:bg-white/5 text-[#075B36] dark:text-[#A3E635] text-[11px] font-bold capitalize">
              <Layers className="h-3 w-3" />
              <span>{t(`alert_category_${alert.category}`) || alert.category}</span>
            </span>
          </div>

          {/* Expiration Status */}
          <div className="text-[11px] font-semibold text-[#56635B] dark:text-white/60">
            {alert.status === 'expired' ? (
              <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60 font-bold">
                Expired
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-emerald-600 dark:text-[#A3E635]" />
                <span>Valid thru: {alert.expirationDate}</span>
              </span>
            )}
          </div>
        </div>

        {/* Alert Title & Summary */}
        <div className="space-y-2">
          <h3
            onClick={() => onOpenModal(alert)}
            className="text-lg sm:text-xl font-black text-[#0A1912] dark:text-white group-hover:text-[#075B36] dark:group-hover:text-[#A3E635] transition-colors leading-snug cursor-pointer"
          >
            {t(alert.titleKey)}
          </h3>
          <p className="text-xs sm:text-sm text-[#56635B] dark:text-white/70 leading-relaxed font-normal line-clamp-3">
            {t(alert.summaryKey)}
          </p>
        </div>

        {/* Recommended Action Snippet (First 48 Hours) */}
        {alert.recommendedActions && alert.recommendedActions.length > 0 && (
          <div className="rounded-2xl bg-[#F0F7EE] dark:bg-white/5 p-3.5 border border-[#D5E8D0] dark:border-white/10 space-y-1.5">
            <span className="text-xs font-black text-[#075B36] dark:text-[#A3E635] flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Immediate Action Protocol:</span>
            </span>
            <p className="text-xs text-[#3E4D43] dark:text-white/80 line-clamp-2 italic font-normal">
              "{alert.recommendedActions[0]}"
            </p>
          </div>
        )}

        {/* Affected Zones & Woredas */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A1912] dark:text-white">
            <MapPin className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635]" />
            <span>Target Corridor: {alert.affectedArea}</span>
          </div>

          {alert.affectedZones && alert.affectedZones.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {alert.affectedZones.map((zone) => (
                <span
                  key={zone}
                  className="px-2 py-0.5 rounded-lg bg-white dark:bg-white/10 border border-[#D5E8D0] dark:border-white/10 text-[11px] font-bold text-[#075B36] dark:text-emerald-200"
                >
                  {zone}
                </span>
              ))}
              {alert.affectedWoredas && alert.affectedWoredas.length > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-[11px] font-medium text-gray-700 dark:text-white/60">
                  +{alert.affectedWoredas.length} Woredas
                </span>
              )}
            </div>
          )}
        </div>

        {/* Responsible Office */}
        <div className="text-[11px] text-[#56635B] dark:text-white/60 flex items-center gap-1.5 pt-1">
          <Building2 className="h-3 w-3 text-[#075B36] dark:text-[#A3E635]" />
          <span className="truncate">{alert.responsibleOffice}</span>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="pt-4 border-t border-[#EDF4EC] dark:border-white/10 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-[#56635B] dark:text-white/60">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <span>Issued: {alert.date}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Share button */}
          <button
            onClick={handleShare}
            title="Share Advisory"
            className="p-2 rounded-xl bg-[#F0F7EE] dark:bg-white/10 hover:bg-[#E2EFE0] dark:hover:bg-white/20 text-[#075B36] dark:text-[#A3E635] transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
          </button>

          {/* View Modal Trigger */}
          <button
            onClick={() => onOpenModal(alert)}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#075B36] hover:bg-[#054629] text-white font-black text-xs transition-all shadow-xs"
          >
            <span>Dossier</span>
            <ChevronRight className="h-3.5 w-3.5 text-[#A3E635]" />
          </button>
        </div>
      </div>
    </div>
  );
};
