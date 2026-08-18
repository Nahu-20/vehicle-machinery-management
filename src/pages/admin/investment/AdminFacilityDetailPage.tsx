import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { InvestmentFacility } from '../../../types/investment';
import { getFacility } from '../../../services/investment/investmentInfrastructureService';
import { InfrastructureFacilityEditor } from '../../../components/admin/investment/InfrastructureFacilityEditor';

export function AdminFacilityDetailPage() {
  const { facilityId } = useParams<{ facilityId: string }>();
  const [facility, setFacility] = useState<InvestmentFacility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFacility = async () => {
    if (!facilityId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getFacility(facilityId);
      if (!data) {
        setError(`Facility with ID "${facilityId}" was not found.`);
      } else {
        setFacility(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load facility data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacility();
  }, [facilityId]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8 text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading infrastructure facility record...</span>
        </div>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 space-y-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-rose-600" />
          <h2 className="text-base font-bold">Facility Not Found</h2>
        </div>
        <p className="text-xs leading-relaxed text-rose-700 dark:text-rose-300">
          {error || 'Unable to retrieve the requested infrastructure record from the database.'}
        </p>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={loadFacility}
            className="px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Load
          </button>
          <Link
            to="/admin/investment/infrastructure"
            className="px-3.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-medium text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60"
          >
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <InfrastructureFacilityEditor
      key={facility.facilityId}
      initialFacility={facility}
      isNew={false}
      onSaved={(updated) => setFacility(updated)}
    />
  );
}
