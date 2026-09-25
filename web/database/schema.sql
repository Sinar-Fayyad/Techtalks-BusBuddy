-- BusBuddy — database/schema.sql (v3, 21/09)
-- RULE: if you change the database, append your query to the CHANGE LOG below
-- (date + name + why) in the SAME PR. Fresh machines run this whole file.

CREATE DATABASE IF NOT EXISTS BusBuddy_app;
USE BusBuddy_app;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','driver','student','parent') NOT NULL DEFAULT 'driver',  -- CHANGED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  license_url VARCHAR(255) NOT NULL,
  status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  start_time DATETIME(3) NOT NULL,
  end_time DATETIME(3) NULL,
  latitude DECIMAL(9,6) NULL,                    -- NEW
  longitude DECIMAL(9,6) NULL,                   -- NEW
  location_updated_at DATETIME(3) NULL,          -- NEW
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_driver_start (driver_id, start_time),
  CONSTRAINT fk_trips_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE parent_student (                    -- NEW TABLE
  parent_user_id INT NOT NULL,
  student_user_id INT NOT NULL,
  PRIMARY KEY (parent_user_id, student_user_id),
  CONSTRAINT fk_parent_student_parent FOREIGN KEY (parent_user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_parent_student_student FOREIGN KEY (student_user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE trip_students (                     -- NEW TABLE
  trip_id INT NOT NULL,
  student_id INT NOT NULL,
  PRIMARY KEY (trip_id, student_id),
  CONSTRAINT fk_trip_students_trip FOREIGN KEY (trip_id)
    REFERENCES trips(id) ON DELETE CASCADE,
  CONSTRAINT fk_trip_students_student FOREIGN KEY (student_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ================= CHANGE LOG =================
-- Format: -- YYYY-MM-DD — name — what & why (paste the exact query)
--
-- 2026-09-15..18 — Sprint 2 — applied to the schema above:
--   ALTER TABLE users CHANGE password password_hash VARCHAR(255) NOT NULL;  -- code uses password_hash
--   ALTER TABLE users ENGINE=InnoDB;   -- MyISAM blocked the trips FK (#1824)
--   ALTER TABLE drivers ENGINE=InnoDB;
--   CREATE TABLE trips (...);          -- defined above (Jad, T8)
--
-- 2026-09-21 — Sinar — DB migration: roles + relationships + trip location
-- users.role enum adds 'student','parent' (appended — safe for existing rows).
-- trips gets nullable GPS columns. New link tables (composite PKs, FK CASCADE).
--   ALTER TABLE users MODIFY COLUMN role ENUM('admin','driver','student','parent') NOT NULL DEFAULT 'driver';
--   ALTER TABLE trips ADD COLUMN latitude DECIMAL(9,6) NULL, ADD COLUMN longitude DECIMAL(9,6) NULL, ADD COLUMN location_updated_at DATETIME(3) NULL;
--   CREATE TABLE parent_student (                    -- NEW TABLE
--   parent_user_id INT NOT NULL,
--   student_user_id INT NOT NULL,
--   PRIMARY KEY (parent_user_id, student_user_id),
--   CONSTRAINT fk_parent_student_parent FOREIGN KEY (parent_user_id)
--     REFERENCES users(id) ON DELETE CASCADE,
--   CONSTRAINT fk_parent_student_student FOREIGN KEY (student_user_id)
--     REFERENCES users(id) ON DELETE CASCADE
-- ) ENGINE=InnoDB;
--   CREATE TABLE trip_students (                     -- NEW TABLE
--   trip_id INT NOT NULL,
--   student_id INT NOT NULL,
--   PRIMARY KEY (trip_id, student_id),
--   CONSTRAINT fk_trip_students_trip FOREIGN KEY (trip_id)
--     REFERENCES trips(id) ON DELETE CASCADE,
--   CONSTRAINT fk_trip_students_student FOREIGN KEY (student_id)
--     REFERENCES users(id) ON DELETE CASCADE
-- ) ENGINE=InnoDB;
--
-- 2026-09-25 — Wassim — T13: seed data for local dry runs (NO schema change)
-- NEW FILE database/seed.sql — run AFTER this file. Seeds the sprint-flow test set:
--   1 admin · 1 VERIFIED driver (license /uploads/seed-driver-license.png)
--   · 1 pending driver (license /uploads/seed-driver2-license.pdf)
--   · 1 student · 1 parent linked to that student (parent_student row)
--   all emails @busbuddy.test · passwords Test1234! (admin/drivers) / Parent1234! (parent/student)
-- Idempotent: re-runs insert nothing, ids stay stable (guarded by WHERE NOT EXISTS).
-- Full reset (optional): DELETE FROM users WHERE email LIKE '%@busbuddy.test'; then re-run.
-- License FILES are NOT in git (uploads/ gitignored) — see T13 PR description to generate them.
-- ==============================================
