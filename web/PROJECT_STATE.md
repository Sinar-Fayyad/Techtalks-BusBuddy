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

## ⬇️ RAW ZONE — append your block below this line, don't touch anything above

Format (the end-of-task prompt already generates this — just paste it):

## [date] — [name] — [task]

- What was done (2-3 lines)
- Files added/changed
- Tested: success + error cases
- Gotchas for others (or "none")
