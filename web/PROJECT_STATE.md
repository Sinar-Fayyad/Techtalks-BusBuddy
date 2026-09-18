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

## 2026-09-18 — [jad kamal el dine] — T8 — GPS spike: trips table + start/stop API

- Added the trips table (id PK, driver_id FK -> drivers.id ON DELETE RESTRICT,
  start_time DATETIME(3) UTC, end_time DATETIME(3) NULL = trip active, created_at,
  index on (driver_id, start_time)) and three endpoints: POST /api/driver/trips/start
  (driver_id from JWT, verified-only, 409 double-start guard via transaction +
  FOR UPDATE), POST /api/driver/trips/stop (sets end_time, 404 when none active),
  GET /api/admin/drivers/[id]/trips (admin-only, newest first, 400/404 handling).
  API_CONTRACT.md sections 7-9 added (Sino approved).
- New/changed: web/app/api/driver/trips/start/route.ts, web/app/api/driver/trips/stop/route.ts,
  web/app/api/admin/drivers/[id]/trips/route.ts (new); web/docs/API_CONTRACT.md;
  DB: CREATE TABLE trips (SQL sent to Sino for the shared schema). No existing
  endpoints, components, or teammates' files touched.
- How it was tested (Apidog + phpMyAdmin): start -> 201, row verified in DB
  (correct driver_id, start_time matches response string-for-string, end_time NULL);
  double-start -> 409; stop -> 200, end_time filled and identical in DB, start_time
  untouched; stop again -> 404; start/stop/start lifecycle repeats (multiple completed
  rows). Admin list -> 200, all fields match MySQL, newest first; empty driver -> 200
  {"trips":[]}. Errors: no/garbage token 401; admin token on driver routes 403;
  driver token on admin route 403; unverified start 403; no profile 404; unknown
  driver 404; non-numeric id 400.
- Gotchas others must know: times stored UTC via UTC_TIMESTAMP(3), returned as
  strings (CAST AS CHAR) so API responses match phpMyAdmin exactly — format on the
  client. Stop has no verified-check on purpose (driver must end an in-progress trip).
  users table needs the password_hash column (ALTER TABLE users CHANGE password
  password_hash VARCHAR(255) NOT NULL) or signup/login break — same open issue Tamara
  noted. VS Code "compact folders" display nested API folders misleadingly
  (trips/start/start looked like trips/start) — disabled the setting; a 404-HTML from
  a route you just wrote usually means wrong folder depth.
## 2026-09-17 — Tamara — T2 — Auth session (web)
- Added a client-side auth context (web/app/auth-context.tsx) that stores the JWT and role
returned by POST /api/auth/login in localStorage (keys: bb_token, bb_role) and restores
them on refresh. The login page now calls login() on success and redirects admins to
/admin/drivers. The /admin/drivers page no longer uses the manual token paste-box: it
reads the session, redirects to /login when no session exists, shows an "Access denied"
screen with no API call for non-admin roles, auto-logs-out on 401, and has a Logout button.
- New/changed: web/app/auth-context.tsx (new); web/app/layout.tsx (children wrapped in
AuthProvider); web/app/login/page.tsx (stores session, admin redirect); web/app/admin/drivers/page.tsx
(session guards, logout). No new endpoints, no DB changes, shared components untouched.
- How it was tested (all on 2026-09-17): 1) admin login -> auto-redirect to /admin/drivers;
2) browser refresh -> session restored, still logged in; 3) logout -> opening
/admin/drivers by URL redirects to /login; 4) driver login -> /admin/drivers shows
"Access denied" with no data and no API call; 5) wrong password -> 401 error, stays on
/login (T1 behavior unchanged). Accounts created via POST /api/auth/signup and verified
in the database (roles correct).
- Gotchas others must know: localStorage keys are bb_token/bb_role (the old admin_token
key is abandoned). The admin page waits for a `ready` flag before redirecting — without
it a refresh briefly sees token=null and falsely redirects to /login. The schema SQL
shared in chat names the password column `password` but the signup/login routes use
`password_hash` — local DBs need the column named password_hash (ALTER TABLE
BusBuddy_app.users CHANGE password password_hash VARCHAR(255) NOT NULL); the committed
schema should be reconciled with the code. Local setup also requires web/.env with
DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET (JWT_SECRET is required by all
protected routes). T4 also edits web/app/admin/drivers/page.tsx — whoever merges second
may need to resolve small conflicts.

