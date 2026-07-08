-- ============================================================
-- CommuterConnect — Database Schema Part 2
-- Calbayog City, Samar · LTFRB Region VIII
-- ============================================================
-- HOW TO USE:
--   Run this in Supabase SQL Editor AFTER schema.sql, seed.sql,
--   and auth-setup.sql have already been applied.
-- ============================================================

-- ── VEHICLES ─────────────────────────────────────────────────
-- Objective 2: verify vehicle information for reliability/safety
-- Extends drivers table with detailed vehicle records
CREATE TABLE IF NOT EXISTS vehicles (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_id      UUID REFERENCES drivers(id) ON DELETE CASCADE,
  plate_number   TEXT NOT NULL UNIQUE,
  vehicle_type   TEXT NOT NULL
                   CHECK (vehicle_type IN ('Tricycle', 'Pedicab', 'Timbol', 'Multicab')),
  color          TEXT,
  model          TEXT,
  year           INTEGER,
  or_number      TEXT,             -- Official Receipt number
  cr_number      TEXT,             -- Certificate of Registration
  ltfrb_franchise TEXT,            -- LTFRB franchise number
  is_verified    BOOLEAN DEFAULT FALSE,
  verified_at    TIMESTAMPTZ,
  verified_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── PAYMENTS ─────────────────────────────────────────────────
-- Objective 1: fare inquiries + booking management
-- Tracks each payment linked to a booking
CREATE TABLE IF NOT EXISTS payments (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id     UUID REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  driver_id      UUID REFERENCES drivers(id) ON DELETE SET NULL,
  amount         NUMERIC(10,2) NOT NULL,
  method         TEXT NOT NULL DEFAULT 'cash'
                   CHECK (method IN ('cash', 'gcash', 'maya', 'bank')),
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  reference_no   TEXT,             -- GCash/Maya transaction reference
  notes          TEXT,
  paid_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── NOTIFICATIONS ────────────────────────────────────────────
-- Real-time alerts for commuters, drivers, and admins
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'system'
                CHECK (type IN ('booking', 'payment', 'alert', 'system', 'report')),
  is_read     BOOLEAN DEFAULT FALSE,
  link        TEXT,               -- optional deep-link (e.g. /bookings/id)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── DRIVER LOCATIONS ─────────────────────────────────────────
-- Objective 3: real-time monitoring via Leaflet.js + Supabase Realtime
CREATE TABLE IF NOT EXISTS driver_locations (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_id   UUID REFERENCES drivers(id) ON DELETE CASCADE UNIQUE,
  lat         NUMERIC(10,7) NOT NULL,
  lng         NUMERIC(10,7) NOT NULL,
  heading     NUMERIC(5,2) DEFAULT 0,   -- degrees 0-360
  speed_kph   NUMERIC(5,2) DEFAULT 0,
  is_online   BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── SCHEDULES ────────────────────────────────────────────────
-- Chapter 1 Scope: Trip Planning — drivers set available time slots
CREATE TABLE IF NOT EXISTS schedules (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_id   UUID REFERENCES drivers(id) ON DELETE CASCADE,
  route_id    UUID REFERENCES routes(id) ON DELETE SET NULL,
  day_of_week TEXT NOT NULL
                CHECK (day_of_week IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── CANCELLATIONS ────────────────────────────────────────────
-- Chapter 1 Scope: advanced booking modification — cancellation tracking
CREATE TABLE IF NOT EXISTS cancellations (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id   UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reason       TEXT NOT NULL,
  cancelled_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ANNOUNCEMENTS ────────────────────────────────────────────
-- Admin broadcast messages to all users (system-wide notices)
CREATE TABLE IF NOT EXISTS announcements (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info'
                CHECK (type IN ('info', 'warning', 'maintenance')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================
CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-set paid_at when payment status becomes 'completed'
CREATE OR REPLACE FUNCTION set_paid_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.paid_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_paid_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_paid_at();

-- Auto-update bookings.payment_status when payment changes
CREATE OR REPLACE FUNCTION sync_booking_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bookings
  SET payment_status = CASE
    WHEN NEW.status = 'completed' THEN 'paid'
    WHEN NEW.status = 'refunded'  THEN 'refunded'
    ELSE 'pending'
  END
  WHERE id = NEW.booking_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_payment_update
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION sync_booking_payment_status();

-- Auto-log key events to activity_log
CREATE OR REPLACE FUNCTION log_booking_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_log (icon, text, user_id)
    VALUES ('🛺', 'New booking created — ' || NEW.pickup || ' → ' || NEW.dropoff, NEW.customer_id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status != OLD.status THEN
    INSERT INTO activity_log (icon, text, user_id)
    VALUES (
      CASE NEW.status
        WHEN 'completed'  THEN '✅'
        WHEN 'cancelled'  THEN '❌'
        WHEN 'ongoing'    THEN '🚗'
        ELSE '📋'
      END,
      'Booking ' || NEW.status || ' — ' || NEW.pickup || ' → ' || NEW.dropoff,
      NEW.customer_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_activity_log
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION log_booking_activity();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE vehicles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements     ENABLE ROW LEVEL SECURITY;

-- Vehicles
CREATE POLICY "admin_all_vehicles"
  ON vehicles FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "driver_read_own_vehicle"
  ON vehicles FOR SELECT
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- Payments
CREATE POLICY "admin_all_payments"
  ON payments FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "customer_read_own_payments"
  ON payments FOR SELECT USING (customer_id = auth.uid());

-- Notifications
CREATE POLICY "admin_all_notifications"
  ON notifications FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "user_own_notifications"
  ON notifications FOR ALL USING (user_id = auth.uid());

-- Driver locations
CREATE POLICY "admin_all_locations"
  ON driver_locations FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "auth_read_locations"
  ON driver_locations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "driver_update_own_location"
  ON driver_locations FOR UPDATE
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- Schedules
CREATE POLICY "admin_all_schedules"
  ON schedules FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "auth_read_schedules"
  ON schedules FOR SELECT USING (auth.uid() IS NOT NULL);

-- Cancellations
CREATE POLICY "admin_all_cancellations"
  ON cancellations FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "user_read_own_cancellations"
  ON cancellations FOR SELECT USING (cancelled_by = auth.uid());

-- Announcements
CREATE POLICY "admin_all_announcements"
  ON announcements FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "auth_read_announcements"
  ON announcements FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_vehicles_driver      ON vehicles         (driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_verified    ON vehicles         (is_verified);
CREATE INDEX IF NOT EXISTS idx_payments_booking     ON payments         (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer    ON payments         (customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status      ON payments         (status);
CREATE INDEX IF NOT EXISTS idx_notifs_user          ON notifications    (user_id);
CREATE INDEX IF NOT EXISTS idx_notifs_read          ON notifications    (is_read);
CREATE INDEX IF NOT EXISTS idx_notifs_created       ON notifications    (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_locations_driver     ON driver_locations (driver_id);
CREATE INDEX IF NOT EXISTS idx_schedules_driver     ON schedules        (driver_id);
CREATE INDEX IF NOT EXISTS idx_cancellations_bk     ON cancellations    (booking_id);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements    (is_active);