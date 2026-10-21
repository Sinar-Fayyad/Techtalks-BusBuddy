-- BusBuddy — database/seed.sql (v4, 20/10)
-- One command seeds the minimum data for a full local dry run:
--   1 admin · 1 VERIFIED driver (profile filled) · 1 pending driver
--   2 students (student1 has bookings, student2 has none) · 1 parent linked to student1
--   driver1 trips: 1 RUNNING (student1 on board) · 2 upcoming · 1 completed · 1 cancelled
--
-- HOW TO RUN: phpMyAdmin -> BusBuddy_app -> Import -> this file (run schema.sql first).
-- Port differs per machine (3306/3307/3308...): ask, never hardcode (see TESTING.md).
--
-- Re-running is SAFE: every INSERT is guarded (WHERE NOT EXISTS), ids stay stable.
-- Manual changes made while testing are NOT reverted. Stopped the running trip? Re-run this
-- file to get a fresh one ONLY if you first run the FULL RESET below (the old run stays on its plan).
--
-- FULL RESET (seed users get NEW ids). Order matters (trips FK is RESTRICT):
--   DELETE FROM trip_students; DELETE FROM trips; DELETE FROM scheduled_trips;
--   DELETE FROM users WHERE email LIKE '%@busbuddy.test';
--   then re-import this file.
--
-- Passwords (dev only): drivers/admin = Test1234! · parents/students = Parent1234!
-- Hashes: bcryptjs cost 10 (same lib as web signup). All times UTC (never NOW()).
-- Lebanon is UTC+3: "tomorrow 07:30 local" = 04:30 UTC.

USE BusBuddy_app;

-- 1. Users ------------------------------------------------------------------
INSERT INTO users (name, email, phone, university, password_hash, role)
SELECT 'Seed Admin', 'admin@busbuddy.test', '+96170000000', NULL,
       '$2b$10$9ABLa/cUCF5Zpjbzu5xYZu36n79H8DvAY0nYrjBiFYwelwPHp.LwK', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@busbuddy.test');

INSERT INTO users (name, email, phone, university, password_hash, role)
SELECT 'Seed Driver One', 'driver1@busbuddy.test', '+96170000001', NULL,
       '$2b$10$9ABLa/cUCF5Zpjbzu5xYZu36n79H8DvAY0nYrjBiFYwelwPHp.LwK', 'driver'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'driver1@busbuddy.test');

INSERT INTO users (name, email, phone, university, password_hash, role)
SELECT 'Seed Driver Two', 'driver2@busbuddy.test', '+96170000002', NULL,
       '$2b$10$9ABLa/cUCF5Zpjbzu5xYZu36n79H8DvAY0nYrjBiFYwelwPHp.LwK', 'driver'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'driver2@busbuddy.test');

INSERT INTO users (name, email, phone, university, password_hash, role)
SELECT 'Seed Student', 'student1@busbuddy.test', '+96171000001', 'AUB',
       '$2b$10$fUvpxD0pwUBmnc5R0Z6cXeVryrFH70Bpf7e1vGxiaHT2PSjXfWoXa', 'student'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'student1@busbuddy.test');

INSERT INTO users (name, email, phone, university, password_hash, role)
SELECT 'Seed Student Two', 'student2@busbuddy.test', '+96171000002', 'LAU',
       '$2b$10$fUvpxD0pwUBmnc5R0Z6cXeVryrFH70Bpf7e1vGxiaHT2PSjXfWoXa', 'student'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'student2@busbuddy.test');

INSERT INTO users (name, email, phone, university, password_hash, role)
SELECT 'Seed Parent', 'parent1@busbuddy.test', '+96171000003', NULL,
       '$2b$10$fUvpxD0pwUBmnc5R0Z6cXeVryrFH70Bpf7e1vGxiaHT2PSjXfWoXa', 'parent'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'parent1@busbuddy.test');

-- 2. Driver profiles ----------------------------------------------------------
-- License FILES are NOT in git (web/uploads is gitignored): recreate them per machine
-- (1x1 PNG + tiny PDF, recipes in TESTING.md).
INSERT INTO drivers (user_id, license_url, status, vehicle_plate, seats, route, stops, price)
SELECT id, '/uploads/seed-driver-license.png', 'verified', 'B 123456', 14,
       'Baabda - Hadath - Campus', 'Baabda 07:00\nHadath 07:15\nCampus gate 07:30', 2.00
