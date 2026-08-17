import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Users,
  Wrench,
  Fuel,
  ShieldCheck,
  BarChart3,
  Map as MapIcon,
  Info,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';
import { isDemoFleet } from '../../../features/fleet/services/fleetService';

/**
 * Shell for the fleet module, mirroring InvestmentAdminLayout so the two
 * sections of the admin area behave identically — same header card, same tab
 * bar, same active-state treatment.
 */
export function FleetAdminLayout() {
  const { staffUser } = useStaffAuthorizationContext();

  const canView = hasPermission(staffUser, 'fleet.view');
  const canMaintain = hasPermission(staffUser, 'fleet.maintenance.manage');
  const canAssign = hasPermission(staffUser, 'fleet.assign');
  const canFuel = hasPermission(staffUser, 'fleet.fuel.record');
  const canReport = hasPermission(staffUser, 'fleet.reports.view');

  const navTabs = [
    {
      id: 'dashboard',
      label: 'Overview',
      to: '/admin/fleet',
      end: true,
      icon: LayoutDashboard,
      visible: canView,
    },
    {
      id: 'register',
      label: 'Vehicle Register',
      to: '/admin/fleet/register',
      end: false,
      icon: Truck,
      visible: canView,
    },
    {
      // Sits next to the register rather than under Reports: the directory is
      // something staff act on when issuing a machine, not something they read
      // at the end of a month.
      id: 'drivers',
      label: 'Drivers',
      to: '/admin/fleet/drivers',
      end: false,
      icon: Users,
      visible: canView || canAssign,
    },
    {
      id: 'garage',
      label: 'Garage & Repairs',
      to: '/admin/fleet/garage',
      end: false,
      icon: Wrench,
      visible: canMaintain,
    },
    {
      id: 'fuel',
      label: 'Fuel',
      to: '/admin/fleet/fuel',
      end: false,
      icon: Fuel,
      visible: canView || canFuel,
    },
    {
      // Between the garage and the reports: it is work to be done, like the
      // garage queue, rather than a figure to be read at month end.
      id: 'compliance',
      label: 'Compliance',
      to: '/admin/fleet/compliance',
      end: false,
      icon: ShieldCheck,
      visible: canView,
    },
    {
      id: 'reports',
      label: 'Reports',
      to: '/admin/fleet/reports',
      end: false,
      icon: BarChart3,
      visible: canReport,
    },
    {
      id: 'map',
      label: 'Zone Map',
      to: '/admin/fleet/map',
      end: false,
      icon: MapIcon,
      visible: canView,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-950 dark:text-emerald-100 flex items-center gap-2.5">
              Vehicle &amp; Machinery Management
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Live register of Bureau vehicles, tractors and equipment — where each one is, who
              holds it, and what needs repair.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50">
              Role: <strong className="uppercase">{staffUser?.role || 'Guest'}</strong>
            </span>
          </div>
        </div>

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

      {isDemoFleet() && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Demonstration register.</strong> Firebase is not configured, so these are
            sample vehicles rather than the Bureau&apos;s real fleet. Adding, issuing and repairing
            are disabled until the VITE_FIREBASE_* values are set.
          </span>
        </div>
      )}

      <div>
        <Outlet />
      </div>
    </div>
  );
}

export default FleetAdminLayout;
