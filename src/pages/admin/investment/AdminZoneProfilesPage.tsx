import React, { useEffect, useState } from 'react';
import { MapPin, Search, Edit, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import {
  getAllZoneDirectoryRows,
  ZoneDirectoryRow,
} from '../../../services/investment/investmentZoneService';

export function AdminZoneProfilesPage() {
  const { staffUser } = useStaffAuthorizationContext();
  const [rows, setRows] = useState<ZoneDirectoryRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canEdit = hasPermission(staffUser, 'investment.edit');

  const loadZones = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllZoneDirectoryRows();
      setRows(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load canonical zone directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  const filteredRows = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.zoneInfo.displayName.toLowerCase().includes(q) ||
      r.zoneInfo.zoneId.toLowerCase().includes(q) ||
      r.zoneInfo.pcode.toLowerCase().includes(q)
    );
  });

  const renderStatusBadge = (statusLabel: string) => {
    switch (statusLabel) {
      case 'published':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            Published
          </span>
        );
      case 'draft':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
            Draft
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Not Created
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>Canonical Zone Directory (22 UN-OCHA ADM2 Zones)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Frozen ADM2 inventory derived from UN-OCHA COD-AB v04 dataset including Shager City (ET0420) and East Borena (ET0422).
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search zone, PCODE or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse space-y-2">
            <MapPin className="w-8 h-8 mx-auto text-slate-300 animate-bounce" />
            <p>Loading canonical 22 zone directory...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Zone Display Name</th>
                  <th className="py-3 px-4">PCODE</th>
                  <th className="py-3 px-4">Canonical ID</th>
                  <th className="py-3 px-4">Profile Status</th>
                  <th className="py-3 px-4">Responsible Office</th>
                  <th className="py-3 px-4">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredRows.map((r) => (
                  <tr
                    key={r.zoneInfo.zoneId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {r.zoneInfo.displayName}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">
                      {r.zoneInfo.pcode}
                    </td>

                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {r.zoneInfo.zoneId}
                    </td>

                    <td className="py-3 px-4">{renderStatusBadge(r.statusLabel)}</td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {r.profile?.responsibleOffice || 'Oromia Agriculture Bureau'}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '—'}
                    </td>
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

export default AdminZoneProfilesPage;