FROM users WHERE email = 'driver1@busbuddy.test'
  AND NOT EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = users.id);

INSERT INTO drivers (user_id, license_url, status)
SELECT id, '/uploads/seed-driver2-license.pdf', 'pending'
FROM users WHERE email = 'driver2@busbuddy.test'
  AND NOT EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = users.id);

-- 3. Parent -> child link -----------------------------------------------------
INSERT INTO parent_student (parent_user_id, student_user_id)
SELECT p.id, s.id
FROM users p
JOIN users s ON s.email = 'student1@busbuddy.test'
WHERE p.email = 'parent1@busbuddy.test'
  AND NOT EXISTS (
    SELECT 1 FROM parent_student ps
    WHERE ps.parent_user_id = p.id AND ps.student_user_id = s.id
  );

-- 4. driver1's scheduled trips (guarded by driver + origin + destination) -----
INSERT INTO scheduled_trips (driver_id, origin, destination, scheduled_at, seats, price, stops)
SELECT d.id, 'Baabda', 'Campus', UTC_TIMESTAMP(3) - INTERVAL 10 MINUTE, 14, 2.00, 'Baabda\nHadath\nCampus gate'
FROM drivers d JOIN users u ON u.id = d.user_id
WHERE u.email = 'driver1@busbuddy.test'
  AND NOT EXISTS (SELECT 1 FROM scheduled_trips x WHERE x.driver_id = d.id AND x.origin = 'Baabda' AND x.destination = 'Campus');

INSERT INTO scheduled_trips (driver_id, origin, destination, scheduled_at, seats, price, stops)
SELECT d.id, 'Hadath', 'Campus', TIMESTAMP(UTC_DATE() + INTERVAL 1 DAY, '04:30:00'), 14, 2.00, 'Hadath\nFurn el Chebbak\nCampus gate'
FROM drivers d JOIN users u ON u.id = d.user_id
WHERE u.email = 'driver1@busbuddy.test'
  AND NOT EXISTS (SELECT 1 FROM scheduled_trips x WHERE x.driver_id = d.id AND x.origin = 'Hadath' AND x.destination = 'Campus');

INSERT INTO scheduled_trips (driver_id, origin, destination, scheduled_at, seats, price, stops)
SELECT d.id, 'Campus', 'Baabda', TIMESTAMP(UTC_DATE() + INTERVAL 1 DAY, '11:00:00'), 14, 2.00, 'Campus gate\nHadath\nBaabda'
FROM drivers d JOIN users u ON u.id = d.user_id
WHERE u.email = 'driver1@busbuddy.test'
  AND NOT EXISTS (SELECT 1 FROM scheduled_trips x WHERE x.driver_id = d.id AND x.origin = 'Campus' AND x.destination = 'Baabda');

INSERT INTO scheduled_trips (driver_id, origin, destination, scheduled_at, seats, price, stops)
SELECT d.id, 'Furn el Chebbak', 'Campus', TIMESTAMP(UTC_DATE() - INTERVAL 1 DAY, '04:30:00'), 14, 2.00, NULL
FROM drivers d JOIN users u ON u.id = d.user_id
WHERE u.email = 'driver1@busbuddy.test'
  AND NOT EXISTS (SELECT 1 FROM scheduled_trips x WHERE x.driver_id = d.id AND x.origin = 'Furn el Chebbak' AND x.destination = 'Campus');

INSERT INTO scheduled_trips (driver_id, origin, destination, scheduled_at, seats, price, stops, cancelled)
SELECT d.id, 'Baabda', 'Hamra', TIMESTAMP(UTC_DATE() + INTERVAL 2 DAY, '05:00:00'), 10, 3.00, NULL, 1
FROM drivers d JOIN users u ON u.id = d.user_id
WHERE u.email = 'driver1@busbuddy.test'
  AND NOT EXISTS (SELECT 1 FROM scheduled_trips x WHERE x.driver_id = d.id AND x.origin = 'Baabda' AND x.destination = 'Hamra');

-- 5. Runs: the first plan is RUNNING now, the yesterday plan is COMPLETED -------
-- Running (only if driver1 has no active trip and the plan has not run yet).
INSERT INTO trips (driver_id, scheduled_trip_id, start_time)
SELECT st.driver_id, st.id, UTC_TIMESTAMP(3) - INTERVAL 5 MINUTE
FROM scheduled_trips st
JOIN drivers d ON d.id = st.driver_id
JOIN users u ON u.id = d.user_id
WHERE u.email = 'driver1@busbuddy.test' AND st.origin = 'Baabda' AND st.destination = 'Campus'
  AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.scheduled_trip_id = st.id)
  AND NOT EXISTS (SELECT 1 FROM trips t2 WHERE t2.driver_id = d.id AND t2.end_time IS NULL);

