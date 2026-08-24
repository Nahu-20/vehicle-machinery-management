import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  History,
  Target,
  Network,
  Users,
  MessageSquareQuote,
  Building2,
  Route,
  BarChart3,
  Handshake,
  FileText,
  Settings,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';
import { hasPermission } from '../../../lib/permissions';

const tabs = [
  { to: '/admin/about', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/about/landing', end: false, label: 'Landing Page', icon: LayoutDashboard },
  { to: '/admin/about/history', end: false, label: 'History', icon: History },
  { to: '/admin/about/mandate', end: false, label: 'Mandate', icon: Target },
  { to: '/admin/about/structure', end: false, label: 'Structure', icon: Network },
  { to: '/admin/about/leadership', end: false, label: 'Leadership', icon: Users },
  { to: '/admin/about/messages', end: false, label: 'Messages', icon: MessageSquareQuote },
  { to: '/admin/about/departments', end: false, label: 'Departments', icon: Building2 },
  { to: '/admin/about/how-we-serve', end: false, label: 'How We Serve', icon: Route },
  { to: '/admin/about/statistics', end: false, label: 'Statistics', icon: BarChart3 },
  { to: '/admin/about/partners', end: false, label: 'Partners', icon: Handshake },
  { to: '/admin/about/documents', end: false, label: 'Documents', icon: FileText },
  { to: '/admin/about/settings', end: false, label: 'Settings', icon: Settings },
];

export function AboutAdminLayout() {
  const { staffUser } = useStaffAuthorizationContext();
  const canView = hasPermission(staffUser, 'about.view');

  if (!canView) {
    return (
      <div className="p-8 text-sm text-slate-600">You do not have permission to view About CMS.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          About OAB CMS
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Governed institutional content for public About pages. Draft → Review → Publish.
        </p>
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-colors ${
                  isActive
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/30'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </NavLink>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}
