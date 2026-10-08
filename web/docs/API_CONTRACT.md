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

## BusBuddy API Contract — v4 ([date]) — T8 parent/student roles

Changed v4: entry 1 signup now accepts role "student" | "parent" (unknown/omitted roles still default to driver). Token payload roles: "admin" | "driver" | "student" | "parent".

12. POST /parents/me/children 🔒 parent only
Links the logged-in parent to a child (self-link only — no body parent id).
Headers: Bearer token
Body: { "studentId": number }
201: { "message": "Child linked" }
Errors: 400 invalid studentId · 401 no/invalid token · 403 not a parent / target user is not a student · 404 student not found · 409 link already exists · 500
DB: parent_student (composite PK parent_user_id+student_user_id — duplicate = 1062, surfaced as 409).

Planned (designed, NOT yet implemented — do not call):
13. POST /trips/{tripId}/students 🔒 admin — assign a student to a trip. Body { "studentId" } · 201 · 401/403/404/409.

## BusBuddy API Contract — v5 (24/09) — T10 parent + T11 student trip status

14. GET /students/{studentId}/trip-status 🔒 student (own) / parent (linked child) / admin (any)
Returns the student's active trip; if none, their most recent ended trip; otherwise null.
200: { studentId, trip: { id, driver_id, start_time, end_time } | null }
   times are UTC strings (DATETIME cast to CHAR); end_time = null means the trip is ACTIVE
400 invalid studentId (not a positive integer) · 401 missing/invalid token
403 wrong role · student asking for another id · parent not linked to this child · target is not a student
404 student not found · 500

15. GET /parents/me/children 🔒 parent only
The logged-in parent's linked children (students only).
200: { children: [ { id, name, email } ] }   (empty array when none linked)
401 missing/invalid token · 403 not a parent · 500

## BusBuddy API Contract — v6 (30/9) — T4 driver location ping

Changed v6: entry 14 (trip-status) response `trip` object now ALSO includes
`latitude`, `longitude`, `location_updated_at` (all null until a location is sent).
Values are UTC strings; latitude/longitude come back as DECIMAL strings (e.g. "33.573110"), not numbers.

16. POST /driver/trips/location 🔒 verified driver with an ACTIVE trip
Records a GPS ping on the caller's active trip. No URL id — the trip is found from the token.
Body: { "latitude": number, "longitude": number }
200: { message, trip: { id, driver_id, start_time, end_time, latitude, longitude, location_updated_at } }
   times UTC strings · end_time null = ACTIVE · latitude/longitude are DECIMAL strings
400 invalid JSON body / latitude or longitude missing, not a number, or out of range
    (lat -90..90, lng -180..180) · 401 missing/invalid token
403 not a driver · driver not verified
404 no driver profile · 409 no active trip
Note: DECIMAL(9,6) — extra decimal precision is rounded by MySQL.
## BusBuddy API Contract — v7 (10/1/2026) — T9 driver active-trip lookup

17. GET /driver/trips/active 🔒 driver
The caller's own active trip, or { "trip": null } when none (200 in both cases).
No URL id — driver found from the token userId → drivers.user_id.
200: { trip: { id, driver_id, start_time, end_time, latitude, longitude, location_updated_at } | null }
   times UTC strings (DATETIME cast to CHAR) · end_time is always null here (active only)
   latitude/longitude are DECIMAL strings (DECIMAL(9,6)); all three GPS fields are null until a ping is sent
   a missing driver row also returns { trip: null } (NOT 404 — by design, documented here)
401 missing/invalid token · 403 not a driver · 500
## BusBuddy API Contract — v8 (2/10) — T10 assign student to trip

Changed v8: entry 13 is now IMPLEMENTED (was "planned, do not call" since v4).

13. POST /trips/{tripId}/students 🔒 admin
Assigns a student to a trip (inserts a trip_students row). Ended trips allowed —
no active-trip requirement (contract never had one).
Body: { "studentId": number }
201: { "message": "Student assigned to trip" }
400 non-numeric tripId (entry 11 precedent) · missing/invalid studentId (entry 12 precedent)
401 missing/invalid token
403 not an admin · target user is not a student
404 trip not found · student not found
409 student already assigned (composite PK trip_id+student_id — dup = ER_DUP_ENTRY,
    surfaced as 409, same as entry 12)

## BusBuddy API Contract — v9 (3/10) — T11 driver trip history

18. GET /driver/trips 🔒 driver
The caller's OWN last 5 trips, newest first (ORDER BY start_time DESC, id DESC —
the active trip counts toward the 5). Found via token userId → drivers.user_id,
no URL id.
200: { trips: [ { id, driver_id, start_time, end_time, created_at } ] }
   times are UTC strings (CAST AS CHAR) · end_time = null means ACTIVE
   { trips: [] } when no trips — or no driver row (documented, not 404, entry-17 precedent)
401 missing/invalid token · 403 not a driver · 500

## BusBuddy API Contract — v10 (04/10) — Signup admin-block

Changed v10: entry 1 signup NO LONGER accepts role "admin".

1. POST /auth/signup
Body: { name, email, password, role? "driver"|"student"|"parent" } — role defaults to driver
(unknown/omitted role still defaults to driver, v4 behavior preserved).
201: { message, userId }
400 missing name/email/password
403 role "admin" — rejected BEFORE any DB write: an admin account can never be
    created via signup (admins exist only via database/seed.sql)
409 email already registered · 500
DB: NO schema change — users.role already contains all four roles; the admin
block is enforced in application code only.


## BusBuddy API Contract — v11 (07/10) — T8 link child by email

Changed v11: entry 12 (POST /parents/me/children) body accepts EITHER form — exactly one:
  { "studentId": number }                    (unchanged, byte-identical to v10)
  { "email": "child@busbuddy.test" }         (new)
Sending both, or neither → 400.
email mode: resolves the child's users row by email first (case-insensitive, MySQL _ci),
then the exact same checks as studentId mode:
  404 no account with that email · 403 account exists but role ≠ student · 409 already linked.
All other responses unchanged: 201 { "message": "Child linked" } · 400 · 401 · 403 · 404 · 409 · 500.
No new endpoint numbers — entry #12 gains the alternate body key only.
UI producers / consumers of email mode: /parent/register (optional field), /parent/home (Add-child card).

1a. (carried from v10, unchanged) POST /auth/signup role="admin" → 403; self-signable roles: driver | student | parent.
