-- BusBuddy — database/schema.sql (v5, 20/10)
-- Fresh machine: run this whole file, then seed.sql.
-- RULE: if you change the database, update the tables below AND append the exact
-- query to the CHANGE LOG at the bottom (date + name + why) in the SAME PR.

CREATE DATABASE IF NOT EXISTS BusBuddy_app;
USE BusBuddy_app;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(30) NULL UNIQUE,             -- normalized, e.g. +96170123456
  university VARCHAR(150) NULL,              -- students only
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','driver','student','parent') NOT NULL DEFAULT 'driver',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  license_url VARCHAR(255) NOT NULL,
  status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  vehicle_plate VARCHAR(30) NULL,
  seats INT NULL,                            -- vehicle capacity (default for new trips)
  route VARCHAR(255) NULL,                   -- default route text (prefills new trips)
  stops TEXT NULL,                           -- default stops (prefills new trips)
  price DECIMAL(8,2) NULL,                   -- default price per ride (prefills new trips)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- A trip the driver PLANS (add / edit / cancel / delete). Students book these.
CREATE TABLE scheduled_trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  origin VARCHAR(150) NOT NULL,
  destination VARCHAR(150) NOT NULL,
  scheduled_at DATETIME(3) NOT NULL,         -- UTC
  seats INT NOT NULL,
  price DECIMAL(8,2) NOT NULL DEFAULT 0,
  stops TEXT NULL,
  cancelled TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sched_driver (driver_id, scheduled_at),
  INDEX idx_sched_time (scheduled_at),
  CONSTRAINT fk_sched_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- A trip that actually RUNS (Start Trip creates it, Stop Trip ends it).