## Changes
- New AuthProvider (web/app/auth-context.tsx): holds token + role in React state,
persisted in localStorage (bb_token / bb_role), restored on refresh.
- web/app/layout.tsx: app wrapped in AuthProvider.
- Login page: stores token/role after successful POST /api/auth/login; admins are
redirected to /admin/drivers.
- Admin drivers page: manual token paste-box removed. Session-based instead:
no session -> redirect to /login; driver token -> "Access denied" with zero API
calls; 401 (stale/invalid token) -> auto-logout -> /login; Logout button clears
the session.

## How to test
1. Set up web/.env (DB + JWT_SECRET) and the BusBuddy_app schema, then create an
admin and a driver account via POST /api/auth/signup.
2. Log in as admin at /login -> lands on /admin/drivers, data loads.
3. Refresh -> still logged in.
4. Logout -> open /admin/drivers by URL -> redirected to /login.
5. Log in as driver -> /admin/drivers -> "Access denied", no data.
6. Corrupt bb_token in DevTools -> Application -> Local Storage, refresh -> logged out.

## 2026-09-17 — Tamara — T7 - Driver my Status Page
- Added GET /api/driver/me (web/app/api/driver/me/route.ts): verifies the JWT from the
Authorization header, rejects non-driver roles (403), and returns only the caller's own
driver row (JOIN users+drivers filtered by user_id from the token payload). No ID is
accepted from the URL, so a driver can never fetch another driver's data. 404 when a
driver account has no profile row yet. Contract section 6 added (Sino approved).
- New/changed: web/app/api/driver/me/route.ts (new); web/app/driver/status/page.tsx (new —
session guards reusing the T2 auth context: no session -> /login, non-driver -> Access
denied with no API call, 401 -> auto-logout; shows name, email, color-coded status and
license info); web/app/login/page.tsx (drivers now redirect to /driver/status after
login; admin redirect unchanged); web/docs/API_CONTRACT.md (section 6, GET /driver/me).
No DB changes, no changes to shared components.
- How it was tested (2026-09-17): 1) logged-out -> /driver/status redirects to /login;
2) admin -> "Access denied" screen, no data; 3) driver with no profile -> "No driver
profile yet" message; 4) new driver registered via /driver/register -> login ->
auto-lands on /driver/status showing PENDING (amber) with own name/email/license name;
5) admin verified the driver -> page refresh shows VERIFIED (green); 6) F12 Network:
the /api/driver/me response contains only the token owner's row (privacy verified).
- Gotchas others must know: /api/driver/me accepts the token via header only (no URL
param) — it serves the logged-in driver's own page. Viewing the license file reuses the
existing /api/driver/license/[name] endpoint with the driver's own token; Sino
confirmed drivers may view their own file. Status colors use CSS variables (--amber,
--success, --danger). Sino wants a follow-up "driver profile edit" task (name, phone,
schedule, price, trips) — requires new DB columns and a PATCH endpoint; should be its
own card, not part of T7.
## Changes
- New endpoint GET /api/driver/me: JWT-verified, drivers-only (admins get 403), returns
the caller's own driver row — users+drivers JOIN filtered by user_id from the token.
No URL parameter involved, so cross-driver access is impossible by design. 404 if the
account has no profile yet.
- New page /driver/status: reuses the T2 auth context — no session -> redirect to /login;
non-driver -> "Access denied" screen with no API call; 401 -> auto-logout. Shows name,
email, status (amber/green/red via CSS variables), license name + submission date, and
a "View license file" link using the driver's own token.
  Authorization header, rejects non-driver roles (403), and returns only the caller's own
  driver row (JOIN users+drivers filtered by user_id from the token payload). No ID is
  accepted from the URL, so a driver can never fetch another driver's data. 404 when a
  driver account has no profile row yet. Contract section 6 added (Sino approved).
- New/changed: web/app/api/driver/me/route.ts (new); web/app/driver/status/page.tsx (new —
  session guards reusing the T2 auth context: no session -> /login, non-driver -> Access
  denied with no API call, 401 -> auto-logout; shows name, email, color-coded status and
  license info); web/app/login/page.tsx (drivers now redirect to /driver/status after
  login; admin redirect unchanged); web/docs/API_CONTRACT.md (section 6, GET /driver/me).
  No DB changes, no changes to shared components.
