-- BusBuddy — database/seed.sql (T13, 2026-09-25 — Wassim)
-- Purpose: one command seeds the minimum data for a full local dry run
-- of the sprint flow BEFORE Sino's final testing:
--   1 admin · 1 VERIFIED driver (PNG license) · 1 pending driver (PDF license)
--   1 student · 1 parent linked to that student
--
-- HOW TO RUN (WAMP):
--   C:\wamp64\bin\mysql\mysql8.0.18\bin\mysql.exe -u root -P <your_port> < database/seed.sql
--   (or import via phpMyAdmin → busbuddy_app → Import)
-- Port differs per machine (3306/3307/3308...). Ask, never hardcode — see TESTING.md.
-- Machine with 8.0.18 + port 3308? Drop the -P flag entirely, 3308 is in my.ini.
--
-- RUN IT TWICE: second run inserts nothing and changes no ids (idempotency check).
--
-- Re-running is SAFE: every INSERT is guarded by WHERE NOT EXISTS on the seed
-- email / pair. It only ever touches rows created by this file — never real
-- registrations. Manual changes you make while testing (verified → rejected,
-- extra trips) are NOT reverted by a re-run; that is deliberate.
--
-- FULL RESET (optional, NOT run automatically — it deletes and re-inserts the
-- seed users, so their ids CHANGE; note the new ids it prints). Order matters:
-- trips FK to drivers is ON DELETE RESTRICT, so clear trips BEFORE users.
--   DELETE FROM trip_students; DELETE FROM trips;
--   DELETE FROM users WHERE email LIKE '%@busbuddy.test';
--   SOURCE database/seed.sql;   (or re-import the file)
--
-- Passwords (dev only): drivers/admin = Test1234! · parent/student = Parent1234!
-- Hashes were generated with bcryptjs (same lib as web signup), cost 10.

USE BusBuddy_app;

-- ---------------------------------------------------------------------------
-- 1. Users — inserted only if missing (re-runs are no-ops, ids stay stable).
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 2. Driver profiles (fixed file names — same ones T13 puts in web/uploads/).
--    License FILES are NOT in git (web/uploads is gitignored); generate them
--    locally — 1x1 PNG + tiny PDF, exact bytes are in the T13 PR description.
-- ---------------------------------------------------------------------------
INSERT INTO drivers (user_id, license_url, status)
SELECT id, '/uploads/seed-driver-license.png', 'verified'
FROM users WHERE email = 'driver1@busbuddy.test'
  AND NOT EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = users.id);

INSERT INTO drivers (user_id, license_url, status)
SELECT id, '/uploads/seed-driver2-license.pdf', 'pending'
FROM users WHERE email = 'driver2@busbuddy.test'
  AND NOT EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = users.id);

-- ---------------------------------------------------------------------------
-- 3. Parent → child link (composite PK makes duplicates impossible anyway).
-- ---------------------------------------------------------------------------
INSERT INTO parent_student (parent_user_id, student_user_id)
SELECT p.id, s.id
FROM users p
JOIN users s ON s.email = 'student1@busbuddy.test'
WHERE p.email = 'parent1@busbuddy.test'
  AND NOT EXISTS (
    SELECT 1 FROM parent_student ps
    WHERE ps.parent_user_id = p.id AND ps.student_user_id = s.id
  );

-- ---------------------------------------------------------------------------
-- 4. Verify: this is what you should see (2 drivers, 1 link, roles = 5 rows)
-- ---------------------------------------------------------------------------
SELECT u.id, u.name, u.role, d.status AS driver_status, d.license_url
FROM users u LEFT JOIN drivers d ON d.user_id = u.id
WHERE u.email LIKE '%@busbuddy.test'
ORDER BY u.id;

SELECT ps.parent_user_id, p.name AS parent, ps.student_user_id, s.name AS child
FROM parent_student ps
JOIN users p ON p.id = ps.parent_user_id
JOIN users s ON s.id = ps.student_user_id;
