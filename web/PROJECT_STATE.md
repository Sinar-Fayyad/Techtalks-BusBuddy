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

## 2026-10-01 — Jad Kamal El Dine — T7 Driver GPS sharing UI

- Added GpsShare component: watchPosition keeps the newest fix in a ref; a 2s timer
  POSTs to endpoint 16 (POST /driver/trips/location) at most once per 10s, first fix
  sent immediately; auto-stops on trip stop / page unmount via effect cleanup;
  PERMISSION_DENIED shows a friendly message and Start/Stop stay usable.
- New/changed: NEW web/components/GpsShare.tsx (standalone, prop tripActive) ·
  EDIT web/app/driver/home/page.tsx (1 import + <GpsShare tripActive={onTrip} />).
  No API/DB/contract change — endpoint 16 already existed (contract v6).
- Tested: intern reported the feature working end-to-end in the browser after a
  build fix ("all worked"); the itemized checklist (≤4 POSTs per 30s, DB
  location_updated_at advancing ~10s, auto-stop on Stop/unmount, permission-denied
  usability, 409 via second tab) was not reported back itemized — re-verify in the
  integration pass. 401 n/a (UI gated on driver session).
- Gotchas: fresh machines need `npm install` after pulling — we hit
  "Module not found: leaflet/dist/leaflet.css" because T6 added leaflet to
  package.json. Geolocation needs a secure context: localhost OK, http://LAN-IP is
  blocked by the browser — test GPS on localhost. auth-context imports as
  '@/app/auth-context' from components/.
## 2026-10-01 — Jad Kamal El Dine — T8 Student live map

- /student/home now polls GET /students/{id}/trip-status every 10s in silent mode
  (busyRef guards overlapping fetches, no screen flash, keeps last good data on
  transient errors) and shows a "Live location" card reusing T6's LiveBusMap,
  rendered ONLY while the trip is active (ended/no-trip = no map, no marker).
- New/changed: EDIT web/app/student/home/page.tsx only (polling effect, TripInfo
  extended with latitude/longitude/location_updated_at as DECIMAL strings per
  contract v6, LiveBusMap card). No API/DB/contract change.
- Tested: checklist issued (1 GET/10s cadence in Network tab, live marker via
  driver tab, ended trip → map disappears within 10s, no-trip state, 403 via
  console fetch with foreign studentId, DB cross-check) — results were not
  reported back in chat; treat as untested until re-run.
- Gotcha: a student shows "No trip scheduled" unless linked in trip_students —
  endpoint 13 was never built, so links exist only via seed/manual SQL. Check
  database/seed.sql before assuming a bug. DECIMAL coords arrive as strings; if
  LiveBusMap's props expect numbers, adapt at the call site (do not edit the T6
  component).
## 2026-10-01 — Jad Kamal El Dine — T9 GET /driver/trips/active

- New endpoint 17 (contract v7): GET /driver/trips/active 🔒 driver — read-only
  LEFT JOIN drivers→trips (end_time IS NULL) by token userId, no URL id. Returns
  200 { trip: {...} } with the same shape as endpoint 16 (UTC time strings via
  CAST AS CHAR, DECIMAL-string latitude/longitude/location_updated_at) or
  { trip: null } when there is no active trip OR no driver row (documented, not 404).
  401 missing/invalid token · 403 not a driver · 500.
- New/changed: NEW web/app/api/driver/trips/active/route.ts · EDIT
  web/app/driver/home/page.tsx (ActiveTripInfo interface + load-on-mount effect
  with cancelled-flag for StrictMode; refresh mid-trip now shows Stop immediately —
  the start-409 flip stays only as a two-tab safety net) · EDIT
  web/docs/API_CONTRACT.md (v7, entry 17). No DB change.
- Tested: API direct — 200 {trip:null} with no active trip · 200 with trip after
  Start (cross-checked with SELECT on trips) · 401 without Authorization header ·
  403 with a student token. Page — refresh mid-trip shows ⏹ Stop immediately,
  no-trip refresh shows ▶ Start, second-tab stop then refresh shows Start;
  regression: normal start/stop and T7 GpsShare gating still work.
