# Milestone 2.1A: Firebase Authentication Foundation

**Platform:** Oromia Agricultural Bureau Web Application  
**Version:** v0.3.1  
**Milestone Scope:** Firebase Configuration & Staff Authentication Foundation  

---

## Overview

Milestone 2.1A connects the Oromia Agricultural Bureau React/Vite web application to Firebase Authentication using the modular Firebase SDK (v10+).

This milestone establishes the initial authentication layer for staff members while preserving the entire public website, multilingual translation dictionaries, light/dark themes, and responsive design.

---

## Scope Implemented

The following core authentication components have been implemented:

1. **Firebase Environment Configuration** (`src/config/env.ts` and `.env.example`)
   - Structured parsing and trimming of `VITE_FIREBASE_*` environment variables.
   - Non-blocking status verification to provide clear developer guidance when environment variables are missing.

2. **Modular Firebase Initialization** (`src/lib/firebase.ts`)
   - Singleton initialization pattern preventing duplicate app instances during Vite Hot Module Replacement (HMR).
   - Clean export of `app`, `auth`, and prepared `db` references.

3. **Global Authentication Context & Hook** (`src/context/AuthContext.tsx` & `src/hooks/useAuth.ts`)
   - Authentication session restoration via Firebase `onAuthStateChanged`.
   - Methods exposed: `signIn(email, password)`, `sendPasswordReset(email)`, `signOut()`, `clearError()`.
   - Security-focused error translation preventing exposure of raw internal Firebase error codes.
   - Automatic browser session persistence handled strictly by Firebase Auth SDK (no passwords or tokens in `localStorage`).

4. **Staff Sign-In Page** (`src/pages/admin/AdminSignInPage.tsx`)
   - Accessible route: `/admin/login`.
   - Form controls with show/hide password toggle, email input, remembered session explanation, inline error feedback, and translated labels in Afaan Oromoo, Amharic, and English.
   - Automatic redirection to `/admin` if already authenticated.

5. **Password Reset Page** (`src/pages/admin/ForgotPasswordPage.tsx`)
   - Accessible route: `/admin/forgot-password`.
   - Form for requesting an automated reset link via Firebase `sendPasswordResetEmail`.

6. **Authentication Route Guard** (`src/components/auth/RequireAuthentication.tsx`)
   - Protects sensitive administrative routes.
   - Displays loading indicator while restoring session.
   - Redirects unauthenticated visitors to `/admin/login` with `location.state` tracking.

7. **Temporary Authenticated Landing Page** (`src/pages/admin/AdminAuthCheckpointPage.tsx`)
   - Accessible route: `/admin`.
   - Displays authenticated email, Firebase UID, session status, and sign-out controls.
   - Prominently displays security warnings clarifying that staff authorization is not yet enforced.

---

## Firebase Setup Instructions

### 1. Create Firebase Development Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it `oromia-agri-bureau-dev`.
3. Disable or enable Google Analytics according to project guidelines and click **Create Project**.

### 2. Enable Email & Password Authentication
1. In the Firebase Console left navigation, select **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, select **Email/Password**.
4. Enable the **Email/Password** toggle (leave Email link passwordless sign-in disabled).
5. Click **Save**.

### 3. Create a Web App in Firebase
1. In Project Overview, click the **Web icon (`</>`)** to add an app.
2. Register app name: `oromia-agri-web`.
3. Copy the `firebaseConfig` object values.

### 4. Configure Environment Variables
Copy `.env.example` to `.env` in the project root and populate the keys:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=oromia-agri-bureau-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=oromia-agri-bureau-dev
VITE_FIREBASE_STORAGE_BUCKET=oromia-agri-bureau-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 5. Create a Staff Test Account
1. Go to **Firebase Console > Authentication > Users**.
2. Click **Add user**.
3. Enter test credentials:
   - **Email:** `test.staff@oromiaagri.gov.et`
   - **Password:** `OromiaAgri2026!`
4. Click **Add user**.

---

## Verification & Testing Workflows

### Test 1: Sign-In Flow
1. Start application: `npm run dev`
2. Navigate to `/admin/login`.
3. Attempt sign-in with invalid credentials (`invalid@oromiaagri.gov.et` / `wrongpass`).
   - Verify inline error message: *"Invalid email or password."*
4. Enter valid test account (`test.staff@oromiaagri.gov.et` / `OromiaAgri2026!`).
5. Click **Sign In**.
6. Verify automatic redirection to `/admin`.

### Test 2: Password Reset
1. Navigate to `/admin/forgot-password`.
2. Enter `test.staff@oromiaagri.gov.et`.
3. Click **Send Reset Link**.
4. Verify success message displayed: *"Password reset email sent! Please check your inbox."*

### Test 3: Session Restoration
1. While authenticated on `/admin`, refresh the browser page (`F5` or `Ctrl+R`).
2. Verify loading state brief flash followed by immediate session restoration without prompting for credentials.

### Test 4: Route Guard Protection
1. Open a new Incognito browser window.
2. Directly navigate to `/admin`.
3. Verify automatic redirection to `/admin/login`.

### Test 5: Sign-Out Flow
1. On `/admin`, click **Sign Out**.
2. Verify state cleared and immediate redirection to `/admin/login`.

---

## Security Architecture & Current Limitations

> [!CAUTION]
> **CRITICAL SECURITY NOTICE FOR MILESTONE 2.1A**
> 
> Authentication alone DOES NOT grant staff authorization.
> 
> The `/admin` landing page in Milestone 2.1A verifies only that a valid Firebase Authentication user account exists. Any user account created in Firebase Authentication can log in at this stage.
> 
> **Do not deploy this checkpoint to production without completing Milestone 2.1B.**

### Required Next Steps (Milestone 2.1B+):
1. **Firestore Staff Users Collection (`staffUsers/{uid}`):** Enforce profile existence check for authenticated UIDs.
2. **Account Status Verification:** Verify `active === true` on every staff request.
3. **Role & Permission System:** Evaluate `role` (`superAdmin`, `contentAdmin`, `editor`, `marketOfficer`, `advisoryOfficer`) against permission matrix.
4. **Firestore Security Rules:** Deploy rules prohibiting read/write operations to unauthenticated or unauthorized users.
