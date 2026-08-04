import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft, Mail, AlertTriangle, Building2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useStaffAuthorization } from '../../hooks/useStaffAuthorization';
import { Permission } from '../../types/auth';

interface PermissionDeniedStateProps {
  requiredPermission?: Permission | Permission[];
  moduleTitle?: string;
}

export const PermissionDeniedState: React.FC<PermissionDeniedStateProps> = ({
  requiredPermission,
  moduleTitle = 'Admin Module',
}) => {
  const { t } = useLanguage();
  const { staffUser, role } = useStaffAuthorization();

  const formattedPermission = Array.isArray(requiredPermission)
    ? requiredPermission.join(' or ')
    : requiredPermission || 'authorized.access';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-sm">
          <ShieldX className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 text-xs font-bold uppercase tracking-wider">
            Permission Required
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {t('auth_access_denied') || 'Access Denied'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Your staff account ({staffUser?.email}) with role{' '}
            <strong className="text-slate-900 dark:text-slate-200">{role}</strong> does not have
            permission to access <strong className="text-slate-900 dark:text-slate-200">{moduleTitle}</strong>.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Missing Permission Marker</span>
          </div>
          <code className="block p-2 rounded-xl bg-slate-200/60 dark:bg-slate-900 text-[11px] font-mono text-red-600 dark:text-red-400 break-all font-semibold">
            {formattedPermission}
          </code>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-2 text-left bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200 dark:border-blue-900/40">
          <Mail className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <span>
            If you require access to this bureau module, please submit a permission update request to your System Administrator (`admin@oromiaagri.gov.et`).
          </span>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('auth_back_to_dashboard') || 'Back to Overview'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
