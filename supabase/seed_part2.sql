-- ============================================================
-- CommuterConnect — Seed Data Part 2
-- Calbayog City, Samar · LTFRB Region VIII
-- ============================================================
-- HOW TO USE:
--   Run this AFTER schema_part2.sql in the Supabase SQL Editor
-- ============================================================

-- ── VEHICLES ─────────────────────────────────────────────────
INSERT INTO vehicles (driver_id, plate_number, vehicle_type, color, model, year, or_number, cr_number, ltfrb_franchise, is_verified, verified_at, status) VALUES
  ('10000000-0000-0000-0000-000000000001', 'SAM 1234', 'Tricycle', 'Green',  'Honda XRM 125', 2019, 'OR-2019-001234', 'CR-2019-001234', 'LTFRB-VIII-FR-001', TRUE,  NOW() - INTERVAL '30 days', 'active'),
  ('10000000-0000-0000-0000-000000000002', 'SAM 5678', 'Tricycle', 'Blue',   'Yamaha Sniper',  2020, 'OR-2020-005678', 'CR-2020-005678', 'LTFRB-VIII-FR-002', TRUE,  NOW() - INTERVAL '25 days', 'active'),
  ('10000000-0000-0000-0000-000000000003', 'SAM 9012', 'Pedicab',  'Yellow', 'Custom Pedicab', 2018, 'OR-2018-009012', 'CR-2018-009012', 'LTFRB-VIII-FR-003', TRUE,  NOW() - INTERVAL '20 days', 'active'),
  ('10000000-0000-0000-0000-000000000004', 'SAM 3456', 'Tricycle', 'Purple', 'Honda TMX 125',  2017, 'OR-2017-003456', 'CR-2017-003456', 'LTFRB-VIII-FR-004', FALSE, NULL,                       'inactive'),
  ('10000000-0000-0000-0000-000000000005', 'SAM 7890', 'Timbol',   'Red',    'Isuzu Elf',      2021, 'OR-2021-007890', 'CR-2021-007890', 'LTFRB-VIII-FR-005', TRUE,  NOW() - INTERVAL '15 days', 'active'),
  ('10000000-0000-0000-0000-000000000006', 'SAM 1122', 'Pedicab',  'Teal',   'Custom Pedicab', 2019, 'OR-2019-001122', 'CR-2019-001122', 'LTFRB-VIII-FR-006', TRUE,  NOW() - INTERVAL '10 days', 'active'),
  ('10000000-0000-0000-0000-000000000007', 'SAM 3344', 'Tricycle', 'Green',  'Yamaha Mio',     2020, 'OR-2020-003344', 'CR-2020-003344', 'LTFRB-VIII-FR-007', TRUE,  NOW() - INTERVAL '5 days',  'active'),
  ('10000000-0000-0000-0000-000000000008', 'SAM 5566', 'Multicab', 'Pink',   'Suzuki Multicab',2018, 'OR-2018-005566', 'CR-2018-005566', 'LTFRB-VIII-FR-008', FALSE, NULL,                       'inactive');

-- ── PAYMENTS ─────────────────────────────────────────────────
INSERT INTO payments (booking_id, customer_id, amount, method, status, reference_no, paid_at)
SELECT
  b.id,
  b.customer_id,
  b.fare,
  CASE b.payment_status
    WHEN 'paid'     THEN 'cash'
    WHEN 'refunded' THEN 'gcash'
    ELSE 'cash'
  END,
  CASE b.payment_status
    WHEN 'paid'     THEN 'completed'
    WHEN 'refunded' THEN 'refunded'
    ELSE 'pending'
  END,
  CASE b.payment_status
    WHEN 'paid'     THEN NULL
    WHEN 'refunded' THEN 'GC-2024-REF-001'
    ELSE NULL
  END,
  CASE b.payment_status
    WHEN 'paid' THEN NOW() - INTERVAL '2 days'
    ELSE NULL
  END
FROM bookings b;

