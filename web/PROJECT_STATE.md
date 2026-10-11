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
