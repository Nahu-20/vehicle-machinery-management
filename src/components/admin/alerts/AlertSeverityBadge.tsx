import React from 'react';
import { AlertSeverity } from '../../../types/agriculturalAlert';
import { useLanguage } from '../../../context/LanguageContext';
import { Info, AlertTriangle, ShieldAlert, Bell } from 'lucide-react';

interface AlertSeverityBadgeProps {
  severity: AlertSeverity;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const LABELS: Record<AlertSeverity, { om: string; am: string; en: string }> = {
  info: { om: 'Odeeffannoo', am: 'መረጃ', en: 'Info' },
  advisory: { om: 'Gorsa', am: 'ምክር', en: 'Advisory' },
  warning: { om: 'Akeekkachiisa', am: 'ማስጠንቀቂያ', en: 'Warning' },
  critical: { om: 'Balaalee / Bayyee Cimaa', am: 'አስቸኳይ / ከፍተኛ', en: 'Critical' },
};

export const AlertSeverityBadge: React.FC<AlertSeverityBadgeProps> = ({
  severity,
  size = 'md',
  showIcon = true,
}) => {
  const { language } = useLanguage();
  const label = LABELS[severity]?.[language] || LABELS[severity]?.en || severity;

  let styleClasses = '';
  let IconComponent = Info;

  switch (severity) {
    case 'info':
      styleClasses = 'bg-sky-50 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      IconComponent = Info;
      break;
    case 'advisory':
      styleClasses = 'bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      IconComponent = Bell;
      break;
    case 'warning':
      styleClasses = 'bg-orange-50 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      IconComponent = AlertTriangle;
      break;
    case 'critical':
      styleClasses = 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700 font-extrabold animate-pulse';
      IconComponent = ShieldAlert;
      break;
    default:
      styleClasses = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
      IconComponent = Info;
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-xs'
      : 'px-2.5 py-1 text-[11px]';

  const iconSizes = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase rounded-full border ${styleClasses} ${sizeClasses} whitespace-nowrap`}
    >
      {showIcon && <IconComponent className={`${iconSizes} shrink-0`} />}
      <span>{label}</span>
    </span>
  );
};