-- ── NOTIFICATIONS ─────────────────────────────────────────────
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
  ('00000000-0000-0000-0000-000000000010', 'Booking Confirmed',     'Your booking from Calbayog City Hall to Calbayog Port has been confirmed.',    'booking', TRUE),
  ('00000000-0000-0000-0000-000000000010', 'Ride Completed',        'Your ride with Ramon Dela Cruz is complete. Please rate your experience.',      'booking', FALSE),
  ('00000000-0000-0000-0000-000000000011', 'Booking Confirmed',     'Your booking from Public Market to District Hospital has been confirmed.',      'booking', TRUE),
  ('00000000-0000-0000-0000-000000000012', 'Driver On The Way',     'Eduardo Reyes is on the way to pick you up at Nijaga Park.',                   'booking', FALSE),
  ('00000000-0000-0000-0000-000000000013', 'Account Suspended',     'Your account has been suspended due to a reported violation. Contact admin.',  'alert',   FALSE),
  ('00000000-0000-0000-0000-000000000014', 'Booking Cancelled',     'Your booking from Brgy. Lonoy to Calbayog Port was cancelled. Refund issued.', 'payment', FALSE),
  ('00000000-0000-0000-0000-000000000001', 'New Report Filed',      'A high-severity complaint has been filed against Eduardo Reyes.',               'report',  FALSE),
  ('00000000-0000-0000-0000-000000000001', 'New Driver Registered', 'Gloria Catalan has submitted vehicle documents for verification.',              'system',  TRUE);

-- ── DRIVER LOCATIONS ─────────────────────────────────────────
INSERT INTO driver_locations (driver_id, lat, lng, heading, speed_kph, is_online) VALUES
  ('10000000-0000-0000-0000-000000000001', 11.9955, 124.6023, 90,  25.5, TRUE),
  ('10000000-0000-0000-0000-000000000002', 11.9940, 124.6010, 180, 15.0, TRUE),
  ('10000000-0000-0000-0000-000000000003', 11.9970, 124.6045,   0,  0.0, FALSE),
  ('10000000-0000-0000-0000-000000000005', 11.9980, 124.5990, 270, 30.0, TRUE),
  ('10000000-0000-0000-0000-000000000007', 11.9935, 124.6060,  45, 20.0, TRUE);

-- ── SCHEDULES ─────────────────────────────────────────────────
INSERT INTO schedules (driver_id, route_id, day_of_week, start_time, end_time, is_active)
SELECT
  d.id,
  r.id,
  dow.day,
  '06:00'::TIME,
  '18:00'::TIME,
  TRUE
FROM drivers d
CROSS JOIN (VALUES ('Mon'),('Tue'),('Wed'),('Thu'),('Fri'),('Sat')) AS dow(day)
JOIN routes r ON r.name = 'City Hall Loop'
WHERE d.status = 'active'
LIMIT 12;

-- ── CANCELLATIONS ─────────────────────────────────────────────
INSERT INTO cancellations (booking_id, cancelled_by, reason)
SELECT
  b.id,
  b.customer_id,
  'Customer requested cancellation — unable to wait for driver.'
FROM bookings b
WHERE b.status = 'cancelled'
LIMIT 1;

-- ── ANNOUNCEMENTS ─────────────────────────────────────────────
INSERT INTO announcements (title, body, type, is_active, created_by) VALUES
  (
    'System Maintenance Notice',
    'CommuterConnect will undergo scheduled maintenance on Sunday, 2:00–4:00 AM. Some features may be temporarily unavailable.',
    'maintenance',
    TRUE,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'New Route Added: Airport Connection',
    'We have added a new route connecting City Center to Calbayog Airport via Multicab and Timbol. Check it out in the Routes section.',
    'info',
    TRUE,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Fare Update — Peak Hours',
    'Effective immediately, a 10% peak hour surcharge applies for Tricycle and Timbol rides between 7–9 AM and 5–7 PM.',
    'warning',
    TRUE,
    '00000000-0000-0000-0000-000000000001'
  );
