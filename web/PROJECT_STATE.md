# BusBuddy — PROJECT_STATE.md

## How this file works

- DURING the sprint: finished a task? → append your block at the very bottom (RAW ZONE). No formatting stress, no editing others' entries.
- END of week: Sino feeds the whole file to the AI → it gets rewritten from zero (clean state + weekly recap) → the clean version starts the next sprint.
- Single sources of truth — do NOT duplicate them here:
  Endpoints → web/docs/API_CONTRACT.md · Database → database/schema.sql · Tests → web/docs/TESTING.md

## Current state (cleaned 05/10 — Sino + AI)

### Stack

- web/ — Next.js App Router: UI in app/, API in app/api/ · NEW: Leaflet 1.9.4 + OpenStreetMap (client-only via next/dynamic)
- mobile/ — Expo/React Native: src/App.js + src/screens/ (Login/Register/Home/DriverTrip) + shared Button/Input · NEW package: expo-linear-gradient
- DB — MySQL (WAMP), BusBuddy_app, all InnoDB → database/schema.sql · seed → database/seed.sql (NO schema change this sprint — GPS columns existed)
- Auth — JWT { userId, role } 7d · roles: admin/driver/student/parent · web: localStorage via auth-context · mobile: expo-secure-store

### Setup on a new machine

1. web/.env.local → DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, DB_PORT (ports differ per machine; ask, never hardcode)
2. Fresh DB → run database/schema.sql, then database/seed.sql (accounts @busbuddy.test + ONE active trip; idempotent). Stopping/starting trips during testing leaves extra ended trips → re-run seed.sql before any demo.
3. Recreate web/uploads/ license files per machine (gitignored — recipes in the T14 PR description)
4. **npm install in web/ AND mobile/ — mandatory after any pull** (leaflet / expo-linear-gradient broke fresh machines this sprint)

### What exists now (end of Sprint 3 — built 01–04/10, integration-tested 04/10 by Sinar, TESTING.md W40+)

- Admin: /admin/home EXISTS (W39 fixed — login lands on it, guarded, links to /admin/drivers) · /admin/drivers (verify/reject, license inline preview)
- Driver: /driver/register · /driver/status · /driver/home = Start/Stop + GPS sharing (GpsShare: watchPosition → POST ~1/10s, auto-stops on trip end/unmount) + "My Trips" card (last 5) · GET /driver/trips/active exists but the /driver/home load-on-mount effect is MISSING (T9b — refresh mid-trip shows stale ▶ Start; 409 resync recovers, confirmed live as F2)
- Student: /student/home = own trip status + LIVE MAP (Leaflet marker, polls 10s, "Updated Xs ago", grey + warning if fix older than 30s, polling stops on trip end/unmount)
- Parent: /parent/home unchanged (children selector + trip status)
- APIs (contract **v9**, entry numbers are permanent IDs): NEW 13 (POST /trips/{id}/students — admin assigns student to trip, API only, no UI) · 16 (POST /driver/trips/location) · 17 (GET /driver/trips/active) · 18 (GET /driver/trips) — on top of existing start/stop/admin-list/trip-status/parent-children
- License rule: admin = any file · driver = ONLY own · anonymous = 401 · Bearer-header only
- DB times stay UTC — seed times UTC_TIMESTAMP(3), never NOW()
- Mobile: NEW DriverTripScreen (verified → Start/Stop + active-trip card; pending/rejected → explanation; 401 → session cleared) · login/register restyled · NO GPS on mobile (web-only)

### Conventions (rules)

- Never invent endpoints — update the contract in the same PR; entry numbers never renumbered
- Never hardcode local config; mobile BASE_URL = PC LAN IPv4 (geolocation needs localhost — test GPS sharing on localhost, not LAN IP)
- Web UI: shared components + CSS variables; errors = ErrorMessage + console.error
- Components live in folders (index.tsx + module.css) — GpsShare.tsx is still flat (known debt)
- DB changed? → schema.sql change log (same PR) · Test data → database/seed.sql

### Known gaps → Sprint 4 (priority order)