-- scheduled_trip_id links it to the plan it executes (NULL = ad-hoc trip, nobody can board).
CREATE TABLE trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  scheduled_trip_id INT NULL,
  start_time DATETIME(3) NOT NULL,
  end_time DATETIME(3) NULL,
  latitude DECIMAL(9,6) NULL,
  longitude DECIMAL(9,6) NULL,
  location_updated_at DATETIME(3) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_driver_start (driver_id, start_time),
  UNIQUE KEY uq_trip_plan (scheduled_trip_id),   -- a plan runs at most once
  CONSTRAINT fk_trips_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_trips_plan FOREIGN KEY (scheduled_trip_id) REFERENCES scheduled_trips(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE parent_student (
  parent_user_id INT NOT NULL,
  student_user_id INT NOT NULL,
  PRIMARY KEY (parent_user_id, student_user_id),
  CONSTRAINT fk_parent_student_parent FOREIGN KEY (parent_user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_parent_student_student FOREIGN KEY (student_user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Who is / was on board a running trip. boarded_at set by POST /trips/board,
-- exited_at by POST /trips/exit. Times are UTC.
CREATE TABLE trip_students (
  trip_id INT NOT NULL,
  student_id INT NOT NULL,
  boarded_at DATETIME(3) NULL,
  exited_at DATETIME(3) NULL,
  PRIMARY KEY (trip_id, student_id),
  CONSTRAINT fk_trip_students_trip FOREIGN KEY (trip_id)
    REFERENCES trips(id) ON DELETE CASCADE,
  CONSTRAINT fk_trip_students_student FOREIGN KEY (student_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- A student booked a scheduled trip (one booking per student+trip; a student can book many trips).
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  scheduled_trip_id INT NOT NULL,
  pickup VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_booking (student_id, scheduled_trip_id),
  CONSTRAINT fk_bookings_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_plan FOREIGN KEY (scheduled_trip_id) REFERENCES scheduled_trips(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- One active 6-digit code per student; a parent needs it (plus the student's email) to link.
CREATE TABLE link_codes (
  student_id INT NOT NULL PRIMARY KEY,
  code CHAR(6) NOT NULL,
  expires_at DATETIME(3) NOT NULL,           -- UTC
  CONSTRAINT fk_link_codes_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Failed link attempts per parent (max 5 per 15 minutes).
CREATE TABLE link_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT NOT NULL,
  attempted_at DATETIME(3) NOT NULL,         -- UTC
  INDEX idx_attempts (parent_id, attempted_at),
  CONSTRAINT fk_link_attempts_parent FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- In-app notifications (the bell). Created by server events (boarding, bookings, issues, ...).
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(30) NOT NULL,                 -- boarded, exited, trip_started, booking, cancelled, issue, linked, driver_status
  title VARCHAR(150) NOT NULL,
  body VARCHAR(500) NOT NULL,
  data JSON NULL,                            -- e.g. {"tripId":1,"studentId":4}
  created_at DATETIME(3) NOT NULL,           -- UTC
  read_at DATETIME(3) NULL,
  INDEX idx_notif_user (user_id, created_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- "Report vehicle issue" (driver). Admin sees and resolves them.
CREATE TABLE vehicle_issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  trip_id INT NULL,                          -- the running trip when reported (if any)
  category ENUM('breakdown','accident','delay','other') NOT NULL,
  message VARCHAR(500) NULL,
  latitude DECIMAL(9,6) NULL,
  longitude DECIMAL(9,6) NULL,
  status ENUM('open','resolved') NOT NULL DEFAULT 'open',
  created_at DATETIME(3) NOT NULL,           -- UTC
  resolved_at DATETIME(3) NULL,
  INDEX idx_issue_status (status, created_at),
  CONSTRAINT fk_issue_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  CONSTRAINT fk_issue_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ================= CHANGE LOG =================
-- For machines with an OLD database. Simplest path for dev machines (no real data):
--   DROP DATABASE BusBuddy_app;  then import schema.sql, then seed.sql.
-- Fresh machines: ignore this section (the tables above are already up to date).
-- Format: -- YYYY-MM-DD — name — what & why
--
-- 2026-09-15..18 — Sprint 2 — fixes to the first schema:
--   ALTER TABLE users CHANGE password password_hash VARCHAR(255) NOT NULL;
--   ALTER TABLE users ENGINE=InnoDB;  ALTER TABLE drivers ENGINE=InnoDB;   -- MyISAM blocked the trips FK (#1824)
--   trips table created (Jad, T8)
--
-- 2026-09-21 — Sinar — roles + relationships + trip location:
--   ALTER TABLE users MODIFY COLUMN role ENUM('admin','driver','student','parent') NOT NULL DEFAULT 'driver';
--   ALTER TABLE trips ADD COLUMN latitude DECIMAL(9,6) NULL, ADD COLUMN longitude DECIMAL(9,6) NULL, ADD COLUMN location_updated_at DATETIME(3) NULL;
--   parent_student and trip_students tables created
--
-- 2026-09-25 / 09-29 — Wassim — seed.sql created, then extended with 1 active trip (NO schema change)
-- 2026-10-04 — signup admin-block — NO schema change (app code rule)
--
-- 2026-10-20 — Sino — v4: booking + QR boarding (first version, per driver):
--   drivers: + phone, route, stops, price · trip_students: + boarded_at, exited_at · bookings table (student_id, driver_id)
--
-- 2026-10-20 — Sino — v5: UI redesign (per-trip booking, phone login, secure child linking):
--   ALTER TABLE users ADD COLUMN phone VARCHAR(30) NULL UNIQUE AFTER email, ADD COLUMN university VARCHAR(150) NULL AFTER phone;
--   UPDATE users u JOIN drivers d ON d.user_id = u.id SET u.phone = d.phone WHERE d.phone IS NOT NULL AND u.phone IS NULL;
--   ALTER TABLE drivers DROP COLUMN phone, ADD COLUMN vehicle_plate VARCHAR(30) NULL, ADD COLUMN seats INT NULL;
--   CREATE TABLE scheduled_trips (...);   -- definition above
--   ALTER TABLE trips ADD COLUMN scheduled_trip_id INT NULL AFTER driver_id,
--     ADD UNIQUE KEY uq_trip_plan (scheduled_trip_id),
--     ADD CONSTRAINT fk_trips_plan FOREIGN KEY (scheduled_trip_id) REFERENCES scheduled_trips(id) ON DELETE SET NULL;
--   DROP TABLE bookings;  CREATE TABLE bookings (...);   -- now per scheduled trip; definition above
--   CREATE TABLE link_codes (...);  CREATE TABLE link_attempts (...);   -- definitions above
--   CREATE TABLE notifications (...);  CREATE TABLE vehicle_issues (...);   -- definitions above
-- ==============================================
