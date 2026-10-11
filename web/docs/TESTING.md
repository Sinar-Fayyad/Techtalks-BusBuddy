# BusBuddy — Testing Document

Rules:

- Every task: test success AND error cases before opening the PR.
- At sprint end, the tester runs the full checklist and records results (✅/❌ + note).
- Tools: browser + DevTools (UI), curl/Postman/Apidog (API), mysql CLI or phpMyAdmin (DB truth), Expo Go (mobile).
- Anonymous/permission checks: verify in a plain browser or fresh curl — leftover headers can fake a pass.

## Environment

- Web/API: http://localhost:3000 (web/, npm run dev)
- DB: MySQL/WAMP — BusBuddy_app (schema: database/schema.sql). Ports differ per machine (testing PC = 3308) — check .env.local, never hardcode.
- Mobile: Expo Go on phone — BASE_URL in mobile/api.js = PC's LAN IPv4
- Test data: run database/schema.sql then database/seed.sql → admin + verified/pending drivers + students + linked parent (all @busbuddy.test, pw Test1234! / Parent1234!) + ONE ACTIVE TRIP (verified driver, student on board) → /parent/home shows "In Transit" immediately. Seed times MUST stay UTC_TIMESTAMP(3) — never NOW(). Stopped the trip while testing? Re-run seed.sql.
- web/uploads/ is gitignored — recreate seed license files per machine (recipes in T14 PR description).

## Sprint 0 — Registration & approval (12/09) — 20/20 ✅

| # | Test | Expected | Result |
|---|------|----------|--------|
| 1 | Signup (name, email, password) | 201 User created | ✅ |
| 2 | Duplicate email | 409 | ✅ |
| 3 | Missing fields | 400 | ✅ |
| 4 | Login, wrong password | 401 Invalid credentials | ✅ |
| 5 | Login, valid driver | 200 + JWT + role driver | ✅ |
| 6 | Login, valid admin | 200 + role admin | ✅ |
| 7 | Driver profile + token | 201 pending review | ✅ |
| 8 | Duplicate profile | 409 | ✅ |
| 9 | Profile without token | 401 | ✅ |
| 10 | Admin list (admin token) | pending drivers array | ✅ |
| 11 | Admin list (driver token) | 403 | ✅ |
| 12 | Verify driver | 200 Driver verified | ✅ |
| 13 | Verified leaves pending list | gone from array | ✅ |
| 14 | Reject driver | 200 Driver rejected | ✅ |
| 15 | Invalid action ("banana") | 400 | ✅ |
| 16 | Admin UI list | rows render with buttons | ✅ |
| 17 | Admin UI verify | driver disappears | ✅ |
| 18 | Driver form E2E | green success message | ✅ |
| 19 | Form → admin integration | appears in pending list | ✅ |
| 20 | DB state check | drivers.status matches action | ✅ |

## Sprint 1 — Integration testing (18/09, Sinar) — Web 14/14 ✅ · Mobile 6/6 ✅

### Web (W)

| # | Test | Expected | Result |
|---|------|----------|--------|
| W1 | Driver register end-to-end (real file upload) | success, row in drivers | ✅ |
| W2 | Admin login → /admin/drivers, no token paste | redirect + list loads | ✅ |
| W3 | Refresh browser | still logged in | ✅ |
| W4 | Cleared session + /admin/drivers by URL | redirect to /login | ✅ |
| W5 | Driver token on admin page | Access denied, 0 API calls | ✅ |
| W6 | Driver views OWN license | file opens | ✅ |
| W7 | Driver views OTHER driver's license | 403 | ✅ |
| W8 | Admin views any license | file opens | ✅ |
| W9 | License request, no token | 401 | ✅ |
| W10 | Admin Verify / Reject | drivers.status updates in DB | ✅ |
| W11 | /driver/status shows own data only | own status, others' impossible | ✅ |
| W12 | Status updates live (pending → verified) | refresh shows VERIFIED | ✅ |
| W13 | Trips: start 201 / double 409 / stop 200 / stop again 404 | as listed | ✅ |
| W14 | Admin GET driver trips | correct rows, newest first | ✅ |

