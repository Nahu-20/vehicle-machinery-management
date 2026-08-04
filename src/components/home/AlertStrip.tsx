import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { mockAlerts } from '../../data/mockData';
import { AgriculturalAlert, AlertSeverity } from '../../types';
import {
  AlertTriangle,
  Info,
  ShieldAlert,
  MapPin,
  ChevronRight,
  X,
  Lock,
  Bell,
} from 'lucide-react';

export const AlertStrip: React.FC = () => {
  const { t } = useLanguage();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [showLockTooltip, setShowLockTooltip] = useState(false);

  // Find active alerts
  const activeAlerts = mockAlerts.filter(
    (a) => a.status === 'active' && !dismissedIds.includes(a.id)
  );

  // Order priority: critical > warning > advisory > info
  const priorityOrder: Record<AlertSeverity, number> = {
    critical: 1,
    warning: 2,
    advisory: 3,
    info: 4,
  };

  const sortedActive = [...activeAlerts].sort(
    (a, b) => priorityOrder[a.severity] - priorityOrder[b.severity]
  );

  const topAlert = sortedActive[0];

  if (!topAlert) {
    return null;
  }

  const handleDismiss = (alert: AgriculturalAlert) => {
    if (alert.severity === 'critical' || alert.isDismissible === false) {
      setShowLockTooltip(true);
      setTimeout(() => setShowLockTooltip(false), 3000);
      return;
    }
    setDismissedIds((prev) => [...prev, alert.id]);
  };

  const getSeverityStyle = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          bannerBg: 'bg-red-900 text-white border-red-800',
          badgeBg: 'bg-red-800/90 text-red-100 border border-red-700',
          icon: <ShieldAlert className="h-4 w-4 text-red-300 shrink-0" aria-hidden="true" />,
          label: t('alert_severity_critical'),
          accentText: 'text-red-200',
          btnBg: 'bg-[#D7A928] hover:bg-amber-400 text-[#063D2A]',
          allBtnBg: 'bg-red-800/60 hover:bg-red-800 text-white border border-red-700',
        };
      case 'warning':
        return {
          bannerBg: 'bg-amber-900 text-amber-50 border-amber-800',
          badgeBg: 'bg-amber-800/90 text-amber-100 border border-amber-700',
          icon: <AlertTriangle className="h-4 w-4 text-amber-300 shrink-0" aria-hidden="true" />,
          label: t('alert_severity_warning'),
          accentText: 'text-amber-200',
          btnBg: 'bg-white hover:bg-amber-50 text-amber-950',
          allBtnBg: 'bg-amber-800/60 hover:bg-amber-800 text-white border border-amber-700',
        };
      case 'advisory':
        return {
          bannerBg: 'bg-[#063D2A] text-white border-emerald-900',
          badgeBg: 'bg-[#087A4B] text-emerald-100 border border-emerald-700',
          icon: <Info className="h-4 w-4 text-[#D7A928] shrink-0" aria-hidden="true" />,
          label: t('alert_severity_advisory'),
          accentText: 'text-emerald-200',
          btnBg: 'bg-[#D7A928] hover:bg-amber-400 text-[#063D2A]',
          allBtnBg: 'bg-emerald-900/60 hover:bg-emerald-900 text-white border border-emerald-700',
        };
      default:
        return {
          bannerBg: 'bg-blue-900 text-white border-blue-800',
          badgeBg: 'bg-blue-800/90 text-blue-100 border border-blue-700',
          icon: <Info className="h-4 w-4 text-blue-300 shrink-0" aria-hidden="true" />,
          label: t('alert_severity_info'),
          accentText: 'text-blue-200',
          btnBg: 'bg-white hover:bg-blue-50 text-blue-950',
          allBtnBg: 'bg-blue-800/60 hover:bg-blue-800 text-white border border-blue-700',
        };
    };
  };

  const style = getSeverityStyle(topAlert.severity);

  return (
    <div
      role="region"
      aria-label="Active High Priority Emergency Alert"
      className={`relative w-full border-b py-2.5 px-4 sm:px-6 lg:px-8 transition-all ${style.bannerBg}`}
    >
      <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left Info Group */}
        <div className="flex flex-wrap items-center gap-2.5 min-w-0 flex-1">
          {/* Severity Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shrink-0 ${style.badgeBg}`}
          >
            {style.icon}
            <span>{style.label}</span>
          </div>

          {/* Shortened Alert Title */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-bold tracking-wide truncate">
              {t(topAlert.titleKey)}
            </span>
          </div>

          {/* Affected Area Tag */}
          <div className={`hidden sm:flex items-center gap-1 text-xs font-semibold shrink-0 ${style.accentText}`}>
            <MapPin className="h-3.5 w-3.5 shrink-0 opacity-80" />
            <span className="truncate max-w-[200px] lg:max-w-[300px]">
              {topAlert.affectedArea}
            </span>
          </div>
        </div>

        {/* Right Actions & Dismissal */}
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-white/10">
          <div className="flex items-center gap-2">
            {/* View Alert Detail Button */}
            <Link
              to={`/alerts/${topAlert.slug}`}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black shadow-xs transition-all ${style.btnBg}`}
            >
              <span>{t('alert_view_alert')}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>

            {/* All Alerts Link */}
            <Link
              to="/alerts"
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${style.allBtnBg}`}
            >
              <Bell className="h-3.5 w-3.5" />
              <span>{t('alert_all_alerts')}</span>
            </Link>
          </div>

          {/* Dismissal Button or Lock Icon */}
          <div className="relative inline-block">
            {topAlert.severity === 'critical' || topAlert.isDismissible === false ? (
              <button
                type="button"
                onClick={() => handleDismiss(topAlert)}
                title={t('alert_banner_critical_lock')}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label={t('alert_banner_critical_lock')}
              >
                <Lock className="h-4 w-4 text-amber-300" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleDismiss(topAlert)}
                title={t('close')}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label={t('close')}
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Critical Alert Lock Tooltip */}
            {showLockTooltip && (
              <div className="absolute right-0 bottom-full mb-2 w-56 rounded-xl bg-gray-900 text-white p-2.5 text-[11px] font-semibold shadow-xl border border-gray-700 z-50 animate-in fade-in">
                🔒 {t('alert_banner_critical_lock')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
