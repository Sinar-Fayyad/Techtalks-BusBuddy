# BusBuddy API Contract — Sprint 1 (v1)

Base URL: `http://localhost:3000/api — all bodies are JSON. Auth endpoints return a JWT; protected endpoints need header Authorization: Bearer <token>`.

1. POST /auth/signup
Creates a user. Role defaults to driver if omitted.

Body: { "name": string, "email": string, "password": string, "role"?: "admin"|"driver" }
201: { "message": "User created", "userId": number }
Errors: 400 missing fields · 409 email exists · 500 server error
2. POST /auth/login
Body: { "email": string, "password": string }
200: { "message": "Login OK", "token": JWT, "role": "admin"|"driver" }
Errors: 401 invalid credentials · 500
3. GET /admin/drivers 🔒 admin only
Lists drivers with status = pending, newest first.

200: { "drivers": [{ "id", "name", "email", "license_url", "status", "created_at" }] }
Errors: 401 no/invalid token · 403 not admin · 500
4. POST /driver/profile 🔒 driver only
Creates the driver profile (one per user).

Headers: Bearer token
Body: { "license_url": string }
201: { "message": "Driver profile created, pending review" }
Errors: 400 missing license_url · 401 · 409 profile exists · 500
5. PATCH /admin/drivers/{id} 🔒 admin only
Approves or rejects a pending driver.

Body: { "action": "verify" | "reject" }
200: { "message": "Driver verified" | "Driver rejected" }
Errors: 400 bad action · 401 · 403 · 404 driver not found · 500
All endpoints implemented and tested (Postman + UI). Planned v2 additions: license file upload (multipart), GET /drivers/me, refresh tokens.

7. POST /driver/trips/start 🔒 driver only
Starts a new trip for the logged-in driver (driver must be verified).

Headers: Bearer token
Body: none — driver_id comes from the token
201: { "message": "Trip started", "trip": { "id", "driver_id", "start_time", "end_time": null } }
Errors: 401 no/invalid token · 403 not a driver / not verified · 404 no driver profile · 409 active trip already exists · 500

8. POST /driver/trips/stop 🔒 driver only
Stops the driver's active trip by setting end_time.

Headers: Bearer token
Body: none
200: { "message": "Trip stopped", "trip": { "id", "driver_id", "start_time", "end_time" } }
Errors: 401 no/invalid token · 403 not a driver · 404 no active trip · 500

9. GET /admin/drivers/{id}/trips 🔒 admin only
Lists all trips for one driver, newest first. All times are UTC.

200: { "trips": [{ "id", "driver_id", "start_time", "end_time", "created_at" }] } — empty array if no trips
Errors: 400 invalid driver id · 401 no/invalid token · 403 not admin · 404 driver not found · 500
