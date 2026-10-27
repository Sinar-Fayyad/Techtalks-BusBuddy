# BusBuddy — UI Form Debug & Fix Report

**Project:** Techtalks-BusBuddy  
**Platform:** React Native (Expo) mobile app + Next.js web dashboard  
**Date:** 2026-10-27  
**Branch:** Mobile-UI-Fixes  
**Status:** Resolved  

## 1. Executive Summary

This report documents a complete UI form debugging and remediation effort for the BusBuddy mobile application. All 20 reference screens were cross-referenced against the source code.

**Two bugs were identified and fixed:**

| Severity | Bug | File | Status |
|----------|-----|------|--------|
| 🔴 Critical | `RoleSelectScreen.js` missing — app crashes on onboarding | `mobile/src/App.js` imports non-existent module | ✅ Fixed (file created) |
| 🟠 High | SignUpScreen driver retry hides editable fields | `mobile/src/screens/SignUpScreen.js` | ✅ Fixed (conditional rendering removed) |

## 2. General Form Setup

### 2.1 Architectural Overview

The BusBuddy application consists of two codebases sharing a common API:

| Component | Technology | Location | Purpose |
|-----------|-----------|----------|---------|
| Mobile App | React Native + Expo (v58) | `/mobile` | Native iOS/Android app |
| Web Dashboard | Next.js (App Router) | `/web` | Administrative web interfaces |
| Shared API | Node.js/Express | `/mobile/api.js` + `/web/app/api/` | REST backend with JWT auth |

### 2.2 Role-Based Navigation

| Role | Mobile Tabs | Web Routes |
|------|-------------|------------|
| **Student** | Home, Bookings, Scan, Settings, Profile | `/student/home`, `/student/bookings`, `/student/profile`, `/student/settings`, `/student/register` |
| **Parent** | Home, Children, Live Map, Profile | `/parent/home`, `/parent/children`, `/parent/map`, `/parent/profile`, `/parent/register`, `/parent/link` |
| **Driver** | Home, Trips, Students, Profile | `/driver/home`, `/driver/trips`, `/driver/students`, `/driver/profile`, `/driver/register` |

### 2.3 Form State Management

| Layer | Implementation | Files |
|-------|---------------|-------|
| Auth Context | React Context (`createContext`/`useContext`) | `mobile/src/ctx.js`, `web/app/auth-context.tsx` |
| Token Storage | `expo-secure-store` (mobile), `localStorage`/`sessionStorage` (web) | `mobile/src/App.js`, `web/app/auth-context.tsx` |
| Form State | `useState` hooks (local component state) | All form screens |
| Validation | Manual inline validation (no shared library) | Each form screen implements its own rules |
| API Client | `apiFetch` wrapper with AbortController timeout (10s) | `mobile/api.js`, `mobile/net.js`, `web/lib/client-api.ts` |

### 2.4 UI Component Library (Mobile)

| Component | Purpose |
|-----------|---------|
| `Screen` | Gradient background + ScrollView with pull-to-refresh |
| `Card` | Glassmorphism card with optional glow effect |
| `Field` | Pill-shaped input with icon, error state, password toggle |
| `Btn` | Primary/danger/ghost button with loading spinner |
| `Notice` | Error/OK/info banner |
| `Segmented` | Pill-shaped tab selector |
| `Chip` | Status badge with color-coded tones |
| `Sheet` | Bottom modal sheet |
| `StatBox` | Statistic card with icon and label |
| `Avatar` | Circular user avatar with initials fallback |
| `CardTitle` | Card header with icon and optional right-side content |

## 3. File Inventory (All Source Files Reviewed)

### Mobile Screens (`mobile/src/screens/`)

| File | Purpose | Form Elements |
|------|---------|---------------|
| `WelcomeScreen.js` | Onboarding landing | None (navigation only) |
| `RoleSelectScreen.js` | **NEW** — Role selection | None (navigation only) |
| `LoginScreen.js` | Sign in (all roles) | Identifier, Password, Remember me |
| `SignUpScreen.js` | Sign up (role-specific) | Name, University (student), Phone, Email, Password, Confirm, License photo (driver) |
| `StudentHome.js` | Student dashboard | None (read-only + scan nav) |
| `StudentBookings.js` | Browse/book trips | Search field, pickup stop (in BookSheet) |
| `StudentProfile.js` | Student account | Link code generator, Edit profile sheet |
| `StudentScan.js` | QR scan board/exit | Camera barcode scanner |
| `DriverHome.js` | Driver dashboard | Trip start/stop, QR code display |
| `DriverTrips.js` | Trip management | Trip form modal (origin, dest, date, time, seats, price, stops) |
| `DriverStudents.js` | Student roster | Search field, status filter |
| `DriverProfile.js` | Driver account | Personal info, license upload, vehicle plate/seats/price/route/stops, Change password |
| `ParentHome.js` | Parent dashboard | None (read-only + child nav) |
| `ParentChildren.js` | Child management | Search field, status filter |
| `ParentLink.js` | Link student | Student email, 6-digit link code |
| `ParentMap.js` | Live child tracking | None (read-only map) |
| `ParentProfile.js` | Parent account | Edit profile sheet, Change password |
| `PermissionsScreen.js` | Permission gate | None (system permission dialogs) |
| `SettingsScreen.js` | Settings | Change password |

