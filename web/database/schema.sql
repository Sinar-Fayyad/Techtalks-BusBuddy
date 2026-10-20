-- BusBuddy — database/schema.sql (v4, 20/10)
-- Fresh machine: run this whole file, then seed.sql.
-- RULE: if you change the database, update the tables below AND append the exact
-- query to the CHANGE LOG at the bottom (date + name + why) in the SAME PR.

CREATE DATABASE IF NOT EXISTS BusBuddy_app;
USE BusBuddy_app;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','driver','student','parent') NOT NULL DEFAULT 'driver',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  license_url VARCHAR(255) NOT NULL,
  status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  phone VARCHAR(30) NULL,
  route VARCHAR(255) NULL,
  stops TEXT NULL,
  price DECIMAL(8,2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  start_time DATETIME(3) NOT NULL,
  end_time DATETIME(3) NULL,
  latitude DECIMAL(9,6) NULL,
  longitude DECIMAL(9,6) NULL,
  location_updated_at DATETIME(3) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_driver_start (driver_id, start_time),
  CONSTRAINT fk_trips_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT
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

-- Who is / was on board a trip. boarded_at set by POST /trips/board (entry 25),
-- exited_at by POST /trips/exit (entry 26). Times are UTC.
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

-- A student booked a driver (one booking per student+driver pair).
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  driver_id INT NOT NULL,
  pickup VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_booking (student_id, driver_id),
  CONSTRAINT fk_bookings_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookings_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ================= CHANGE LOG =================
-- For machines with an OLD database: run the queries of every entry newer than your DB.
-- Fresh machines: ignore this section (the tables above are already up to date).
-- Format: -- YYYY-MM-DD — name — what & why (exact queries)
--
-- 2026-09-15..18 — Sprint 2 — fixes to the first schema:
--   ALTER TABLE users CHANGE password password_hash VARCHAR(255) NOT NULL;  -- code uses password_hash
--   ALTER TABLE users ENGINE=InnoDB;    -- MyISAM blocked the trips FK (#1824)
--   ALTER TABLE drivers ENGINE=InnoDB;
--   trips table created (Jad, T8)
--
-- 2026-09-21 — Sinar — roles + relationships + trip location:
--   ALTER TABLE users MODIFY COLUMN role ENUM('admin','driver','student','parent') NOT NULL DEFAULT 'driver';
--   ALTER TABLE trips ADD COLUMN latitude DECIMAL(9,6) NULL, ADD COLUMN longitude DECIMAL(9,6) NULL, ADD COLUMN location_updated_at DATETIME(3) NULL;
--   parent_student and trip_students tables created (definitions above)
--
-- 2026-09-25 / 09-29 — Wassim — seed.sql created, then extended with 1 active trip (NO schema change)
--
-- 2026-10-04 — signup admin-block — NO schema change (rule enforced in app code:
--   POST /auth/signup rejects role="admin" with 403; admins exist only via seed.sql)
--
-- 2026-10-20 — Sino — bookings + driver profile fields + boarding/exit stamps:
--   ALTER TABLE drivers
--     ADD COLUMN phone VARCHAR(30) NULL,
--     ADD COLUMN route VARCHAR(255) NULL,
--     ADD COLUMN stops TEXT NULL,
--     ADD COLUMN price DECIMAL(8,2) NULL;
--   ALTER TABLE trip_students
--     ADD COLUMN boarded_at DATETIME(3) NULL,
--     ADD COLUMN exited_at DATETIME(3) NULL;
--   UPDATE trip_students SET boarded_at = UTC_TIMESTAMP(3) WHERE boarded_at IS NULL;
--   bookings table created (definition above; run that CREATE TABLE as is)
-- ==============================================