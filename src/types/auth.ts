export type StaffRole =
  | 'superAdmin'
  | 'contentAdmin'
  | 'editor'
  | 'marketOfficer'
  | 'advisoryOfficer'
  | 'fleetOfficer';

export type SupportedLanguage = 'om' | 'am' | 'en';

export interface StaffUser {
  uid: string;
  email: string;
  displayName: string;
  role: StaffRole;
  active: boolean;
  preferredLanguage: SupportedLanguage;
  createdAt?: any;
  updatedAt?: any;
  lastLoginAt?: any;
}

export type Permission =
  | 'dashboard.view'
  | 'content.view'
  | 'content.create'
  | 'content.edit'
  | 'content.publish'
  | 'alerts.manage'
  | 'market.manage'
  | 'resources.manage'
  | 'staff.manage'
  | 'settings.manage'
  | 'audit.view'
  | 'audit.export'
  | 'media.view'
  | 'media.upload'
  | 'media.delete'
  | 'media.manage'
  | 'achievement.view'
  | 'achievement.create'
  | 'achievement.edit'
  | 'achievement.review'
  | 'achievement.publish'
  | 'achievement.trash'
  | 'achievement.restore'
  | 'achievement.delete'
  | 'alert.view'
  | 'alert.create'
  | 'alert.edit'
  | 'alert.review'
  | 'alert.publish'
  | 'alert.trash'
  | 'alert.restore'
  | 'alert.delete'
  | 'investment.view'
  | 'investment.edit'
  | 'investment.publish'
  | 'investment.verify'
  | 'investment.sources.manage'
  | 'investment.datasets.manage'
  | 'investment.opportunities.manage'
  | 'investment.config.manage'
  | 'gis.manage'
  | 'fleet.view'
  | 'fleet.asset.manage'
  | 'fleet.assign'
  | 'fleet.maintenance.manage'
  | 'fleet.reports.view'
  | 'fleet.driver.manage'
  | 'fleet.fuel.record'
  | 'fleet.asset.retire';

export type StaffAuthorizationStatus =
  | 'loading'
  | 'signedOut'
  | 'profileMissing'
  | 'inactive'
  | 'unknownRole'
  | 'malformedProfile'
  | 'authorizationError'
  | 'serviceError'
  | 'authorized'
  | 'error';

export interface StaffProfileValidationResult {
  valid: boolean;
  profile?: StaffUser;
  errorStatus?:
    | 'profileMissing'
    | 'inactive'
    | 'unknownRole'
    | 'malformedProfile'
    | 'authorizationError'
    | 'serviceError'
    | 'error';
  errorMessage?: string;
}

export function validateStaffProfile(
  data: any,
  expectedUid: string
): StaffProfileValidationResult {
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errorStatus: 'profileMissing',
      errorMessage: `Staff profile document at staffUsers/${expectedUid} does not exist or is empty.`,
    };
  }

  // Validate required fields exist
  const requiredFields = ['uid', 'email', 'displayName', 'role', 'active', 'preferredLanguage'];
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      return {
        valid: false,
        errorStatus: 'malformedProfile',
        errorMessage: `Staff profile document is missing required field: "${field}".`,
      };
    }
  }

  // Validate document ID / uid field equals authenticated UID
  if (typeof data.uid !== 'string' || data.uid !== expectedUid) {
    return {
      valid: false,
      errorStatus: 'malformedProfile',
      errorMessage: `Staff profile "uid" field ("${data.uid}") does not match authenticated UID ("${expectedUid}").`,
    };
  }

  // Validate active field is boolean
  if (typeof data.active !== 'boolean') {
    return {
      valid: false,
      errorStatus: 'malformedProfile',
      errorMessage: 'Staff profile field "active" must be a boolean.',
    };
  }

  if (data.active !== true) {
    return {
      valid: false,
      errorStatus: 'inactive',
      errorMessage: 'This staff account is set to inactive status (active === false).',
    };
  }

  // Validate role
  const role = data.role;
  // Must stay in step with the StaffRole union above. fleetOfficer was missing
  // from this list for four rounds: present in the union, in AuthContext's
  // VALID_ROLES, in both permission tables, in firestore.rules and in the demo
  // accounts — everywhere except the one function that gates real sign-in. A
  // staff document with that role was rejected as 'unknownRole' and bounced to
  // /admin/unauthorized. Demo mode never reaches this check, which is why it
  // survived. fleetConsistencyTests asserts the two agree.
  const validRoles: StaffRole[] = [
    'superAdmin',
    'contentAdmin',
    'editor',
    'marketOfficer',
    'advisoryOfficer',
    'fleetOfficer',
  ];

  if (typeof role !== 'string' || !validRoles.includes(role as StaffRole)) {
    return {
      valid: false,
      errorStatus: 'unknownRole',
      errorMessage: `Unrecognized or missing staff role: "${role}".`,
    };
  }

  // Validate email
  const email = data.email;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return {
      valid: false,
      errorStatus: 'malformedProfile',
      errorMessage: 'Staff profile contains an invalid or missing email address.',
    };
  }

  const preferredLanguage: SupportedLanguage =
    data.preferredLanguage === 'am' || data.preferredLanguage === 'en'
      ? data.preferredLanguage
      : 'om';

  const profile: StaffUser = {
    uid: expectedUid,
    email: email.trim(),
    displayName: String(data.displayName).trim() || 'Staff Member',
    role: role as StaffRole,
    active: true,
    preferredLanguage,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    lastLoginAt: data.lastLoginAt,
  };

  return {
    valid: true,
    profile,
  };
}

