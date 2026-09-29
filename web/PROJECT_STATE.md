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

## [date] — [name] — [task]

- What was done (2-3 lines)
- Files added/changed
- Tested: success + error cases
- Gotchas for others (or "none")