- How it was tested (2026-09-17): 1) logged-out -> /driver/status redirects to /login;
  2) admin -> "Access denied" screen, no data; 3) driver with no profile -> "No driver
  profile yet" message; 4) new driver registered via /driver/register -> login ->
  auto-lands on /driver/status showing PENDING (amber) with own name/email/license name;
  5) admin verified the driver -> page refresh shows VERIFIED (green); 6) F12 Network:
  the /api/driver/me response contains only the token owner's row (privacy verified).
- Gotchas others must know: /api/driver/me accepts the token via header only (no URL
  param) — it serves the logged-in driver's own page. Viewing the license file reuses the
  existing /api/driver/license/[name] endpoint with the driver's own token; Sino
  confirmed drivers may view their own file. Status colors use CSS variables (--amber,
  --success, --danger). Sino wants a follow-up "driver profile edit" task (name, phone,
  schedule, price, trips) — requires new DB columns and a PATCH endpoint; should be its
  own card, not part of T7.
## Changes
- New endpoint GET /api/driver/me: JWT-verified, drivers-only (admins get 403), returns
  the caller's own driver row — users+drivers JOIN filtered by user_id from the token.
  No URL parameter involved, so cross-driver access is impossible by design. 404 if the
  account has no profile yet.
- New page /driver/status: reuses the T2 auth context — no session -> redirect to /login;
  non-driver -> "Access denied" screen with no API call; 401 -> auto-logout. Shows name,
  email, status (amber/green/red via CSS variables), license name + submission date, and
  a "View license file" link using the driver's own token.
- Login page: drivers redirect to /driver/status after login (admin redirect unchanged).
- API_CONTRACT.md: section 6 (GET /driver/me) added — approved by Sino.

## How to test
1. Logged out -> open /driver/status -> redirected to /login.
2. Login as admin -> go to /driver/status -> "Access denied".
3. Login as a driver with no profile -> "No driver profile yet" message.
4. Register a new driver at /driver/register -> login -> auto-lands on /driver/status
showing PENDING with own name/email/license info.
5. Admin verifies the driver (second tab) -> driver refreshes -> status shows VERIFIED.
6. F12 -> Network -> the me response contains only the token owner's data.

## 18/09/2026 — Wassim Mahmoud — Login route : admins-only
- Enforced admins-only access on GET /api/driver/license/[name]: valid admin tokens view license files (200), driver tokens get 403, missing/invalid tokens 401. Both Bearer-header and ?token= transports preserved.
- New/changed: web/app/api/driver/license/[name]/route.ts (role check added); web/app/api/driver/license/route.ts restored to Sprint 1 upload behavior after an edit accident (no behavior change). No DB or endpoint changes. Upload route still accepts driver tokens — registration and mobile flows unaffected.

- How it was tested: REST Client suite verified 401/403/404/400/200 across header + query-string tokens; driver blocked on normal names, traversal paths, and ?token=. Admin file viewing confirmed via header and ?token=. Verified in DB: users roles correct, drivers.license_url matches uploaded file. UI regression: admin license link opens file; driver sees Access-denied screen.
- Gotchas others must know: the role check lives ONLY in the [name] route — the upload route must keep accepting drivers. ?token= URLs can leak into browser history/logs (out of scope, flagged). This GET endpoint is missing from API_CONTRACT.md — contract owner should add it. Local schema drifted from the team schema (status enum typo "verifide", MyISAM, missing created_at/FK) — reported to DB owner. Never commit web/.env.

## Changes
- GET /api/driver/license/[name] is now admins-only (403 for non-admins, 401 for missing/invalid tokens)
- Bearer header and ?token= transports preserved
- Upload route restored to Sprint 1 behavior (accepts driver tokens)
- Added web/docs/t3-tests.http (REST Client suite)

## How to test
1. Setup: web/.env (DB port 3308, JWT_SECRET), admin + driver accounts, one registered driver with a license file
2. Run web/docs/t3-tests.http requests 3–11 → expect 401, 401, 403, 404, 400, 403, 200, 200, 403
3. UI: admin → /admin/drivers → license link opens; driver → Access denied

Screenshots attached (API responses + both UI screens).

## Flags for reviewers
- This endpoint is undocumented in API_CONTRACT.md — needs a section (owner: ?)
- ?token= in URLs is a history/log leak risk — future hardening task?


   showing PENDING with own name/email/license info.
