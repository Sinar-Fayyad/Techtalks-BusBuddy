# BusBuddy — PROJECT_STATE.md

## How this file works

- DURING the sprint: finished a task? → append your block at the very bottom (RAW ZONE). No formatting stress, no editing others' entries.
- END of week: Sino feeds the whole file to the AI → it gets rewritten from zero (clean state + weekly recap) → the clean version starts the next sprint.
- Single sources of truth — do NOT duplicate them here:
  Endpoints → web/docs/API_CONTRACT.md · Database → database/schema.sql · Tests → web/docs/TESTING.md

## Current state (cleaned 29/09 — Sino + AI)

### Stack

- web/ — Next.js App Router: UI in app/, API in app/api/
- mobile/ — Expo/React Native: src/App.js + src/screens/ (Login/Home/Register), shared Button/Input — unchanged this sprint
- DB — MySQL (WAMP), BusBuddy_app, all InnoDB → database/schema.sql · seed data → database/seed.sql
- Auth — JWT { userId, role } 7d · roles: admin/driver/student/parent · web: localStorage bb_token/bb_role via auth-context (restores ALL 4 roles on refresh) · mobile: expo-secure-store (same keys)

### Setup on a new machine

1. web/.env.local → DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, DB_PORT (ports differ per machine — testing PC uses 3308; ask, never hardcode)
2. Fresh DB → run database/schema.sql, then database/seed.sql (test accounts @busbuddy.test + ONE active trip; idempotent — WHERE NOT EXISTS guard, never creates a second active trip). Old DB → check its change log.
3. Recreate web/uploads/ license files per machine (gitignored — recipes in the T14 PR description #18)
4. npm install in web/ AND mobile/

### What exists now (end of Sprint 2 — built 21–24/09, integration-tested 29/09 by Wassim)

- Roles: signup/login for all 4 roles; login redirects → admin:/admin/home ⚠️404 (page missing, W39) · driver:/driver/home · student:/student/home · parent:/parent/home
- Driver: /driver/register (license upload) · /driver/status (own status + own license + logout) · /driver/home (Start/Stop trip — verified only; 409 double-start / 404 stop-without-trip resync the UI)
- Admin: /admin/drivers (session, verify/reject, license inline preview: image inline, PDF via protected link)
- Parent: /parent/home — children selector + linked child's trip status (active/ended/no-trip); linked children ONLY
- Student: /student/home — own trip status only
- APIs: trips start/stop/admin-list · GET /students/{id}/trip-status (student=own, parent=linked) · POST+GET /parents/me/children
- License rule: admin = any file · driver = ONLY own · anonymous = 401 · Bearer-header only (no ?token=)
- DB times stored UTC — seed uses UTC_TIMESTAMP(3), NEVER NOW()
- Mobile: no new features this sprint (refactor only)

### Conventions (unchanged rules)

- Never invent endpoints — update the contract in the same PR
- Never hardcode local config; mobile BASE_URL = PC LAN IPv4
- Web UI: shared components + CSS variables; errors = ErrorMessage component + console.error
- DB changed? → append to database/schema.sql change log (same PR)
- Test data → database/seed.sql; seed trip times must stay UTC_TIMESTAMP(3)

### Known gaps → Sprint 3 (priority order)

1. /admin/home doesn't exist — admin login dead-ends with 404 (W39 ❌, pre-existing — owner needed)
2. Endpoint 13 (assign student to trip) contract-planned, never built — linking students to trips = direct SQL only
3. Upload-validation quick-checks pending (wrong type 400, >5MB 400, /login empty fields) · PDF viewing to confirm once in real Chrome
4. Mobile: M1–M6 not re-run this pass; still no driver-status/trip screens
5. Seed "full reset" recipe documented, never executed end-to-end
6. Parent page styling + full mockup parity (route/ETA/alerts cut — no endpoints behind them)

### Weekly recaps

- Sprint 0 (→12/09): signup/login, driver profile, admin approval, registration UIs (web+mobile). 20 tests ✅.
- Sprint 1 (15–18/09): sessions + guards, driver status, license permission model, trips APIs, mobile refactor+login. Bugs fixed: leaked DB port, outdated schema, MyISAM→#1824, token field mismatch, T3/T7 license conflict, unreachable RegisterScreen. W1–W14 ✅ M1–M6 ✅.
- Sprint 2 (21–24/09, tested 29/09 by Wassim): 4 roles + parent_student/trip_students + trips location columns · driver home start/stop · parent + student trip-status pages · admin license inline preview · web/mobile cleanup. Fixes during testing: auth-context restores all 4 roles on refresh; seed NOW(3)→UTC_TIMESTAMP(3) + one-time CONVERT_TZ repair. Result: 34 ✅ · 1 ❌ (W39 /admin/home 404) · 14 not re-run. Details: TESTING.md W15+.

---

## ⬇️ RAW ZONE — append your block below this line, don't touch anything above

Format (the end-of-task prompt already generates this — just paste it):
## 2026-10-01 — Tamara — T4 Location API

- Added POST /driver/trips/location for a verified driver's active trip: validates
  latitude/longitude (400), rejects wrong role (403), rejects no active trip (409),
  401 without token; on success writes latitude, longitude and location_updated_at.
- New/changed: new web/app/api/driver/trips/location/route.ts · web/docs/API_CONTRACT.md
  updated in the same PR · trips table already had the three GPS columns (no schema change).
- Tested: 401 no token · 403 student token ("Not a driver") · 400 invalid coordinates ·
  409 no active trip (after stopping the seed trip) · success path run after re-running
  database/seed.sql, coordinates read back with a SELECT on trips.
- Gotchas: http://localhost:3000/api returns 404 in a browser — normal, there is no index
  route. Stopping the seed trip leaves driver1 with NO active trip; re-run database/seed.sql
  (against BusBuddy_app) to get exactly one active trip back. Seed trip times stay UTC.
## 2026-10-01 — Tamara — T5 /admin/home page (W39 fix)

- Created the missing admin landing page so admin login stops dead-ending at a 404.
- New: web/app/admin/home/page.tsx only. Reuses useAuth() (token/role/ready/logout),
  Button and the CSS variables exactly like /admin/drivers. No DB / API / contract change.
- Guards: no session -> router.replace('/login') · logged-in non-admin -> "Access denied"
  screen with Log out. Cards: Drivers (live Link to /admin/drivers) and Trips (disabled
  "Coming soon" — NOT a link, because no /admin/trips route exists).
- Tested: admin login -> lands on /admin/home, both cards, no 404 · driver session opening
  /admin/home -> "Access denied" · logged-out/incognito opening /admin/home -> redirected
  to /login.
- Gotchas: login ALREADY redirected to /admin/home — only the page was missing, so no
  login-page edit was needed. Flip the Trips card from <div> to <Link> once an /admin/trips
  page exists. Branch was named T5—/admin/home-page-(W39-fix), not the feature/ convention.
## 2026-10-01 — Tamara — T6 LiveBusMap component

- Added a reusable client-only Leaflet + OpenStreetMap component showing a bus as a single
  marker that is moved in place (no recreation, no jank).
- New: web/components/LeafletMap.tsx (map + one custom L.divIcon marker; updates via
  marker.setLatLng; null coords -> marker removed + "Location unavailable"; stale
  location_updated_at -> marker kept + "Last known position") ·
  web/components/LiveBusMap.tsx ('use client' wrapper loading LeafletMap through
  next/dynamic({ ssr: false }) so Leaflet never runs on the server).
- Changed: web/app/layout.tsx (import 'leaflet/dist/leaflet.css' AFTER globals.css so the
  Tailwind v4 preflight can't override Leaflet's styles) · web/package.json +
  web/package-lock.json (leaflet@1.9.4, @types/leaflet@1.9.22).
- Tested in the browser with a temporary /map-test harness (deleted, NOT committed):
  loads with no "window is not defined" and no hydration error · marker glides in place on
  simulated movement, one marker, no flicker · null coordinates -> message + marker removed,
  recovers on fresh coords · old timestamp -> "Last known position", clears when fresh.
- Gotchas: next/dynamic({ ssr:false }) must be called from a 'use client' file (it throws in
  a Server Component). API timestamps have no timezone, so the component appends 'Z' before
  parsing (DB stores UTC). Initializing state with a time value (nowUtc()) in the test page
  caused a hydration mismatch — set time-dependent state inside useEffect instead. The
  component is STANDALONE (props latitude / longitude / locationUpdatedAt) and is NOT wired
  into any page yet — T3's output was still unknown.

## [date] — [name] — [task]

- What was done (2-3 lines)
- Files added/changed
- Tested: success + error cases
- Gotchas for others (or "none")