### Test-method changes (21/09 web cleanup)

- W6/W8: license opens via "View license file" button / "license" link (Bearer + blob viewer, web/lib/view-license.ts). Expected unchanged: file displays.
- W7: UI no longer exposes other drivers' file URLs. Run as DRIVER via DevTools console:
  fetch('/api/driver/license/<OTHER_FILE>', { headers: { Authorization: 'Bearer ' + localStorage.getItem('bb_token') } }).then(r => r.status) → 403
- W9: file URL with no token → 401. Legacy ?token=... URLs also 401 (hardened, Bearer-only).

### Mobile (M)

| # | Test | Expected | Result |
|---|------|----------|--------|
| M1 | Login driver on phone | Home "Logged in as driver" | ✅ |
| M2 | Kill app → reopen | still logged in (secure-store) | ✅ |
| M3 | Wrong password | visible error, no crash | ✅ |
| M4 | Register from phone (photo pick → upload) | success | ✅ |
| M5 | "Create an account" link | opens RegisterScreen | ✅ |
| M6 | Full loop: register on phone → admin verifies on web → login on phone | works | ✅ |

## Bugs found & fixed while integration-testing (Sprint 1)

1. DB port 3308 leaked from one teammate's machine → ECONNREFUSED everywhere. Fix: DB_PORT in .env.local, never hardcode.
2. Repo schema SQL outdated (password vs password_hash) → signup crashed. Fix: ALTER TABLE users CHANGE password password_hash VARCHAR(255) NOT NULL.
3. users/drivers were MyISAM → error #1824 creating trips FK. Fix: ALTER TABLE ... ENGINE=InnoDB.
4. Token payload field mismatch (code read id/sub, token has userId) → driver 403 on own license. Fix: read userId first.
5. T3 vs T7 conflict → rule: admin = any file, driver = only own license_url.
6. Mobile RegisterScreen unreachable. Fix: register link on LoginScreen.

## Sprint 2 — Integration testing (29/09, Wassim) — on dev incl. T8–T12

Environment: Windows 10 · WAMP MySQL 8.0.18 port 3308 · Next.js dev :3000 · branch `feature/T14-integration-dry-run` (off dev @ ee6919f, incl. merged T13 + T12). Fresh seed re-run before the pass. Tools: curl (API, fresh Bearer token per request), Chromium preview (UI, DOM/img checks), mysql CLI (DB truth). phpMyAdmin and Expo Go NOT used this pass.

### New tests (W15+)

