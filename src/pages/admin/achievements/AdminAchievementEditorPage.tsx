import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAchievementBySlugForAdmin } from '../../../services/achievementService';
import { Achievement } from '../../../types/achievement';
import { AchievementEditorForm } from '../../../components/admin/achievements/AchievementEditorForm';
import { useStaffAuthorization } from '../../../hooks/useStaffAuthorization';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

interface AdminAchievementEditorPageProps {
  isEditMode?: boolean;
}

export const AdminAchievementEditorPage: React.FC<AdminAchievementEditorPageProps> = ({
  isEditMode = false,
}) => {
  const { achievementSlug } = useParams<{ achievementSlug: string }>();
  const navigate = useNavigate();
  const { staffUser } = useStaffAuthorization();

  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditMode) {
      setLoading(false);
      return;
    }

    async function loadAchievement() {
      if (!achievementSlug) {
        setError('Missing achievement slug parameter.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const fetched = await getAchievementBySlugForAdmin(achievementSlug, staffUser || undefined);
        if (fetched) {
          setAchievement(fetched);
          setError(null);
        } else {
          setError(`Achievement with slug "${achievementSlug}" was not found in Firestore.`);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch achievement record from Firestore.');
      } finally {
        setLoading(false);
      }
    }

    loadAchievement();
  }, [isEditMode, achievementSlug, staffUser]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading achievement editor...</p>
      </div>
    );
  }

  if (isEditMode && (error || !achievement)) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Achievement Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/achievements')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Achievements List</span>
        </button>
      </div>
    );
  }

  return (
    <div className="py-2">
      <AchievementEditorForm initialAchievement={achievement} isEditMode={isEditMode} />
    </div>
  );
};
