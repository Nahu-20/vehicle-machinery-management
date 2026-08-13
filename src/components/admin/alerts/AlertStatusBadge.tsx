import React from 'react';
import { AlertStatus } from '../../../types/agriculturalAlert';
import { useLanguage } from '../../../context/LanguageContext';
import {
  FileEdit,
  Eye,
  CheckCircle2,
  EyeOff,
  Clock,
  Archive,
  Trash2,
} from 'lucide-react';

interface AlertStatusBadgeProps {
  status: AlertStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const LABELS: Record<AlertStatus, { om: string; am: string; en: string }> = {
  draft: { om: 'Wixinee', am: 'ረቂቅ', en: 'Draft' },
  review: { om: 'Gamaaggamaa', am: 'በግምገማ ላይ', en: 'In Review' },
  published: { om: 'Maxxanfame', am: 'የታተመ', en: 'Published' },
  unpublished: { om: 'Maxxansi Hakaame', am: 'ያልታተመ', en: 'Unpublished' },
  expired: { om: 'Yeroon Darbe', am: 'ጊዜው ያለፈበት', en: 'Expired' },
  archived: { om: 'Kuhamaa', am: 'የተቀመጠ', en: 'Archived' },
  trashed: { om: 'Gatamaa', am: 'በቆሻሻ መጣያ', en: 'Trashed' },
};

export const AlertStatusBadge: React.FC<AlertStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const { language } = useLanguage();
  const label = LABELS[status]?.[language] || LABELS[status]?.en || status;

  let styleClasses = '';
  let IconComponent = FileEdit;

  switch (status) {
    case 'draft':
      styleClasses = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      IconComponent = FileEdit;
      break;
    case 'review':
      styleClasses = 'bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      IconComponent = Eye;
      break;
    case 'published':
      styleClasses = 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      IconComponent = CheckCircle2;
      break;
    case 'unpublished':
      styleClasses = 'bg-orange-50 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      IconComponent = EyeOff;
      break;
    case 'expired':
      styleClasses = 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
      IconComponent = Clock;
      break;
    case 'archived':
      styleClasses = 'bg-purple-50 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      IconComponent = Archive;
      break;
    case 'trashed':
      styleClasses = 'bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      IconComponent = Trash2;
      break;
    default:
      styleClasses = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
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
