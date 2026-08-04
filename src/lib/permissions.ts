import React from 'react';
import { StaffUser, StaffRole, Permission } from '../types/auth';

export const ALL_PERMISSIONS: Permission[] = [
  'dashboard.view',
  'content.view',
  'content.create',
  'content.edit',
  'content.publish',
  'alerts.manage',
  'market.manage',
  'resources.manage',
  'staff.manage',
  'settings.manage',
];

export const ROLE_PERMISSIONS_MAP: Record<StaffRole, Permission[]> = {
  superAdmin: [...ALL_PERMISSIONS],
  contentAdmin: [
    'dashboard.view',
    'content.view',
    'content.create',
    'content.edit',
    'content.publish',
    'resources.manage',
  ],
  editor: [
    'dashboard.view',
    'content.view',
    'content.create',
    'content.edit',
  ],
  marketOfficer: [
    'dashboard.view',
    'market.manage',
  ],
  advisoryOfficer: [
    'dashboard.view',
    'alerts.manage',
  ],
};

export function hasPermission(user: StaffUser | null, permission: Permission): boolean {
  if (!user || !user.active) return false;
  const userPermissions = ROLE_PERMISSIONS_MAP[user.role] || [];
  return userPermissions.includes(permission);
}

export function hasRole(user: StaffUser | null, roles: StaffRole | StaffRole[]): boolean {
  if (!user || !user.active) return false;
  const roleList = Array.isArray(roles) ? roles : [roles];
  return roleList.includes(user.role);
}

interface RequirePermissionProps {
  permission: Permission;
  user: StaffUser | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  user,
  children,
  fallback = null,
}) => {
  if (hasPermission(user, permission)) {
    return React.createElement(React.Fragment, null, children);
  }
  return React.createElement(React.Fragment, null, fallback);
};