### Mobile Shared Components (`mobile/src/`)

| File | Purpose |
|------|---------|
| `ui.js` | Shared UI components (Field, Btn, Card, Screen, etc.) |
| `parts.js` | TripCard, BookSheet, ChangePasswordCard, EditProfileSheet |
| `driverParts.js` | useGps hook, TripFormSheet, ReportSheet |
| `ctx.js` | AppContext (token, role, me, refreshMe, logout) |
| `net.js` | API call wrapper (call, errOf, uploadNative) |
| `format.js` | Date/format helpers, EMAIL_RE, PHONE_HINT, phoneOk |
| `Shell.js` | Navigation shell with tab bar per role |
| `MapView.js` | Leaflet map inside WebView |
| `live.js` | useLiveChildren hook (parent child tracking) |
| `Bell.js` | Notification bell |

### Web Components (`web/components/`)

| File | Purpose |
|------|---------|
| `SignUpForm/index.tsx` | Role-specific sign-up form |
| `TripFormModal/index.tsx` | Add/edit trip modal |
| `BookModal/index.tsx` | Booking confirmation modal |
| `ChangePasswordCard/index.tsx` | Password change form |
| `ReportIssueModal/index.tsx` | Vehicle issue report form |
| `Field/index.tsx` | Web input component (pill with icon) |
| `Input/index.tsx` | Basic web input |
| `Modal/index.tsx` | Accessible modal dialog |
| `ErrorMessage/index.tsx` | Error text display |
| `QrBox/index.tsx` | QR code display |
| `LocationGate/index.tsx` | Location permission gate |
| `ChildrenMap/index.tsx` | Parent child map |


## 4. Fixed Bugs

### Bug #1: Critical — Missing `RoleSelectScreen.js` (Onboarding Blocker)

**File:** `mobile/src/App.js` line 8  
**Import:** `import RoleSelectScreen from './screens/RoleSelectScreen';`

**Root Cause:** The `RoleSelectScreen` module was imported in `App.js` but the corresponding file did not exist in `mobile/src/screens/`. When a new user taps "Get Started" on the Welcome screen, the app attempts to navigate to the role selection stage and crashes with a "module not found" error.

**Impact:** Complete blocker for new user onboarding. No user can sign up or proceed past the Welcome screen.

**Fix Applied:** Created `mobile/src/screens/RoleSelectScreen.js` with:
- Three selectable role cards (Student, Parent, Driver)
- Matching icons (school-outline, people-outline, bus-outline)
- Color-coded accents matching the brand palette
- Back navigation to Welcome screen
- Direct role selection (tap card → proceed to sign-up for that role)
- Consistent with web `/get-started` page and Image 20 design

**Verification:** File exists at `mobile/src/screens/RoleSelectScreen.js` and import path in `App.js` resolves correctly.

---

### Bug #2: High — SignUpScreen Driver Retry Hides Editable Fields

**File:** `mobile/src/screens/SignUpScreen.js` lines 122–131

**Root Cause:** The basic sign-up fields (Full Name, Phone, Email, Password, Confirm Password) were wrapped in `{!retry ? (...) : null}`. When a driver's license upload previously failed and `retry` state was set to `true`, all these fields were hidden from the UI, leaving only the "Retry license upload" button visible. The user could not correct any other information before retrying.

**Impact:** Drivers who fail license upload are stuck — they cannot edit their name, phone, email, or password before retrying the license upload.

**Fix Applied:** Removed the `{!retry ? (...) : null}` conditional wrapper so all basic fields are always rendered. The license photo section remains conditionally shown only for the `driver` role. The `retry` state now only changes the button label ("Retry license upload" vs "Sign Up") as originally intended.

**Verification:** Fields are now always visible regardless of `retry` state. The license upload section still correctly appears only for driver role.


## 5. Identified but Not Fixed (Medium/Low Priority)

The following issues were identified during review but are not blocking and are documented for future sprint planning:

| # | File | Issue | Recommendation |
|---|------|-------|----------------|
| 1 | All mobile forms | No shared form validation library | Consider adopting React Hook Form or Formik with Yup/Zod schemas for consistent validation |
| 2 | Mobile app (all files) | No TypeScript | Gradual migration to TypeScript for compile-time type safety |
| 3 | `mobile/src/screens/ParentLink.js` | No visual digit grouping for link code | Match StudentProfile's individual digit box design |
| 4 | All mobile forms | Validation only on submit | Add onBlur/onChange validation for better UX |
| 5 | Mobile LoginScreen | No Google Sign In option | Web has it; consider adding for parity |
| 6 | Mobile forms | No loading state on data refresh | Only initial load shows ActivityIndicator; refreshes are silent |