5. Admin verifies the driver (second tab) -> driver refreshes -> status shows VERIFIED.
6. F12 -> Network -> the me response contains only the token owner's data.
## 2026-09-18 — Tamara — T9 — Design cleanup (code)
- Styling-only cleanup across the web app: raw <button> elements replaced with the shared
  Button component, all hardcoded colors removed from .tsx/.module.css files, and the two
  mockup criteria completed: /login matches Dana's T10 Sign In screen (Welcome Back /
  Sign In wording, Create Account link to /driver/register) and /driver/status matches the
  T11 My Status mockups (dark gradient background, glass cards, per-state icon/headline/
  message with checklist, License Information card). A repo-wide color audit returns hits
  in globals.css only.
- New/changed: web/app/globals.css (added --text-muted: #6b7280, --bb-link: #08d9d6);
  web/components/Input/Input.module.css (border #ccc -> var(--grey)); web/app/admin/drivers/
  page.tsx (Button for Verify/Reject/Logout, colors via variables); web/app/driver/status/
  page.tsx (Button, variables, restyled to T11 mockup); web/app/driver/register/page.tsx
  (status messages use --success/--danger); web/app/login/page.tsx (T10 wording + Create
  Account link); web/app/page.tsx (Next.js scaffold welcome page replaced with a minimal
  BusBuddy landing page — approved by Sino). No endpoints, no DB changes, no behavior
  changes: guards, fetches, handlers untouched.
- How it was tested (2026-09-17/18): after each page refactor its behavior was re-tested —
  admin: list loads, Verify/Reject/Logout work; driver: status loads in all data states,
  license file link opens, admin on the page still gets "Access denied"; register:
  success/error messages show; login: valid login redirects, wrong password errors.
  Final color audit (regex over web/app + web/components) returns matches in globals.css
  only. T10 skipped: Forgot Password, back arrow (no corresponding features/endpoints).
  T11 skipped: License No/Expiry (no DB columns), Re-upload License/Start Driving buttons
  (no endpoints).
- Gotchas others must know: Tailwind color classes (text-gray-500, bg-green-600, ...) are
  banned — use CSS variables, e.g. style={{ color: 'var(--text-muted)' }}. Two variables
  added: --text-muted (muted grey text) and --bb-link (cyan links on dark backgrounds).
  The landing page (/) is a client component because Button only supports onClick (no
  href). audit.txt at the repo root is a throwaway diagnostic file — never commit it.
## Changes
- All pages use the shared Button component (admin Verify/Reject/Logout, driver status
  Log out, landing page buttons).
- Zero hardcoded colors outside globals.css: Tailwind color classes and inline hexes
  replaced with CSS variables. Two variables added: --text-muted, --bb-link. Input
  border now uses var(--grey).
- /login matches Dana's T10 Sign In mockup: "Welcome Back" / "Sign in to continue to
  BusBuddy" / "Sign In →" gradient pill button (existing T1 styling), plus a
  "Don't have an account? Create Account" link to /driver/register.
  Skipped: Forgot Password, back arrow — no corresponding features/endpoints exist.
- /driver/status matches Dana's T11 My Status mockups: dark gradient background, two
  glass cards, per-state display (pending: ⏳ "Under review" amber; verified: ✅
  "Verification Approved" green; rejected: ❌ "Verification Rejected" red), progress
  checklist (Profile created, License uploaded, Admin review, Go live), License
  Information card. Skipped: License No/Expiry (no DB columns), Re-upload/Start Driving
  (no endpoints).
- Next.js scaffold welcome page replaced with a minimal BusBuddy landing page
  (approved by Sino).
- No behavior changes: guards, fetches, and handlers are unchanged.

## How to test
1. npm run dev → localhost:3000 → BusBuddy landing page; "Log in" and "Driver
   registration" buttons navigate.
2. /login matches the T10 mockup; "Create Account" opens /driver/register; valid login
   still redirects by role; wrong password still shows an error.
3. Admin login → /admin/drivers → list loads; Verify/Reject/Logout work.
4. Driver login → /driver/status → T11-style page; "View license file" opens the file;
   admin opening /driver/status gets "Access denied".
5. /driver/register → success message green, error message red.
6. Color audit over web/app + web/components returns matches in globals.css only.


<!-- Append your block below this line after finishing a task. Format:

## YYYY-MM-DD — [name] — [task name]
- What was added (2-3 lines, factual)
- New/changed: endpoints, DB tables, components, files
- How it was tested (success + error cases)
- Gotchas others must know (if any)
-->