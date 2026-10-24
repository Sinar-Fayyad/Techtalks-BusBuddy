# BusBuddy — Testing

## Rules
- Every task: test success AND error cases before the PR; record the result here.
- Permission checks: use a fresh curl / private window (leftover headers fake passes).
- Tools: browser + DevTools (UI) · Postman/curl (API) · phpMyAdmin (DB truth) · Expo Go (mobile).
- Be honest in the status below: **who** ran a test and **where**.

## Environment
- Web/API: http://localhost:3000 (`web/`, `npm run dev`) · after every pull: `npm install` in `web/` and `mobile/`.
- DB: MySQL/WAMP `BusBuddy_app`. The port differs per machine → `web/.env.local` (`DB_PORT`), never hardcode.
- Mobile: Expo Go on a real phone on the same Wi-Fi · `EXPO_PUBLIC_API_URL=http://<PC LAN IPv4>:3000` in `mobile/.env` (restart with `npx expo start -c`).
- Web GPS must be tested on `http://localhost:3000` (browsers block geolocation on plain-http LAN addresses).

## Reset test data (run in this order)
1. phpMyAdmin → SQL tab → `DROP DATABASE IF EXISTS BusBuddy_app;`
2. Import `web/database/schema.sql` (creates the database and all tables)
3. Import `web/database/seed.sql`
4. Put any small PNG / PDF in `web/uploads/` named `seed-driver-license.png` and `seed-driver2-license.pdf` (gitignored; needed to preview licenses).

The seeded running trip can be used once: after you stop it, repeat steps 1–3.

## Test accounts (seed data, development only)
| Email | Password | Role / state |
|---|---|---|
| admin@busbuddy.test | Test1234! | admin |
| driver1@busbuddy.test | Test1234! | verified driver, profile filled, 5 trips (1 running, 2 upcoming, 1 completed, 1 cancelled) |
| driver2@busbuddy.test | Test1234! | pending driver (license not verified) |
| student1@busbuddy.test | Parent1234! | 2 bookings, on board the running trip |
| student2@busbuddy.test | Parent1234! | no bookings (use it for booking / "not booked" tests) |
| parent1@busbuddy.test | Parent1234! | linked to student1 |

All can also log in with their phone number (`+96170000001` … see `seed.sql`).

---

## STATUS (current truth — update this first; history is at the bottom)
Last updated: 24/10

### ✅ Verified by the team on their own machine
| What | Result | Who / when |
|---|---|---|
| Backend API smoke test: `node tests/api-smoke.mjs` (159 checks: sign-up/login by email and phone, profile, trips add/edit/cancel/delete, browse + search, booking rules, child-link code + rate limit, start → board → ping → exit, parent location privacy, vehicle-issue notifications, notifications, admin endpoints) | 159 / 159 passed | Sino, 20/10 |
| Database: schema v5 + seed import, verification queries (6 users, 1 parent link, 5 trips, 2 bookings, 1 running trip with a boarded student) | correct | Sino, 20/10 |
| Earlier sprints (see History) | all recorded below | Sino / Wassim |

### 🧪 Verified in an isolated test environment (not yet repeated on the team's PCs)
These were run by the AI assistant with Playwright (headless Chromium) against a copy of the app, MySQL 8.0.46 and the real API. **Please re-run the manual lists below on your own machine before presenting.**
| Area | Checks | Result |
|---|---|---|
| Web auth + student: login by email/phone, wrong password, remember me on/off, session survives refresh, role guard, 3 sign-ups (empty form sends nothing, mismatch, duplicate email), driver sign-up with license upload (F4 fixed), booking via UI, cancel booking, search with no match, link code, parent links with email + code, remove parent, edit profile, change password, logout, narrow screen | 29 / 29 | passed |
| Web driver / parent / admin: driver home (running trip, QR, automatic GPS ping reaches the server, QR tab switch, report issue, stop, start next trip), trips (validation, add, edit, delete, cancel → student notified, filter), students, profile (vehicle saved, license tab); parent home / children / map / link (wrong code, success) / unlink; admin dashboard, resolve issue, verify driver, users search, trips, issues; role guards; narrow screen | 41 / 41 | passed |
| Mobile code: lint (undefined variables, hooks rules) + full bundle resolution | no errors | passed — **but never run on a phone** |

### ⬜ Manual tests still to run (do these, then change ⬜ → ✅ / ❌)

