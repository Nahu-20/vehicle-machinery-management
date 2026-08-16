import React from 'react';
import { Users, Shield, UserPlus, CheckCircle2, Lock, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../lib/permissions';
import { StaffUser } from '../../types/auth';

export const StaffManagementPage: React.FC = () => {
  const { staffUser } = useAuth();
  const canManageStaff = hasPermission(staffUser, 'staff.manage');

  const registeredStaffUsers: StaffUser[] = [
    {
      uid: 'demo-superadmin-001',
      email: 'admin@oromiaagri.gov.et',
      displayName: 'Dr. Chala Gudina',
      role: 'superAdmin',
      active: true,
      preferredLanguage: 'om',
    },
    {
      uid: 'demo-contentadmin-002',
      email: 'content.admin@oromiaagri.gov.et',
      displayName: 'Hawani Bekele',
      role: 'contentAdmin',
      active: true,
      preferredLanguage: 'om',
    },
    {
      uid: 'demo-editor-003',
      email: 'editor@oromiaagri.gov.et',
      displayName: 'Abebe Tadesse',
      role: 'editor',
      active: true,
      preferredLanguage: 'am',
    },
    {
      uid: 'demo-market-004',
      email: 'market@oromiaagri.gov.et',
      displayName: 'Bontu Tola',
      role: 'marketOfficer',
      active: true,
      preferredLanguage: 'en',
    },
    {
      uid: 'demo-advisory-005',
      email: 'advisory@oromiaagri.gov.et',
      displayName: 'Kelo Feyissa',
      role: 'advisoryOfficer',
      active: true,
      preferredLanguage: 'om',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Staff Authorization & Role Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Firestore collection: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400 font-mono">staffUsers/{'{uid}'}</code>
          </p>
        </div>

        {canManageStaff && (
          <button
            disabled
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 opacity-60 cursor-not-allowed shadow"
            title="Public registration is disabled. Staff provisioned by SuperAdmin in Firestore."
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision Staff Member</span>
          </button>
        )}
      </div>

      {/* Security Invariants Box */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
          <Lock className="w-5 h-5" />
          <span>Staff Authorization Invariants (Milestone 2.1)</span>
        </div>
        <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-5">
          <li><strong>Document ID:</strong> Must exactly match the Firebase Authentication <code className="text-emerald-300 font-mono">uid</code>.</li>
          <li><strong>Authorization criteria:</strong> Valid Firebase Auth session + <code className="text-emerald-300 font-mono">staffUsers/{'{uid}'}</code> exists + <code className="text-emerald-300 font-mono">active === true</code> + recognized <code className="text-emerald-300 font-mono">role</code>.</li>
          <li><strong>Role elevation protection:</strong> Staff users cannot modify their own <code className="text-emerald-300 font-mono">role</code> or activate themselves via client SDK.</li>
          <li><strong>Public registration:</strong> Public user registration is explicitly disabled.</li>
        </ul>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
          Configured Staff Profiles ({registeredStaffUsers.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Staff User</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Language</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">UID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {registeredStaffUsers.map((usr) => (
                <tr key={usr.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{usr.displayName}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono">{usr.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                      {usr.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 uppercase font-bold text-slate-500 dark:text-slate-400">{usr.preferredLanguage}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{usr.uid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
