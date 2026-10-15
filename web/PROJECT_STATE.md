# BusBuddy — PROJECT_STATE.md

## How this file works

- DURING the sprint: finished a task? → append your block at the very bottom (RAW ZONE). No formatting stress, no editing others' entries.
- END of week: Sino feeds the whole file to the AI → it gets rewritten from zero (clean state + weekly recap) → the clean version starts the next sprint.
- Single sources of truth — do NOT duplicate them here:
  Endpoints → web/docs/API_CONTRACT.md · Database → database/schema.sql · Tests → web/docs/TESTING.md

## Current state (cleaned 11/10 — Sino + AI — starts Sprint 5)

### Stack

- web/ — Next.js App Router: UI in app/, API in app/api/ · Leaflet 1.9.4 + OpenStreetMap (client-only via next/dynamic) · welcome-page asset: public/busbuddy-illustration.jpg
- mobile/ — Expo/React Native: src/App.js + src/screens/ (Login/Register/Home/DriverTrip/DriverStatus) + shared Button/Input · packages: expo-linear-gradient, expo-secure-store
- DB — MySQL (WAMP), busbuddy_app, all InnoDB → database/schema.sql · seed → database/seed.sql (NO schema change in Sprint 4)
- Auth — JWT { userId, role } 7d · roles: admin/driver/student/parent · web: localStorage bb_token/bb_role via auth-context · mobile: expo-secure-store · signup with role="admin" → 403 (contract v10+)

### Setup on a new machine

1. web/.env.local → DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, DB_PORT (ports differ per machine; ask, never hardcode)
2. Fresh DB → run database/schema.sql, then database/seed.sql (accounts @busbuddy.test + ONE active trip; idempotent). Stopping/starting trips during testing leaves extra ended trips → re-run seed.sql before any demo.
3. Recreate web/uploads/ license files per machine (gitignored — recipes in the T14 PR description)
4. **npm install in web/ AND mobile/ — mandatory after any pull**

### What exists now (end of Sprint 4 — built 05–11/10, tested 11/10, TESTING.md W41–W45)

- Welcome + onboarding: `/` (welcome page, illustration bg) · `/get-started` role chooser · shared ErrorMessage wired on both (S4-T13)
- Admin: /admin/home · /admin/drivers (verify/reject, license inline preview) — unchanged this sprint
- Driver web: /driver/register (signup → login → upload → profile all 201 **but no session saved and no redirect — finding F4**) · /driver/status · /driver/home = Start/Stop + GpsShare GPS + "My trips" · **T9b FIXED: on mount GET /driver/trips/active → refresh mid-trip shows correct Stop state (no 409)**
- Student: /student/home — **F1 FIXED: polling always runs — 30s with no trip, 10s while active; auto-detects a trip starting while the page is open; logout stops polling** · live Leaflet map · "Trip completed" end state
- Parent: /parent/home — children selector (entry 15) + "Add child" card (entry 12 email mode) · **BROKEN — finding F3: UI + contract v11 send { email }, API route still studentId-only → every attempt 400; parents cannot link children via UI**
- Onboarding wiring status: Driver card → /driver/register ✅ · Student/Parent cards → /student/home, /parent/home → signed-out visitors bounce to /login (**F5**) · /student/register exists but is unreachable from any UI link · /parent/register **does not exist (404)**
- Signup (contract entry 1): driver/student/parent → 201 · admin → 403, 0 rows · unknown/omitted role → defaults driver · dup → 409 · missing → 400
- Mobile: DriverTripScreen (start/stop) + DriverStatusScreen (verified/pending/rejected + license download) · NO GPS sharing on mobile (web-only)
- APIs — contract **v11**: same entries 1–18 as v9, plus signup admin-block rules (v10) and entry 12 email-mode documented (v11 — see F3: docs ahead of implementation)
- Testing: Sprint 4 pass (11/10) — 26 checks → **17 ✅ · 1 ⚠️ · 8 ❌** (W41–W45, TESTING.md)

### Conventions (rules)

- Never invent endpoints — update the contract in the same PR; entry numbers never renumbered
- Never hardcode local config; mobile BASE_URL = PC LAN IPv4 (geolocation needs localhost — test GPS sharing on localhost, not LAN IP)
- Web UI: shared components + CSS variables; errors = ErrorMessage + console.error
- Components live in folders (index.tsx + module.css) — GpsShare.tsx is still flat (known debt)
- DB changed? → schema.sql change log (same PR) · Test data → database/seed.sql
- Every task: success AND error cases tested before the PR; results appended to TESTING.md

### Known gaps → Sprint 5 (priority order)

