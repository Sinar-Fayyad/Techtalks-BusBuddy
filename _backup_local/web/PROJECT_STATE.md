# BusBuddy — PROJECT_STATE.md

## How this file works

- DURING the sprint: finished a task? → append your block at the very bottom (RAW ZONE). No formatting stress, no editing others' entries.
- END of week: Sino feeds the whole file to the AI → it gets rewritten from zero (clean state + weekly recap) → the clean version starts the next sprint.
- Single sources of truth — do NOT duplicate them here:
  Endpoints → web/docs/API_CONTRACT.md · Database → database/schema.sql · Tests → web/docs/TESTING.md

## Current state (cleaned 18/09 — Sino + AI)

### Stack

- web/ — Next.js App Router: UI in app/, API in app/api/
- mobile/ — Expo/React Native: App.js = session controller, screens as separate files
- DB — MySQL (WAMP), BusBuddy_app, all tables InnoDB → database/schema.sql
- Auth — JWT { userId, role } 7d · web: localStorage bb_token/bb_role (auth-context) · mobile: expo-secure-store (same keys)

### Setup on a new machine

1. web/.env.local → DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, DB_PORT (ports differ per machine — ask, never hardcode)
2. Fresh DB → run database/schema.sql. Old DB → check its change log.
3. npm install in web/ AND mobile/ (again after any pull that adds packages)

### What exists now (end of Sprint 2)

- Web: landing → login (role redirects) → /admin/drivers (session, verify/reject, logout) → /driver/register → /driver/status (own status + own license file)
- License rule: admin = any file · driver = ONLY own · anonymous = 401
- Trips APIs: start (409 guard) / stop / admin list — verified live (201/409/200/404)
- Mobile: login ↔ register navigation, secure session surviving restarts, registration end-to-end
- Full loop proven: register on phone → admin verifies on web → new driver logs in on phone

### Conventions (unchanged rules)

- Never invent endpoints — update the contract in the same PR
- Never hardcode local config; mobile BASE_URL = PC LAN IPv4
- Web UI: shared components + CSS variables only; errors = friendly message + console.error in catch
- DB changed? → append the query to database/schema.sql change log (same PR)

### Known gaps → Sprint 3

- License preview inline in /admin/drivers · logout/back on /driver/status
- Pages to match Dana's mockups · shared Error component
- Mobile: shared Button/Input · driver status screen
- ?token= URL hardening

### Weekly recaps

- Sprint 1 (→12/09): signup/login, driver profile, admin approval, registration UIs (web+mobile). 20 tests ✅. Gaps carried: no sessions, manual tokens.
- Sprint 2 (15–18/09): sessions + guards, driver status page, license permission model, trips APIs, mobile refactor+login. Integration bugs fixed: leaked DB port, outdated schema, MyISAM→#1824, token field mismatch, T3/T7 license conflict, unreachable RegisterScreen. W1–W14 ✅ M1–M6 ✅. New package: expo-secure-store.

---

## 21/09 — Sinar — DB migration: roles + relationships + trip location

- What was done: users.role ENUM extended with 'student','parent' (appended, safe for existing rows). trips gained nullable latitude/longitude DECIMAL(9,6) + location_updated_at DATETIME(3). New InnoDB link tables parent_student and trip_students with composite PKs (= unique pair) and FK ON DELETE CASCADE to users/trips.
- New/changed: DB only — database/schema.sql (updated CREATE TABLEs for users/trips + 2 new tables + change-log entry). No endpoints, no app code. Teammates upgrade by running the change-log block.
- Tested: signup/login still work in UI; existing rows unchanged (location = NULL). Success: insert parent→student link, insert trip_student, new roles accepted. Errors: duplicate pair → 1062, non-existent student → 1452, delete user → CASCADE removed link rows.
- Gotchas: FK columns must match users.id/trips.id types exactly; never reorder ENUM values (internal numeric mapping); composite PK already enforces the unique pair; FKs guarantee row existence, NOT role correctness (parent-vs-student checks belong in a future API task). Migration runs once — ADD COLUMN fails if repeated.

## 21/09 — Sinar — Web cleanup: Error component, logout, token hardening

- What was done: shared ErrorMessage component (friendly box, role=alert, renders null when empty) adopted on /login, /driver/register, /driver/status, /admin/drivers; catches now do console.error + friendly message per convention. Logout button added on /driver/status (outside the data block, works with no driver profile). License GET hardened to Bearer-header ONLY — ?token= fallback removed, missing token = 401; response now sends correct Content-Type. New web/lib/view-license.ts: fetch with Bearer → blob → objectURL in a pre-opened tab (popup-blocker safe), revoked after 60s.
- New/changed: NEW web/components/ErrorMessage/ (index.tsx + module.css), web/lib/view-license.ts. CHANGED api/driver/license/[name]/route.ts, app/driver/status/page.tsx, app/admin/drivers/page.tsx, app/login/page.tsx, app/driver/register/page.tsx, docs/API_CONTRACT.md (v3: entry 8 Bearer-only), docs/TESTING.md (W6–W9 methods updated, 1 quick-check ticked, 3 known issues resolved).
- Tested: admin views any license (displays), driver views own file (displays), driver views other's file → 403 (DevTools fetch), no token → 401, legacy ?token= URL → 401, global search ?token= = 0 hits. Server-off forced failure → friendly box + console.error on login/register. W1–W14 regression: all pass.
- Gotchas: license GET must send Content-Type or blobs open as downloads; window.open must run synchronously inside the click or popup blockers kill it; ?token= links die by design (401) — anyone with old saved URLs sees 401; register pages still being built keep inline errors — adopt ErrorMessage when their tasks finish.

