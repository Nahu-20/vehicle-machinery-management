import React from 'react';
import { AgriculturalAlert, toMillis } from '../../../types/agriculturalAlert';
import { useLanguage } from '../../../context/LanguageContext';
import { Radio, CalendarClock, Clock, FileEdit, Eye, EyeOff, Archive, Trash2 } from 'lucide-react';

export type OperationalActiveState =
  | 'active'
  | 'scheduled'
  | 'expired_natural'
  | 'draft'
  | 'review'
  | 'unpublished'
  | 'archived'
  | 'trashed';

export function getAlertOperationalState(alert: AgriculturalAlert, now: number = Date.now()): OperationalActiveState {
  if (alert.status === 'draft') return 'draft';
  if (alert.status === 'review') return 'review';
  if (alert.status === 'unpublished') return 'unpublished';
  if (alert.status === 'archived') return 'archived';
  if (alert.status === 'trashed') return 'trashed';
  if (alert.status === 'expired') return 'expired_natural';

  if (alert.status === 'published') {
    const effMs = toMillis(alert.effectiveFrom);
    const expMs = toMillis(alert.expiresAt);

    if (effMs !== null && effMs > now) {
      return 'scheduled';
    }
    if (expMs !== null && expMs <= now) {
      return 'expired_natural';
    }
    return 'active';
  }

  return 'draft';
}

interface AlertActiveStateBadgeProps {
  alert: AgriculturalAlert;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const LABELS: Record<OperationalActiveState, { om: string; am: string; en: string }> = {
  active: { om: 'Hojii Irra Jira', am: 'በስራ ላይ (ቀጥታ)', en: 'Active Now' },
  scheduled: { om: 'Karoorfame', am: 'የተያዘለት', en: 'Scheduled' },
  expired_natural: { om: 'Yeroon Darbe', am: 'ጊዜው ያለፈበት', en: 'Expired' },
  draft: { om: 'Wixinee', am: 'ረቂቅ', en: 'Draft' },
  review: { om: 'Gamaaggamaa', am: 'በግምገማ ላይ', en: 'In Review' },
  unpublished: { om: 'Maxxansi Hakaame', am: 'ያልታተመ', en: 'Unpublished' },
  archived: { om: 'Kuhamaa', am: 'የተቀመጠ', en: 'Archived' },
  trashed: { om: 'Gatamaa', am: 'በቆሻሻ መጣያ', en: 'Trashed' },
};

export const AlertActiveStateBadge: React.FC<AlertActiveStateBadgeProps> = ({
  alert,
  size = 'md',
  showIcon = true,
}) => {
  const { language } = useLanguage();
  const opState = getAlertOperationalState(alert);
  const label = LABELS[opState]?.[language] || LABELS[opState]?.en || opState;

  let styleClasses = '';
  let IconComponent = Radio;

  switch (opState) {
    case 'active':
      styleClasses = 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-extrabold';
      IconComponent = Radio;
      break;
    case 'scheduled':
      styleClasses = 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      IconComponent = CalendarClock;
      break;
    case 'expired_natural':
      styleClasses = 'bg-amber-50 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      IconComponent = Clock;
      break;
    case 'draft':
      styleClasses = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      IconComponent = FileEdit;
      break;
    case 'review':
      styleClasses = 'bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      IconComponent = Eye;
      break;
    case 'unpublished':
      styleClasses = 'bg-orange-50 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      IconComponent = EyeOff;
      break;
    case 'archived':
      styleClasses = 'bg-purple-50 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      IconComponent = Archive;
      break;
    case 'trashed':
      styleClasses = 'bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      IconComponent = Trash2;
      break;
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
      {showIcon && <IconComponent className={`${iconSizes} shrink-0 ${opState === 'active' ? 'animate-pulse' : ''}`} />}
      <span>{label}</span>
    </span>
  );
};