1. **F3 (blocker):** entry 12 email mode missing in app/api/parents/me/children/route.ts — UI + contract v11 already use { email }; route is studentId-only → 400. Parent linking dead until fixed.
2. **F4:** /driver/register discards the token and never redirects to /driver/home (T10 spec not in code).
3. **F5:** chooser Student/Parent cards dead-end at /login; /parent/register 404; /student/register unreachable from UI.
4. Mobile GPS sharing (expo-location) + mobile parity gaps.
5. UI mockup parity; bus-list/booking needs NEW contract endpoints first (design before build).
6. Endpoint 13 has no admin UI · GpsShare folder conversion (convention debt).
7. **S4-T14 branch pushed but NOT yet merged into dev** — close it before Sprint 5 work starts.

### Weekly recaps

- Sprint 0 (→12/09): signup/login, driver profile, admin approval, registration UIs. 20 tests ✅.
- Sprint 1 (15–18/09): sessions + guards, driver status, license permissions, trips APIs, mobile refactor. W1–W14 ✅ M1–M6 ✅.
- Sprint 2 (21–24/09, tested 29/09): 4 roles + link tables + GPS columns · driver start/stop · parent/student trip-status · admin inline preview. 34 ✅ · 1 ❌ (W39) · fixes: auth-context 4-role refresh, seed UTC.
- Sprint 3 (01–04/10, tested 04/10): live GPS map (location API 16, GpsShare, student live map), GET active trip (17), trip history (18), endpoint 13, /admin/home (W39 fixed), mobile DriverTripScreen. Contract v9. TESTING.md W40+.
- Sprint 4 (05–11/10, tested 11/10): signup admin-block (contract v10→v11) · welcome + role chooser + illustration bg · T9b refresh fix · student signup (T6) · F1 polling fix (T7) · parent link-child UI (T8) · mobile driver status (T9) · onboarding wiring (T10) · ErrorMessage on welcome/chooser (S4-T13) · auth-page guards (S4-T14, unmerged) · test pass W41–W45 (T15) = 17✅/1⚠️/8❌, findings **F3/F4/F5**. Details: TESTING.md Sprint 4 section.

---

## ⬇️ RAW ZONE — append your block below this line, don't touch anything above

Format (the end-of-task prompt already generates this — just paste it):

## [date] — [name] — [task]

- What was done (2-3 lines)
- Files added/changed
- Tested: success + error cases
- Gotchas for others (or "none")

## 2026-10-15 — Jad Kamal El Dine — T4 — Driver status parity + back/logout

- Rewrote `DriverStatusScreen` to work with this app's hand-rolled navigation: it takes
  `token` / `onBack` / `onLogout` / `onSessionExpired` props instead of a `navigation`
  object, uses the shared `apiFetch` helper, and reads driver status from contract
  entry 6 (`GET /driver/me`). Added an Android `BackHandler` listener so hardware back
  and the on-screen Back button do the same thing, plus a Log out control wired to
  `App.js`'s existing `handleLogout`.
- Wired the screen into the driver flow in `App.js` through a `driverView` state
  (`'trip' | 'status'`), reached by a "My status & license" link on the trip screen.
  Before this the screen was unreachable — a driver always landed on `DriverTripScreen`.
- New/changed: `mobile/src/screens/DriverStatusScreen.js` (rewritten), `mobile/App.js`,
  `mobile/src/screens/DriverTripScreen.js`, `mobile/api.js` (exports `BASE_URL`).
  Endpoints used: entry 6 `GET /driver/me`, entry 8 `GET /driver/license/{name}`
  (Bearer header; filename derived from `license_url`). No endpoints, DB tables or
  components added. No contract or schema change.
- Tested: verified driver shows ✓ Verified and the license file opens; pending → ⏳ Pending
  approval; rejected → ✗ Rejected with no reason line; no profile (404) → "No driver
  profile" state; invalid/expired token → returns to Login; on-screen Back and Android
  hardware back both return to the trip screen; Log out clears `bb_token`/`bb_role` and
  Login does not allow hardware back into the app.
- Gotchas: (1) contract entry 6 returns no `rejection_reason` field, so no rejection
  reason can be shown without a schema + contract change; (2) the scaffold this started
  from called `/api/driver/status` and `/api/driver/license`, neither of which exists —
  the real entries are 6 and 8; (3) on Expo SDK 54+ the classic file-system API lives in
  `expo-file-system/legacy` (`getContentUriAsync` does not exist in the new API);
  (4) this app has no navigation library — screens receive callbacks as props, so
  `navigation.*` calls silently do nothing.
  
  ## 2026-10-15 — Jad Kamal El Dine — T5 — Driver home parity (My trips)

