import React from 'react';
import { Shield, Database, FileText, MapPin, Layers, Settings, AlertCircle, Sparkles } from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';

export function AdminInvestmentDashboardPage() {
  const { staffUser } = useStaffAuthorizationContext();

  const canEdit = hasPermission(staffUser, 'investment.edit');
  const canPublish = hasPermission(staffUser, 'investment.publish');
  const canManageConfig = hasPermission(staffUser, 'investment.config.manage');
  const canManageGIS = hasPermission(staffUser, 'gis.manage');

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#11221A] p-6 rounded-xl border border-slate-200 dark:border-emerald-800/40 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <Shield className="w-3.5 h-3.5" />
              Milestone A1 — Investment CMS Foundation
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Agricultural Investment CMS
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Secure managed repository for zone editorial profiles, agricultural datasets, source provenance, and investment opportunities.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800/40 dark:text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Public Map: Isolated M6A Prototype
            </span>
          </div>
        </div>
      </div>

      {/* Permission Matrix Diagnostic */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Active Authorization Matrix
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-[#11221A] rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="block text-slate-500">Staff Role</span>
            <span className="font-semibold text-slate-900 dark:text-white">{staffUser?.role || 'Guest'}</span>
          </div>
          <div className="p-3 bg-white dark:bg-[#11221A] rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="block text-slate-500">Edit Permission</span>
            <span className={`font-semibold ${canEdit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
              {canEdit ? 'Granted' : 'Denied'}
            </span>
          </div>
          <div className="p-3 bg-white dark:bg-[#11221A] rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="block text-slate-500">Publish Permission</span>
            <span className={`font-semibold ${canPublish ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
              {canPublish ? 'Granted' : 'Denied'}
            </span>
          </div>
          <div className="p-3 bg-white dark:bg-[#11221A] rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="block text-slate-500">GIS Geometry Management</span>
            <span className={`font-semibold ${canManageGIS ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {canManageGIS ? 'SuperAdmin Only' : 'Restricted (SuperAdmin Only)'}
            </span>
          </div>
        </div>
      </div>

      {/* Domain Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-[#11221A] rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg w-fit">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-base">Zone Editorial Profiles</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Slow-changing descriptive profiles, responsible offices, and featured commodities keyed by canonical <code>zone_id</code>.
          </p>
          <div className="pt-2">
            <span className="text-xs text-slate-500 font-mono">Collection: investmentZoneProfiles</span>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-[#11221A] rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg w-fit">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-base">Agricultural Datasets</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Statistical metadata, unit controls, reference periods, and 22 zone production/suitability records with history preservation.
          </p>
          <div className="pt-2">
            <span className="text-xs text-slate-500 font-mono">Collection: investmentDatasets</span>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-[#11221A] rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-lg w-fit">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-base">Data Provenance & Sources</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Official citations, document references, and methodology definitions required before datasets can be published.
          </p>
          <div className="pt-2">
            <span className="text-xs text-slate-500 font-mono">Collection: investmentSources</span>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-[#11221A] rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg w-fit">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-base">Investment Opportunities</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Pipeline and verified investment projects with land tenure notes and contact directory.
          </p>
          <div className="pt-2">
            <span className="text-xs text-slate-500 font-mono">Collection: investmentOpportunities</span>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-[#11221A] rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="p-3 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 rounded-lg w-fit">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-base">Infrastructure Records</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Structured records for roads, irrigation, electricity, storage, cold chain, and market facilities.
          </p>
          <div className="pt-2">
            <span className="text-xs text-slate-500 font-mono">Collection: investmentInfrastructure</span>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-[#11221A] rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg w-fit">
            <Settings className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-base">Public Map Configuration</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Pointers to default current active published datasets for the public investment portal.
          </p>
          <div className="pt-2">
            <span className="text-xs text-slate-500 font-mono">Document: investmentMapConfig/default</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminInvestmentDashboardPage;
