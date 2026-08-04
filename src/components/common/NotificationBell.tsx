import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { mockAlerts } from '../../data/mockData';
import { AgriculturalAlert, AlertSeverity } from '../../types';
import {
  Bell,
  AlertTriangle,
  Info,
  ShieldAlert,
  ChevronRight,
  MapPin,
  Calendar,
  X,
  ExternalLink,
} from 'lucide-react';

export const NotificationBell: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter active alerts
  const activeAlerts = mockAlerts.filter((a) => a.status === 'active');
  const activeCount = activeAlerts.length;
  // Get 3 latest active alerts
  const latestAlerts = activeAlerts.slice(0, 3);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-800 border border-red-200">
            <ShieldAlert className="h-3 w-3 text-red-600" />
            <span>{t('alert_severity_critical')}</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 border border-amber-200">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            <span>{t('alert_severity_warning')}</span>
          </span>
        );
      case 'advisory':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
            <Info className="h-3 w-3 text-emerald-600" />
            <span>{t('alert_severity_advisory')}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800 border border-blue-200">
            <Info className="h-3 w-3 text-blue-600" />
            <span>{t('alert_severity_info')}</span>
          </span>
        );
    }
  };

  const handleAlertClick = (slug: string) => {
    setIsOpen(false);
    navigate(`/alerts/${slug}`);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`${t('alert_bell_title')} (${activeCount} ${t('alert_active_count')})`}
        className="relative flex items-center justify-center rounded-xl border border-[#DDE8E1] bg-white p-2.5 text-[#063D2A] hover:bg-[#EFF8F2] hover:border-[#087A4B] transition-all h-11 w-11 focus:outline-none focus:ring-2 focus:ring-[#087A4B]"
      >
        <Bell className="h-5 w-5 text-[#063D2A]" />
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-sm ring-2 ring-white animate-pulse">
            {activeCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="alert-bell-menu"
          className="fixed left-3 right-3 top-16 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:mt-2 w-auto sm:w-96 max-h-[82vh] sm:max-h-[520px] rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10 z-50 overflow-hidden flex flex-col animate-in fade-in duration-150 border border-emerald-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#DDE8E1] pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF8F2] text-[#087A4B]">
                <Bell className="h-4 w-4" />
              </div>
              <span className="text-sm font-black text-[#063D2A]">
                {t('alert_bell_title')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-extrabold text-red-700 border border-red-200">
                {activeCount} {t('alert_status_active')}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#087A4B]"
                aria-label={t('close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List of 3 Latest Alerts */}
          <div className="mt-3 space-y-2.5 overflow-y-auto flex-1 max-h-[300px] sm:max-h-[360px] pr-1">
            {latestAlerts.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-500">
                {t('alert_bell_empty')}
              </p>
            ) : (
              latestAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert.slug)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAlertClick(alert.slug);
                    }
                  }}
                  tabIndex={0}
                  role="menuitem"
                  className="group cursor-pointer rounded-xl border border-gray-100 bg-[#FAFAF7] p-3 transition-all hover:bg-white hover:border-[#087A4B] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#087A4B]"
                >
                  <div className="flex items-start justify-between gap-2">
                    {getSeverityBadge(alert.severity)}
                    <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {alert.date}
                    </span>
                  </div>

                  <h4 className="mt-1.5 text-xs font-bold text-[#14251D] group-hover:text-[#087A4B] line-clamp-2">
                    {t(alert.titleKey)}
                  </h4>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#637069]">
                    <span className="flex items-center gap-1 font-semibold truncate max-w-[200px]">
                      <MapPin className="h-3 w-3 shrink-0 text-[#087A4B]" />
                      <span className="truncate">{alert.affectedArea}</span>
                    </span>
                    <span className="flex items-center text-[10px] font-bold text-[#087A4B] group-hover:underline shrink-0">
                      {t('alert_view_alert')}
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Action */}
          <div className="mt-3 pt-3 border-t border-[#DDE8E1]">
            <Link
              to="/alerts"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#063D2A] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#087A4B] transition-colors"
            >
              <span>{t('alert_all_alerts')}</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#D7A928]" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
