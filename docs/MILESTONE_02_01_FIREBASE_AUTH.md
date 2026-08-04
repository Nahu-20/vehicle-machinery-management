# Milestone 2.1 — Firebase Authentication & Authorization Implementation Guide

## Overview

Milestone 2.1 establishes the authentication and role-based authorization foundation for the **Oromia Agricultural Bureau** web application.

---

## 1. Firebase Project Setup & Environment Variables

### Expected Environment Variables

In `.env` (derived from `.env.example`):

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

> **Security Note:** Real environment values are never committed to version control. If configuration keys are missing, the system gracefully operates in local demonstration mode.

---

## 2. Bootstrapping the First Staff SuperAdmin Account

### Step 1: Create Firebase Authentication User
In the [Firebase Console](https://console.firebase.google.com):
1. Navigate to **Authentication** → **Users** tab.
2. Click **Add User**.
3. Enter email (e.g., `admin@oromiaagri.gov.et`) and set a secure password.
4. Copy the generated **User UID** (e.g., `8xK9pQ...`).

### Step 2: Provision `staffUsers/{uid}` Document
In **Firestore Database**:
1. Create a document in collection `staffUsers` where the **Document ID** is equal to the **User UID**:

```json
{
  "uid": "8xK9pQ...",
  "email": "admin@oromiaagri.gov.et",
  "displayName": "Dr. Chala Gudina",
  "role": "superAdmin",
  "active": true,
  "preferredLanguage": "om",
  "createdAt": "2026-08-04T00:00:00Z",
  "updatedAt": "2026-08-04T00:00:00Z"
}
```

---

## 3. Staff Role & Permission Mapping

| Role | Description | Granted Permissions |
| :--- | :--- | :--- |
| **`superAdmin`** | System & IT Administrator | All 10 permissions (`dashboard.view`, `content.view`, `content.create`, `content.edit`, `content.publish`, `alerts.manage`, `market.manage`, `resources.manage`, `staff.manage`, `settings.manage`) |
| **`contentAdmin`** | Bureau Content Manager | `dashboard.view`, `content.view`, `content.create`, `content.edit`, `content.publish`, `resources.manage` |
| **`editor`** | Content Writer | `dashboard.view`, `content.view`, `content.create`, `content.edit` |
| **`marketOfficer`** | Market Data Specialist | `dashboard.view`, `market.manage` |
| **`advisoryOfficer`** | Regional Advisory Officer | `dashboard.view`, `alerts.manage` |

---

## 4. Authorization Enforcement Rules

A user may access the `/admin` dashboard only when:
1. Firebase Authentication token is valid.
2. `staffUsers/{uid}` document exists in Firestore.
3. `active === true`.
4. `role` is recognized in the predefined list of roles.

---

## 5. Security Rules Deployment

### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

Key guarantees in `firestore.rules`:
- Default deny on all unmapped paths.
- Public users cannot read or query `staffUsers`.
- Staff users cannot elevate their own roles or activate themselves.
- Non-staff or inactive staff reads/writes are rejected.

### Deploy Storage Rules
```bash
firebase deploy --only storage
```
All uploads are denied until full CMS media uploads are enabled in Milestone 2.2.

---

## 6. Testing Authorization States

1. **Signed Out Access:** Navigating directly to `/admin` redirects to `/admin/login`.
2. **Invalid Credentials:** Renders explicit error banner on `/admin/login`.
3. **No Staff Profile:** Authenticated user without `staffUsers/{uid}` redirects to `/admin/unauthorized`.
4. **Inactive Account:** Account with `active = false` redirects to `/admin/unauthorized`.
5. **Role-Gated Route:** User without permission navigating to restricted subpath (e.g. `editor` opening `/admin/staff`) is redirected to `/admin/unauthorized`.
6. **Demonstration Persona Switcher:** Available on `/admin/login` for instant local audit.

---

## 7. Known Limitations (Milestone 2.1)

- Public content CRUD editing will be added in Milestone 2.2.
- Public mock data remains fallback until Firestore migration in Milestone 2.3.
- Self-registration is intentionally disabled.
