import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAchievementBySlugForAdmin } from '../../../services/achievementService';
import { Achievement } from '../../../types/achievement';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { AchievementStatusBadge } from '../../../components/admin/achievements/AchievementStatusBadge';
import { ArrowLeft, Building2, Calendar, MapPin, TrendingUp, AlertCircle } from 'lucide-react';

export const AdminAchievementPreviewPage: React.FC = () => {
  const { achievementSlug } = useParams<{ achievementSlug: string }>();
  const { staffUser } = useAuth();
  const { getLocalizedText } = useLanguage();

  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!achievementSlug) return;
      setLoading(true);
      try {
        const item = await getAchievementBySlugForAdmin(achievementSlug, staffUser || undefined);
        if (isMounted) {
          if (!item) {
            setError('Achievement document not found or permission denied.');
          } else {
            setAchievement(item);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Error loading achievement preview.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [achievementSlug, staffUser]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
        <div className="flex items-center justify-between">
          <Link
            to="/admin/achievements"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium text-xs">
            Loading achievement preview...
          </div>
        ) : error || !achievement ? (
          <div className="p-8 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-center space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-red-600 dark:text-red-400" />
            <h2 className="font-bold text-red-900 dark:text-red-200 text-sm">{error || 'Record Not Found'}</h2>
            <p className="text-xs text-red-700 dark:text-red-300">
              The requested slug /{achievementSlug} could not be retrieved.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AchievementStatusBadge status={achievement.status} />
                <span className="text-xs font-mono text-slate-400">/{achievement.slug}</span>
              </div>
              <span className="text-xs text-slate-500">
                Internal Preview Mode
              </span>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {achievement.category}
              </span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {getLocalizedText(achievement.title)}
              </h1>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              {getLocalizedText(achievement.summary)}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs">
                <div className="text-slate-400 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Date
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {achievement.achievementDate || 'N/A'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs">
                <div className="text-slate-400 font-semibold flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Office
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {getLocalizedText(achievement.responsibleOffice) || 'N/A'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs">
                <div className="text-slate-400 font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Location
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {getLocalizedText(achievement.location) || 'Oromia'}
                </div>
              </div>
            </div>

            {Array.isArray(achievement.metrics) && achievement.metrics.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Key Metrics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {achievement.metrics.map((m, idx) => (
                    <div key={m.id || idx} className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                      <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                        {m.value} {getLocalizedText(m.unit)}
                      </div>
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {getLocalizedText(m.label)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
  );
};