1. T9b-page: /driver/home refresh shows stale ▶ Start on an active trip (F2, confirmed live) — small, spec'd in T9 log
2. F1: student page opened BEFORE trip start misses the map until manual refresh (polling only runs while an active trip is on screen)
3. Mobile GPS sharing (expo-location) + mobile parity gaps
4. UI mockup parity; welcome + per-role signup pages; bus-list/booking needs NEW contract endpoints first (design before build)
5. Endpoint 13 has no admin UI (API only) · GpsShare folder conversion (convention debt)

### Weekly recaps

- Sprint 0 (→12/09): signup/login, driver profile, admin approval, registration UIs. 20 tests ✅.
- Sprint 1 (15–18/09): sessions + guards, driver status, license permissions, trips APIs, mobile refactor. W1–W14 ✅ M1–M6 ✅.
- Sprint 2 (21–24/09, tested 29/09): 4 roles + link tables + GPS columns · driver start/stop · parent/student trip-status · admin inline preview. 34 ✅ · 1 ❌ (W39) · fixes: auth-context 4-role refresh, seed UTC.
- Sprint 3 (01–04/10, tested 04/10 by Sinar): live GPS map — location API (16), GpsShare driver sharing, student live map with freshness UI, GET active trip (17), driver trip history (18), endpoint 13 (10), /admin/home (W39 fixed), mobile DriverTripScreen, all 5 pending quick-checks done. Live-map E2E 5/6 (F1 logged) · M1–M6 6/6 · Q1–Q5 5/5. Findings F1/F2 → Sprint 4. Contract v9. Details: TESTING.md W40+.

---

## ⬇️ RAW ZONE — append your block below this line, don't touch anything above

Format (the end-of-task prompt already generates this — just paste it):

## [date] — [name] — [task]

- What was done (2-3 lines)
- Files added/changed
- Tested: success + error cases
- Gotchas for others (or "none")

## 2026-10-04 — S4-T1 signup admin-block — done

- POST /auth/signup now rejects role="admin" with 403 BEFORE any DB write (only driver/student/parent are self-creatable; admins exist only via seed.sql). Unknown/omitted role still defaults to driver.
- web/docs/API_CONTRACT.md bumped to v10 with the new entry 1 rules (400 missing fields, 403 admin, 409 dup, 201, 500). web/database/schema.sql change-log entry added 2026-10-04 noting NO schema change.
- Commit: 68349e7 "S4-T1: block admin creation via signup (403), contract v10".
- Tested: curl student→201, parent→201, admin→403, duplicate email→409, missing fields→400; DB confirmed 0 rows for the admin attempt; test users deleted afterwards.


## 2026-10-04 — S4-T2 welcome page — done

- Added a full welcome/onboarding page (`web/app/page.tsx` + `web/app/page.module.css`) built to Dana's mobile mockup: vibrant cyan→magenta/purple gradient bg, brand icon, "Safe Rides. Connected Families." tagline, three feature columns (Drivers / Students / Parents), illustrated bus scene with glowing road + floating "Bus 12: On time • 2 min away" notification, and the rounded cyan→magenta gradient "Get Started →" pill with a transparent "Log in" link under it.
- Added role chooser page (`web/app/get-started/page.tsx` + `web/app/get-started/page.module.css`): Driver / Student / Parent cards; nav links to /login.
- No API calls on either page. CSS variables only (--bb-bg-gradient, --navy, --amber, --text-muted, --bb-link, --grey), no inline styles.
- Commit: 31111bd "S4-T2: welcome page (modern mockup) + role chooser (navy bg, transparent login)".
- Tested: home /get-started both return 200; HTML contains "Get Started →", transparent "Log in" link to /login, all three role cards, 0 leftover inline style= attributes.


## 2026-10-05 — S4-T2 welcome background image + role page bg match — done

