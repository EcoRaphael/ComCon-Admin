-- ============================================================
-- CommuterConnect — Supabase Database Schema
-- Calbayog City, Samar · LTFRB Region VIII
-- Step 2, Part 1
-- ============================================================
-- HOW TO USE:
--   1. Go to your Supabase project
--   2. Click "SQL Editor" in the left sidebar
--   3. Paste this entire file and click "Run"
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── USERS (commuters, drivers, admins) ───────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'customer'
                CHECK (role IN ('admin', 'driver', 'customer')),
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'suspended', 'inactive')),
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── DRIVERS ──────────────────────────────────────────────────
-- Objective 2: verify vehicle and driver information
CREATE TABLE IF NOT EXISTS drivers (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  plate        TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL DEFAULT 'Tricycle'
                 CHECK (vehicle_type IN ('Tricycle', 'Pedicab', 'Timbol', 'Multicab')),
  route        TEXT,
  rating       NUMERIC(3,1) DEFAULT 0.0,
  trips        INTEGER DEFAULT 0,
  earnings     NUMERIC(10,2) DEFAULT 0.00,
  status       TEXT NOT NULL DEFAULT 'inactive'
                 CHECK (status IN ('active', 'inactive')),
  verified     BOOLEAN DEFAULT FALSE,
  license_no   TEXT,
  color        TEXT DEFAULT '#00b86b',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── BOOKINGS ─────────────────────────────────────────────────
-- Objective 1: manage bookings, ride details, fare inquiries
CREATE TABLE IF NOT EXISTS bookings (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  driver_id       UUID REFERENCES drivers(id) ON DELETE SET NULL,
  pickup          TEXT NOT NULL,
  dropoff         TEXT NOT NULL,
  vehicle_type    TEXT CHECK (vehicle_type IN ('Tricycle', 'Pedicab', 'Timbol', 'Multicab')),
  fare            NUMERIC(8,2) DEFAULT 0.00,
  payment_status  TEXT DEFAULT 'pending'
                    CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'ongoing', 'completed', 'cancelled')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── REPORTS ──────────────────────────────────────────────────
-- Objective 4: organize reports, ratings, and complaints
CREATE TABLE IF NOT EXISTS reports (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  driver_id    UUID REFERENCES drivers(id) ON DELETE SET NULL,
  issue_type   TEXT NOT NULL,
  severity     TEXT NOT NULL DEFAULT 'Low'
                 CHECK (severity IN ('Low', 'Medium', 'High')),
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'under review', 'resolved')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── RATINGS ──────────────────────────────────────────────────
-- Objective 4: commuter ride ratings
CREATE TABLE IF NOT EXISTS ratings (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id   UUID REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  driver_id    UUID REFERENCES drivers(id) ON DELETE SET NULL,
  stars        INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROUTES ───────────────────────────────────────────────────
-- Chapter 1 Scope: Route Viewing & Trip Planning
CREATE TABLE IF NOT EXISTS routes (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name          TEXT NOT NULL,
  origin        TEXT NOT NULL,
  destination   TEXT NOT NULL,
  distance_km   NUMERIC(5,2) DEFAULT 0.00,
  vehicle_types TEXT[] DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── FARE MATRIX ───────────────────────────────────────────────
-- Objective 1: fare inquiries — Calbayog City native vehicles
CREATE TABLE IF NOT EXISTS fare_matrix (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_type TEXT NOT NULL UNIQUE
                 CHECK (vehicle_type IN ('Tricycle', 'Pedicab', 'Timbol', 'Multicab')),
  base_fare    NUMERIC(6,2) NOT NULL,
  per_km       NUMERIC(5,2) NOT NULL,
  peak_surcharge NUMERIC(4,1) DEFAULT 0.0,
  icon         TEXT DEFAULT '🛺',
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── ACTIVITY LOG ─────────────────────────────────────────────
-- Objective 3: monitor system activity and record transactions
CREATE TABLE IF NOT EXISTS activity_log (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  icon       TEXT DEFAULT '📋',
  text       TEXT NOT NULL,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER drivers_updated_at  BEFORE UPDATE ON drivers  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER reports_updated_at  BEFORE UPDATE ON reports  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-UPDATE DRIVER RATING AFTER NEW RATING
-- ============================================================
CREATE OR REPLACE FUNCTION update_driver_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE drivers
  SET rating = (
    SELECT ROUND(AVG(stars)::NUMERIC, 1)
    FROM ratings
    WHERE driver_id = NEW.driver_id
  ),
  trips = (
    SELECT COUNT(*)
    FROM bookings
    WHERE driver_id = NEW.driver_id AND status = 'completed'
  )
  WHERE id = NEW.driver_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_rating_insert
  AFTER INSERT ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_driver_rating();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Protects data so only authenticated users can access it
-- ============================================================
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE fare_matrix  ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Admin: full access to everything
CREATE POLICY "admin_all_users"        ON users        FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admin_all_drivers"      ON drivers      FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admin_all_bookings"     ON bookings     FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admin_all_reports"      ON reports      FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admin_all_ratings"      ON ratings      FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admin_all_routes"       ON routes       FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admin_all_fare_matrix"  ON fare_matrix  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "admin_all_activity_log" ON activity_log FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Public read for fare matrix and routes (customers/drivers can see these)
CREATE POLICY "public_read_fares"  ON fare_matrix FOR SELECT USING (true);
CREATE POLICY "public_read_routes" ON routes      FOR SELECT USING (true);

-- ============================================================
-- INDEXES (improves query speed)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bookings_customer  ON bookings (customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver    ON bookings (driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status    ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_created   ON bookings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status     ON reports  (status);
CREATE INDEX IF NOT EXISTS idx_drivers_status     ON drivers  (status);
CREATE INDEX IF NOT EXISTS idx_drivers_verified   ON drivers  (verified);
CREATE INDEX IF NOT EXISTS idx_activity_created   ON activity_log (created_at DESC);
