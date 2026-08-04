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

export const VALID_STAFF_ROLES: StaffRole[] = [
  'superAdmin',
  'contentAdmin',
  'editor',
  'marketOfficer',
  'advisoryOfficer',
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

export function isStaffRole(role: any): role is StaffRole {
  return typeof role === 'string' && VALID_STAFF_ROLES.includes(role as StaffRole);
}

export function getPermissionsForRole(role: StaffRole): Permission[] {
  return ROLE_PERMISSIONS_MAP[role] || [];
}

export function hasPermission(
  user: StaffUser | null,
  permission: Permission
): boolean {
  if (!user || !user.active) return false;
  const permissions = getPermissionsForRole(user.role);
  return permissions.includes(permission);
}

export function hasAnyPermission(
  user: StaffUser | null,
  permissions: Permission[]
): boolean {
  if (!user || !user.active) return false;
  const userPermissions = getPermissionsForRole(user.role);
  return permissions.some((p) => userPermissions.includes(p));
}

export function hasAllPermissions(
  user: StaffUser | null,
  permissions: Permission[]
): boolean {
  if (!user || !user.active) return false;
  const userPermissions = getPermissionsForRole(user.role);
  return permissions.every((p) => userPermissions.includes(p));
}

export function hasRole(
  user: StaffUser | null,
  roles: StaffRole | StaffRole[]
): boolean {
  if (!user || !user.active) return false;
  const roleList = Array.isArray(roles) ? roles : [roles];
  return roleList.includes(user.role);
}
