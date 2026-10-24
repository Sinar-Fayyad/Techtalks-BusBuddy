# BusBuddy — Safe Rides. Connected Families.

BusBuddy is a web + mobile app built during the **TechTalks Summer Internship 2026**. University students find and book **verified independent bus drivers**, and a parent can follow their child's live location **only for the duration of a confirmed ride**.

## The problem
Students who commute with private or informal bus drivers have no reliable way to find a driver, see the price and route, or confirm they boarded safely. Parents have no way to see where their child is. Existing tools are fleet-management software for companies, or apps for one university's own shuttle.

## Target users
- **Students** who ride with independent drivers.
- **Parents** who want to know their child is on the bus and arrived.
- **Drivers** who want to publish trips and manage who booked.
- **Admins** who verify drivers' licenses and handle reported problems.

## MVP scope
**In:** driver license verification · driver-created trips · per-trip booking · QR boarding and exit · live bus location for booked students · parent location only between the two scans · notifications · vehicle-issue reports · admin dashboard.
**Out (on purpose):** payments (students pay the driver directly), institutions as participants, credits / plans, recurring or on-demand requests, ratings.

## Main features
| Role | What they can do |
|---|---|
| Student | Sign up (name, university, phone, email) · search and sort trips · book with a pickup stop · cancel · see the bus live · scan the driver's QR to board / exit (mobile) · create a one-time link code for parents · remove parents |
| Parent | Sign up · link a child with the child's **email + 6-digit code** · see every child's status (not travelling / waiting / on the bus / arrived) · live map **only while the child is on board** · notifications when the child boards and gets off |
| Driver | Sign up with a license photo · complete vehicle & route · create, edit, cancel, delete trips · Start / Stop trip with automatic GPS sharing · show the boarding / exit QR code · see who booked and who boarded · **Report vehicle issue** (notifies the parents on board, nearby buses and admins) |
| Admin | Dashboard · verify / reject licenses · list students, parents and trips · resolve reported issues |

## Technologies
- **Web + API:** Next.js 16 (App Router), React 19, TypeScript, MySQL (`mysql2`), JWT (`jsonwebtoken`), `bcryptjs`, Leaflet + OpenStreetMap, `qrcode.react`
- **Mobile:** Expo (SDK 57) / React Native, `expo-camera`, `expo-location`, `expo-image-picker`, `expo-secure-store`, `expo-linear-gradient`, `react-native-webview` (Leaflet map), `react-native-qrcode-svg`
- **Database:** MySQL 8
- **Tooling:** GitHub Desktop, phpMyAdmin / WAMP, Postman, Playwright (automated browser checks), AI coding assistants (see *Team and workflow*)

## Architecture
```
 Web app (Next.js pages)  ─┐
                           ├─►  REST API (Next.js route handlers, app/api/*)  ─►  MySQL (BusBuddy_app)
 Mobile app (Expo)        ─┘            │
                                        └─► web/uploads/  (driver licenses, served only to authorised users)
```
Both clients use the same endpoints (`web/docs/API_CONTRACT.md`). Live data uses polling (10 s while a trip is live, 30 s otherwise).

## Project structure
```
web/
  app/                 pages (public, student/, parent/, driver/, admin/) and app/api/ (REST API)
  components/          UI components (one folder each: index.tsx + module.css)
  lib/                 db, auth helper, QR codes, trip status rules, notifications, validation
  database/            schema.sql (tables + change log) and seed.sql (demo data)
  docs/                API_CONTRACT.md, TESTING.md
  tests/               api-smoke.mjs (159 automated API checks)
  PROJECT_STATE.md     current state, conventions, recaps
mobile/
  src/                 App.js, Shell.js, screens/, shared ui.js / net.js / MapView.js …
  api.js               API base URL + fetch helper
  assets/              logo and artwork
```

## Getting started

**Requirements:** Node.js 20.9+, MySQL 8 (e.g. WAMP), Expo Go on a phone (same Wi-Fi as the PC).

### 1. Database
1. Start MySQL, open phpMyAdmin.
2. Import `web/database/schema.sql` (creates `BusBuddy_app` and the tables).
3. Import `web/database/seed.sql` (demo data).

Reset at any time: `DROP DATABASE IF EXISTS BusBuddy_app;` then import both files again.

