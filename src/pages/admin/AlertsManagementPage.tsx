import React from 'react';
import { Bell, AlertTriangle, ShieldCheck, Plus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../lib/permissions';

export const AlertsManagementPage: React.FC = () => {
  const { staffUser } = useAuth();
  const canManageAlerts = hasPermission(staffUser, 'alerts.manage');

  const mockAlerts = [
    {
      id: 'alt-1',
      title: 'Desert Locust Early Advisory & Swarm Warning',
      severity: 'critical',
      category: 'pest',
      affectedZones: ['Bale', 'East Hararghe', 'West Hararghe'],
      date: '2026-08-01',
      status: 'active',
    },
    {
      id: 'alt-2',
      title: 'Arsi Zone Heavy Rainfall & Soil Erosion Advisory',
      severity: 'warning',
      category: 'weather',
      affectedZones: ['Arsi', 'West Arsi'],
      date: '2026-07-29',
      status: 'active',
    },
    {
      id: 'alt-3',
      title: 'Irrigation Water Distribution Schedule Update',
      severity: 'advisory',
      category: 'irrigation',
      affectedZones: ['Jimma'],
      date: '2026-07-20',
      status: 'expired',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-7 h-7 text-amber-500" />
            <span>Agricultural Alerts & Advisory Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dispatch urgent pest warnings, weather advisories, and regional crop alerts.
          </p>
        </div>

        {canManageAlerts && (
          <button
            disabled
            className="px-4 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center gap-2 opacity-60 cursor-not-allowed shadow"
            title="Alert broadcasting CRUD will be enabled in subsequent milestone"
          >
            <Plus className="w-4 h-4" />
            <span>Broadcast New Alert</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
          Active & Historical Advisories ({mockAlerts.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Advisory Title</th>
                <th className="px-6 py-3.5">Severity</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Affected Zones</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {mockAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{alert.title}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        alert.severity === 'critical'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : alert.severity === 'warning'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 uppercase text-slate-500 dark:text-slate-400">{alert.category}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{alert.affectedZones.join(', ')}</td>
                  <td className="px-6 py-4 font-bold uppercase text-slate-500">{alert.status}</td>
                  <td className="px-6 py-4 text-right text-slate-400 italic">Read-only</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
