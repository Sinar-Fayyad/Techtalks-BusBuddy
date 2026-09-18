# BusBuddy — Sprint 1 Testing Checklist (BUS-34)

**Scope:** Driver registration → admin approval flow (web)
**Date tested:** 2026-09-12 · **Tester:** [your name]
**Tools:** Postman (API), Chrome (UI), MySQL/phpMyAdmin (data verification)

## Environment

- Next.js 16 (Turbopack) on `http://localhost:3000`
- MySQL (WAMP) — database `BusBuddy_app`
- Branch: `dev`

## Test Results

| # | Test | Steps | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Driver signup | POST /api/auth/signup (name, email, password) | 201 "User created" | ✅ |
| 2 | Duplicate email blocked | Repeat test 1, same email | 409 "Email already registered" | ✅ |
| 3 | Missing fields rejected | POST signup without password | 400 "Missing fields" | ✅ |
| 4 | Login — wrong password | POST /api/auth/login, bad password | 401 "Invalid credentials" | ✅ |
| 5 | Login — success | POST /api/auth/login, valid credentials | 200 + JWT + role="driver" | ✅ |
| 6 | Admin login | Login with admin account | 200 + role="admin" | ✅ |
| 7 | Driver profile created | POST /api/driver/profile + Bearer token + license_url | 201 "pending review" | ✅ |
| 8 | Duplicate profile blocked | Repeat test 7 | 409 "Profile already exists" | ✅ |
| 9 | Profile needs token | POST /api/driver/profile without token | 401 "No token" | ✅ |
| 10 | Admin list shows pending | GET /api/admin/drivers + admin token | drivers array contains new driver | ✅ |
| 11 | Non-admin blocked | GET /api/admin/drivers with driver token | 403 "Admins only" | ✅ |
| 12 | Verify driver | PATCH /api/admin/drivers/{id} {"action":"verify"} | 200 "Driver verified" | ✅ |
| 13 | Verified leaves pending list | GET /api/admin/drivers again | driver no longer in array | ✅ |
| 14 | Reject driver | PATCH same driver {"action":"reject"} | 200 "Driver rejected" | ✅ |
| 15 | Invalid action rejected | PATCH {"action":"banana"} | 400 | ✅ |
| 16 | Admin UI — list | /admin/drivers → paste token → Load | pending drivers render with buttons | ✅ |
| 17 | Admin UI — verify button | Click Verify | driver disappears, empty state shows | ✅ |
| 18 | Driver form E2E | /driver/register → fill → submit | green success message | ✅ |
| 19 | Form → admin integration | New driver registers → admin Load | appears in pending list | ✅ |
| 20 | DB state check | phpMyAdmin → drivers table | status matches action taken | ✅ |

## Coverage Gaps (→ Sprint 2)

- Mobile flow (BUS-8 — Expo app not yet built)
- License upload with real files (BUS-27 — currently URL string)
- Persistence of login across pages (no auth context yet)

## Known Issues

- Tokens pasted manually into admin UI (dev convenience, replace with login page in Sprint 2)

## Sprint 2 — T1 Login Page (BUS-?)

| # | Test | Steps | Expected | Result |
|---|------|-------|----------|--------|
| 21 | Admin login UI | /login → admin credentials → submit | "Login successful as admin." | ⬜ |
| 22 | Driver login UI | /login → driver credentials → submit | "Login successful as driver." | ⬜ |
| 23 | Wrong password | /login → valid email, wrong password | red error, stays on /login | ⬜ |
| 24 | Empty fields | /login → submit with empty email/password | inline errors, no network call (check DevTools) | ⬜ |
| 25 | Server down | stop WAMP/Node, submit | friendly error, page usable | ⬜ |

<!-- Git -->

git checkout dev && git pull
git checkout -b feature/login-page
# add the 2 new files, then:
git commit -m "Login Page: add login form with validation and error handling"
# after testing, add the TESTING.md block:
git commit -m "Login Page: add login test checklist entries"
git push -u origin feature/login-page
# then open the PR into dev

## Sprint 2 — T3 License viewing admins-only

| # | Test | Steps | Expected | Result |
|---|------|-------|----------|--------|
| 26 | No token | GET /api/driver/license/x.jpg | 401 "Invalid token" | ✅ |
| 27 | Invalid token | GET with "Bearer garbage" | 401 | ✅ |
| 28 | Driver token blocked | GET with driver Bearer token | 403 "Admins only" | ✅ |
| 29 | Admin, missing file | GET nonexistent name with admin token | 404 "Not found" | ✅ |
| 30 | Path traversal blocked | GET /license/..%2Fsecret with admin token | 400 "Bad name" | ✅ |
| 31 | Driver + traversal | same with driver token | 403 "Admins only" | ✅ |
| 32 | Admin views file | GET real filename with admin Bearer | 200 + file | ✅ |
| 33 | Admin via ?token= | GET real file?token=<admin> | 200 + file | ✅ |
| 34 | Driver via ?token= | GET real file?token=<driver> | 403 "Admins only" | ✅ |
| 35 | Admin UI link | /admin/drivers → click license | file opens in new tab | ⬜ |
| 36 | Driver UI blocked | driver opens /admin/drivers | "Access denied" screen | ⬜ |

