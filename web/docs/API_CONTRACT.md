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

## BusBuddy API Contract — v12 (20/10) — booking, driver profile, QR boarding

Changed v12: entry 6 GET /driver/me response also includes `phone`, `route`, `stops`, `price` (null until set; price is a DECIMAL string e.g. "5.00").
All new entries: Bearer token. Shared helper: web/lib/api-auth.ts. QR codes: web/lib/trip-codes.ts (signed, 24h, kind = board | exit).

19. GET /drivers 🔒 student / admin
Verified drivers only, ordered by name.
200: { drivers: [ { id, name, phone, route, stops, price, booked } ] }  (booked = true if the calling student already booked; always false for admin)
401 · 403 other roles · 500

20. POST /bookings 🔒 student
Body: { driverId: number, pickup?: string (max 255) }
201: { message: "Booked", booking: { id, driver_id, pickup } }
400 missing/invalid driverId or pickup · 401 · 403 not a student · 404 driver not found / not verified · 409 already booked (UNIQUE student+driver) · 500

21. GET /bookings/me 🔒 student
200: { bookings: [ { id, driver_id, driver_name, phone, route, stops, price, pickup, created_at } ] }  (newest first, [] when none)
401 · 403 · 500

22. GET /driver/bookings 🔒 driver
Students who booked the caller.
200: { bookings: [ { id, student_id, student_name, student_email, pickup, created_at } ] }  ({ bookings: [] } when none or no driver row — entry 17/18 precedent)
401 · 403 · 500

23. PATCH /driver/me 🔒 driver
Body: any of { phone (≤30), route (≤255), stops (≤2000), price (0..999999.99) } — null or "" clears a field. At least one key required.
200: { message: "Profile updated", driver: { name, email, status, license_url, created_at, phone, route, stops, price } }
400 invalid JSON / invalid field / nothing to update · 401 · 403 · 404 no driver profile · 500

24. GET /driver/qr 🔒 driver with an ACTIVE trip
200: { trip_id, board_code, exit_code }  (two different signed strings, valid 24h)
401 · 403 · 404 no driver profile · 409 no active trip · 500

25. POST /trips/board 🔒 student
Body: { code } — the board_code from entry 24.
Checks: code valid + kind "board" → trip exists and is ACTIVE → student has booked that trip's driver.
201: { message: "Boarded", trip_id, boarded_at }  (UTC string)
400 invalid/expired/wrong-kind code · 401 · 403 not a student / not booked with this driver · 404 trip not found · 409 trip ended / already boarded / already exited · 500
DB: trip_students.boarded_at set (row inserted, or updated if admin-assigned via entry 13).

26. POST /trips/exit 🔒 student
Body: { code } — the exit_code from entry 24.
200: { message: "Exited", trip_id, exited_at }
400 invalid/expired/wrong-kind code · 401 · 403 not a student · 409 not boarded / already exited · 500
DB: trip_students.exited_at set. Works even if the driver already stopped the trip.

PENDING: entry 14 (trip-status) — student finds the driver's active trip through `bookings`; parent sees live location only while boarded_at IS NOT NULL AND exited_at IS NULL.

## BusBuddy API Contract — v13 (21/10) — UI redesign backend

Auth for everything below: Bearer token unless said otherwise. Helpers: web/lib/api-auth.ts, trip-codes.ts, trip-status.ts, notify.ts, validation.ts. Times are UTC strings ("2026-10-20 07:55:10.377"). Decimals (price, lat/lng) come back as strings.

# Changed entries

