import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserPlus,
  CheckCircle2,
  Lock,
  XCircle,
  Pencil,
  X,
  Save,
  Search,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useStaffAuthorizationContext } from '../../context/StaffAuthorizationContext';
import { hasPermission, VALID_STAFF_ROLES } from '../../auth/permissions';
import { StaffRole, StaffUser, SupportedLanguage } from '../../types/auth';
import {
  listStaffUsers,
  provisionStaffProfile,
  updateStaffProfile,
} from '../../services/staffService';

type FormMode = 'provision' | 'edit' | null;

const ROLE_OPTIONS: StaffRole[] = [...VALID_STAFF_ROLES];
const LANG_OPTIONS: SupportedLanguage[] = ['om', 'am', 'en'];

function roleBadgeClass(role: StaffRole): string {
  switch (role) {
    case 'superAdmin':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'contentAdmin':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'editor':
      return 'bg-violet-100 text-violet-800 border-violet-200';
    case 'marketOfficer':
      return 'bg-amber-100 text-amber-900 border-amber-200';
    case 'advisoryOfficer':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'fleetOfficer':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

const emptyProvision = () => ({
  uid: '',
  email: '',
  displayName: '',
  role: 'editor' as StaffRole,
  preferredLanguage: 'om' as SupportedLanguage,
  active: true,
});

export const StaffManagementPage: React.FC = () => {
  const { staffUser } = useStaffAuthorizationContext();
  const canManageStaff = hasPermission(staffUser, 'staff.manage');
  const isSuperAdmin = staffUser?.role === 'superAdmin';

  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [form, setForm] = useState(emptyProvision());
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStaffList(await listStaffUsers());
    } catch (err: any) {
      setError(err?.message || 'Failed to load staff users');
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManageStaff) load();
    else setLoading(false);
  }, [canManageStaff, load]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return staffList.filter((s) => {
      if (statusFilter === 'active' && !s.active) return false;
      if (statusFilter === 'inactive' && s.active) return false;
      if (!q) return true;
      return (
        s.displayName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.uid.toLowerCase().includes(q)
      );
    });
  }, [staffList, searchQuery, statusFilter]);

  const counts = useMemo(
    () => ({
      all: staffList.length,
      active: staffList.filter((s) => s.active).length,
      inactive: staffList.filter((s) => !s.active).length,
    }),
    [staffList]
  );

  const openProvision = () => {
    setForm(emptyProvision());
    setEditingUid(null);
    setFormError(null);
    setFormMode('provision');
  };

  const openEdit = (s: StaffUser) => {
    setForm({
      uid: s.uid,
      email: s.email,
      displayName: s.displayName,
      role: s.role,
      preferredLanguage: s.preferredLanguage,
      active: s.active,
    });
    setEditingUid(s.uid);
    setFormError(null);
    setFormMode('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUser || !isSuperAdmin) {
      setFormError('Only superAdmin can provision or update staff profiles.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setActionMessage(null);
    try {
      if (formMode === 'provision') {
        const created = await provisionStaffProfile(form);
        setActionMessage(`Provisioned staffUsers/${created.uid} (${created.role})`);
      } else if (formMode === 'edit' && editingUid) {
        await updateStaffProfile(
          staffUser,
          editingUid,
          {
            displayName: form.displayName,
            email: form.email,
            role: form.role,
            active: form.active,
            preferredLanguage: form.preferredLanguage,
          },
          staffList
        );
        setActionMessage(`Updated staffUsers/${editingUid}`);
      }
      setFormMode(null);
      await load();
    } catch (err: any) {
      setFormError(err?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const quickToggleActive = async (s: StaffUser) => {
    if (!staffUser || !isSuperAdmin) return;
    if (s.uid === staffUser.uid) {
      setError('You cannot deactivate your own account.');
      return;
    }
    try {
      await updateStaffProfile(staffUser, s.uid, { active: !s.active }, staffList);
      setActionMessage(`${s.active ? 'Deactivated' : 'Activated'} ${s.displayName}`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Status update failed');
    }
  };

  if (!canManageStaff) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-3">
        <Lock className="w-10 h-10 mx-auto text-slate-400" />
        <h1 className="text-lg font-bold">Staff management restricted</h1>
        <p className="text-sm text-slate-500">
          You need the <code className="font-mono text-xs">staff.manage</code> permission (superAdmin).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Staff User Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Live Firestore <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">staffUsers/{'{uid}'}</code>
            {' '}— document ID must match Firebase Auth UID.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={openProvision}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow"
            >
              <UserPlus className="w-4 h-4" />
              <span>Provision staff</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
          <Lock className="w-5 h-5" />
          <span>Provisioning rules</span>
        </div>
        <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-5">
          <li>
            Create the Auth user in Firebase Console first, then paste the UID here to write{' '}
            <code className="text-emerald-300 font-mono">staffUsers/{'{uid}'}</code>.
          </li>
          <li>Self-provisioning on sign-in is disabled. Role and active cannot be changed by the staff member themselves.</li>
          <li>You cannot demote/deactivate yourself or remove the last active superAdmin.</li>
          <li>List/create/role changes require superAdmin (matches Firestore rules).</li>
        </ul>
      </div>

      {actionMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-4 py-3 text-sm">
          {actionMessage}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {formMode && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">
              {formMode === 'provision' ? 'Provision staff profile' : `Edit ${editingUid}`}
            </h2>
            <button type="button" onClick={() => setFormMode(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>
          {formError && (
            <div className="flex gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-xs space-y-1 md:col-span-2">
              <span className="font-semibold">Firebase Auth UID</span>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-mono"
                value={form.uid}
                onChange={(e) => setForm((p) => ({ ...p, uid: e.target.value }))}
                disabled={formMode === 'edit'}
                required
                placeholder="Paste Auth UID from Firebase Console"
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold">Display name</span>
              <input
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.displayName}
                onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                required
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold">Email</span>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold">Role</span>
              <select
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as StaffRole }))}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs space-y-1">
              <span className="font-semibold">Preferred language</span>
              <select
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2"
                value={form.preferredLanguage}
                onChange={(e) =>
                  setForm((p) => ({ ...p, preferredLanguage: e.target.value as SupportedLanguage }))
                }
              >
                {LANG_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {l.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                disabled={editingUid === staffUser?.uid}
              />
              <span className="font-semibold">Active (can sign in to admin)</span>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormMode(null)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-700 text-white disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {submitting ? 'Saving…' : formMode === 'provision' ? 'Provision' : 'Save changes'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', `All (${counts.all})`],
                ['active', `Active (${counts.active})`],
                ['inactive', `Inactive (${counts.inactive})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setStatusFilter(id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border ${
                  statusFilter === id
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white dark:bg-slate-950 text-slate-600 border-slate-200 dark:border-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="font-bold text-xs text-slate-700 dark:text-slate-300">
              Staff profiles ({filtered.length})
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                placeholder="Search name, email, role, uid…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading staff…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-2">
            <p>No staff profiles found.</p>
            <p>Provision a profile after creating the Auth user in Firebase Console.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Staff user</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Lang</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">UID</th>
                  <th className="px-6 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filtered.map((usr) => (
                  <tr key={usr.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {usr.displayName}
                      {usr.uid === staffUser?.uid && (
                        <span className="ml-2 text-[10px] uppercase text-emerald-700">You</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono">{usr.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${roleBadgeClass(usr.role)}`}
                      >
                        {usr.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 uppercase font-bold text-slate-500">{usr.preferredLanguage}</td>
                    <td className="px-6 py-4">
                      {usr.active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400 max-w-[140px] truncate" title={usr.uid}>
                      {usr.uid}
                    </td>
                    <td className="px-6 py-4">
                      {isSuperAdmin && (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(usr)}
                            className="p-1.5 rounded-lg hover:bg-slate-100"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => quickToggleActive(usr)}
                            disabled={usr.uid === staffUser?.uid}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 disabled:opacity-40"
                            title={usr.active ? 'Deactivate' : 'Activate'}
                          >
                            {usr.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      )}
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
};

export default StaffManagementPage;