## 6. Component Hierarchy (Final)

### Mobile App Navigation Tree

```
App.js
├── WelcomeScreen (onGetStarted, onLogin)
│   └── RoleSelectScreen (onContinue, onBack)  ← NEW
├── RoleSelect → SignUpScreen (role, onLogin, onBack, onGoLogin)
├── LoginScreen (onLogin, onGoSignUp, onBack)
├── PermissionsScreen (role, onDone)
└── Shell (token, role, onLogout)
    ├── Student tabs:
    │   ├── StudentHome (nav)
    │   ├── StudentBookings (params)
    │   │   └── BookSheet (trip, token, onClose, onBooked)
    │   ├── StudentScan (params)
    │   ├── SettingsScreen
    │   └── StudentProfile
    │       └── EditProfileSheet (me, token, onClose, onSaved)
    ├── Parent tabs:
    │   ├── ParentHome (nav)
    │   ├── ParentChildren (nav)
    │   ├── ParentMap (params)
    │   └── ParentProfile (nav)
    │       └── EditProfileSheet / ChangePasswordCard
    └── Driver tabs:
        ├── DriverHome (nav)
        │   ├── TripFormSheet (token, defaults, onClose, onSaved)
        │   └── ReportSheet (token, onClose)
        ├── DriverTrips (nav)
        │   └── TripFormSheet (token, trip, defaults, onClose, onSaved)
        ├── DriverStudents (params)
        └── DriverProfile
            └── EditProfileSheet / ChangePasswordCard
```

Extra (non-tab) route:
- `ParentLink` (nav) — linked via `EXTRA.link` in Shell.js

### Web App Navigation Tree

```
layout.tsx (AuthProvider)
├── page.tsx (landing)
├── get-started/page.tsx (Choose Your Role)
├── login/page.tsx (Sign In form)
├── student/register/page.tsx → SignUpForm (role=student)
├── parent/register/page.tsx → SignUpForm (role=parent)
├── driver/register/page.tsx → SignUpForm (role=driver)
├── parent/link/page.tsx (Link Student form)
├── student/home/page.tsx
├── student/bookings/page.tsx
├── student/profile/page.tsx
├── student/settings/page.tsx
├── parent/home/page.tsx
├── parent/children/page.tsx
├── parent/map/page.tsx
├── parent/profile/page.tsx
├── driver/home/page.tsx
├── driver/trips/page.tsx
├── driver/students/page.tsx
├── driver/profile/page.tsx
├── driver/register/page.tsx
├── admin/* (admin routes)
└── api/* (REST endpoints)


## 7. Design System Consistency

### Colors (Mobile — `mobile/src/ui.js`)

| Token | Value | Usage |
|-------|-------|-------|
| `C.bg` | `#050b3a` | App background |
| `C.cyan` | `#00e5ff` | Primary accent, active states |
| `C.pink` | `#ff3d8b` | Danger, errors |
| `C.green` | `#19e3a0` | Success, confirmed |
| `C.amber` | `#ffb02e` | Warnings, pending |
| `C.violet` | `#b08cff` | Secondary accents |
| `C.panel` | `rgba(255,255,255,0.08)` | Card background |
| `C.line` | `rgba(0,229,255,0.30)` | Borders, dividers |

### Form Field Pattern (Mobile)

All mobile `Field` components follow this pattern:

```
<Field
  icon="<ionicon-name>"
  placeholder="<hint>"
  value={state}
  onChangeText={setState}
  error={errors.field}
  keyboardType="<type>"
  secure={boolean}
/>
```

Error text is rendered below the field in red (`#ff8f8f`).

## 8. Verification Checklist

| Item | Status |
|------|--------|
| `RoleSelectScreen.js` created at correct path | ✅ |
| Import path in `App.js` matches file location | ✅ |
| `SignUpScreen.js` fields always rendered (retry fix) | ✅ |
| License upload section still driver-only | ✅ |
| All existing imports in modified files intact | ✅ |
| No other files reference missing modules | ✅ (verified App.js is the only importer) |
| Web app unaffected (separate codebase) | ✅ |

## 9. Conclusion

The two identified UI form bugs have been resolved:

1. **Critical onboarding blocker fixed** — `RoleSelectScreen.js` was created, allowing new users to select their role and proceed to sign-up.
2. **Driver retry UX fixed** — Sign-up fields are now always visible during license retry, preventing data loss.

The application's form architecture is sound with consistent patterns across all screens. No additional breaking bugs were found in the form components. The remaining issues (TypeScript migration, shared validation library, real-time validation) are recommended for future sprint planning.

---

**Report prepared by:** Cline AI Coding Agent  
**Project:** Techtalks-BusBuddy  
**Branch:** Mobile-UI-Fixes  
**Files modified:** 1 created, 1 edited  
**Lines changed:** +75 (new file), -10/+8 (edit)

