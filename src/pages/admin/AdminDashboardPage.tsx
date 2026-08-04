import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Bell,
  TrendingUp,
  FolderDown,
  Users,
  ShieldCheck,
  Building2,
  Clock,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  Lock,
  Sparkles,
  Database,
  Key,
} from 'lucide-react';
import { useStaffAuthorization } from '../../hooks/useStaffAuthorization';
import { StaffRole } from '../../types/auth';

export const AdminDashboardPage: React.FC = () => {
  const { staffUser, role, permissions, authorizationStatus } = useStaffAuthorization();

  const userRole: StaffRole = role || 'editor';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Staff Authorization Verified</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
              Welcome, {staffUser?.displayName || 'Staff Member'}
            </h1>

            <p className="text-slate-300 text-sm max-w-2xl">
              You are signed in as <span className="text-emerald-400 font-bold uppercase">{userRole}</span> ({staffUser?.email}). Manage administrative features, public content, and agricultural advisories below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs font-semibold text-slate-300">
              Status: <span className="text-emerald-400 font-bold">Active Staff</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs font-semibold text-slate-300">
              Auth State: <span className="text-amber-400 font-bold">{authorizationStatus}</span>
            </span>
          </div>
        </div>
      </div>


      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              News & Stories
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">12</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
              <Activity className="w-3 h-3" />
              <span>4 Published this month</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Alerts
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">4</div>
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-semibold">
              1 Critical Pest Warning
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <Bell className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Market Commodities
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">16</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Updated 2 hours ago
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Staff Users
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">5</div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-semibold">
              5 Role Tiers Configured
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Profile & Granted Permissions Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Staff Profile Card */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Current Staff Profile</span>
            </h2>
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold uppercase">
              {userRole}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Display Name:</span>
              <span className="font-bold text-slate-900 dark:text-white">{staffUser?.displayName}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Email Address:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{staffUser?.email}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">User UID:</span>
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {staffUser?.uid}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Account Status:</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active</span>
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Preferred UI Language:</span>
              <span className="font-bold text-slate-900 dark:text-white uppercase">{staffUser?.preferredLanguage}</span>
            </div>
          </div>
        </div>

        {/* Permissions Breakdown Card */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Granted Permissions</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {permissions.length} Permissions Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {permissions.map((perm) => (
              <div
                key={perm}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-mono">{perm}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Milestone 2.1 Architecture Notice */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-emerald-400 shrink-0" />
          <h3 className="text-lg font-bold text-white">Milestone 2.1 Implementation Architecture</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400">1. Staff Authorization</div>
            <p className="text-slate-400">
              Users authenticate via Firebase Auth. Authorization is verified against <code className="text-slate-200">staffUsers/{'{uid}'}</code> in Firestore (must be active with recognized role).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400">2. Security Rules</div>
            <p className="text-slate-400">
              Hardened <code className="text-slate-200">firestore.rules</code> and <code className="text-slate-200">storage.rules</code> prevent non-staff or inactive staff from modifying data.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400">3. Audit Logging</div>
            <p className="text-slate-400">
              Includes an <code className="text-slate-200">AuditLog</code> interface model to log administrative actions with actor UID, email, action type, and timestamp.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
