import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasPermission, hasRole } from '../../lib/permissions';
import { Permission, StaffRole } from '../../types/auth';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  requiredPermission?: Permission;
  requiredRoles?: StaffRole | StaffRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredPermission,
  requiredRoles,
  children,
}) => {
  const { status, staffUser, loading } = useAuth();
  const location = useLocation();

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">Authenticating Staff Identity</h3>
        <p className="text-xs text-slate-400">Verifying security credentials and role permissions...</p>
      </div>
    );
  }

  if (status === 'signedOut') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (status === 'noProfile' || status === 'inactive' || status === 'unknownRole') {
    return <Navigate to="/admin/unauthorized" state={{ from: location }} replace />;
  }

  if (status === 'authorized' || status === 'demoAuthorized') {
    if (requiredPermission && !hasPermission(staffUser, requiredPermission)) {
      return <Navigate to="/admin/unauthorized" state={{ from: location, reason: 'missing_permission' }} replace />;
    }

    if (requiredRoles && !hasRole(staffUser, requiredRoles)) {
      return <Navigate to="/admin/unauthorized" state={{ from: location, reason: 'missing_role' }} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
  }

  return <Navigate to="/admin/login" state={{ from: location }} replace />;
};
