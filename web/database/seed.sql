-- BusBuddy — database/seed.sql (v3, 20/10)
-- One command seeds the minimum data for a full local dry run:
--   1 admin · 1 VERIFIED driver (PNG license, profile filled) · 1 pending driver (PDF license)
--   1 student (booked with the verified driver) · 1 parent linked to that student
--   1 ACTIVE trip (end_time NULL) with the student already on board
--
-- HOW TO RUN: phpMyAdmin → BusBuddy_app → Import → this file
--   (or: mysql.exe -u root -P <your_port> < database/seed.sql). Run schema.sql first.
-- Port differs per machine (3306/3307/3308...): ask, never hardcode (see TESTING.md).
--
-- Re-running is SAFE: every INSERT is guarded (WHERE NOT EXISTS), ids stay stable.
-- Manual changes made while testing are NOT reverted. Stopped the trip? Re-run this
-- file to get a fresh active one.
--
-- FULL RESET (optional — seed users get NEW ids). Order matters (trips FK is RESTRICT):
--   DELETE FROM trip_students; DELETE FROM trips;
--   DELETE FROM users WHERE email LIKE '%@busbuddy.test';   (bookings go with the users)
--   then re-import this file.
--
-- Passwords (dev only): drivers/admin = Test1234! · parent/student = Parent1234!
-- Hashes: bcryptjs cost 10 (same lib as web signup). All times UTC (never NOW()).

USE BusBuddy_app;

-- 1. Users ------------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role)
SELECT 'Seed Admin', 'admin@busbuddy.test',
       '$2b$10$9ABLa/cUCF5Zpjbzu5xYZu36n79H8DvAY0nYrjBiFYwelwPHp.LwK', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@busbuddy.test');

INSERT INTO users (name, email, password_hash, role)
SELECT 'Seed Driver One', 'driver1@busbuddy.test',
       '$2b$10$9ABLa/cUCF5Zpjbzu5xYZu36n79H8DvAY0nYrjBiFYwelwPHp.LwK', 'driver'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'driver1@busbuddy.test');

INSERT INTO users (name, email, password_hash, role)
SELECT 'Seed Driver Two', 'driver2@busbuddy.test',
       '$2b$10$9ABLa/cUCF5Zpjbzu5xYZu36n79H8DvAY0nYrjBiFYwelwPHp.LwK', 'driver'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'driver2@busbuddy.test');

INSERT INTO users (name, email, password_hash, role)
SELECT 'Seed Student', 'student1@busbuddy.test',
       '$2b$10$fUvpxD0pwUBmnc5R0Z6cXeVryrFH70Bpf7e1vGxiaHT2PSjXfWoXa', 'student'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'student1@busbuddy.test');

INSERT INTO users (name, email, password_hash, role)
SELECT 'Seed Parent', 'parent1@busbuddy.test',
       '$2b$10$fUvpxD0pwUBmnc5R0Z6cXeVryrFH70Bpf7e1vGxiaHT2PSjXfWoXa', 'parent'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'parent1@busbuddy.test');

-- 2. Driver profiles ----------------------------------------------------------
-- License FILES are NOT in git (web/uploads is gitignored): recreate them per machine
-- (1x1 PNG + tiny PDF, recipes in TESTING.md).
INSERT INTO drivers (user_id, license_url, status)
SELECT id, '/uploads/seed-driver-license.png', 'verified'
FROM users WHERE email = 'driver1@busbuddy.test'
  AND NOT EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = users.id);

INSERT INTO drivers (user_id, license_url, status)
SELECT id, '/uploads/seed-driver2-license.pdf', 'pending'
FROM users WHERE email = 'driver2@busbuddy.test'
  AND NOT EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = users.id);

-- Profile details for driver1 (only filled if still empty, so edits are never overwritten)
UPDATE drivers d
JOIN users u ON u.id = d.user_id
SET d.phone = '70 000 000',
    d.route = 'Baabda - Hadath - Campus',
    d.stops = 'Baabda, Hadath, Campus gate',
    d.price = 5.00
WHERE u.email = 'driver1@busbuddy.test' AND d.phone IS NULL;

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

-- 4. Booking: student1 booked driver1 (required to board his trips) ------------
INSERT INTO bookings (student_id, driver_id, pickup)
SELECT s.id, d.id, 'Baabda main square'
FROM users s
JOIN users du ON du.email = 'driver1@busbuddy.test'
JOIN drivers d ON d.user_id = du.id
WHERE s.email = 'student1@busbuddy.test'
  AND NOT EXISTS (
    SELECT 1 FROM bookings b WHERE b.student_id = s.id AND b.driver_id = d.id
  );

-- 5. ONE ACTIVE TRIP: driver1 driving now (end_time NULL), student1 on board ----
-- Guarded: only inserted if driver1 has no active trip (mirrors the API's 409 rule).
INSERT INTO trips (driver_id, start_time)
SELECT d.id, UTC_TIMESTAMP(3)
FROM drivers d
JOIN users u ON u.id = d.user_id
WHERE u.email = 'driver1@busbuddy.test'
  AND d.status = 'verified'
  AND NOT EXISTS (
    SELECT 1 FROM trips t2
    JOIN drivers d2 ON d2.id = t2.driver_id
    WHERE d2.user_id = d.user_id AND t2.end_time IS NULL
  );

INSERT INTO trip_students (trip_id, student_id, boarded_at)
SELECT t.id, s.id, UTC_TIMESTAMP(3)
FROM trips t
JOIN drivers d ON d.id = t.driver_id
JOIN users u ON u.id = d.user_id
JOIN users s ON s.email = 'student1@busbuddy.test'
WHERE u.email = 'driver1@busbuddy.test'
  AND t.end_time IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM trip_students ts
    WHERE ts.trip_id = t.id AND ts.student_id = s.id
  );

-- 6. Verify: what you should see ------------------------------------------------
--    5 users · 1 parent link · 1 booking · 1 ACTIVE trip with student1 boarded
SELECT u.id, u.name, u.role, d.status AS driver_status, d.license_url, d.phone, d.price
FROM users u LEFT JOIN drivers d ON d.user_id = u.id
WHERE u.email LIKE '%@busbuddy.test'
ORDER BY u.id;

SELECT ps.parent_user_id, p.name AS parent, ps.student_user_id, s.name AS child
FROM parent_student ps
JOIN users p ON p.id = ps.parent_user_id
JOIN users s ON s.id = ps.student_user_id;

SELECT b.id, s.name AS student, du.name AS driver, b.pickup
FROM bookings b
JOIN users s ON s.id = b.student_id
JOIN drivers d ON d.id = b.driver_id
JOIN users du ON du.id = d.user_id;

SELECT t.id, du.name AS driver, t.start_time, t.end_time,
       su.name AS student_on_board, ts.boarded_at, ts.exited_at
FROM trips t
JOIN drivers d ON d.id = t.driver_id
JOIN users du ON du.id = d.user_id
LEFT JOIN trip_students ts ON ts.trip_id = t.id
LEFT JOIN users su ON su.id = ts.student_id
ORDER BY t.id DESC;