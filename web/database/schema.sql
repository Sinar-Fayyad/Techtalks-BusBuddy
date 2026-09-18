-- BusBuddy — database/schema.sql (v2, 18/09)
-- RULE: if you change the database, append your query to the CHANGE LOG below
-- (date + name + why) in the SAME PR. Fresh machines run this whole file.

CREATE DATABASE IF NOT EXISTS BusBuddy_app;
USE BusBuddy_app;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','driver') NOT NULL DEFAULT 'driver',
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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_driver_start (driver_id, start_time),
  CONSTRAINT fk_trips_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ================= CHANGE LOG =================
-- Format: -- YYYY-MM-DD — name — what & why (paste the exact query)
--
-- 2026-09-15..18 — Sprint 2 — applied to the schema above:
--   ALTER TABLE users CHANGE password password_hash VARCHAR(255) NOT NULL;  -- code uses password_hash
--   ALTER TABLE users ENGINE=InnoDB;   -- MyISAM blocked the trips FK (#1824)
--   ALTER TABLE drivers ENGINE=InnoDB;
--   CREATE TABLE trips (...);          -- defined above (Jad, T8)
-- ==============================================
