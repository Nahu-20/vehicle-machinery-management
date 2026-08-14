import React, { useEffect, useState } from 'react';
import { Sparkles, Plus, Search, Filter, AlertCircle } from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  getAllOpportunities,
  createOpportunity,
} from '../../../services/investment/investmentOpportunityService';
import { InvestmentOpportunity } from '../../../types/investment';
import { CANONICAL_ZONE_METADATA } from '../../../features/investment-map/constants/canonicalZones';

export function AdminOpportunitiesPage() {
  const { staffUser } = useStaffAuthorizationContext();
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManageOpps = hasPermission(staffUser, 'investment.opportunities.manage');

  const loadOpps = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllOpportunities();
      setOpportunities(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load opportunities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpps();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>Investment Opportunities Directory</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Promotional investment profiles, processing clusters, land availability, and incentives.
          </p>
        </div>

        {canManageOpps && (
          <button
            onClick={() => alert('Opportunity Creation Form is accessible. Connects via trusted backend mutation route POST /api/investment/mutate.')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Opportunity</span>
          </button>
        )}
      </div>

      {/* Directory Table / Empty State */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-slate-300 animate-bounce" />
            <p>Loading opportunities from Firestore...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No investment opportunities published or drafted yet.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Create structured opportunity profiles linked to canonical zones and verified commodities.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Opportunity</th>
                  <th className="py-3 px-4">Zone(s)</th>
                  <th className="py-3 px-4">Commodity</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Lifecycle</th>
                  <th className="py-3 px-4">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {opportunities.map((opp) => (
                  <tr key={opp.opportunityId}>
                    <td className="py-3 px-4 font-bold">{opp.title?.en || opp.title}</td>
                    <td className="py-3 px-4">
                      {opp.zoneIds?.map((z) => CANONICAL_ZONE_METADATA[z as keyof typeof CANONICAL_ZONE_METADATA]?.displayName || z).join(', ')}
                    </td>
                    <td className="py-3 px-4 capitalize">{opp.commodity}</td>
                    <td className="py-3 px-4 capitalize">{opp.opportunityType}</td>
                    <td className="py-3 px-4">{opp.verificationStatus}</td>
                    <td className="py-3 px-4">{opp.lifecycleStatus}</td>
                    <td className="py-3 px-4">{opp.updatedAt ? new Date(opp.updatedAt).toLocaleDateString() : 'N/A'}</td>
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

export default AdminOpportunitiesPage;
