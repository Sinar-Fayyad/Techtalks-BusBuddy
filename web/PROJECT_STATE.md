# BusBuddy — PROJECT_STATE.md

Final state of the project (24/10/2026, end of the TechTalks internship).
Single sources of truth:
Endpoints → `web/docs/API_CONTRACT.md` (v13, entries 1–48) · Database → `web/database/schema.sql` (v5) · Tests → `web/docs/TESTING.md`

## What BusBuddy is

University students find and book independent bus drivers. A parent can see their child's live location **only between the moment the child scans the boarding QR code and the moment they scan the exit QR code**. Drivers' licenses are checked by an admin before a driver can offer trips. Payment happens outside the app. Web app + mobile app, one shared REST API and one MySQL database.

## Current state (cleaned 24/10)

### Stack
- **web/** — Next.js 16 (App Router, Turbopack), React 19, TypeScript. Pages in `app/`, REST API in `app/api/`. Leaflet 1.9.4 + OpenStreetMap, `qrcode.react`. Styling: design tokens + shared classes in `app/globals.css`, CSS modules per component.
- **mobile/** — Expo (SDK 57) / React Native 0.86. `src/App.js` (small state machine, no react-navigation), `src/Shell.js` (tabs per role), `src/screens/`. `expo-camera` (QR scan), `expo-location` (driver GPS), `expo-image-picker` (license photo), `expo-secure-store` (session), `react-native-webview` (Leaflet map), `react-native-qrcode-svg`.
- **DB** — MySQL 8 (WAMP), database `BusBuddy_app`, all InnoDB → `web/database/schema.sql`, seed → `web/database/seed.sql`.
- **Auth** — JWT `{ userId, role }` valid 7 days · roles `admin | driver | student | parent` · passwords hashed with bcryptjs (cost 10) · web token in `localStorage` ("Remember me" on) or `sessionStorage` (off) · mobile token in `expo-secure-store` · `role: "admin"` can never be created through sign-up (403).
- **Live updates** — polling (10 s while a trip is live, 30 s otherwise). No websockets, no push notifications.

### Setup on a new machine
1. `web/.env.local` → `DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, JWT_SECRET` (ports differ per machine; never hardcode, never commit).
2. Fresh DB → import `web/database/schema.sql`, then `web/database/seed.sql`. Full reset: `DROP DATABASE IF EXISTS BusBuddy_app;` then import both again.
3. Recreate the seed license files in `web/uploads/` (gitignored): `seed-driver-license.png` and `seed-driver2-license.pdf` (any small PNG / PDF).
4. `npm install` in `web/` AND `mobile/` — mandatory after every pull. Mobile first install: `npx expo install expo-camera expo-location react-native-webview react-native-svg react-native-qrcode-svg`.
5. Mobile: set `EXPO_PUBLIC_API_URL=http://<PC LAN IPv4>:3000` in `mobile/.env`, then `npx expo start -c`. Test **web GPS on `localhost`**, not the LAN IP (browsers block geolocation on plain http LAN addresses).
6. Check: with the server running, `node web/tests/api-smoke.mjs` on a FRESH seed → 159 checks must pass (it creates data, so re-seed afterwards).

### What exists now

**Web pages**
- Public: `/` (one-screen landing), `/about`, `/features`, `/contact`, `/get-started` (role picker → straight to sign-up), `/login` (email or phone, remember me), `/student/register`, `/parent/register`, `/driver/register` (license upload during sign-up).
- Student: `/student/home` (next ride, live map, trips to book), `/student/bookings` (Book a ride: search + sort; My bookings: cancel), `/student/profile` (edit, 6-digit link code, linked parents), `/student/settings`.
- Parent: `/parent/home`, `/parent/children`, `/parent/map` (all children, hover name, click details), `/parent/link` (student email + code), `/parent/profile`.
- Driver: `/driver/home` (start/stop trip, automatic GPS sharing, boarding/exit QR, alerts, report issue), `/driver/trips` (add / edit / cancel / delete), `/driver/students`, `/driver/profile` (personal, license, vehicle & route, settings).
- Admin: `/admin/home` (stats, pending drivers, open issues), `/admin/drivers` (verify / reject, license preview), `/admin/users`, `/admin/trips`, `/admin/issues` (resolve).
- Everywhere after login: notification bell (polls every 30 s), role guards (wrong role → own home, signed out → `/login`).

**Mobile screens** — Welcome (fits the phone), role picker, login, 3 sign-ups, permissions (driver = location, student = camera, parent = none), then per role:
- Student: Home, Bookings, **Scan** (boarding / exit QR), Settings, Profile (link code, parents).
- Parent: Home, Children, Live Map, Link Student, Profile.
- Driver: Home (start/stop, GPS ping every ≥10 s, QR codes, alerts, report issue), Trips, Students, Profile.
- Notification bell on every screen.

**Backend** — API contract v13: auth (email/phone login, signup, me, change password), driver profile + license, scheduled trips (CRUD), trips start/stop/location, QR codes, board/exit, bookings, secure child linking, parent live list, notifications, vehicle issues, admin (stats, users, trips, issues, driver review). Shared helpers in `web/lib/`: `api-auth.ts`, `trip-codes.ts`, `trip-status.ts`, `trip-sql.ts`, `notify.ts`, `validation.ts`.

**Database (schema v5)** — `users, drivers, scheduled_trips, trips, trip_students, bookings, parent_student, link_codes, link_attempts, notifications, vehicle_issues`.

### Key product rules (implemented on the server)
- A student can book several trips (same or different drivers); seats are enforced (409 "Trip is full"); boarding requires a booking for THAT trip.
- Parent location visibility: student sees the bus while `waiting` + `onboard`; **parent only while `onboard`** (between the two scans); admin always. Implemented once in `lib/trip-status.ts`.
- Child linking: student creates a one-time 6-digit code (10 min); parent enters the student's email + code; max 5 wrong attempts / 15 min per parent; the student can remove a parent at any time.
- Vehicle issue report → notifies parents of students on board, drivers of other running buses within 3 km (GPS fresher than 2 min), and all admins; one report per 2 minutes per driver.
- Driver license: admin must verify before the driver can create trips; uploading a new license sets the status back to `pending`.

### Conventions (rules)
- Contract first: never invent endpoints — update `API_CONTRACT.md` in the same PR; entry numbers are never renumbered (entry 19 was removed in v13).
- Never hardcode local config (DB port, LAN IP). Never commit `.env*` or `web/uploads/`.
- All web API calls go through `lib/client-api.ts`; all mobile calls through `src/net.js`. Errors: inline message + `console.error`.
- Components live in folders (`index.tsx` + `module.css`). Shared look: `globals.css` tokens and `bb-*` classes.
- DB changed → update `schema.sql` tables + CHANGE LOG, and `seed.sql`, in the same PR.
- Every task: success AND error cases tested before the PR; results go to `TESTING.md`.

### Known gaps / not built
1. **Forgot password (OTP by email)** — designed in the mockups, not built (needs an email provider).
2. **Mobile has never been run on a real phone by the team** — the code passes lint/bundle checks only. See `TESTING.md` (MM list).
3. Mobile cannot open a driver's license file (admin reviews on the web); drivers can re-upload a photo.
4. Expo Go shares the driver's GPS only while the app is open on screen (no background location).
5. Notifications are in-app only (no push).
6. No payments, ratings, recurring trips, seat selection, profile photos, or admin user management (delete / block).
7. Login has no rate limit; tokens last 7 days and cannot be revoked (no refresh tokens).

### Weekly recaps
- Sprint 0 (→12/09): signup/login, driver profile, admin approval, registration UIs. 20 ✅
- Sprint 1 (15–18/09): sessions + guards, driver status, license permissions, trips APIs, mobile refactor. Web 14/14 ✅, mobile 6/6 ✅
- Sprint 2 (21–24/09, tested 29/09): 4 roles + link tables + GPS columns, driver start/stop, parent/student trip status, admin inline preview. 34 ✅ · 1 ❌ (fixed)
- Sprint 3 (01–04/10): live GPS map, trip history, admin /admin/home, mobile DriverTripScreen, seed with an active trip.
- Sprint 4 (05–11/10): signup admin-block, welcome + role chooser, student sign-up, polling fix, parent link UI, mobile driver status. Test pass 17 ✅ / 1 ⚠️ / 8 ❌ → findings F3/F4/F5.
- Sprint 5 (13–16/10): mobile driver parity, student home parity, parent home restyle. T7 8/8 ✅.
- **Final sprint (20–24/10)** — after the designer's mockups (52 slides) were reviewed: backend v12/v13 (per-trip booking, phone login, QR boarding/exit, secure child linking, notifications, vehicle issues, admin endpoints; 159-check API smoke test), full web redesign (public pages, student, parent, driver, admin), complete mobile app, new docs. F3 replaced by the code-based linking, F4 and F5 fixed.

### Team and contributions
| Member | Contribution (from the sprint log) |
|---|---|
| Sino (Sinar Fayyad) | Tech-lead; Sprint 0/1/3/4 integration testing; DB migration (roles, link tables); docs; final redesign (backend v12/v13, web, mobile) with an AI assistant |
| Jad | Trips API and mobile trip screen (T8), mobile landing / sign-up / role picker |
| Wassim | Seed data (T13/T14), Sprint 2 integration testing |
| Tamara | Web UI and navigation corrections |
| Designer | UI mockups (52-slide PowerPoint: web + mobile) |

Workflow: GitHub Desktop, branches per task, PRs into `dev`, each member took 3 tasks per sprint and appended a block to the RAW ZONE below; sprint tasks were done with an AI coding assistant (freebuff + shared prompts); the final redesign used Claude. Review all generated code before relying on it.

---

## RAW ZONE — append your block below this line, don't touch anything above

Format:

## [date] — [name] — [task]

- What was done (2-3 lines)
- Files added/changed
- Tested: success + error cases
- Gotchas for others (or "none")