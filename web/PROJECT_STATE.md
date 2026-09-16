# BusBuddy — PROJECT_STATE.md

This file is the single source of truth for the current state of the project.
Every teammate MUST append an update block at the end of this file before opening their PR. Never delete or edit other people's entries. Pull from dev before starting work so you have the latest version.

## Stack

- Web + Backend: one Next.js project (web/) using the App Router — pages in app/, API routes in app/api/
- Database: MySQL via WAMP/phpMyAdmin — database: BusBuddy_app
- Mobile: Expo/React Native app in mobile/
- Git: work happens on feature branches, PRs into dev. Sino reviews and merges.

## Backend endpoints (existing)

- POST /api/auth/signup — creates user, bcrypt-hashed password
- POST /api/auth/login — returns JWT (user id + role: admin/driver)
- POST /api/driver/profile — creates driver profile (status=pending), requires Bearer token
- POST /api/driver/license — uploads PDF/JPG/PNG max 5MB, stores privately in web/uploads/
- GET /api/driver/license/[name] — protected file viewing (token via header or URL param)
- GET /api/admin/drivers — pending drivers list, admins only
- PATCH /api/admin/drivers/[id] — verify/reject a driver

## Web pages (existing)

- /driver/register — driver registration form with license file upload
- /admin/drivers — pending drivers list (token pasted manually — being replaced by login in Sprint 2)

## Mobile (existing)

- Single file mobile/App.js — driver registration with gallery photo pick
  (expo-image-picker) + upload (expo-file-system/legacy), same API as web

## Conventions (must follow)

- UI lives in web/components/ (Button, Input), each with its own CSS Module
- Colors ONLY via CSS variables from web/app/globals.css (--navy, --amber, --grey, --danger, --success)
- API contract is the source of truth: web/docs/API_CONTRACT.md — never invent endpoints
- Tests live in web/docs/TESTING.md — 20 tests passing from Sprint 1

## Current known gaps

- No login page / no persistent session (token pasted manually in admin UI)
- No auth context — token lost on navigation
- Mobile is one big file, no navigation structure
- License viewing not yet enforced admins-only
- GPS/trips: nothing built yet

## Sprint 2 plan (current)

- Day 1: T1 login page, T3 license admins-only, T5 mobile refactor (needs T10 mockup first)
- Day 2: T2 auth session, T4 license inline, T6 mobile login
- Day 3: T7 driver my-status page, T8 GPS spike (trips table + start/stop API), T9 design cleanup
- Day 4: T13 acceptance testing, T14 test checklist, T15 sprint report
- Dana delivers mockups: T10 (before Day 1), T11 (before Day 3), T12 (before Day 4)

---

## Changelog

## 16/09/2026 — Wassim Mahmoud — Login Page (web)
- Added the /login page: email/password form with client-side validation, password visibility toggle, loading/success/error states, styled per T10 mockup (gradient background, glass card, pill inputs).
- Calls POST /api/auth/login per API contract v1. Token is not stored and no session is kept (T2 scope).

- New/changed: web/app/login/page.tsx, web/app/login/page.module.css (new); web/app/globals.css (added --bb-* theme variables; existing 5 variables untouched). No new endpoints, no DB changes, shared Input/Button components not modified.
- How it was tested: admin login and driver login return success message with role (200); wrong password shows error and stays on /login (401); empty or invalid-format email shows inline errors and makes no API call (verified in DevTools Network tab); server stopped shows friendly error and page stays usable. Accounts verified in phpMyAdmin (roles correct, bcrypt hashes).
- Gotchas others must know: page uses its own CSS module instead of shared Input/Button (they don't support pill/gradient styles) — T9 design cleanup should unify this. Safari blur needs -webkit-backdrop-filter; an @supports fallback raises card opacity where blur is unsupported. The schema SQL should be committed to the repo by the DB owner — local setup required importing it manually.

## Changes
- New /login page (web/app/login/page.tsx + web/app/login/page.module.css)
- Client-side validation: empty fields, email format — failed validation makes no API call
- Password visibility toggle (client-side only)
- Loading, success, and error states
- T10 styling: gradient background, glass card, pill inputs; -webkit-backdrop-filter with @supports fallback
- New --bb-* CSS variables in globals.css (existing variables untouched)
- Calls POST /api/auth/login per contract v1; token is not stored (T2 handles sessions)

## How to test
1. Import schema (or have DB running), create an admin and a driver account via POST /api/auth/signup
2. npm run dev → open http://localhost:3000/login
3. Admin credentials → "Login successful as admin." (200 in Network tab)
4. Driver credentials → "Login successful as driver." (200)
5. Wrong password → error message, stays on /login (401)
6. Empty submit, then email "abc" → inline errors, no network request
7. Stop dev server → submit → friendly error; restart → works again


<!-- Append your block below this line after finishing a task. Format:

## YYYY-MM-DD — [name] — [task name]
- What was added (2-3 lines, factual)
- New/changed: endpoints, DB tables, components, files
- How it was tested (success + error cases)
- Gotchas others must know (if any)
-->
