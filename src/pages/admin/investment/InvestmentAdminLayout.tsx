import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Database,
  FileText,
  BookOpen,
  Sparkles,
  Layers,
  Settings,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';

export function InvestmentAdminLayout() {
  const { staffUser } = useStaffAuthorizationContext();

  const canView = hasPermission(staffUser, 'investment.view');
  const canManageDatasets = hasPermission(staffUser, 'investment.datasets.manage');
  const canManageSources = hasPermission(staffUser, 'investment.sources.manage');
  const canManageConfig = hasPermission(staffUser, 'investment.config.manage');

  const navTabs = [
    {
      id: 'overview',
      label: 'Overview',
      to: '/admin/investment',
      end: true,
      icon: LayoutDashboard,
      visible: canView,
    },
    {
      id: 'zones',
      label: 'Zone Profiles',
      to: '/admin/investment/zones',
      end: false,
      icon: MapPin,
      visible: canView,
    },
    {
      id: 'datasets',
      label: 'Datasets',
      to: '/admin/investment/datasets',
      end: false,
      icon: Database,
      visible: canView,
    },
    {
      id: 'sources',
      label: 'Sources',
      to: '/admin/investment/sources',
      end: false,
      icon: FileText,
      visible: canView,
    },
    {
      id: 'methodologies',
      label: 'Methodologies',
      to: '/admin/investment/methodologies',
      end: false,
      icon: BookOpen,
      visible: canView,
    },
    {
      id: 'opportunities',
      label: 'Opportunities',
      to: '/admin/investment/opportunities',
      end: false,
      icon: Sparkles,
      visible: canView,
    },
    {
      id: 'infrastructure',
      label: 'Infrastructure',
      to: '/admin/investment/infrastructure',
      end: false,
      icon: Layers,
      visible: canView,
    },
    {
      id: 'config',
      label: 'Map Config',
      to: '/admin/investment/config',
      end: false,
      icon: Settings,
      visible: canView,
    },
    {
      id: 'activity',
      label: 'Activity Log',
      to: '/admin/investment/activity',
      end: false,
      icon: Clock,
      visible: canView,
    },
    {
      id: 'tests',
      label: 'Security Tests',
      to: '/admin/investment/tests',
      end: false,
      icon: ShieldAlert,
      visible: canView,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-950 dark:text-emerald-100 flex items-center gap-2.5">
              Agricultural Investment Management
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Manage zone profiles, datasets, sources, opportunities and published map configuration.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50">
              Role: <strong className="uppercase">{staffUser?.role || 'Guest'}</strong>
            </span>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="mt-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto scrollbar-none">
          {navTabs
            .filter((t) => t.visible)
            .map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.id}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
                      isActive
                        ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-400'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </NavLink>
              );
            })}
        </div>
      </div>

      {/* Tab Content Route */}
      <div>
        <Outlet />
      </div>
    </div>
  );
}

export default InvestmentAdminLayout;