- Gotchas: read-only GET needs NO transaction/FOR UPDATE (locks are for writers
  like /stop). The load effect ignores stale responses via a cancelled flag —
  required for React StrictMode's dev double-mount. lastTrip state type widened to
  ActiveTripInfo (GPS fields may be null). Contract updated in the SAME PR (rule:
  never call an endpoint that isn't in the contract).

## 2026-10-03 — [your name] — T10 Endpoint 13: assign student to trip

- Implemented contract entry 13: POST /trips/{tripId}/students 🔒 admin — inserts a
  trip_students row. Ended trips allowed (contract never required an active trip —
  now stated explicitly in v8).
- New/changed: NEW web/app/api/trips/[tripId]/students/route.ts · web/docs/API_CONTRACT.md
  v8 block (entry 13 implemented) in the same PR. No DB change (trip_students existed).
- Tested (Thunder Client — Postman wouldn't launch on this machine): 201 success (row verified
  via SELECT on trip_students) · 409 duplicate · 400 /trips/abc · 400 missing/invalid studentId ·
  404 trip 999999 · 404 student 999999 · 403 target-not-a-student · 401 no/garbage token ·
  403 student token · cross-check: GET /students/13/trip-status → 200 with the assigned trip.
- Gotchas: mid-testing the dev server returned 500 on ALL routes — missing leaflet (T6 dep,
  `npm install` after pulling is mandatory), environmental, no code bug. Test-user ids differ
  per machine (created via signup, not seed) — check users table before assuming a bug.

## 2026-10-03 — Sinar — T11 Driver trip history

- GET /driver/trips (entry 18): caller's OWN last 5 trips, newest first (token → drivers.user_id,
  no URL id; { trips: [] } when none/no driver row — entry-17 precedent). "My trips" card on
  /driver/home (date, start→end, Active/Ended from end_time), auto-refreshes after Start/Stop.
- New/changed: NEW web/app/api/driver/trips/route.ts · EDIT web/app/driver/home/page.tsx
  (additive only) · EDIT web/docs/API_CONTRACT.md (v9 block + chronological reorder + landed
  T9's missing v7/entry 17 + GpsShare import fix — separate disclosed commits, one PR).
- Tested: API — 200 own trips (matches DB cross-check SELECT exactly) · 200 {trips:[]} fresh
  driver · 401 no/garbage token · 403 admin token · 403 student token. UI — card renders,
  Active↔Ended flips after Stop/Start without refresh, console clean (expected 409 on
  double-start only).
- Gotchas: PR #26 (T9) had merged ONLY route.ts — contract v7 + page effect missing from dev;
  v7 landed here (coordinated with Jad). GpsShare.tsx imported '@/lib/auth-context' (compiled
  only where uncommitted local files existed) → fixed to '@/app/auth-context' in this PR.
  T9's PAGE effect (active-trip load on mount) is STILL MISSING → stale ▶ Start button when a
  trip is already active → follow-up T9b-page. Empty SQL for a fresh driver = documented empty
  path, not a bug.

## 2026-10-03 — Sinar — T12 Map freshness UI

- LeafletMap: live "Updated Xs ago" (1s ticker), grey marker + warning when the last GPS fix is
  older than staleAfterMs (student page passes 30s; T6 default 2min kept). Student page: polling
  interval exists ONLY while an active trip is on screen → stops on trip end AND unmount (no
  zombie requests); Refresh picks up a new trip.
- New/changed: NEW web/components/LeafletMap/ (tsx + module.css) + web/components/LiveBusMap/
  (index.tsx + module.css), loose versions deleted — import path '@/components/LiveBusMap' kept
  working via index.tsx · EDIT web/app/student/home/page.tsx (split effects gated on activeTrip,
  staleAfterMs=30_000, Number() conversion of DECIMAL-string coords — map previously showed
  "Location unavailable" despite valid coordinates). No API/DB/contract change.
- Tested (browser, driver+student tabs): blue marker + ticking age while driver shared · grey
  flip at ~31s after sharing stopped · Network 1 req/10s while active → silence after trip
  completed · silence after navigating away · resumes via Refresh on a new trip.
- Gotchas: T6 component edited + folder/CSS-module restructure — authorized exception by team
  lead, disclosed; GpsShare (T7) NOT converted (still flat — convention debt). Student1 sees a
  new trip only after re-running database/seed.sql or an endpoint-13 call (links never
  auto-create). INCIDENT: T12 was pushed DIRECTLY to dev instead of via a PR (cherry-pick
  recovery attempt tangled the feature branch; branch deleted; changes kept on dev with
  team-lead approval).

## 2026-10-03 — Sinar — Sprint carry-over notes (team lead)

- T9b-page: /driver/home still lacks the active-trip load effect (refresh mid-trip shows ▶
  Start). Small follow-up, spec'd in T9's log; integration pass must verify it.
- Component convention: GpsShare.tsx still flat (LeafletMap/LiveBusMap now foldered) — convert
  during sprint testing (owner T7).
- GitHub Desktop lesson: a commit contains ONLY ticked files — always read the "N files
  changed" counter (root cause of PR #26 losing 2 of 3 T9 files).
- Contract hygiene: entry numbers are IDs, never renumber (MD029 disabled at top of
  API_CONTRACT.md); file now chronological v2→v9.
- Welcome page + per-role signup pages (student/driver/parent) — needed, candidate NEXT TASK.
- UI mockups NOT applied to code yet; bus-list/booking screens need NEW contract endpoints
  first (none exist — never call what isn't in the contract).
- T12 went to dev without a PR — approved incident (see T12 block).

## [date] — [name] — [task]

- What was done (2-3 lines)
- Files added/changed
- Tested: success + error cases
- Gotchas for others (or "none")
