-- ============================================================
-- CommuterConnect — RLS Policy Patch
-- Run this in Supabase SQL Editor AFTER schema.sql, auth-setup.sql,
-- and schema_part2.sql have already been applied.
-- ============================================================
-- WHY THIS FILE EXISTS:
--   The existing policies only let admins write to most tables.
--   Commuters and drivers had SELECT-only (or no) access to their
--   own rows, which silently blocks booking, rating, signup, and
--   location-tracking features when using the anon key from the
--   commuter/driver apps.
-- ============================================================


-- ── USERS: allow a user to update their own profile ──────────
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ── DRIVERS: allow signup (insert own row) + self-update ─────
CREATE POLICY "driver_insert_own"
  ON drivers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "driver_update_own"
  ON drivers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ── BOOKINGS: allow customers to create and manage their own ─
CREATE POLICY "customer_insert_own_bookings"
  ON bookings FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "customer_update_own_bookings"
  ON bookings FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- Drivers need to update bookings assigned to them (accept / start / complete trip)
CREATE POLICY "driver_update_assigned_bookings"
  ON bookings FOR UPDATE
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()))
  WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- Drivers need to see bookings assigned to them
CREATE POLICY "driver_read_assigned_bookings"
  ON bookings FOR SELECT
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));


-- ── RATINGS: allow customers to submit a rating for their trip ─
-- (This is the likely root cause of ratings not appearing —
--  the insert was being silently blocked by RLS.)
CREATE POLICY "customer_insert_own_ratings"
  ON ratings FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "customer_read_own_ratings"
  ON ratings FOR SELECT
  USING (customer_id = auth.uid());

-- Drivers should be able to see ratings left for them
CREATE POLICY "driver_read_own_ratings"
  ON ratings FOR SELECT
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));


-- ── REPORTS: allow customers/drivers to file a complaint ─────
CREATE POLICY "user_insert_own_reports"
  ON reports FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "user_read_own_reports"
  ON reports FOR SELECT
  USING (customer_id = auth.uid());


-- ── VEHICLES: allow drivers to register their own vehicle ────
CREATE POLICY "driver_insert_own_vehicle"
  ON vehicles FOR INSERT
  WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

CREATE POLICY "driver_update_own_vehicle"
  ON vehicles FOR UPDATE
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()))
  WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));


-- ── DRIVER LOCATIONS: allow first-ever insert, not just update ─
CREATE POLICY "driver_insert_own_location"
  ON driver_locations FOR INSERT
  WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));


-- ── CANCELLATIONS: allow a user to record their own cancellation ─
CREATE POLICY "user_insert_own_cancellation"
  ON cancellations FOR INSERT
  WITH CHECK (cancelled_by = auth.uid());


-- ── PAYMENTS: allow customer to insert their own payment record ─
-- (Needed if the commuter app itself logs a payment attempt,
--  e.g. selecting "GCash" and entering a reference number.
--  Remove this if only the driver/admin should ever create payment rows.)
CREATE POLICY "customer_insert_own_payment"
  ON payments FOR INSERT
  WITH CHECK (customer_id = auth.uid());


-- ============================================================
-- VERIFY: list all policies per table after applying this patch
-- ============================================================
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;
