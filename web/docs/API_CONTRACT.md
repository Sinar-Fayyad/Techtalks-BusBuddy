# BusBuddy API Contract — v2 (18/09)

Base URL: `http://localhost:3000/api` — all bodies JSON.
Auth: protected endpoints need header Authorization: `Bearer <token>`.
Token payload: { "userId": number, "role": "admin"|"driver" } — signed JWT_SECRET, 7d.
Rule: an endpoint that isn't here must NOT be called — add it here first, in the same PR.

1. POST /auth/signup
Body: { name, email, password, role? "admin"|"driver" } — role defaults to driver.
201: { message, userId } · 400 missing fields · 409 email exists · 500

2. POST /auth/login
Body: { email, password }
200: { message, token, role } · 401 invalid credentials · 500

3. GET /admin/drivers 🔒 admin
Pending drivers, newest first.
200: { drivers: [{ id, name, email, license_url, status, created_at }] } · 401 · 403

4. POST /driver/profile 🔒 driver
Body: { license_url } — creates driver row, status=pending.
201: { message } · 400 · 401 · 409 profile exists

5. PATCH /admin/drivers/{id} 🔒 admin
Body: { action: "verify" | "reject" }
200: { message } · 400 bad action · 401 · 403 · 404

6. GET /driver/me 🔒 driver
The caller's own profile (JOIN users+drivers by token userId — no URL id).
200: { driver: { name, email, status, license_url, created_at } } · 401 · 403 (admin) · 404 no profile

7. POST /driver/license 🔒 driver
Multipart form-data, field "file". PDF/JPG/PNG only, max 5MB. Stores in web/uploads/.
201: `{ path: "/uploads/<name>" }` · 400 no file / bad type / too big · 401 · 500

9. POST /driver/trips/start 🔒 verified driver
Starts a trip. Times stored/returned UTC.
201: trip { id, driver_id, start_time, end_time: null } · 401 · 403 unverified/not driver · 404 no profile · 409 trip already active

10. POST /driver/trips/stop 🔒 driver
Ends the caller's active trip (no verified-check by design — must be able to end it).
200: trip with end_time set · 401 · 404 no active trip

11. GET /admin/drivers/{id}/trips 🔒 admin
All trips of one driver, newest first.
200: { trips: [{ id, driver_id, start_time, end_time, created_at }] } · 400 non-numeric id · 401 · 403 · 404 unknown driver

Planned: refresh tokens, driver profile edit (PATCH /driver/me), live GPS pings.

## BusBuddy API Contract — v3 (21/09)

8. GET /driver/license/{name} 🔒 token required (Bearer header ONLY)
Permission: admin = any file · driver = ONLY the file in their own drivers.license_url.
200: file bytes (correct Content-Type) · 400 bad name (path traversal) · 401 missing/invalid token · 403 · 404 not found
Changed v3: ?token= query auth removed (URLs leak via history/logs). Viewers: fetch with Bearer → open via blob URL (web/lib/view-license.ts).