## 21/09 — Sinar — Mobile cleanup: src/ structure + shared components

- What was done: restructured Expo app — App.js → src/App.js, screens → src/screens/ (Login/Home/Register), index.js entry repointed to './src/App' (package.json "main": "index.js" unchanged). New shared src/components/Button.js (label/onPress/loading/disabled/style/textStyle, built-in ActivityIndicator, disabled=disabled||loading) and Input.js (controlled TextInput, neutral layout-only base). Both adopted in all three screens with existing styles passed in — visuals unchanged. api.js deliberately left at root; BASE_URL and secure-store keys untouched.
- New/changed: NEW mobile/src/components/Button.js, Input.js. MOVED src/App.js, src/screens/{LoginScreen,HomeScreen,RegisterScreen}.js. CHANGED mobile/index.js (1 line). Imports updated (./api → ../../api). No endpoint/DB changes.
- Tested: npx expo start -c boots cleanly from new structure (after each stage). M1–M6 all pass: phone login, session survives restart, wrong-password error, phone register E2E, create-account link, full register→verify→login loop. Screens visually identical to before.
- Gotchas: index.js import must point at src/App or the app white-screens; always restart with expo start -c after moving files (Metro cache); shared Input defaults autoCapitalize='none' — plain-text fields (Full name) need explicit autoCapitalize="sentences" to preserve RN default; RegisterScreen keeps "Registering..." text via conditional label + disabled, NOT the loading prop (spinner would be a behavior change); delete old root copies of moved files or Metro may resolve stale ones.

## 21/09 — jad — T8 API: parent/student auth + relationships + trip status



- What was done: signup now accepts role "student"/"parent" via a VALID_ROLES allowlist (unknown roles fall back to driver, preserving old behavior). Built endpoint 1 of 3: POST /api/parents/me/children (parent self-links a child; checks in order: Bearer/JWT 401 → role≠parent 403 → body validation 400 → target missing 404 / target not a student 403 → duplicate check + ER_DUP_ENTRY safety net 409). Endpoints "assign student to trip" and "GET trip status" NOT built; API_CONTRACT.md NOT yet updated (required by task rules).
- New/changed: CHANGED web/app/api/auth/signup/route.ts · NEW web/app/api/parents/me/children/route.ts. DB: ran Sinar's 21/09 change-log migration on my local WAMP (no schema.sql change — already in the file). No contract/docs changes yet.
- Tested: SUCCESS — signup parent+student → 201; login returns "role":"parent"/"student"; link child → 201 "Child linked"; DB shows one parent_student row. ERROR cases (409 duplicate, 403 self/wrong-role, 404 missing, 401 no token, 400 bad body) planned as T8–T13 but NOT confirmed run — must be executed before PR.
- Gotchas for others: (1) My local DB was missing the 21/09 migration — ENUM without student/parent silently stored role='' (non-strict MySQL). Signup "worked" (201) but login gave role:"" and every role guard failed. Run the change-log block BEFORE testing anything from this task, then DELETE FROM users WHERE role=''. (2) A Next.js HTML 404 means the route file isn't where the server looks (exact path: app/api/parents/me/children/route.ts) — our JSON 404s never render HTML. (3) JWTs can't be recovered — re-login mints a fresh one; check the login response's "role" field as ground truth. (4) Apidog: paste ONLY the token into Bearer Token (no "Bearer " prefix). (5) PowerShell curl: wrap JSON bodies in single quotes, not \" escapes.

## 22/9 — jad — T9 Driver trip controls UI (web)

- What was done: new driver home page (web) adapted from mockup screen 1: greeting + driver name + verified badge; Start/Stop trip buttons on existing endpoints 9/10; buttons render ONLY for verified drivers (pending/rejected get an explanation card, criterion met); 409 double-start shows a friendly message AND flips the UI to Stop mode; 404 stop-without-trip flips back to Start; network failures → friendly box + console.error. Mockup elements deliberately cut (trip route/bus/student counts, Today's Summary, Alerts, bottom nav) — no endpoints provide that data; listed in PR description.
- New/changed: NEW web/app/driver/home/page.tsx · CHANGED web/app/login/page.tsx (1 line: driver redirect → /driver/home) · CHANGED web/app/driver/status/page.tsx (additive "Trip controls →" link, verified-only) — both glue edits approved. No endpoint, DB, or contract changes.
- Tested (T1–T11, all pass): verified driver lands on /driver/home; start flips to Stop + "Trip in progress" (trips row created, end_time NULL, verified in DB); trip visible in admin trips list; two-tab double-start → friendly 409 + flip; stop sets end_time (DB verified); stale-tab stop → friendly 404 + flip back; pending and rejected drivers see no buttons; server-off → friendly error + console.error; regression on login/status/license/admin list clean.
- Gotchas for others: 409/404 handlers repair UI state (setOnTrip) instead of only showing text — no "GET my active trip" endpoint exists, so the button flip on 409/404 is how the client resyncs; a future GET-active-trip endpoint would remove this (contract candidate, not invented here). Register→admin-verify→home loop used to create test drivers; keep test credentials noted (bcrypt hashes can't be recovered).

## ⬇️ RAW ZONE — append your block below this line, don't touch anything above

Format (the end-of-task prompt already generates this — just paste it):

## [date] — [name] — [task]

- What was done (2-3 lines)
- Files added/changed
- Tested: success + error cases
- Gotchas for others (or "none")
