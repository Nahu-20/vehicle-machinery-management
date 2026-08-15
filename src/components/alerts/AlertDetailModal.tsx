import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { AgriculturalAlert, AlertSeverity } from '../../types';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  MapPin,
  Building2,
  CheckCircle2,
  PhoneCall,
  Printer,
  Share2,
  Check,
  Download,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface AlertDetailModalProps {
  alert: AgriculturalAlert | null;
  onClose: () => void;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({ alert, onClose }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!alert) return null;

  const isCritical = alert.severity === 'critical';

  const getSeverityStyle = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          badge: 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30',
          icon: ShieldAlert,
          headerGradient: 'from-red-950 via-red-900 to-[#0A110D]',
        };
      case 'warning':
        return {
          badge: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30',
          icon: AlertTriangle,
          headerGradient: 'from-amber-950 via-amber-900 to-[#0A110D]',
        };
      case 'advisory':
        return {
          badge: 'bg-emerald-500/15 text-[#075B36] dark:text-[#A3E635] border border-emerald-500/30',
          icon: Info,
          headerGradient: 'from-emerald-950 via-[#075B36] to-[#0A110D]',
        };
      default:
        return {
          badge: 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30',
          icon: Info,
          headerGradient: 'from-blue-950 via-blue-900 to-[#0A110D]',
        };
    }
  };

  const style = getSeverityStyle(alert.severity);
  const Icon = style.icon;

  const handleShare = () => {
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-3xl bg-white dark:bg-[#111613] rounded-3xl shadow-2xl border border-[#E2EFE0] dark:border-white/15 overflow-hidden my-6 flex flex-col max-h-[90vh]"
        >
          {/* Header Banner */}
          <div className={`relative bg-gradient-to-r ${style.headerGradient} text-white p-6 sm:p-8 border-b border-white/10 shrink-0`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-3 pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${style.badge}`}>
                  <Icon className="h-3.5 w-3.5" />
                  <span>{t(`alert_severity_${alert.severity}`) || alert.severity}</span>
                </span>

                <span className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold capitalize">
                  {alert.category}
                </span>

                {alert.status === 'active' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-[#A3E635] text-xs font-black border border-emerald-500/30">
                    <span className="h-2 w-2 rounded-full bg-[#A3E635] animate-ping" />
                    Active Bulletin
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-bold">
                    Resolved / Expired
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                {t(alert.titleKey)}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-100/80 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#A3E635]" />
                  <span>Issued: {alert.date}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[#A3E635]" />
                  <span>Expiration: {alert.expirationDate}</span>
                </span>
                {alert.updatedDate && (
                  <>
                    <span>•</span>
                    <span>Updated: {alert.updatedDate}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Modal Body */}
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 text-[#111310] dark:text-white">
            {/* Narrative Full Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#56635B] dark:text-white/60">
                Official Advisory Narrative
              </h3>
              <p className="text-sm sm:text-base text-[#3E4D43] dark:text-white/90 leading-relaxed font-normal">
                {alert.fullDescriptionKey ? t(alert.fullDescriptionKey) : t(alert.summaryKey)}
              </p>
            </div>

            {/* Recommended Action Protocol Checklist */}
            {alert.recommendedActions && alert.recommendedActions.length > 0 && (
              <div className="rounded-2xl bg-[#F0F7EE] dark:bg-white/5 p-5 border border-[#D5E8D0] dark:border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-[#075B36] dark:text-[#A3E635] uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Mandated Farmer & DA Action Protocol</span>
                </div>

                <div className="space-y-2">
                  {alert.recommendedActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 bg-white dark:bg-[#181F1B] p-3 rounded-xl border border-[#E2EFE0] dark:border-white/10 text-xs sm:text-sm text-[#0A1912] dark:text-white font-medium"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#075B36] text-[#A3E635] font-black text-[11px]">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Affected Geography Matrix */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#56635B] dark:text-white/60 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#075B36] dark:text-[#A3E635]" />
                <span>Impacted Geography ({alert.affectedArea})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#F9FCF8] dark:bg-white/5 p-4 rounded-2xl border border-[#EDF4EC] dark:border-white/10 space-y-2">
                  <span className="font-extrabold text-[#0A1912] dark:text-white block">
                    Affected Administrative Zones:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {alert.affectedZones.map((z) => (
                      <span
                        key={z}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 border border-[#D5E8D0] dark:border-white/10 font-bold text-[#075B36] dark:text-[#A3E635]"
                      >
                        {z}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-[#F9FCF8] dark:bg-white/5 p-4 rounded-2xl border border-[#EDF4EC] dark:border-white/10 space-y-2">
                  <span className="font-extrabold text-[#0A1912] dark:text-white block">
                    Priority High-Risk Woredas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {alert.affectedWoredas.map((w) => (
                      <span
                        key={w}
                        className="px-2.5 py-1 rounded-lg bg-emerald-100/70 dark:bg-white/10 text-emerald-950 dark:text-white font-semibold"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Responsible Office Box */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#181F1B] border border-[#E2EFE0] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#56635B] dark:text-white/60">
                  Responsible Directorate / Authority
                </span>
                <p className="text-xs sm:text-sm font-bold text-[#0A1912] dark:text-white flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-[#075B36] dark:text-[#A3E635]" />
                  <span>{alert.responsibleOffice}</span>
                </p>
              </div>

              <a
                href="tel:8888"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shrink-0 transition-all shadow-sm"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Call Hotline 8888</span>
              </a>
            </div>
          </div>

          {/* Modal Action Footer */}
          <div className="p-4 sm:p-6 bg-[#F9FCF8] dark:bg-white/5 border-t border-[#EDF4EC] dark:border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-[#F0F7EE] text-xs font-bold text-[#0A1912] dark:text-white border border-[#D5E8D0] dark:border-white/10 transition-colors"
              >
                <Printer className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635]" />
                <span>Print Dossier</span>
              </button>

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-[#F0F7EE] text-xs font-bold text-[#0A1912] dark:text-white border border-[#D5E8D0] dark:border-white/10 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5 text-[#075B36] dark:text-[#A3E635]" />}
                <span>{copied ? 'Link Copied!' : 'Share Broadcast'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/alerts/${alert.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#075B36] hover:bg-[#054629] text-white text-xs font-black transition-all shadow-xs"
              >
                <span>Open Full Page</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#A3E635]" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
