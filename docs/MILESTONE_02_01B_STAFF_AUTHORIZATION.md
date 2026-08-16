# Milestone 2.1B Documentation: Firestore-Backed Staff Authorization

**Project**: Oromia Agricultural Bureau Digital Portal  
**Milestone**: 2.1B (Staff Authorization & Role-Based Permissions Foundation)  
**Status**: Verified & Completed  

---

## 1. Executive Summary

Milestone 2.1B expands the basic Firebase authentication foundation (Milestone 2.1A) into a secure, Firestore-backed staff authorization engine with centralized role and permission management, protected administrative route guards, a responsive admin dashboard shell, and initial default-deny security rules for Firestore and Storage.

---

## 2. Staff Profile Firestore Schema (`staffUsers/{uid}`)

Staff user profiles are stored in Firestore under the `staffUsers` collection using the Firebase Auth UID as the document ID (`/staffUsers/{uid}`).

```json
{
  "uid": "aB3x9kL2pQ01z",
  "email": "alemayehu.t@oromiaagri.gov.et",
  "displayName": "Alemayehu Tadesse",
  "role": "superAdmin",
  "active": true,
  "preferredLanguage": "om",
  "createdAt": "2026-08-01T10:00:00Z",
  "updatedAt": "2026-08-04T12:00:00Z",
  "lastLoginAt": "2026-08-04T12:00:00Z"
}
```

### Recognized Staff Roles (`StaffRole`)

| Role | Role Identifier | Description |
| :--- | :--- | :--- |
| **Super Administrator** | `superAdmin` | Full administrative control, role assignment, system settings, staff management. |
| **Content Administrator** | `contentAdmin` | Manages news, announcements, achievements, and publications across all languages. |
| **Content Editor** | `editor` | Drafts and edits news articles and achievement cases. Cannot publish directly. |
| **Market Officer** | `marketOfficer` | Manages regional market commodity prices and trade volume data. |
| **Advisory Officer** | `advisoryOfficer` | Manages urgent agricultural alerts, pest warnings, and extension notices. |

---

## 3. Centralized Permission Mapping Matrix

| Permission Key | Description | `superAdmin` | `contentAdmin` | `editor` | `marketOfficer` | `advisoryOfficer` |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `dashboard.view` | View admin control panel | ✅ | ✅ | ✅ | ✅ | ✅ |
| `content.view` | View news & achievements | ✅ | ✅ | ✅ | ❌ | ❌ |
| `content.create` | Draft news & achievements | ✅ | ✅ | ✅ | ❌ | ❌ |
| `content.edit` | Modify news & achievements | ✅ | ✅ | ✅ | ❌ | ❌ |
| `content.publish` | Publish/unpublish articles | ✅ | ✅ | ❌ | ❌ | ❌ |
| `alerts.manage` | Manage agricultural alerts | ✅ | ❌ | ❌ | ❌ | ✅ |
| `market.manage` | Manage commodity prices | ✅ | ❌ | ❌ | ✅ | ❌ |
| `resources.manage` | Manage extension manuals | ✅ | ✅ | ❌ | ❌ | ❌ |
| `staff.manage` | Manage staff user roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| `settings.manage` | Configure system settings | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Verification Workflows & Security Guarantees

1. **Active Status Verification**: Users with `active === false` are immediately rejected with an `inactive` authorization status and redirected to `/admin/unauthorized`.
2. **Real-time Synchronization**: Firestore `onSnapshot` listeners ensure that disabling a staff user or changing their role takes effect instantly without page refreshes.
3. **Route Protection**: All `/admin/*` sub-routes are guarded by `RequireStaffAuthorization` and `RequirePermission`.
4. **Data Validation**: Strict runtime validation prevents corrupted or spoofed Firestore documents from granting unauthorized access.

---

## 5. Security Rules Summary

- **`firestore.rules`**: Implements default-deny on all unlisted paths. Grants `staffUsers` document reads only to authenticated owners or `superAdmin`. Client-side writes to roles and active status are blocked.
- **`storage.rules`**: Implements default-deny for all file uploads, documenting future CMS image/PDF storage paths for Milestone 2.2+.

---

## 6. SuperAdmin Bootstrap Guide

To seed the initial SuperAdmin staff document in Firestore:

1. Create a user in Firebase Auth with email `superadmin@oromiaagri.gov.et`.
2. In the Firestore console, create a document at `staffUsers/{UID_FROM_AUTH}`:
   ```json
   {
     "uid": "{UID_FROM_AUTH}",
     "email": "superadmin@oromiaagri.gov.et",
     "displayName": "Oromia Admin",
     "role": "superAdmin",
     "active": true,
     "preferredLanguage": "om"
   }
   ```
