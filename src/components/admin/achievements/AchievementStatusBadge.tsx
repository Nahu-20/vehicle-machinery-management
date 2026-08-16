import React from 'react';
import { AchievementStatus } from '../../../types/achievement';
import { useLanguage } from '../../../context/LanguageContext';
import {
  FileText,
  Clock,
  CheckCircle2,
  EyeOff,
  Archive,
  Trash2,
} from 'lucide-react';

interface AchievementStatusBadgeProps {
  status: AchievementStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const AchievementStatusBadge: React.FC<AchievementStatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const { language } = useLanguage();

  const getStatusConfig = (st: AchievementStatus) => {
    switch (st) {
      case 'draft':
        return {
          label: {
            om: 'Wixinee (Draft)',
            am: 'ረቂቅ (Draft)',
            en: 'Draft',
          },
          bg: 'bg-slate-100 dark:bg-slate-800/80',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-300 dark:border-slate-700',
          icon: FileText,
        };
      case 'review':
        return {
          label: {
            om: 'Gamaggamarra (Review)',
            am: 'በግምገማ ላይ (Review)',
            en: 'In Review',
          },
          bg: 'bg-amber-50 dark:bg-amber-950/60',
          text: 'text-amber-800 dark:text-amber-300',
          border: 'border-amber-300 dark:border-amber-800',
          icon: Clock,
        };
      case 'published':
        return {
          label: {
            om: 'Maxxanfameera (Published)',
            am: 'የታተመ (Published)',
            en: 'Published',
          },
          bg: 'bg-emerald-50 dark:bg-emerald-950/60',
          text: 'text-emerald-800 dark:text-emerald-300',
          border: 'border-emerald-300 dark:border-emerald-800',
          icon: CheckCircle2,
        };
      case 'unpublished':
        return {
          label: {
            om: 'Dhaabbate (Unpublished)',
            am: 'ያልታተመ (Unpublished)',
            en: 'Unpublished',
          },
          bg: 'bg-blue-50 dark:bg-blue-950/60',
          text: 'text-blue-800 dark:text-blue-300',
          border: 'border-blue-300 dark:border-blue-800',
          icon: EyeOff,
        };
      case 'archived':
        return {
          label: {
            om: 'Kuusameera (Archived)',
            am: 'የተቀመጠ (Archived)',
            en: 'Archived',
          },
          bg: 'bg-purple-50 dark:bg-purple-950/60',
          text: 'text-purple-800 dark:text-purple-300',
          border: 'border-purple-300 dark:border-purple-800',
          icon: Archive,
        };
      case 'trashed':
        return {
          label: {
            om: 'Qulqullinaa (Trashed)',
            am: 'በቆሻሻ መጣያ (Trashed)',
            en: 'Trashed',
          },
          bg: 'bg-rose-50 dark:bg-rose-950/60',
          text: 'text-rose-800 dark:text-rose-300',
          border: 'border-rose-300 dark:border-rose-800',
          icon: Trash2,
        };
      default:
        return {
          label: { om: status, am: status, en: status },
          bg: 'bg-slate-100 dark:bg-slate-800',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-300 dark:border-slate-700',
          icon: FileText,
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  const labelText = config.label[language] || config.label.en;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs gap-1'
      : 'px-2.5 py-1 text-xs sm:text-sm gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
      title={`Status: ${status}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{labelText}</span>
    </span>
  );
};