POST /auth/signup — body { name, email, phone, password, role?, university? }. phone REQUIRED for every role (stored normalized, unique). Students must send university. password ≥ 8. Email lowercased. 400 invalid/missing · 403 role admin · 409 email OR phone exists.
POST /auth/login — body { identifier, password } where identifier = email OR phone ("+961 71 000 001" works). Legacy { email, password } still works. 200 { token, role, name } · 400 · 401.
GET /admin/drivers — optional ?status=pending (default) | verified | rejected | all. Rows now include phone, vehicle_plate, seats.
PATCH /admin/drivers/{id} — also sends the driver a notification (verified / rejected). 400 bad id.
GET /driver/me — now returns phone (from users), vehicle_plate, seats, route, stops, price, missing_fields[], profile_complete. (missing = vehicle_plate, seats, price)
POST /driver/trips/start — optional body { scheduledTripId }. Starts that planned trip (400 bad id · 404 not yours/not found · 409 cancelled / already started). Booked students are notified. Without a body it starts an ad-hoc trip (nobody can board it).
POST /parents/me/children — body { email, code } ONLY (student's email + 6-digit code from entry 33). studentId / email-only modes REMOVED. 201 { child } · 400 · 403 not a parent · 404 invalid/expired code (same message for unknown email) · 409 already linked · 429 after 5 wrong attempts in 15 min. Code is single use. Student is notified.
GET /students/{id}/trip-status — trip now has phase: waiting (booked trip is running, not scanned in) | onboard | done, plus scheduled_trip_id, origin, destination, scheduled_at, driver_name, driver_phone, vehicle_plate, boarded_at, exited_at. Location visibility (server-enforced): student = waiting + onboard · PARENT = onboard ONLY · admin = always.
GET /parents/me/children — children now include phone, university.
GET /driver/trips/active — trip now includes scheduled_trip_id, origin, destination.
REMOVED (replaced by 27). Delete web/app/api/drivers/route.ts.
POST /bookings — body { scheduledTripId, pickup? }. A student can book many trips. 201 · 400 · 403 · 404 · 409 cancelled / already started / already booked / "Trip is full" (seats).
GET /bookings/me — rows now: id, scheduled_trip_id, pickup, origin, destination, scheduled_at, price, stops, driver_name, driver_phone, vehicle_plate, trip_status (upcoming|in_progress|completed|cancelled), trip_id, boarded_at, exited_at.
GET /driver/bookings — optional ?tripId=. Rows include student name/email/phone/university, pickup, scheduled trip info and status: booked | waiting | on_board | exited | no_show.
PATCH /driver/me — any of name, phone, vehicle_plate, seats (1-100), route, stops, price, license_url (must start with /uploads/; sets status back to pending). 409 phone taken.
POST /trips/board — student must have booked THIS trip (403 "You have not booked this trip"). Parents are notified.
POST /trips/exit — parents are notified.

# New entries

GET /scheduled-trips 🔒 student/admin — bookable trips (verified driver, not cancelled, not started, not older than 1h). ?q= (driver, origin, destination, stops) · ?sort=time|price. 200 { trips: [ { id, driver_id, driver_name, driver_phone, vehicle_plate, origin, destination, scheduled_at, seats, seats_left, price, stops, booked } ] }
GET /driver/scheduled-trips 🔒 driver — own trips newest first. 200 { trips: [ { id, origin, destination, scheduled_at, seats, price, stops, booked_count, status, trip_id } ], counts: { total, upcoming, completed, cancelled } }
POST /driver/scheduled-trips 🔒 verified driver — { origin, destination, scheduled_at (ISO), seats, price?, stops? }. 201 · 400 invalid / past (>1h ago) / >1 year ahead · 403 not verified · 404 no profile.
PATCH /driver/scheduled-trips/{id} 🔒 driver — edit origin, destination, scheduled_at, seats, price, stops or { cancelled: true } (booked students notified). 400 · 404 not yours · 409 started / cancelled / seats below bookings.
DELETE /driver/scheduled-trips/{id} 🔒 driver — only if not started and no bookings (else 409 → cancel instead).
DELETE /bookings/{id} 🔒 student — cancel own booking before the trip starts. 404 not yours · 409 started. Driver notified.
POST /students/me/link-code 🔒 student — new 6-digit code, valid 10 min, replaces the old one. 201 { code, expires_at, expires_in_seconds }
GET /students/me/parents 🔒 student — 200 { parents: [ { id, name, email, phone } ] }
DELETE /students/me/parents/{parentId} 🔒 student — removes a linked parent. 404 not linked.
DELETE /parents/me/children/{studentId} 🔒 parent — unlinks a child. 404 not linked.
GET /parents/me/children/live 🔒 parent — all children in one call. 200 { children: [ { id, name, email, phone, university, status, trip } ] } status: idle | waiting | on_board | arrived (arrived shows 3h). Location only while on_board.
GET /auth/me 🔒 any — { user: { id, name, email, phone, university, role, created_at } }
PATCH /auth/me 🔒 any — name, phone, university (students only). 409 phone taken.
POST /auth/change-password 🔒 any — { currentPassword, newPassword (≥8) }. 400 wrong current / too short.
POST /driver/issues 🔒 driver — "Report vehicle issue" { category: breakdown|accident|delay|other, message? }. Notifies: parents of students ON BOARD the running trip · drivers of other running buses within 3 km (GPS fresh < 2 min) · all admins. 201 { issue, notified: { parents, drivers, admins } } · 400 · 429 (one report per 2 min).
GET /notifications 🔒 any — latest 50 + unread_count. Types: boarded, exited, trip_started, booking, cancelled, issue, linked, driver_status.
POST /notifications/read 🔒 any — { id } one, or {} all.
GET /admin/stats 🔒 admin — { users:{students,parents}, drivers:{pending,verified,rejected}, trips:{running,upcoming,completed,cancelled}, bookings, open_issues }
GET /admin/users 🔒 admin — ?role=student|parent&q= → { users: [ { id, name, email, phone, university, created_at, links, bookings } ] }
GET /admin/trips 🔒 admin — ?status=all|upcoming|in_progress|completed|cancelled → every planned trip with driver, booked_count, status.
GET /admin/issues 🔒 admin — ?status=open (default)|resolved|all.
PATCH /admin/issues/{id} 🔒 admin — { status: "resolved" }. 404 · 409 already resolved.

DB: schema.sql v5 (users.phone/university · drivers.vehicle_plate/seats, phone moved to users · scheduled_trips · trips.scheduled_trip_id · bookings per trip · link_codes · link_attempts · notifications · vehicle_issues). CHANGE LOG in schema.sql lists the ALTERs.