-- ============================================================
-- CommuterConnect — Auth Setup SQL
-- Step 2, Part 2: Authentication
-- ============================================================
-- HOW TO USE:
--   Run this in Supabase SQL Editor AFTER schema.sql and seed.sql
--   This sets up auth triggers and updates RLS policies
-- ============================================================


-- ── LINK SUPABASE AUTH TO OUR USERS TABLE ────────────────────
-- When a new user signs up in Supabase Auth,
-- this trigger automatically creates a matching row in our users table

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- ── SECURITY DEFINER HELPER FUNCTION ─────────────────────────
-- This function fetches the current user's role WITHOUT triggering
-- RLS policies — this is the key fix for infinite recursion.
-- Policies on the users table were causing a loop because they
-- queried the users table themselves, re-triggering the same policy.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ── DROP ALL EXISTING ADMIN POLICIES ─────────────────────────

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND (policyname LIKE 'admin_%' OR policyname IN (
        'users_read_own',
        'driver_read_own',
        'customer_read_own_bookings',
        'auth_read_fares',
        'auth_read_routes'
      ))
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;


-- ── RLS POLICIES ─────────────────────────────────────────────
-- All admin policies now use get_my_role() instead of querying
-- the users table directly — this prevents infinite recursion.

-- Users table: admins can do everything, users can read their own row
CREATE POLICY "admin_all_users"
  ON users FOR ALL
  USING (public.get_my_role() = 'admin');

CREATE POLICY "users_read_own"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Drivers
CREATE POLICY "admin_all_drivers"
  ON drivers FOR ALL
  USING (public.get_my_role() = 'admin');

CREATE POLICY "driver_read_own"
  ON drivers FOR SELECT
  USING (user_id = auth.uid());

-- Bookings
CREATE POLICY "admin_all_bookings"
  ON bookings FOR ALL
  USING (public.get_my_role() = 'admin');

CREATE POLICY "customer_read_own_bookings"
  ON bookings FOR SELECT
  USING (customer_id = auth.uid());

-- Reports
CREATE POLICY "admin_all_reports"
  ON reports FOR ALL
  USING (public.get_my_role() = 'admin');

-- Ratings
CREATE POLICY "admin_all_ratings"
  ON ratings FOR ALL
  USING (public.get_my_role() = 'admin');

-- Routes
CREATE POLICY "admin_all_routes"
  ON routes FOR ALL
  USING (public.get_my_role() = 'admin');

CREATE POLICY "auth_read_routes"
  ON routes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Fare Matrix
CREATE POLICY "admin_all_fare_matrix"
  ON fare_matrix FOR ALL
  USING (public.get_my_role() = 'admin');

CREATE POLICY "auth_read_fares"
  ON fare_matrix FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Activity Log
CREATE POLICY "admin_all_activity_log"
  ON activity_log FOR ALL
  USING (public.get_my_role() = 'admin');


-- ── CREATE ADMIN USER ─────────────────────────────────────────
-- IMPORTANT: Before running this block, go to:
--   Supabase Dashboard → Authentication → Users
-- And manually create a user with:
--   Email:    ecorojas0@gmail.com
--   Password: (your chosen password)
--
-- Then run this block to link them as admin:

DO $$
DECLARE
  admin_auth_id UUID;
BEGIN
  SELECT id INTO admin_auth_id
  FROM auth.users
  WHERE email = 'ecorojas0@gmail.com'
  LIMIT 1;

  IF admin_auth_id IS NOT NULL THEN
    INSERT INTO public.users (id, email, name, role, status, address)
    VALUES (
      admin_auth_id,
      'ecorojas0@gmail.com',
      'Admin User',
      'admin',
      'active',
      'City Hall, Calbayog City'
    )
    ON CONFLICT (id) DO UPDATE
      SET role = 'admin', name = 'Admin User';
    RAISE NOTICE 'Admin user linked successfully: %', admin_auth_id;
  ELSE
    RAISE NOTICE 'Admin auth user not found. Create them in Auth → Users first, then re-run this block.';
  END IF;
END $$;