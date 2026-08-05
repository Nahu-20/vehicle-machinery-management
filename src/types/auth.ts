export type StaffRole =
  | 'superAdmin'
  | 'contentAdmin'
  | 'editor'
  | 'marketOfficer'
  | 'advisoryOfficer';

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
  | 'audit.export';

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
  const validRoles: StaffRole[] = [
    'superAdmin',
    'contentAdmin',
    'editor',
    'marketOfficer',
    'advisoryOfficer',
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

