import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAlertBySlugForAdmin } from '../../../services/agriculturalAlertService';
import { AgriculturalAlert } from '../../../types/agriculturalAlert';
import { AlertEditorForm } from '../../../components/admin/alerts/AlertEditorForm';
import { useStaffAuthorization } from '../../../hooks/useStaffAuthorization';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export const AdminAlertEditPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { staffUser } = useStaffAuthorization();
  const [alertData, setAlertData] = useState<AgriculturalAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAlert() {
      if (!slug) {
        setError('Missing alert slug parameter.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const item = await getAlertBySlugForAdmin(slug, staffUser);
        if (item) {
          setAlertData(item);
          setError(null);
        } else {
          setError(`Agricultural alert with slug "${slug}" was not found.`);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch alert document from Firestore.');
      } finally {
        setLoading(false);
      }
    }
    loadAlert();
  }, [slug, staffUser]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 my-8">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading alert authoring editor...</p>
      </div>
    );
  }

  if (error || !alertData) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Alert Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
        </div>
        <Link
          to="/admin/alerts"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Alerts Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-2">
      <AlertEditorForm initialAlert={alertData} isEditMode={true} />
    </div>
  );
};