**Web (MW)**
| ID | Test | Expected | Result |
|---|---|---|---|
| MW1 | Open `/` in a normal browser window | one screen, no scrolling; About / Features / Contact are separate pages | ⬜ |
| MW2 | `/get-started`: click each role | goes straight to that sign-up (no Continue button) | ⬜ |
| MW3 | `/login`: logo visible in the background; log in by email, then by phone; Remember me OFF, close the browser | logged out after closing | ⬜ |
| MW4 | Sign up as student / parent / driver (driver with a license photo) | auto-login → own home; errors shown for empty / invalid / duplicate | ⬜ |
| MW5 | Admin verifies the new driver (`/admin/drivers`), driver sees the bell notification | status Approved | ⬜ |
| MW6 | Driver: Vehicle & Route, add / edit / delete a trip, cancel a trip that has bookings | student gets a notification | ⬜ |
| MW7 | Student: search, sort, book with a pickup stop, see it in My bookings, cancel it | works; full trip → "Trip is full" | ⬜ |
| MW8 | Driver: Start Trip on `localhost` and allow location | GPS ping every ~10 s; student sees the bus on the map (real map tiles) | ⬜ |
| MW9 | Student creates a link code; parent links with email + code; wrong code; 6 wrong codes | linked / "do not match" / blocked 15 min | ⬜ |
| MW10 | Boarding + exit with the mobile scanner (MM5) | parent sees the child on the map only between the scans, gets "boarded" and "got off" notifications | ⬜ |
| MW11 | Driver: Report vehicle issue while a student is on board | parent, nearby driver (if any) and admin are notified; second report within 2 min is refused | ⬜ |
| MW12 | Admin: stats, users, trips, issues (resolve) | numbers match the DB | ⬜ |
| MW13 | Role guards: logged out → `/login`; student opens `/admin/home` | redirected to own home | ⬜ |
| MW14 | Phone-width browser | sidebar becomes a bottom bar; nothing overflows | ⬜ |
| MW15 | Fonts, background images, logo and tab icon load | yes | ⬜ |

**Mobile on a real phone (MM)** — Expo Go, same Wi-Fi
| ID | Test | Expected | Result |
|---|---|---|---|
| MM1 | Welcome → Get Started → tap a role | fits the screen with no scrolling; goes straight to that sign-up | ⬜ |
| MM2 | Sign up as student / parent / driver (license photo); log in by email and by phone; wrong password | account created and logged in; clear error messages | ⬜ |
| MM3 | Permissions screen | driver asked for location, student for camera, parent skips; denying shows "Open Settings" | ⬜ |
| MM4 | Student: Home, Bookings (book with pickup, cancel) | works like the web | ⬜ |
| MM5 | Student: Scan tab — Boarding code, then Exit code; also the wrong code type; boarding twice | success messages; "not a boarding code"; "Already boarded" | ⬜ |
| MM6 | Driver: Start Trip, keep the app open | GPS ping reaches the server; QR codes (Boarding / Exit tabs) are scannable; Stop Trip works | ⬜ |
| MM7 | Driver: Trips — add (date `YYYY-MM-DD`, time `HH:MM`), edit, cancel, delete | works; bad formats are rejected | ⬜ |
| MM8 | Driver: Students list while students board | status changes booked → on board → arrived | ⬜ |
| MM9 | Driver: Profile — vehicle saved; new license photo | status goes back to Pending | ⬜ |
| MM10 | Parent: Home statuses, Live Map (marker only while on board), link student, unlink | matches the privacy rule | ⬜ |
| MM11 | Student: Profile — link code countdown, remove a parent | works | ⬜ |
| MM12 | Notification bell for each role; mark read | badge updates | ⬜ |
| MM13 | Driver: Report issue from the phone | notifications as in MW11 | ⬜ |
| MM14 | Log out; Remember me ON/OFF | session behaves accordingly | ⬜ |

**End-to-end demo (E2E)** — the scenario for the presentation
Admin verifies a new driver → driver adds a trip → student books it → driver starts the trip (GPS on) → student scans the boarding code → parent (linked with a code) sees the live location → student scans the exit code → parent no longer sees the location → driver stops the trip. ⬜

### ❌ Not built / known limitations (not bugs)
Forgot password (OTP) · viewing a license file on mobile · background GPS in Expo Go · push notifications · payments, ratings, recurring trips, seat selection, profile photos, admin user management · login rate limiting / token revocation.

---

## History (one line per sprint)
- S0 (12/09, Sinar): registration + approval, 20/20 ✅
- S1 (18/09, Sinar): web 14/14 ✅, mobile 6/6 ✅
- S2 (29/09, Wassim): W15–W39, 34 ✅ · 1 ❌ (W39, fixed later)
- S3 (04/10, Sinar): Q1–Q5 ✅ · W40 5/6 ✅ · M1–M6 ✅ · found F1, F2 (both fixed)
- S4 (11/10, Sinar): W41–W45, 17 ✅ · 1 ⚠️ · 8 ❌ → found F3, F4, F5
- S5 (16/10): T7 student home freshness, 8/8 ✅
- Final sprint (20–24/10): F3 replaced by code-based linking (email-only linking was a privacy hole) · F4 fixed (driver sign-up logs in and redirects) · F5 fixed (role picker goes straight to sign-up) · backend 159/159 on the team machine · browser checks 70/70 in the isolated environment · manual lists above pending

## Bugs found & fixed while testing (lessons)
1. DB port leaked from one machine → `DB_PORT` in `.env.local`, never hardcode.
2. Outdated schema (`password` vs `password_hash`) → schema + change log must be updated in the same PR.
3. MyISAM tables blocked a foreign key (#1824) → all tables InnoDB.
4. Token payload mismatch (`id` vs `userId`) → one helper, `lib/api-auth.ts`.
5. Seed times written with `NOW()` instead of `UTC_TIMESTAMP(3)` → trips looked finished before they started.
6. Seed re-runs could create a second active trip → guarded with `WHERE NOT EXISTS`.
7. Parent could link to ANY student by email alone → replaced by one-time code + email, rate-limited.
8. Leaflet CSS was never imported → map tiles were mispositioned.