- Updated image: copied the user's uploaded `busbuddy-illustration.jpg` into `web/public/busbuddy-illustration.jpg` (committed as a new public asset) and switched the welcome page (`web/app/page.module.css` `.wrap`) background from the flat cyan→magenta gradient to `background-image: url('../public/busbuddy-illustration.jpg'); background-size: cover; background-position: center;`. Everything else (geometry, text, single "Get Started →" button, three feature columns, transparent login line, vertical stack) unchanged.
- Role page background fix: `web/app/get-started/page.module.css` `.chooser` background changed from `var(--navy)` to `var(--bb-bg-gradient)` — the same gradient as Login and the rest of the app (the login-page gradient), no longer navy. Card text and the navy nav button intentionally kept as-is.
- Path fix: an initial commit used `url('../../public/...')` which Next.js could not resolve; corrected to `url('../public/...')` and re-pushed.
- Commit: 5653cd3 "S4-T2: welcome background image + role page background matching other pages".
- Tested: all 6 routes (/, /get-started, /driver/register, /student/home, /parent/home, /login) return HTTP 200; served CSS confirms the image url on the welcome page and the gradient on the role chooser.


## 2026-10-05 — S4-T3 T9b driver home refresh state — done

- Fixed stale Start-button after refresh on `/driver/home`: on mount the page now fetches `GET /api/driver/trips/active` and derives `onTrip = !!data.trip` from backend truth instead of relying on local state.
- Stop shows immediately on refresh for an active trip; after a stop in another tab, Start shows again. Normal start/stop and `GpsShare`-gating unchanged.
- Commit: 7e78f32 "S4-T3: T9b fix — driver home refresh shows correct Start/Stop state".
- Tested: route registered in app-path-routes-manifest; `tsc --noEmit` clean for the changed file; dev server on :51840 returns HTTP 200 for all 6 routes; served CSS confirms the image url on welcome page and the gradient on the role chooser. Live in-browser session test (db seed + trip) not runnable from this machine — reported as limitation.

2026-10-07 — Tamara — T6 — Student signup page
Added: web/app/student/register/page.tsx (signup → auto-login → /student/home), web/app/student/register/page.module.css (cloned from login CSS, only used classes kept). 2 new files; no API/DB/contract/schema changes.
New/changed: endpoints POST /auth/signup (entry 1) + POST /auth/login (entry 2) — pre-existing, reused. Reused: auth-context (localStorage bb_token/bb_role), ErrorMessage shared component, CSS vars.
Tested: all 6 checks green: (1) T6 signup account lands on /student/home (2) F5 keeps session (3) duplicate email → inline "Email already registered", no second row (4) empty form → inline "Please fill in all fields", 0 network requests (5) invalid email → inline "Enter a valid email", 0 requests (6) DB row id 15 (guest1@gmail.com) has role = student, password_hash is bcrypt ($2b$10$zBRR7HCa...).
Gotchas: /get-started Student card left untouched (T6 scope excluded that file); signup footer links to /login (inheritance, not T6); listed $2a$ in test checklist vs actual $2b$ — same bcrypt family, no functional difference.

2026-10-07 — Tamara — T7 — F1 fix: student page detects new trip
Added: nothing new. Changed: web/app/student/home/page.tsx — the only file edited. The T12 polling effect now always runs: setInterval(() => loadTrip(true), activeTrip ? 10_000 : 30_000); !activeTrip return removed; single cleanup (clearInterval) preserved.
New/changed: no endpoints, no components, no DB tables, no schema/contract. Entry 14 (GET /students/{id}/trip-status) reused.
Tested: only the file-edit was confirmed (compile/no errors, effect semantics reviewed). Failure: all functional test attempts (Tabs A/B + phpMyAdmin wiring) hit a non-existent blocker — the POST /api/auth/login route returned HTTP 401 {"error":"Invalid credentials"} for three known-good bcrypt hashes ($2y$10$EixZaYVK... for busbuddy123, same vector, fresh row), while the request body and DB row were confirmed byte-exact. During this loop, no F1 criteria were executed or verified (no 30s polling rhythm, no trip-detection flip, no cleanup checks). This is a T7 blocking issue, handed to the team lead.
Gotchas: F1's test required a driver login to create a trip; the login API in this running environment returned 401 for exact, known-good credentials — root cause not yet diagnosed (session/auth path under review with the team lead). If re-tested, verify: (1) 30s polling with no trip in DevTools Network, (2) trip starts while open → "Trip in progress" + map appear without refresh, (3) 10s rhythm resumes, (4) 30s after trip end, (5) zero requests after logout.
