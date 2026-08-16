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
  'investment.sources.manage',
  'investment.datasets.manage',
  'investment.opportunities.manage',
  'investment.config.manage',
  'gis.manage',
  'fleet.view',
  'fleet.asset.manage',
  'fleet.assign',
  'fleet.maintenance.manage',
  'fleet.reports.view',
  'fleet.asset.retire',
];

export const VALID_STAFF_ROLES: StaffRole[] = [
  'superAdmin',
  'contentAdmin',
  'editor',
  'marketOfficer',
  'advisoryOfficer',
  'fleetOfficer',
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
  // Runs the vehicle and machinery register day to day: adds assets, issues and
  // receives them, and manages garage work. Retiring an asset is withheld — it
  // is the one irreversible action here, and it belongs with a super admin.
  fleetOfficer: [
    'dashboard.view',
    'fleet.view',
    'fleet.asset.manage',
    'fleet.assign',
    'fleet.maintenance.manage',
    'fleet.reports.view',
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
