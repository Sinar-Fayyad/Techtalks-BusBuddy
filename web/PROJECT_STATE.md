# BusBuddy — PROJECT_STATE.md

## How this file works

- DURING the sprint: finished a task? → append your block at the very bottom (RAW ZONE). No formatting stress, no editing others' entries.
- END of week: the AI rewrites the whole file (clean state + weekly recap) → the clean version starts the next sprint.
- Single sources of truth — do NOT duplicate them here:
  Endpoints → web/docs/API_CONTRACT.md · Database → database/schema.sql · Tests → web/docs/TESTING.md

## Current state (cleaned 16/10 — mid Sprint 5)

### Stack

- web/ — Next.js App Router: UI in app/, API in app/api/ · Leaflet 1.9.4 + OpenStreetMap (client-only via next/dynamic) · welcome asset: public/busbuddy-illustration.jpg
- mobile/ — Expo/React Native: src/App.js + src/screens/ (Login/Register/Home/DriverTrip/DriverStatus) + shared Button/Input · expo-linear-gradient, expo-secure-store
- DB — MySQL (WAMP), busbuddy_app, all InnoDB → database/schema.sql · seed → database/seed.sql
- Auth — JWT { userId, role } 7d · roles: admin/driver/student/parent · web: localStorage bb_token/bb_role via auth-context · mobile: expo-secure-store · signup role="admin" → 403

### Setup on a new machine

1. web/.env.local → DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, DB_PORT (ports differ per machine; ask, never hardcode)
2. Fresh DB → run database/schema.sql, then database/seed.sql. Starting/stopping trips during testing leaves extra ended trips → re-run seed.sql before any demo.
3. Recreate web/uploads/ license files per machine (gitignored — recipes in the T14 PR description)
4. npm install in web/ AND mobile/ — mandatory after any pull

### What exists now

- Welcome + onboarding: / (welcome, illustration bg) · /get-started role chooser · shared ErrorMessage on both
- Admin: /admin/home · /admin/drivers (verify/reject, inline license preview)
- Driver web: /driver/register (201s but no session/redirect — F4) · /driver/status · /driver/home = Start/Stop + GpsShare GPS + "My trips" (refresh mid-trip shows the correct Stop state)
- Student: /student/home — always-on polling (30s idle / 10s active), auto-detects a trip starting, live Leaflet map, "Trip completed" end state, stale indicator greys out after 30s
- Parent: /parent/home — restyled (greeting header, "Tracking Active" banner, "My Children" cards with status badges, selected child's trip card + live map, quick actions); children selector + the 3 trip states intact · Add-child card (entry 12) still 400s — F3
- Onboarding wiring: Driver → /driver/register ✅ · Student/Parent → /student/home, /parent/home; signed-out visitors bounce to /login (F5) · /student/register unreachable from UI · /parent/register 404
- Signup: driver/student/parent → 201 · admin → 403, 0 rows · unknown/omitted role → driver · dup → 409 · missing → 400
- Mobile: DriverTripScreen (start/stop) + DriverStatusScreen (verified/pending/rejected + license download) · no GPS sharing on mobile (web-only)
- Components: Button / ErrorMessage / Input / LeafletMap / LiveBusMap / GpsShare — all in folders (index.tsx + module.css)
- APIs — contract v11 (entries 1–18)
- Testing: Sprint 4 pass — 26 checks → 17 ✅ · 1 ⚠️ · 8 ❌ (W41–W45, TESTING.md)

### Conventions (rules)

- Never invent endpoints — update the contract in the same PR; entry numbers never renumbered
- Never hardcode local config; mobile BASE_URL = PC LAN IPv4 (test GPS sharing on localhost, not the LAN IP)
- Web UI: shared components + CSS variables; errors = ErrorMessage + console.error
- Components live in folders (index.tsx + module.css)
- DB changed? → schema.sql change log (same PR) · Test data → database/seed.sql
- Every task: success AND error cases tested before the PR; results appended to TESTING.md

### Known gaps (priority order)

1. **F3 (blocker):** entry 12 email mode missing in app/api/parents/me/children/route.ts — UI + contract v11 use { email }; route is studentId-only → 400. Parent linking dead until fixed.
2. **F4:** /driver/register discards the token and never redirects to /driver/home.
3. **F5:** chooser Student/Parent cards dead-end at /login; /parent/register 404; /student/register unreachable from UI.
4. Mobile GPS sharing (expo-location) + mobile parity gaps.
5. UI mockup parity; bus-list/booking needs NEW contract endpoints first (design before build).
6. Endpoint 13 has no admin UI.
7. Parents can't **unlink** a child — no endpoint exists (entry 12 only links, entry 15 only lists). Needs a new contract entry (e.g. DELETE /parents/me/children/{studentId}) + route + UI before it can exist.

### Weekly recaps

- Sprint 0 (→12/09): signup/login, driver profile, admin approval, registration UIs. 20 ✅
- Sprint 1 (15–18/09): sessions + guards, driver status, license permissions, trips APIs, mobile refactor. W1–W14 ✅ M1–M6 ✅
- Sprint 2 (21–24/09, tested 29/09): 4 roles + link tables + GPS columns · driver start/stop · parent/student trip-status · admin inline preview. 34 ✅ · 1 ❌ (W39) · fixes: auth-context 4-role refresh, seed UTC
- Sprint 3 (01–04/10, tested 04/10): live GPS map (entry 16, GpsShare, student map), GET active trip (17), trip history (18), endpoint 13, /admin/home (W39 fixed), mobile DriverTripScreen. Contract v9. TESTING.md W40+
- Sprint 4 (05–11/10, tested 11/10): signup admin-block (contract v10→v11) · welcome + role chooser + illustration bg · T9b refresh fix · student signup · F1 polling fix · parent link-child UI · mobile driver status · onboarding wiring · ErrorMessage on welcome/chooser · auth-page guards · test pass 17✅/1⚠️/8❌, findings **F3/F4/F5**
- Sprint 5 (13–16/10, in progress): mobile driver parity (T4 status + back/logout, T5 My trips, T6 buffer/drop-safe) · student home parity (T7) · parent home restyle (T8) · GpsShare folder conversion. No new findings.

---

## ⬇️ RAW ZONE — append your block below this line, don't touch anything above

Format (the end-of-task prompt already generates this — just paste it):

## [date] — [name] — [task]

- What was done (2-3 lines)
- Files added/changed
- Tested: success + error cases
- Gotchas for others (or "none")
