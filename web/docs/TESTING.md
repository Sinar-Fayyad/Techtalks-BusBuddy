# BusBuddy — Testing

## Rules
- Every task: test success AND error cases before the PR. Append results here.
- Permission checks: use a fresh curl or private window (leftover headers fake passes).
- Tools: browser + DevTools (UI) · curl/Postman (API) · phpMyAdmin/mysql (DB truth) · Expo Go (mobile).

## Environment
- Web/API: http://localhost:3000 (`web/`, `npm run dev`) · after every pull: `npm install` in web/ and mobile/
- DB: MySQL/WAMP `BusBuddy_app`. Port differs per machine → `.env.local` (DB_PORT), never hardcode.
- Mobile: Expo Go, `BASE_URL` in mobile/api.js = PC LAN IPv4
- Reset test data (run in this order):
  1. `database/schema.sql` (fresh DB only)
  2. `database/migrations/2026-10-20-booking-boarding.sql` (once per machine)
  3. `database/seed.sql`
  4. `database/migrations/2026-10-20-seed-booking.sql`
- Seed users (@busbuddy.test): admin, verified driver, pending driver, students, linked parent · pw `Test1234!` / `Parent1234!` · 1 active trip.
- Re-run steps 3–4 after any trip stop. Seed times must stay `UTC_TIMESTAMP(3)`.
- `web/uploads/` is gitignored: recreate seed license files per machine (PNG via base64, PDF via Chrome print).

## STATUS (current truth — update this first; history below is for reference)
Last updated: 20/10

### ✅ Tested and working
| Area | What | Ref |
|---|---|---|
| Auth | Signup (all roles), admin signup → 403, login, duplicate 409, missing 400 | W15–16, W41 |
| Driver onboarding | Signup → upload → profile → admin verify (API) | W32 |
| License | Type/size limits, own/other/admin permissions, PNG + PDF | W18, Q1–Q4 |
| Admin | Verify/reject, inline preview, /admin/home, driver trips | W26, W38, W39 |
| Trips | Start, stop, double-start 409, pending driver 403, refresh resync | W21–25, W44 |
| Live GPS | Pings, student map moves, grey after 30s, stop ends it | W40, T7-1…8 |
| Student home | Auto-detect trip start/end, logout stops polling | W43, T7 |
| Parent home | In-transit / no-trip, refresh keeps session, children list | W27, W33–35 |
| Parent link | By studentId: 201/409/403/404/401 | W28–29 |
| Permissions | Student can't read another student's trip | W31 |
| Mobile (Sprint 3 build) | Login, session, register, driver start/stop | M1–M6 |

### ❌ Tested and NOT working
| ID | Problem |
|---|---|
| F4 | /driver/register saves no session, no redirect to /driver/home |
| F5 | Chooser Student/Parent cards dead-end at /login · /parent/register 404 · /student/register unreachable |

### ⬜ Needs testing
| What |
|---|
| F3 parent link by email (code has email mode now) → B23, B24 |
| F5 again: navigation was changed since the last test |
| Backend v12 (booking + QR) → B1–B24 |
| Sprint 5: mobile driver status/back/logout, My trips, GPS buffer, parent home restyle, GpsShare folder change |
| Tamara's UI/navigation fixes · Jad's mobile landing, sign-up, picker |
| Mobile regression M1–M6 after all of the above |

### 🚧 Not built yet (can't test)
Booking UI · QR UI · mobile GPS sharing · entry 14 update (booking + boarded/exited) · unlink child

## Backend v12 — booking + QR (20/10)
| ID | Call | Expected | Result |
|---|---|---|---|
| B1 | GET /drivers as student | 200, verified only, `booked` true for seed student | |
| B2 | GET /drivers no token / parent token | 401 / 403 | |
| B3 | POST /bookings, pending driver id | 404 | |
| B4 | POST /bookings {} | 400 | |
| B5 | POST /bookings, same driver twice | 409 | |
| B6 | POST /bookings as driver | 403 | |
| B7 | GET /bookings/me | 200, driver_name, route, price | |
| B8 | GET /driver/bookings as driver | 200, includes student | |
| B9 | GET /driver/bookings as student | 403 | |
| B10 | PATCH /driver/me {phone}, then GET | 200, value shown | |
| B11 | PATCH /driver/me {} | 400 | |
| B12 | PATCH /driver/me {price:-1} / {price:"abc"} | 400 / 400 | |
| B13 | GET /driver/qr, active trip | 200, 2 different codes | |
| B14 | GET /driver/qr after Stop | 409 | |
| B15 | POST /trips/board with exit_code | 400 | |
| B16 | POST /trips/board {code:"abc"} | 400 | |
| B17 | POST /trips/board, student not booked | 403 | |
| B18 | POST /trips/board, booked student | 201 | |
| B19 | POST /trips/board again | 409 | |
| B20 | POST /trips/exit after boarding | 200 | |
| B21 | POST /trips/exit again | 409 | |
| B22 | POST /trips/exit without boarding | 409 | |
| B23 | Parent POST /parents/me/children {email: seed student} | 201 (409 if linked) | |
| B24 | Same, unknown email / driver email | 404 / 403 | |

## Gotchas
- Seed reset changes user ids: re-check ids before debugging by id.
- PowerShell `WriteAllBytes` needs a FULL path (it wrote into System32 silently once).
- If the preview hangs on "Checking session…", restart the dev server (HMR stall).

## History (one line per sprint)
- S0 (12/09, Sinar): registration + approval, 20/20 ✅
- S1 (18/09, Sinar): web 14/14, mobile 6/6 ✅
- S2 (29/09, Wassim): W15–W39, 34 ✅ · 1 ❌ (W39, since fixed)
- S3 (04/10, Sinar): Q1–Q5 ✅ · W40 5/6 ✅ · M1–M6 ✅ · found F1, F2 (both fixed)
- S4 (11/10, Sinar): W41–W45, 17 ✅ · 1 ⚠️ · 8 ❌ → found F3, F4, F5
- S5 (16/10): T7 student home freshness, 8/8 ✅