### 2. Web + API
```bash
cd web
npm install
```
Create `web/.env.local` (never commit it):
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=BusBuddy_app
JWT_SECRET=put-a-long-random-string-here
```
Create `web/uploads/` and put any small image named `seed-driver-license.png` and any small PDF named `seed-driver2-license.pdf` in it (only needed to preview the seeded drivers' licenses).
```bash
npm run dev        # http://localhost:3000
```

### 3. Mobile
```bash
cd mobile
npm install
npx expo install expo-camera expo-location react-native-webview react-native-svg react-native-qrcode-svg
```
Create `mobile/.env` with your PC's LAN address:
```
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000
```
```bash
npx expo start -c   # scan the QR code with Expo Go
```
Allow Node through the Windows firewall so the phone can reach port 3000.

### 4. Check that everything works
With the server running and a **fresh seed**:
```bash
cd web
node tests/api-smoke.mjs     # expects: 159 passed, 0 failed
```
The test creates data — import `schema.sql` and `seed.sql` again afterwards. The manual test lists are in `web/docs/TESTING.md`.

## Demo accounts (seed data, development only)
| Email | Password | Role |
|---|---|---|
| admin@busbuddy.test | Test1234! | admin |
| driver1@busbuddy.test | Test1234! | verified driver with trips |
| driver2@busbuddy.test | Test1234! | pending driver |
| student1@busbuddy.test | Parent1234! | student (booked, on board) |
| student2@busbuddy.test | Parent1234! | student (no bookings) |
| parent1@busbuddy.test | Parent1234! | parent of student1 |

These only exist in the local seed. Never use these passwords anywhere real.

## Security and privacy
- Passwords are hashed (bcrypt). Every API route checks the JWT and the role (`lib/api-auth.ts`). Admin accounts cannot be created through sign-up.
- All SQL uses parameterised queries.
- A parent sees a child's location **only between the boarding scan and the exit scan** — enforced on the server, not only in the UI.
- Child linking needs the student's email **and** a one-time 6-digit code that expires after 10 minutes; 5 wrong attempts block the parent for 15 minutes; students can remove a parent.
- QR codes are signed, expire after 24 h, and boarding needs a booking for that exact trip.
- Driver licenses are stored outside the public folder (`web/uploads`, git-ignored), type- and size-checked (PDF/JPG/PNG, 5 MB) and only served to the owner and admins.
- Secrets live in `.env.local` / `.env` (git-ignored). Only the last known GPS position is stored (no location history).
- Known limits: no login rate limiting, tokens last 7 days and can't be revoked, no email/phone verification.

## Testing
- 159 automated API checks (`web/tests/api-smoke.mjs`) — passing.
- 70 automated browser checks (Playwright) run in an isolated environment — passing; to be repeated on the team machines.
- Manual lists for web and for a real phone: `web/docs/TESTING.md`.

## Documentation
- `web/docs/API_CONTRACT.md` — every endpoint (v13)
- `web/database/schema.sql` — tables and change log
- `web/docs/TESTING.md` — test status and checklists
- `web/PROJECT_STATE.md` — current state, conventions, sprint recaps

## Known limitations and roadmap
**Not completed:** forgot password (OTP by email) · opening a license file on mobile · background GPS (Expo Go only shares while the app is open) · push notifications.
**Future ideas:** payments and credits, ratings, recurring trips, seat selection, institution accounts, admin user management, push notifications, background location in a standalone build.

## Team and workflow
Built by a team of five (one designer, four developers): Sino (team lead), Jad, Wassim, Tamara and the designer. Contributions per sprint are in `web/PROJECT_STATE.md`.
Workflow: GitHub Desktop, one branch per task, pull requests into `dev`, API contract first, sprint notes appended to `PROJECT_STATE.md`. AI coding assistants were used throughout (sprint tasks with shared prompts; the final redesign, tests and documentation with Claude). All generated code was reviewed and tested by the team.

## Troubleshooting
- **`ECONNREFUSED` on the API:** wrong `DB_PORT` in `web/.env.local` (some machines use 3307/3308).
- **Phone cannot reach the API:** check the LAN IP in `mobile/.env`, restart with `npx expo start -c`, allow Node in the firewall.
- **Web GPS does nothing:** use `http://localhost:3000` (browsers block geolocation on plain-http LAN addresses).
- **Licenses do not open:** the files are missing in `web/uploads/`.
- **Seeded trip is finished:** reset the database (see Database).
