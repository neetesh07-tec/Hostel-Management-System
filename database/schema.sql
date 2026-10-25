-- ============================================================================
-- Hostel Management System - Database Schema
-- ============================================================================
--
-- ⚠️  STEP 0: CREATE THE DATABASE FIRST (in pgAdmin or psql)
--   Database name:  hostel_manegment
--   pgAdmin:  Right-click "Databases" → Create → Database → name: hostel_manegment
--   psql:     CREATE DATABASE hostel_manegment;
--
-- STEP 1: Select the "hostel_manegment" database.
-- STEP 2: Paste this file into Query Tool and run (F5).
--         SAFE to re-run — uses IF NOT EXISTS, won't drop your data.
-- STEP 3: Run seed.sql to populate demo data.
--
-- ============================================================================

BEGIN;

-- Tables are created with IF NOT EXISTS so this script is idempotent.

-- ---------------------------------------------------------------------------
-- 1. USERS  (authentication + authorization)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'student')),
    status        VARCHAR(20)  NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive')),
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- 2. STUDENTS  (profile data, linked to a user account)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    full_name      VARCHAR(255) NOT NULL,
    student_code   VARCHAR(50)  NOT NULL UNIQUE,
    email          VARCHAR(255) NOT NULL UNIQUE,
    phone          VARCHAR(30),
    gender         VARCHAR(10)  CHECK (gender IN ('male', 'female', 'other')),
    account_status VARCHAR(20)  NOT NULL DEFAULT 'active'
                   CHECK (account_status IN ('active', 'inactive')),
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- 3. BUILDINGS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS buildings (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL UNIQUE,
    status     VARCHAR(30)  NOT NULL DEFAULT 'operational'
               CHECK (status IN ('operational', 'under_construction', 'unavailable')),
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- 4. FLOORS  (belong to a building)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS floors (
    id           SERIAL PRIMARY KEY,
    building_id  INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL CHECK (floor_number > 0),
    name         VARCHAR(100),
    status       VARCHAR(30) NOT NULL DEFAULT 'operational'
                 CHECK (status IN ('operational', 'under_construction', 'unavailable')),
    created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (building_id, floor_number)
);

-- ---------------------------------------------------------------------------
-- 5. SECTIONS  (belong to a floor, e.g. "A" and "B")
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sections (
    id         SERIAL PRIMARY KEY,
    floor_id   INTEGER NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    name       VARCHAR(10) NOT NULL,
    status     VARCHAR(30) NOT NULL DEFAULT 'operational'
               CHECK (status IN ('operational', 'under_construction', 'unavailable')),
    created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (floor_id, name)
);

-- ---------------------------------------------------------------------------
-- 6. ROOMS  (belong to a section, own configurable capacity)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rooms (
    id           SERIAL PRIMARY KEY,
    section_id   INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    room_number  VARCHAR(20) NOT NULL,
    capacity     INTEGER NOT NULL CHECK (capacity > 0),
    status       VARCHAR(30) NOT NULL DEFAULT 'operational'
                 CHECK (status IN ('operational', 'under_construction', 'unavailable')),
    created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (section_id, room_number)
);

-- ---------------------------------------------------------------------------
-- 7. BOOKINGS  (room allocation lifecycle)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id                  SERIAL PRIMARY KEY,
    student_id          INTEGER NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    room_id             INTEGER NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','cancelled','checked_in','completed')),
    check_in_date       DATE NOT NULL,
    expected_check_out  DATE NOT NULL,
    actual_check_in     DATE,
    actual_check_out    DATE,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (expected_check_out >= check_in_date),
    CHECK (actual_check_out IS NULL OR actual_check_out >= actual_check_in)
);

-- ---------------------------------------------------------------------------
-- 8. FEES  (amount due for a student / period)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fees (
    id          SERIAL PRIMARY KEY,
    student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    description VARCHAR(255) NOT NULL,
    amount_due  NUMERIC(10,2) NOT NULL CHECK (amount_due >= 0),
    due_date    DATE NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- 9. PAYMENTS  (recorded payments against a fee)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id             SERIAL PRIMARY KEY,
    fee_id         INTEGER NOT NULL REFERENCES fees(id) ON DELETE RESTRICT,
    student_id     INTEGER NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    amount         NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Indexes for common lookups
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_students_user_id     ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_floors_building_id   ON floors(building_id);
CREATE INDEX IF NOT EXISTS idx_sections_floor_id    ON sections(floor_id);
CREATE INDEX IF NOT EXISTS idx_rooms_section_id     ON rooms(section_id);
CREATE INDEX IF NOT EXISTS idx_bookings_student_id  ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id     ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status      ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_fees_student_id      ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_fee_id      ON payments(fee_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id  ON payments(student_id);

-- ---------------------------------------------------------------------------
-- View: room_occupancy
-- Computes currently occupied / available beds per room from active bookings.
-- "Occupied" = confirmed or checked-in bookings where today falls inside the
-- stay window and the student has not actually checked out.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW room_occupancy AS
SELECT
    r.id                                  AS room_id,
    r.room_number,
    r.capacity,
    COALESCE(occupied.count, 0)           AS occupied_beds,
    r.capacity - COALESCE(occupied.count, 0) AS available_beds
FROM rooms r
LEFT JOIN (
    SELECT room_id, COUNT(*) AS count
    FROM bookings
    WHERE status IN ('confirmed', 'checked_in')
      AND check_in_date <= CURRENT_DATE
      AND (expected_check_out >= CURRENT_DATE)
      AND (actual_check_out IS NULL OR actual_check_out > CURRENT_DATE)
    GROUP BY room_id
) occupied ON occupied.room_id = r.id;

COMMIT;

-- ============================================================================
-- Schema created. Now run seed.sql to load demo data.
-- ============================================================================