- Added a "My trips" list to the driver home: the last 5 trips, newest first, from contract
  entry 18 (`GET /driver/trips`), showing `start → end` per row and "Active" while
  `end_time` is null. The list refreshes after a trip starts or stops, including the
  409 (already on a trip) and 404 (nothing to stop) sync branches.
- Added a `fmtTime` helper that converts the API's UTC timestamps to local time, tolerating
  both ISO (`…Z`) and MySQL `YYYY-MM-DD HH:MM:SS` formats, and used it for the "last trip"
  line too.
- New/changed: `web/app/driver/home/page.tsx` (My trips section, trips state, `loadTrips`,
  refresh calls after start/stop, `fmtTime`) and `mobile/src/screens/DriverTripScreen.js`
  (My trips card + `loadTrips`), with `mobile/App.js` and `mobile/api.js` (`BASE_URL`
  export) touched for the same flow. Endpoints used: entry 18, plus existing 6/9/10/13.
  No endpoints, DB tables or components added. No contract or schema change.
- Tested: verified driver sees the My trips list matching
  `SELECT id, start_time, end_time FROM trips WHERE driver_id=<id> ORDER BY id DESC LIMIT 5;`
  with the active trip marked "Active"; Start adds a row and flips the button to Stop; Stop
  sets `end_time` and updates the row without a reload; double Start shows the 409 message
  and flips to Stop; Stop with no active trip shows the 404 message; the three base-AC
  features were re-checked intact — Start/Stop, GpsShare (location keeps posting for the
  active trip and stops when the trip stops) and My Trips.
- Gotchas: (1) the AC named "My Trips" as an existing feature, but the web driver home had
  no trip history at all before this change — the feature was added, not preserved;
  (2) mobile has no GpsShare by design (GPS sharing is web-only), so "parity" cannot mean
  feature-identical screens; (3) entry 18 returns only the last 5 trips — a full history
  page is a separate task; (4) a `ScrollView`'s `contentContainerStyle` needs `flexGrow`
  rather than `flex`, or added cards clip instead of scrolling; (5) the T5 branch was cut
  before T4 merged, which caused merge conflicts in the driver screens — resolve by keeping
  dev's styles and re-applying only the T5 additions.

  ## 2026-10-15 — Jad Kamal El Dine — T6 — Mobile screen parity (buffer / drop-safe)

- Made the mobile screens survive slow or failed requests and rapid taps: `apiFetch` now uses
  an `AbortController` with a 10s timeout and never throws — on timeout or network failure it
  resolves `{ status: 0, ok: false }`, so a hung server can no longer leave a screen spinning.
- Added unmount guards (`alive` ref) and in-flight gates to both driver screens, so responses
  that land after Back/Log out no longer call `setState`, and repeated taps on
  Start/Stop/Refresh collapse into a single request. Status refresh is now silent: it keeps
  the content on screen and reports failure inline instead of blanking to a spinner.
- Hardened `App.js`: `handleLogout` uses `try/finally` so a SecureStore failure cannot strand
  the session, `handleLogin` sets the session even if the keychain write fails, and the
  screen callbacks are `useCallback`-stable so the status screen's `BackHandler` effect stops
  re-subscribing every render. A malformed 200 (missing `driver`) falls back to the
  "No driver profile" view instead of crashing on destructuring.
- New/changed: `mobile/api.js`, `mobile/App.js`, `mobile/src/screens/DriverStatusScreen.js`,
  `mobile/src/screens/DriverTripScreen.js`. No endpoints, DB tables or components added.
  No contract or schema change.
- Tested: in Expo Go against a slowed/hung API — spinner then the error state with Retry, no
  crash; Start tapped 5× fast → one POST and one new `trips` row; Refresh tapped 5× fast →
  one request with the content never blanking; Back pressed while a request was in flight →
  no "unmounted component" warning and no crash; repeated Android hardware back during a
  refresh → app never closes; airplane mode then Retry → error state twice, recovers;
  malformed 200 body → "No driver profile" instead of a red screen.
- Gotchas: (1) `BASE_URL` must be exported from `api.js` — `DriverStatusScreen` imports it,
  and if it is undefined the license download requests `undefined/api/driver/license/...`;
  (2) a physical phone cannot reach `localhost`, so `BASE_URL` needs the PC's LAN IP
  (Android emulator `10.0.2.2`, iOS simulator `localhost`); (3) changing `api.js` requires
  `npx expo start -c` because Metro caches that module; (4) `apiFetch`'s timeout path returns
  `status: 0`, deliberately not a real HTTP code, so existing `!r.ok` handling catches it.