| # | Test | Steps | Expected | Result |
|---|------|-------|----------|--------|
| W15 | Login all seeded roles | POST /auth/login ×5 (admin/driver×2/student/parent) | 200 + correct role each | ✅ |
| W16 | Login wrong password | POST /auth/login, bad pw | 401 | ✅ |
| W17 | Admin list permission matrix | admin 200 · driver token · no token | 200 · 403 · 401 | ✅ |
| W18 | License matrix W6–W9 + hardening | admin→PNG 200 image/png · admin→PDF 200 application/pdf · driver own 200 · driver→other 403 · student token 403 · no token 401 · legacy ?token= 401 · `..%2F` traversal 400 · missing 404 | as listed | ✅ |
| W19 | Seed → student sees ACTIVE trip | GET /students/4/trip-status (student token) | trip with end_time null | ✅ |
| W20 | Student with no trip | GET /students/6/trip-status | {"trip":null} | ✅ |
| W21 | Double-start on seeded trip | POST /driver/trips/start while seed trip active | 409 | ✅ |
| W22 | Stop the seeded trip | POST /driver/trips/stop | 200, end_time set | ✅ |
| W23 | Stop again | POST /driver/trips/stop | 404 | ✅ |
| W24 | Fresh start after stop | POST /driver/trips/start | 201 | ✅ |
| W25 | Pending driver starts trip | driver2 (pending) token | 403 | ✅ |
| W26 | Admin trips list + bad id | GET /admin/drivers/1/trips · /abc/trips | 200 newest-first · 400 | ✅ |
| W27 | Parent lists children (endpoint 15) | GET /parents/me/children | 200, both linked children | ✅ |
| W28 | Link child SUCCESS | signup student3 → POST /parents/me/children | 201 "Child linked" | ✅ |
| W29 | Link error guards | dup 409 · missing 404 · target admin 403 · driver token 403 · no token 401 · bad body 400 | as listed | ✅ |
| W30 | Trip-status after stop | GET /students/4/trip-status | same trip, end_time set | ✅ |
| W31 | Student views another student | student1 token → /students/6/trip-status | 403 | ✅ |
| W32 | Registration loop E2E | signup (defaults driver) → upload 201 → profile 201 → dup 409 → admin verify 200 → /driver/me verified | as listed | ✅ |
| W33 | /parent/home In-Transit | login parent in browser, select student1 | "🚌 In Transit" + start time | ✅ |
| W34 | /parent/home no-trip state | select student2 | "🗓 No trip today" | ✅ |
| W35 | Parent session survives refresh | F5 on /parent/home | still logged in, same data | ✅ |
| W36 | /student/home live trip | student token → /student/home | "Trip in progress", trip id, Active | ✅ |
| W37 | /driver/home 409 resync | Start (seed trip active) → friendly msg + flips to Stop → Stop → "Last trip" summary | as listed | ✅ |
| W38 | Admin inline preview (T12) | /admin/drivers: driver3 PNG + driver2 PDF pending | PNG renders inline `<img>`; PDF shows "📄 View PDF" | ✅ |
| W39 | Admin login redirect | login as admin in browser | lands on working admin page | ❌ redirects to /admin/home → 404 (page doesn't exist) |

### Regressions re-run this pass

| # | Test | Result |
|---|------|--------|
| W1 | Driver signup → upload → profile E2E (API) | ✅ (see W32) |
| W5 | Driver token on /admin/drivers (browser) | ✅ blocked |
| W6 | Driver views own license | ✅ 200 image/png |
| W7 | Driver → other driver's license | ✅ 403 |
| W8 | Admin views any license | ✅ 200 (PNG + PDF) |
| W9 | License, no token / legacy ?token= | ✅ 401 both |
| W10 | Admin Verify (+ Reject in T13 pass) | ✅ 200, status in DB |
| W13 | Trips 201/409/200/404 | ✅ (W21–W24) |
| W14 | Admin GET driver trips | ✅ (W26) |
| W3 | Refresh stays logged in | ✅ admin/parent/student; driver refresh not separately observed (same code path) |
| W2/W4/W11/W12 | Not re-run this pass | ⬜ superseded by W17/W33–W36 coverage; Sprint-1 results stand |
| M1–M6 | Mobile regression | ⬜ not run — no Expo device/emulator this session |
| Quick checks (upload bad type / >5MB, /login empty fields, server-off) | not run this session | ⬜ |

### Fixes made during testing (on T14 branch — merge before claiming)

1. web/app/auth-context.tsx — session restore dropped student/parent roles → "Access denied" after F5. Widened filter to all 4 roles; re-verified refresh for admin/parent/student.
2. database/seed.sql — NOW(3) → UTC_TIMESTAMP(3): NOW() wrote WAMP local time (+3) vs API's UTC → start>end rows. One-time CONVERT_TZ repair applied to existing rows. Reset recipe corrected for FK-safe order (trips → drivers → links → users).
3. Docs only: schema.sql change-log + TESTING.md seed notes.

**Tally: 34 ✅ (24 new + 10 regression) · 1 ❌ (W39) · 14 ⬜ not re-run this pass.**

## Quick checks (T14) — ✅ executed 2026-10-04, see the Sprint 3 T14 block below

## Known issues → next sprint

1. ~~Admin login → /admin/home → 404 (W39 ❌)~~ ✅ FIXED (T5) — /admin/home renders in real Chrome, confirmed 2026-10-04 during T14
2. ~~Endpoint 13 (POST /trips/{id}/students) contract-planned, NOT built — student-trip linking via direct trip_students SQL only~~ ✅ IMPLEMENTED (T10, 02/10) — admin API only, no UI yet; students linked via API/seed
3. ~~Mobile M1–M6 not re-run this pass (no device); mobile still has no driver-status/trip screens~~ ✅ M1–M6 6/6 (T15, real device) · T13 added DriverTripScreen — mobile GPS sharing still missing (Sprint 4)
4. ~~Seed "full reset" recipe documented but not executed end-to-end after edit~~ ✅ executed end-to-end 2026-10-04 (T14 Q5)
5. ~~F1: student page open before trip start misses the map~~ ✅ FIXED (T7) — re-verified live in Sprint 4 pass (W43a–d, 4/4 ✅)
6. ~~F2: /driver/home refresh showed stale Start~~ ✅ FIXED (S4-T3) — re-verified live (W44a–c, 3/3 ✅)
7. **NEW → Sprint 5:** F3 parent link-by-email 400 (route not updated for contract v11) · F4 driver register saves no session / no redirect · F5 chooser Student+Parent cards dead-end to /login, /parent/register 404, /student/register unreachable

## Sprint 3 — T14 pending quick-checks (2026-10-04) — 5/5 ✅

Environment: Windows · WAMP MySQL 3306 · BusBuddy_app · web dev :3000 · branch feature/t14-pending-quick-checks. Fresh seed reset FIRST (DELETE trips/trip_students + seed users → re-import database/seed.sql), then all checks on the fresh DB. License files recreated per-machine: 1×1 PNG via PowerShell base64, PDF via Chrome print-to-PDF (~102 KB).

| # | Test | Steps | Expected | Result |
|---|------|-------|----------|--------|
| Q1 | Upload wrong type | curl POST /api/driver/license, driver1 token, test-bad-type.txt | 400 | ✅ `{"error":"Only PDF, JPG, PNG allowed"}` 400 |
| Q2 | Upload >5MB | same, test-big.jpg (6,291,456 bytes via fsutil) | 400 | ✅ `{"error":"Max 5MB"}` 400 |
| Q3 | /login empty fields | Chrome DevTools Network tab, click Log in with both fields empty | inline error, NO network call | ✅ "Email is required" + "Password is required" inline; Network shows only 2 font requests, zero API calls |
| Q4 | PDF license in real Chrome | admin → /admin/drivers → Seed Driver Two → View PDF | PDF renders in new tab (blob URL) | ✅ seed-driver2-license.pdf renders |
| Q5 | Full seed reset end-to-end | phpMyAdmin SQL: DELETE trip_students; trips; seed users → Import seed.sql | 5 users, 1 link, exactly 1 active trip, UTC times | ✅ users ids 15–19 (driver1 verified+PNG, driver2 pending+PDF), 1 link (parent 19 → student 18), trip id 10 end_time NULL, start 18:31 UTC = 21:31 local (UTC+3) |

Notes / gotchas:

- PowerShell `[IO.File]::WriteAllBytes` ignores the shell's current folder — always pass the FULL absolute path (it wrote to C:\WINDOWS\system32 silently otherwise).
- Seed reset CHANGES user ids (now 15–19) — re-check ids before any hardcoded-id debugging.
- Bonus observation: admin login → /admin/home renders correctly (W39 fix confirmed in real Chrome).
- License-file recipes (for any machine): PNG = PowerShell base64 one-liner (bytes in T14 PR description) · PDF = Chrome Ctrl+P → Save as PDF → rename to seed-driver2-license.pdf.

## Sprint 3 — T15 integration pass (2026-10-04) — W40 + mobile

Environment: Windows · WAMP MySQL 3306 · BusBuddy_app · web dev :3000 · branch feature/t15-integration-and-report (incl. merged T13/T14). Seed reset run first (T14 recipe). Tools: Chrome ×2 (driver/student tabs), DevTools Network, phpMyAdmin SQL, Expo Go on physical device.

### W40 — E2E live-map flow (driver shares → student sees → stop ends)

| # | Test | Steps | Expected | Result |
|---|------|-------|----------|--------|
| W40a | Student baseline | student1 → /student/home with seeded active trip | "Trip in progress" + Live location card | ✅ |
| W40b | Driver starts + shares | /driver/home → Start Trip → allow location | 409 on seeded trip → resync → Stop button; GpsShare pings | ✅ |
| W40c | Pings every ~10s | DevTools Network on driver tab | POST /driver/trips/location 200, ~1/10s, initiator GpsShare.tsx | ✅ |
| W40d | Student marker moves | watch student tab ~10s | bus marker + "Updated Xs ago" ticker | ⚠️ marker appeared only AFTER manual student refresh; see finding F1 |
| W40e | Stop ends sharing | driver → Stop Trip | student map card disappears within ~10s | ✅ |
| W40f | DB truth | SELECT id, latitude, longitude, location_updated_at, end_time FROM trips ORDER BY id DESC | GPS verified on watched trip: coords + location_updated_at set while active (end_time NULL); end_time filled after stop | ✅ (watched trip: 33.667694 / 35.671859) |

Findings:

- F1: student tab open BEFORE trip start misses the transition — polling only runs while an active trip is already on screen (T12 design); one manual refresh recovers. Owner: T12. Not fixed in T15.
- F2 (pre-existing, confirmed live): /driver/home on fresh refresh shows ▶ Start even though the seeded trip is active (T9b-page gap) — Start then 409s and resyncs. Owner: T9. Not fixed in T15.

### Mobile regression — M1–M6 on physical device (Expo Go) — 6/6 ✅

M1 login shows the NEW T13 driver screen (Start/Stop) — expected change from T13, not a failure. M2 session survives kill+reopen ✅ · M3 wrong password error, no crash ✅ · M4 student1 login renders HomeScreen ✅ · M5 "Create an account" opens RegisterScreen ✅ · M6 register-on-phone → admin verifies on web → driver login on phone ✅.

**T15 tally: W40 5/6 ✅ + 1 ⚠️ (F1) · M1–M6 6/6 ✅ · 2 pre-existing findings logged (F1, F2), not fixed here.**

## Sprint 4 — T15 test pass (2026-10-11) — W41–W45

Environment: Windows · WAMP MySQL busbuddy_app (port 3308 per .env.local, root/no password) · web dev on :51841 (reused the already-running dev server; :3000 was free) · branch `S4-T15-testing-docs` (off dev @ 4dab16c). Fresh seed reset first (T14 recipe). Tools: curl (fresh Bearer per request) · Chrome + DevTools (UI) · mysql CLI (DB truth). Contract v11 — no API/schema change in this task (docs-only).

### W41 — Signup role matrix, incl. admin rejection (contract v11 entry 1)

| # | Test | Steps | Expected | Result |
|---|------|-------|----------|--------|
| W41a | Signup student | POST /auth/signup role=student | 201, role=student row in users | ✅ 201 userId=14, DB role=student |
| W41b | Signup parent | role=parent | 201, role=parent row | ✅ 201 userId=15, DB role=parent |
| W41c | Signup driver (default) | role omitted | 201, role=driver row | ✅ 201 explicit=userId16 + omitted=userId18, both DB role=driver |
| W41d | Signup admin REJECTED | role=admin | 403, 0 rows written (DB check) | ✅ 403 `Admin accounts cannot be created via signup`, DB rows=0 |
| W41e | Unknown role | role=banana | defaults to driver (carried from v4) | ✅ 201 userId=17, DB role=driver |
| W41f | Duplicate email | repeat W41a email | 409, still one row | ✅ 409 `Email already registered`, DB rows=1 |
| W41g | Missing fields | empty body | 400 | ✅ 400 `Missing fields` |

### W42 — Onboarding E2E per role (T6 student / T8 parent / T10 wiring)

| # | Test | Steps | Expected | Result |
|---|------|-------|----------|--------|
| W42a | Driver path | / → Get Started → Driver card → /driver/register → submit | lands on /driver/home, session survives F5 | ❌ register works (signup 201 → login 200 → upload 201 → profile 201, inline ✅ msg) but NO session saved (bb_token null) and NO redirect — stays on /driver/register. See F4 |
| W42b | Student path | chooser → /student/register → submit | auto-login → /student/home, F5 keeps session | ⚠️ page itself ✅ (signup → auto-login → /student/home, F5 keeps session) but chooser does NOT link to it — reached by direct URL only, see W42d/F5 |
| W42c | Parent path | chooser → /parent/register → submit | auto-login → /parent/home, F5 keeps session | ❌ GET /parent/register → HTTP 404 — page does not exist (T8 never built it). See F5 |
| W42d | Chooser no dead-end | signed-out browser, Student/Parent cards | reach the signup pages (no bounce to /login) | ❌ Student card → /student/home → bounced to /login; Parent card → same; Driver card → /driver/register ✅. T10 chooser wiring not on dev. See F5 |
| W42e | Signup error cases | empty form · invalid email · duplicate email | inline errors, 0 requests / 409 inline, no crash | ✅ empty → "Please fill in all fields" + 0 requests · invalid → "Enter a valid email" + 0 requests · duplicate → 409 inline "Email already registered" (driver form: "All fields are required" + 0 requests) |
| W42f | Admin signup regression | API role=admin | 403 | ✅ 403 (see W41d) |

### W43 — F1: student page opened BEFORE trip start (T7 fix)

| # | Test | Steps | Expected | Result |
|---|------|-------|----------|--------|
| W43a | Detects new trip | student no-trip page open → driver starts trip | "Trip in progress" + map appear WITHOUT manual refresh (≤~30s) | ✅ page flipped to "🚌 Trip in progress" + Live location + Trip #7 within ≤33s of the trip starting — zero refreshes/clicks (F1 confirmed FIXED) |
| W43b | Poll rhythm | DevTools Network on student tab | ~30s interval with no trip → ~10s while active | ✅ measured: 3 req/68s idle · 8 req/33s + 3 req/26s active · performance-timeline deltas 10s×n while active → 30s×10 after end |
| W43c | Trip ends | driver stops trip | status clears ≤~30s, rhythm back to 30s | ✅ "✅ Trip completed" + end time + map card gone within ≤33s, no refresh |
| W43d | Logout stops polling | log out on student home | 0 further trip-status requests | ✅ logout → /login, bb_token cleared, 1 boundary request then 0 in the next 38s (> one 30s period) |

### W44 — T9b: /driver/home refresh mid-trip (S4-T3 fix, was F2)

| # | Test | Steps | Expected | Result |
|---|------|-------|----------|--------|
| W44a | Refresh during own active trip | F5 on /driver/home while trip active | Stop shown immediately (GET /driver/trips/active on mount), no 409 resync needed | ✅ fresh load with trip 8 active → GET /api/driver/trips/active 200 on mount, ⏹ Stop shown, no POST/409 (F2 confirmed FIXED). Note: preview-tool reload hung on "Checking session…" — dev-server HMR stall, see gotchas |
| W44b | Trip ended in another tab | stop elsewhere → refresh | ▶ Start shown | ✅ stop via API ("other tab") → reload → GET active 200 → ▶ Start shown, no 409 needed |
| W44c | No trip | fresh refresh | ▶ Start, normal start still works (201) | ✅ no trip → ▶ Start Trip on load; clicking it → POST /driver/trips/start 201 + flips to ⏹ Stop |

### W45 — Link-child guards via the T8 UI (contract v11 entry 12; API guards already covered by W28/W29)

| # | Test | Steps | Expected | Result |
|---|------|-------|----------|--------|
| W45a | Link success via UI | parent link form with a student email | 201, parent_child row in DB, child appears in /parent/home selector (entry 15) | ❌ UI → 400 `Missing or invalid studentId` — API route never implemented email mode (see F3). Sub-check: API `{studentId}` mode → 201, row in parent_student, chip appears in selector after reload ✅ |
| W45b | Already linked | same pair again | 409, friendly inline message | ❌ blocked by the F3 400 (unreachable via UI). Sub-check: API studentId mode → 409 `Link already exists` ✅ |
| W45c | Unknown email | no-such-email@x.com | 404 message | ❌ got 400 `Missing or invalid studentId` instead of 404 — email lookup does not exist server-side (F3). Malformed input is blocked client-side with 0 requests ✅ |
| W45d | Target not a student | driver or admin email | 403 message | ❌ blocked by the F3 400. Sub-check: API studentId mode with driver token → 403 `Not a parent` ✅ |
| W45e | No session | logged-out attempt | redirect to /login / 401, no row | ✅ signed-out /parent/home → redirect /login; API with no token → 401 `No token`, no row |
| W45f | Skip + link later | skip at signup → link from /parent/home | both paths work | ❌ link-later card opens + client validation works, but submit → 400 (F3); skip-at-signup untestable — /parent/register 404 (F5) |

### Findings (new this pass)

- **F3 (blocker, T8): parent link-child by email is broken end-to-end.** The UI (parent/home) and contract v11 both use `{ email }`, but `app/api/parents/me/children/route.ts` was never updated — it only accepts `{ studentId }`, so every email attempt returns 400 `Missing or invalid studentId`. Parents cannot link a child through the UI at all, and contract v11 documents behavior the API does not implement (contract/implementation mismatch). Fix belongs to the T8 owner: implement email mode in the route.
- **F4 (T10): driver register creates no session.** After the successful 4-step register (signup 201 → login 200 → upload 201 → profile 201) the token is discarded (`bb_token` null) and there is no redirect — the user sits on /driver/register. T10's specified fix (auth-context `login(token, role)` + `router.push('/driver/home')`) is not in the code.
- **F5 (T6/T8/T10): onboarding chooser dead-ends.** /get-started Student and Parent cards link to /student/home and /parent/home, which bounce signed-out visitors to /login; /student/register exists but is unreachable from any UI link (direct URL only); /parent/register returns 404 (never built).
- Environment gotcha (not an app bug): the preview browser's reload hung on "Checking session…" while the dev server was in a Turbopack HMR reconnect loop (its own log: "Turbopack's filesystem cache has been deleted because we previously detected an internal error"). Fresh full-page loads worked — W44 verified that way. Restart the dev server if HMR stalls.

**Sprint 4 tally: W41 7/7 ✅ · W42 2✅ + 1⚠️ + 3❌ · W43 4/4 ✅ · W44 3/3 ✅ · W45 1✅ + 5❌ → 17 ✅ · 1 ⚠️ · 8 ❌.** F1 (T7) and F2/T9b (S4-T3) confirmed FIXED; new findings F3/F4/F5 logged → Sprint 5.

---

Testers: Sprint 0 + Sprint 1 — Sinar · Sprint 2 — Wassim · Sprint 3 — Sinar · Sprint 4 — Sinar
