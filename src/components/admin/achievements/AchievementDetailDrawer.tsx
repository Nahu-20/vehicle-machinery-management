import React from 'react';
import { Link } from 'react-router-dom';
import { Achievement } from '../../../types/achievement';
import { AchievementStatusBadge } from './AchievementStatusBadge';
import { useLanguage } from '../../../context/LanguageContext';
import {
  X,
  ExternalLink,
  Edit,
  History,
  Calendar,
  Building2,
  MapPin,
  TrendingUp,
  Tag,
  User,
  Clock,
  Star,
  ShieldCheck,
  FileText,
  Trash2,
} from 'lucide-react';

interface AchievementDetailDrawerProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
  canEdit?: boolean;
}

export const AchievementDetailDrawer: React.FC<AchievementDetailDrawerProps> = ({
  achievement,
  isOpen,
  onClose,
  canEdit = false,
}) => {
  const { language, getLocalizedText } = useLanguage();

  if (!isOpen || !achievement) return null;

  const isPublished = achievement.status === 'published';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-start justify-between">
            <div className="space-y-2 pr-4">
              <div className="flex items-center gap-2 flex-wrap">
                <AchievementStatusBadge status={achievement.status} size="sm" />
                {achievement.featured && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    Featured
                  </span>
                )}
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  v{achievement.version || 1}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {getLocalizedText(achievement.title)}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                /{achievement.slug}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 dark:text-slate-300 text-xs">
            {/* Quick Actions Bar */}
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 flex-wrap">
              {isPublished && (
                <a
                  href={`/achievements/${achievement.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Public Page
                </a>
              )}

              {canEdit && achievement.status !== 'trashed' && (
                <Link
                  to={`/admin/achievements/${achievement.slug}/edit`}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Record
                </Link>
              )}

              <Link
                to={`/admin/history?module=achievements&targetId=${achievement.slug}`}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                Audit Logs
              </Link>
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-slate-400">
                Summary
              </h3>
              <p className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 leading-relaxed text-slate-800 dark:text-slate-200">
                {getLocalizedText(achievement.summary) || 'No summary provided.'}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px]">
                  <Tag className="w-3 h-3" /> Category
                </span>
                <p className="font-bold text-slate-900 dark:text-white capitalize">
                  {achievement.category}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px]">
                  <Calendar className="w-3 h-3" /> Achievement Date
                </span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {achievement.achievementDate || 'N/A'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px]">
                  <Building2 className="w-3 h-3" /> Responsible Office
                </span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {getLocalizedText(achievement.responsibleOffice) || 'N/A'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3 h-3" /> Location
                </span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {getLocalizedText(achievement.location) || 'Oromia Region'}
                </p>
              </div>
            </div>

            {/* Key Impact Metrics */}
            {Array.isArray(achievement.metrics) && achievement.metrics.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Key Impact Metrics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {achievement.metrics.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50"
                    >
                      <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                        {m.value}{' '}
                        <span className="text-xs font-normal text-emerald-800 dark:text-emerald-300">
                          {getLocalizedText(m.unit)}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {getLocalizedText(m.label)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Staff Attribution & History */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Administrative Attribution
              </h3>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> Created By:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {achievement.createdByName || achievement.createdByEmail || 'Staff'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Last Updated By:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {achievement.updatedByName || achievement.updatedByEmail || 'Staff'}
                  </span>
                </div>

                {achievement.publishedByName && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" /> Published By:
                    </span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {achievement.publishedByName}
                    </span>
                  </div>
                )}

                {achievement.trashedByName && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Trash2 className="w-3 h-3 text-rose-500" /> Trashed By:
                    </span>
                    <span className="font-semibold text-rose-700 dark:text-rose-400">
                      {achievement.trashedByName} {achievement.trashReason ? `(${achievement.trashReason})` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
