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
  'audit.view',
  'audit.export',
  'media.view',
  'media.upload',
  'media.delete',
  'media.manage',
  'achievement.view',
  'achievement.create',
  'achievement.edit',
  'achievement.review',
  'achievement.publish',
  'achievement.trash',
  'achievement.restore',
  'achievement.delete',
  'alert.view',
  'alert.create',
  'alert.edit',
  'alert.review',
  'alert.publish',
  'alert.trash',
  'alert.restore',
  'alert.delete',
  'investment.view',
  'investment.edit',
  'investment.publish',
  'investment.verify',
  'investment.sources.manage',
  'investment.datasets.manage',
  'investment.opportunities.manage',
  'investment.config.manage',
  'gis.manage',
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
    'audit.view',
    'media.view',
    'media.upload',
    'media.delete',
    'media.manage',
    'achievement.view',
    'achievement.create',
    'achievement.edit',
    'achievement.review',
    'achievement.publish',
    'achievement.trash',
    'achievement.restore',
    'alert.view',
    'alert.create',
    'alert.edit',
    'alert.review',
    'alert.publish',
    'alert.trash',
    'alert.restore',
    'investment.view',
    'investment.edit',
    'investment.publish',
    'investment.verify',
    'investment.sources.manage',
    'investment.datasets.manage',
    'investment.opportunities.manage',
    'investment.config.manage',
  ],
  editor: [
    'dashboard.view',
    'content.view',
    'content.create',
    'content.edit',
    'media.view',
    'media.upload',
    'achievement.view',
    'achievement.create',
    'achievement.edit',
    'achievement.review',
    'alert.view',
    'alert.create',
    'alert.edit',
    'alert.review',
    'investment.view',
    'investment.edit',
    'investment.sources.manage',
    'investment.datasets.manage',
    'investment.opportunities.manage',
  ],
  marketOfficer: [
    'dashboard.view',
    'market.manage',
    'investment.view',
    'investment.datasets.manage',
    'investment.sources.manage',
  ],
  advisoryOfficer: [
    'dashboard.view',
    'alerts.manage',
    'alert.view',
    'alert.create',
    'alert.edit',
    'alert.review',
    'investment.view',
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

