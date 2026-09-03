import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Users,
  Building2,
  BarChart3,
  FileText,
  History,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  getAboutCmsCounts,
  listRecentlyUpdatedAbout,
} from '../../../services/aboutCmsService';
import type { AboutCmsCounts } from '../../../types/about';
import { hasPermission } from '../../../lib/permissions';
import { useStaffAuthorizationContext } from '../../../context/StaffAuthorizationContext';

export const AdminAboutOverviewPage: React.FC = () => {
  const { staffUser } = useStaffAuthorizationContext();
  const canCreate = hasPermission(staffUser, 'about.create');
  const [counts, setCounts] = useState<AboutCmsCounts | null>(null);
  const [recent, setRecent] = useState<
    Array<{ entity: string; id: string; label: string; updatedAt: string; status: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, r] = await Promise.all([getAboutCmsCounts(), listRecentlyUpdatedAbout(8)]);
        if (!cancelled) {
          setCounts(c);
          setRecent(r);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load overview');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 py-12 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading About CMS…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4 text-sm flex gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Could not load CMS counts</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-xs">
            Deploy Firestore rules for about* collections if this is a permissions error.
          </p>
        </div>
      </div>
    );
  }

  const cards = [
    { label: 'Overview', value: counts?.overviewStatus || 'missing', href: '/admin/about/landing' },
    {
      label: 'History',
      value: `${counts?.history.published || 0} published / ${counts?.history.draft || 0} draft`,
      href: '/admin/about/history',
    },
    {
      label: 'Leadership',
      value: `${counts?.leaders.current || 0} current published`,
      href: '/admin/about/leadership',
    },
    {
      label: 'Organization',
      value: `${counts?.orgNodes.published || 0} published nodes`,
      href: '/admin/about/structure',
    },
    {
      label: 'Departments',
      value: `${counts?.departments.published || 0} published`,
      href: '/admin/about/departments',
    },
    {
      label: 'Statistics',
      value: `${counts?.statistics.published || 0} published`,
      href: '/admin/about/statistics',
    },
    {
      label: 'Partners',
      value: `${counts?.partners.published || 0} published`,
      href: '/admin/about/partners',
    },
    {
      label: 'Documents',
      value: `${counts?.documents.published || 0} published`,
      href: '/admin/about/documents',
    },
  ];

  return (
    <div className="space-y-8">
      {canCreate && (
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/about/landing"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold px-3 py-2 hover:bg-emerald-800"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Overview
          </Link>
          <Link
            to="/admin/about/history"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold px-3 py-2"
          >
            <History className="h-3.5 w-3.5" /> Add History
          </Link>
          <Link
            to="/admin/about/leadership"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold px-3 py-2"
          >
            <Users className="h-3.5 w-3.5" /> Add Leader
          </Link>
          <Link
            to="/admin/about/departments"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold px-3 py-2"
          >
            <Building2 className="h-3.5 w-3.5" /> Add Department
          </Link>
          <Link
            to="/admin/about/statistics"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold px-3 py-2"
          >
            <BarChart3 className="h-3.5 w-3.5" /> Add Statistic
          </Link>
          <Link
            to="/admin/about/documents"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold px-3 py-2"
          >
            <FileText className="h-3.5 w-3.5" /> Upload Document
          </Link>
        </div>
      )}

      {(counts?.awaitingReview || 0) > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          <strong>{counts?.awaitingReview}</strong> item(s) awaiting review.
        </div>
      )}

      <div>
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-3">
          Content Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((c) => (
            <Link
              key={c.label}
              to={c.href}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-emerald-500/40 transition-colors"
            >
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{c.label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{c.value}</p>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-3">
          Recently Updated
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">No About CMS records yet. Create drafts from the tabs above.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {recent.map((r) => (
              <li key={`${r.entity}-${r.id}`} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{r.label}</p>
                  <p className="text-xs text-slate-500">
                    {r.entity} · {r.status}
                  </p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
