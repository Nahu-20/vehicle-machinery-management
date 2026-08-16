import React, { useEffect, useState } from 'react';
import { Layers, Plus, Search } from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import { getAllInfrastructure } from '../../../services/investment/investmentInfrastructureService';
import { InvestmentInfrastructure } from '../../../types/investment';
import { CANONICAL_ZONE_METADATA } from '../../../features/investment-map/constants/canonicalZones';

export function AdminInfrastructurePage() {
  const { staffUser } = useStaffAuthorizationContext();
  const [records, setRecords] = useState<InvestmentInfrastructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canEdit = hasPermission(staffUser, 'investment.edit');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllInfrastructure();
      setRecords(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load infrastructure records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>Infrastructure Records Directory</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Agro-processing parks, cold storage facilities, warehouses, irrigation schemes, and logistics networks.
          </p>
        </div>
      </div>

      {/* Directory Table / Empty State */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-300 animate-bounce" />
            <p>Loading infrastructure inventory from Firestore...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No investment infrastructure records created yet.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Map physical infrastructure assets against canonical zones to support investment decision-making.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Title & Record ID</th>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {records.map((rec) => (
                  <tr key={rec.recordId}>
                    <td className="py-3 px-4 font-bold">{rec.title}</td>
                    <td className="py-3 px-4">{CANONICAL_ZONE_METADATA[rec.zoneId]?.displayName || rec.zoneId}</td>
                    <td className="py-3 px-4 capitalize">{rec.category}</td>
                    <td className="py-3 px-4 capitalize">{rec.status}</td>
                    <td className="py-3 px-4 capitalize">{rec.verificationStatus}</td>
                    <td className="py-3 px-4">{rec.updatedAt ? new Date(rec.updatedAt).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminInfrastructurePage;
