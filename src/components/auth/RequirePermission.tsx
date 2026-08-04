import React from 'react';
import { useStaffAuthorization } from '../../hooks/useStaffAuthorization';
import { RequireStaffAuthorization } from './RequireStaffAuthorization';
import { PermissionDeniedState } from '../admin/PermissionDeniedState';
import { Permission } from '../../types/auth';

interface RequirePermissionProps {
  requiredPermission: Permission | Permission[];
  requireAll?: boolean;
  moduleTitle?: string;
  children: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  requiredPermission,
  requireAll = false,
  moduleTitle,
  children,
}) => {
  const { hasPermission, staffUser } = useStaffAuthorization();

  const permissionsList = Array.isArray(requiredPermission)
    ? requiredPermission
    : [requiredPermission];

  const hasAccess = requireAll
    ? permissionsList.every((p) => hasPermission(p))
    : permissionsList.some((p) => hasPermission(p));

  return (
    <RequireStaffAuthorization>
      {hasAccess ? (
        children
      ) : (
        <PermissionDeniedState
          requiredPermission={requiredPermission}
          moduleTitle={moduleTitle}
        />
      )}
    </RequireStaffAuthorization>
  );
};
