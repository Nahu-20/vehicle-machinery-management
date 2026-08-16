import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { AgriculturalAlert, AlertSeverity } from '../../types';
import {
  ShieldAlert,
  AlertTriangle,
  ChevronRight,
  Radio,
  Volume2,
  ChevronLeft,
  Pause,
  Play,
  MapPin,
  Clock,
} from 'lucide-react';

interface AlertsEmergencyTickerProps {
  alerts: AgriculturalAlert[];
  onOpenAlertModal?: (alert: AgriculturalAlert) => void;
}

export const AlertsEmergencyTicker: React.FC<AlertsEmergencyTickerProps> = ({
  alerts,
  onOpenAlertModal,
}) => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Filter for high-priority alerts (critical & warning)
  const priorityAlerts = alerts.filter(
    (a) => a.status === 'active' && (a.severity === 'critical' || a.severity === 'warning')
  );

  const activeList = priorityAlerts.length > 0 ? priorityAlerts : alerts.filter((a) => a.status === 'active');

  useEffect(() => {
    if (!isPlaying || activeList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPlaying, activeList.length]);

  if (activeList.length === 0) return null;

  const currentAlert = activeList[currentIndex] || activeList[0];
  const isCritical = currentAlert.severity === 'critical';

  return (
    <div
      id="emergency-broadcast-ticker"
      className="w-full bg-[#0E1712] border-y border-[#1E2E25] text-white"
    >
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          {/* Left badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                isCritical
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isCritical ? 'bg-red-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isCritical ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                />
              </span>
              <Radio className="h-3 w-3" />
              <span>
                {isCritical ? 'CRITICAL BROADCAST' : 'EARLY WARNING'}
              </span>
            </div>

            <span className="hidden md:inline-block text-white/40">|</span>
            <span className="hidden md:flex items-center gap-1 text-white/70 font-medium">
              <MapPin className="h-3 w-3 text-[#A3E635]" />
              <span>{currentAlert.affectedArea}</span>
            </span>
          </div>

          {/* Center Alert Title & Summary */}
          <div className="flex-1 min-w-0 pr-2">
            <button
              onClick={() => onOpenAlertModal?.(currentAlert)}
              className="text-left group flex items-baseline gap-2 w-full truncate"
            >
              <span className="font-extrabold text-white group-hover:text-[#A3E635] transition-colors truncate">
                {t(currentAlert.titleKey) || currentAlert.slug}
              </span>
              <span className="hidden lg:inline text-white/60 truncate font-normal text-[11px]">
                — {t(currentAlert.summaryKey)}
              </span>
            </button>
          </div>

          {/* Right Controls & Link */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5 border border-white/10">
              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev - 1 + activeList.length) % activeList.length)
                }
                title="Previous advisory"
                className="p-1 hover:bg-white/20 rounded text-white/80 transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? 'Pause ticker' : 'Resume ticker'}
                className="p-1 hover:bg-white/20 rounded text-white/80 transition-colors"
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % activeList.length)}
                title="Next advisory"
                className="p-1 hover:bg-white/20 rounded text-white/80 transition-colors"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <button
              onClick={() => onOpenAlertModal?.(currentAlert)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#A3E635] text-[#0A1912] hover:bg-[#92D022] font-black text-[11px] transition-colors shadow-xs"
            >
              <span>View Dossier</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
