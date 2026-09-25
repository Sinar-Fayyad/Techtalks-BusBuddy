# BusBuddy — Testing Document

Rules:

- Every task: test success AND error cases before opening the PR.
- At sprint end, the tester runs the full checklist and records results (✅/❌ + note).
- Tools: browser + DevTools (UI), Postman/Apidog (API), phpMyAdmin (DB truth), Expo Go (mobile).

## Environment

- Web/API: `http://localhost:3000` (web/, npm run dev)
- DB: MySQL/WAMP — busbuddy_app (schema: database/schema.sql)
- Mobile: Expo Go on phone — BASE_URL in mobile/api.js = PC's LAN IPv4
- Test data: run `database/seed.sql` (T13) → admin + verified/pending drivers
  + student + linked parent (all `@busbuddy.test`, pw `Test1234!` / `Parent1234!`).
  Manual method still works — signup via UI →
  UPDATE users SET role='admin' WHERE email='...';

---

## Sprint 1 — Registration & approval (12/09) — 20/20 ✅

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

---

## Sprint 2 — Integration testing (18/09, Sinar) — Web 14/14 ✅ · Mobile 6/6 ✅

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
| W11 | /driver/status shows own data only | own status, others' impossible (no URL id) | ✅ |
| W12 | Status updates live (pending → verified) | refresh shows VERIFIED | ✅ |
| W13 | Trips: start → 201, double-start → 409, stop → 200, stop again → 404 | as listed | ✅ |
| W14 | Admin GET driver trips | correct rows, newest first | ✅ |### Sprint 3 — test-method changes (web cleanup PR, 2026-09-XX)

- W6/W8: license opens via "View license file" button / "license" link
  (Bearer + blob viewer, web/lib/view-license.ts). Expected unchanged: file displays.
- W7: UI no longer exposes other drivers' file URLs. Run as DRIVER via DevTools console:
  fetch('/api/driver/license/<OTHER_FILE>', { headers: { Authorization: 'Bearer ' + localStorage.getItem('bb_token') } }).then(r => r.status) → 403
- W9: file URL with no token → 401. Legacy ?token=... URLs also return 401 (hardened).

### Mobile (M)

| # | Test | Expected | Result |
|---|------|----------|--------|
| M1 | Login driver on phone | Home "Logged in as driver" | ✅ |
| M2 | Kill app → reopen | still logged in (secure-store) | ✅ |
| M3 | Wrong password | visible error, no crash | ✅ |
| M4 | Register from phone (photo pick → upload) | success | ✅ |
| M5 | "Create an account" link | opens RegisterScreen | ✅ |
| M6 | Full loop: register on phone → admin verifies on web → login on phone | works | ✅ |

---

## Bugs found & fixed while integration-testing (Sprint 2)

1. DB port 3308 leaked from one teammate's machine → ECONNREFUSED everywhere. Fix: DB_PORT in .env.local, never hardcode local config.
2. Repo schema SQL outdated (password vs password_hash) → signup crashed. Fix: ALTER TABLE users CHANGE password password_hash VARCHAR(255) NOT NULL.
3. users/drivers were MyISAM → error #1824 creating trips FK. Fix: ALTER TABLE ... ENGINE=InnoDB.
4. Token payload field mismatch (code read id/sub, token has userId) → driver 403 on own license. Fix: read userId first.
5. T3 vs T7 conflict (admins-only vs driver views own file) → rule: admin = any file, driver = only own license_url.
6. Mobile RegisterScreen unreachable (no link). Fix: register link on LoginScreen.

## Quick checks still pending ⬜

- /login empty fields → inline error, no network call (DevTools)
- ✅ Server stopped → friendly error on login/register (verified during web-cleanup task)
- License upload validation: wrong type → 400, >5MB → 400

## Known issues → Sprint 3

- License preview not inline in /admin/drivers (link only) — STILL OPEN
- ~~No logout/back button on /driver/status~~ — done (web cleanup PR)
- ~~No shared Error component~~ — done (ErrorMessage on login/register/status/admin; other pages adopt as they're finished)
- Mobile: no shared Button/Input components; no driver status screen
- ~~?token= in URLs can leak into history/logs~~ — done (Bearer-only, contract v3)
