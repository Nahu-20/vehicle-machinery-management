import React from 'react';
import { TrendingUp, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../lib/permissions';

export const MarketManagementPage: React.FC = () => {
  const { staffUser } = useAuth();
  const canManageMarket = hasPermission(staffUser, 'market.manage');

  const mockPrices = [
    { id: 'm1', commodity: 'Teff (White / Magalaba)', market: 'Adama Central', zone: 'East Shewa', price: 9200, unit: 'Quintal (100kg)', trend: 'up' },
    { id: 'm2', commodity: 'Wheat (Grade A)', market: 'Asella Market', zone: 'Arsi', price: 6100, unit: 'Quintal (100kg)', trend: 'stable' },
    { id: 'm3', commodity: 'Maize (Yellow)', market: 'Jimma Main Market', zone: 'Jimma', price: 4300, unit: 'Quintal (100kg)', trend: 'down' },
    { id: 'm4', commodity: 'Red Kidney Beans', market: 'Shashamane Market', zone: 'West Arsi', price: 7800, unit: 'Quintal (100kg)', trend: 'up' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-blue-500" />
            <span>Market Price Index Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Publish weekly regional grain and livestock commodity prices across Oromia zones.
          </p>
        </div>

        {canManageMarket && (
          <button
            disabled
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-2 opacity-60 cursor-not-allowed shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Update Price Bulletin</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
          Regional Commodity Prices ({mockPrices.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Commodity</th>
                <th className="px-6 py-3.5">Market Center</th>
                <th className="px-6 py-3.5">Zone</th>
                <th className="px-6 py-3.5">Price (ETB)</th>
                <th className="px-6 py-3.5">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {mockPrices.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{p.commodity}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{p.market}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{p.zone}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                    {p.price.toLocaleString()} ETB / {p.unit}
                  </td>
                  <td className="px-6 py-4 uppercase text-slate-400 font-bold">{p.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