-- Completed (yesterday).
INSERT INTO trips (driver_id, scheduled_trip_id, start_time, end_time)
SELECT st.driver_id, st.id, st.scheduled_at, st.scheduled_at + INTERVAL 40 MINUTE
FROM scheduled_trips st
JOIN drivers d ON d.id = st.driver_id
JOIN users u ON u.id = d.user_id
WHERE u.email = 'driver1@busbuddy.test' AND st.origin = 'Furn el Chebbak' AND st.destination = 'Campus'
  AND NOT EXISTS (SELECT 1 FROM trips t WHERE t.scheduled_trip_id = st.id);

-- 6. Bookings: student1 booked the running trip and the tomorrow-morning trip ----
INSERT INTO bookings (student_id, scheduled_trip_id, pickup)
SELECT s.id, st.id, 'Baabda main square'
FROM users s
JOIN users du ON du.email = 'driver1@busbuddy.test'
JOIN drivers d ON d.user_id = du.id
JOIN scheduled_trips st ON st.driver_id = d.id AND st.origin = 'Baabda' AND st.destination = 'Campus'
WHERE s.email = 'student1@busbuddy.test'
  AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.student_id = s.id AND b.scheduled_trip_id = st.id);

INSERT INTO bookings (student_id, scheduled_trip_id, pickup)
SELECT s.id, st.id, 'Hadath bridge'
FROM users s
JOIN users du ON du.email = 'driver1@busbuddy.test'
JOIN drivers d ON d.user_id = du.id
JOIN scheduled_trips st ON st.driver_id = d.id AND st.origin = 'Hadath' AND st.destination = 'Campus'
WHERE s.email = 'student1@busbuddy.test'
  AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.student_id = s.id AND b.scheduled_trip_id = st.id);

-- 7. student1 is ON BOARD the running trip ----------------------------------------
INSERT INTO trip_students (trip_id, student_id, boarded_at)
SELECT t.id, s.id, UTC_TIMESTAMP(3) - INTERVAL 3 MINUTE
FROM trips t
JOIN scheduled_trips st ON st.id = t.scheduled_trip_id
JOIN users s ON s.email = 'student1@busbuddy.test'
JOIN drivers d ON d.id = t.driver_id
JOIN users u ON u.id = d.user_id
WHERE u.email = 'driver1@busbuddy.test' AND st.origin = 'Baabda' AND st.destination = 'Campus'
  AND t.end_time IS NULL
  AND NOT EXISTS (SELECT 1 FROM trip_students ts WHERE ts.trip_id = t.id AND ts.student_id = s.id);

-- 8. Verify: what you should see ----------------------------------------------------
--    6 users · 1 parent link · 5 scheduled trips (running, 2 upcoming, completed, cancelled)
--    2 bookings (student1) · 1 RUNNING trip with student1 boarded
SELECT u.id, u.name, u.role, u.phone, u.university, d.status AS driver_status, d.vehicle_plate, d.seats, d.price
FROM users u LEFT JOIN drivers d ON d.user_id = u.id
WHERE u.email LIKE '%@busbuddy.test'
ORDER BY u.id;

SELECT st.id, st.origin, st.destination, st.scheduled_at, st.seats, st.cancelled,
       CASE WHEN st.cancelled = 1 THEN 'cancelled'
            WHEN t.id IS NULL THEN 'upcoming'
            WHEN t.end_time IS NULL THEN 'in_progress'
            ELSE 'completed' END AS status
FROM scheduled_trips st LEFT JOIN trips t ON t.scheduled_trip_id = st.id
ORDER BY st.id;

SELECT b.id, s.name AS student, st.origin, st.destination, b.pickup
FROM bookings b
JOIN users s ON s.id = b.student_id
JOIN scheduled_trips st ON st.id = b.scheduled_trip_id;

SELECT t.id, t.scheduled_trip_id, t.start_time, t.end_time, su.name AS student_on_board, ts.boarded_at, ts.exited_at
FROM trips t
LEFT JOIN trip_students ts ON ts.trip_id = t.id
LEFT JOIN users su ON su.id = ts.student_id
ORDER BY t.id DESC;
