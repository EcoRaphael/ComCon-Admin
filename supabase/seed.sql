-- ============================================================
-- CommuterConnect — Calbayog City Seed Data
-- Run this in Supabase SQL Editor → New Query → Run
-- ============================================================

-- ── 1. FARE MATRIX ──────────────────────────────────────────
INSERT INTO fare_matrix (vehicle_type, base_fare, per_km, peak_surcharge, updated_at) VALUES
  ('Tricycle', 10.00, 2.50, 10, NOW()),
  ('Pedicab',   8.00, 2.00,  0, NOW()),
  ('Timbol',   12.00, 3.00, 15, NOW()),
  ('Multicab', 15.00, 3.50, 15, NOW())
ON CONFLICT (vehicle_type) DO UPDATE
  SET base_fare = EXCLUDED.base_fare,
      per_km    = EXCLUDED.per_km,
      peak_surcharge = EXCLUDED.peak_surcharge;

-- ── 2. ROUTES ───────────────────────────────────────────────
INSERT INTO routes (name, origin, destination, distance_km, vehicle_types, status, created_at) VALUES
  ('City Hall Loop',         'Calbayog City Hall',    'Brgy. Rawis',           3.2,  ARRAY['Tricycle','Pedicab'],          'active',   NOW()),
  ('Nijaga Park Route',      'Nijaga Park',           'Public Market',          2.8,  ARRAY['Tricycle','Multicab'],          'active',   NOW()),
  ('Oquendo Circuit',        'Calbayog Airport',      'Brgy. Oquendo',          5.1,  ARRAY['Tricycle','Timbol','Multicab'], 'active',   NOW()),
  ('Hamorawon Expressway',   'City Hall',             'Brgy. Hamorawon',        6.4,  ARRAY['Timbol','Multicab'],            'active',   NOW()),
  ('Lonoy Barangay Route',   'Public Market',         'Brgy. Lonoy',            4.0,  ARRAY['Tricycle','Pedicab'],          'active',   NOW()),
  ('Downtown Loop',          'Calbayog Port',         'Calbayog Cathedral',     1.5,  ARRAY['Tricycle','Pedicab'],          'active',   NOW()),
  ('Airport Connector',      'Calbayog Airport',      'City Hall',              7.2,  ARRAY['Timbol','Multicab'],            'active',   NOW()),
  ('Brgy. Aguit-itan Route', 'Public Market',         'Brgy. Aguit-itan',       3.8,  ARRAY['Tricycle'],                    'inactive', NOW())
ON CONFLICT DO NOTHING;

-- ── 3. USERS (drivers + customers) ──────────────────────────
INSERT INTO users (id, name, email, phone, role, status, address, created_at) VALUES
  ('d1000001-0000-0000-0000-000000000001', 'Ramon Dela Cruz',       'ramon.delacruz@gmail.com',    '+63 912 345 6789', 'driver',   'active',    'Brgy. Rawis, Calbayog City',       NOW() - INTERVAL '90 days'),
  ('d1000001-0000-0000-0000-000000000002', 'Jose Peñaranda',        'jose.penaranda@yahoo.com',    '+63 923 456 7890', 'driver',   'active',    'Brgy. Lonoy, Calbayog City',       NOW() - INTERVAL '85 days'),
  ('d1000001-0000-0000-0000-000000000003', 'Marites Abundo',        'marites.abundo@gmail.com',    '+63 934 567 8901', 'driver',   'inactive',  'Brgy. Oquendo, Calbayog City',     NOW() - INTERVAL '80 days'),
  ('d1000001-0000-0000-0000-000000000004', 'Lourdes Buenaventura',  'lourdes.bvt@gmail.com',       '+63 945 678 9012', 'driver',   'active',    'Brgy. Hamorawon, Calbayog City',   NOW() - INTERVAL '75 days'),
  ('d1000001-0000-0000-0000-000000000005', 'Eduardo Reyes',         'eduardo.reyes@gmail.com',     '+63 956 789 0123', 'driver',   'active',    'Downtown, Calbayog City',          NOW() - INTERVAL '70 days'),
  ('d1000001-0000-0000-0000-000000000006', 'Salvacion Torralba',    'salvacion.torralba@gmail.com','+63 967 890 1234', 'driver',   'active',    'Brgy. Aguit-itan, Calbayog City',  NOW() - INTERVAL '65 days'),
  ('d1000001-0000-0000-0000-000000000007', 'Florencio Mangubat',    'florencio.m@gmail.com',       '+63 978 901 2345', 'driver',   'inactive',  'Brgy. Rawis, Calbayog City',       NOW() - INTERVAL '60 days'),
  ('d1000001-0000-0000-0000-000000000008', 'Gloria Catalan',        'gloria.catalan@yahoo.com',    '+63 989 012 3456', 'driver',   'active',    'Brgy. Lonoy, Calbayog City',       NOW() - INTERVAL '55 days'),
  ('c2000001-0000-0000-0000-000000000001', 'Maria Santos',          'maria.santos@gmail.com',      '+63 912 111 2222', 'customer', 'active',    'Brgy. Rawis, Calbayog City',       NOW() - INTERVAL '88 days'),
  ('c2000001-0000-0000-0000-000000000002', 'Juan dela Vega',        'juan.delavega@gmail.com',     '+63 923 222 3333', 'customer', 'active',    'Downtown, Calbayog City',          NOW() - INTERVAL '75 days'),
  ('c2000001-0000-0000-0000-000000000003', 'Ana Villanueva',        'ana.villanueva@yahoo.com',    '+63 934 333 4444', 'customer', 'active',    'Brgy. Oquendo, Calbayog City',     NOW() - INTERVAL '60 days'),
  ('c2000001-0000-0000-0000-000000000004', 'Roberto Espiritu',      'roberto.e@gmail.com',         '+63 945 444 5555', 'customer', 'active',    'Brgy. Hamorawon, Calbayog City',   NOW() - INTERVAL '50 days'),
  ('c2000001-0000-0000-0000-000000000005', 'Ligaya Fuentes',        'ligaya.fuentes@gmail.com',    '+63 956 555 6666', 'customer', 'active',    'Brgy. Lonoy, Calbayog City',       NOW() - INTERVAL '45 days'),
  ('c2000001-0000-0000-0000-000000000006', 'Ernesto Caballero',     'ernesto.c@yahoo.com',         '+63 967 666 7777', 'customer', 'suspended', 'Brgy. Aguit-itan, Calbayog City',  NOW() - INTERVAL '40 days'),
  ('c2000001-0000-0000-0000-000000000007', 'Rosario Dimaculangan',  'rosario.d@gmail.com',         '+63 978 777 8888', 'customer', 'active',    'Downtown, Calbayog City',          NOW() - INTERVAL '30 days'),
  ('c2000001-0000-0000-0000-000000000008', 'Domingo Pascual',       'domingo.p@gmail.com',         '+63 989 888 9999', 'customer', 'active',    'Brgy. Rawis, Calbayog City',       NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- ── 4. DRIVERS ───────────────────────────────────────────────
INSERT INTO drivers (user_id, name, plate, vehicle_type, route, license_no, status, verified, rating, trips, color, created_at) VALUES
  ('d1000001-0000-0000-0000-000000000001', 'Ramon Dela Cruz',      'SAM-1234', 'Tricycle', 'City Hall Loop',       'LTO-CY-2021-001', 'active',   true,  5.0, 142, '#1565C0', NOW() - INTERVAL '90 days'),
  ('d1000001-0000-0000-0000-000000000002', 'Jose Peñaranda',       'SAM-9012', 'Pedicab',  'Nijaga Park Route',    'LTO-CY-2020-002', 'active',   true,  4.0,  98, '#2E7D32', NOW() - INTERVAL '85 days'),
  ('d1000001-0000-0000-0000-000000000003', 'Marites Abundo',       'SAM-3456', 'Tricycle', 'Lonoy Barangay Route', 'LTO-CY-2022-003', 'inactive', false, 4.6,  34, '#E65100', NOW() - INTERVAL '80 days'),
  ('d1000001-0000-0000-0000-000000000004', 'Lourdes Buenaventura', 'SAM-5678', 'Tricycle', 'Hamorawon Expressway', 'LTO-CY-2021-004', 'active',   true,  4.7,  87, '#6A1B9A', NOW() - INTERVAL '75 days'),
  ('d1000001-0000-0000-0000-000000000005', 'Eduardo Reyes',        'SAM-7890', 'Timbol',   'Oquendo Circuit',      'LTO-CY-2019-005', 'active',   true,  4.9, 213, '#BF360C', NOW() - INTERVAL '70 days'),
  ('d1000001-0000-0000-0000-000000000006', 'Salvacion Torralba',   'SAM-1122', 'Pedicab',  'Downtown Loop',        'LTO-CY-2022-006', 'active',   true,  4.5,  61, '#00695C', NOW() - INTERVAL '65 days'),
  ('d1000001-0000-0000-0000-000000000007', 'Florencio Mangubat',   'SAM-3344', 'Multicab', 'Airport Connector',    'LTO-CY-2020-007', 'inactive', false, 3.8,  29, '#4527A0', NOW() - INTERVAL '60 days'),
  ('d1000001-0000-0000-0000-000000000008', 'Gloria Catalan',       'SAM-5566', 'Multicab', 'Hamorawon Expressway', 'LTO-CY-2023-008', 'active',   false, 5.0,  12, '#AD1457', NOW() - INTERVAL '55 days')
ON CONFLICT DO NOTHING;

-- ── 5. VEHICLES ──────────────────────────────────────────────
INSERT INTO vehicles (driver_id, plate_number, type, brand, color, year, or_number, cr_number, ltfrb_permit, is_verified, status, created_at)
SELECT d.id, d.plate, d.vehicle_type,
  CASE d.vehicle_type
    WHEN 'Tricycle' THEN 'Honda'
    WHEN 'Pedicab'  THEN 'Custom'
    WHEN 'Timbol'   THEN 'Isuzu'
    WHEN 'Multicab' THEN 'Suzuki'
  END,
  d.color, 2019 + (random()*5)::int,
  'OR-' || LPAD((random()*999999)::int::text, 6, '0'),
  'CR-' || LPAD((random()*999999)::int::text, 6, '0'),
  'LTFRB-R8-' || LPAD((random()*9999)::int::text, 4, '0'),
  d.verified, 'active', d.created_at
FROM drivers d
ON CONFLICT DO NOTHING;

-- ── 6. SCHEDULES ─────────────────────────────────────────────
INSERT INTO schedules (driver_id, day_of_week, start_time, end_time, is_active, created_at)
SELECT d.id, day, '06:00', '14:00', true, NOW()
FROM drivers d, UNNEST(ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday']) AS day
WHERE d.status = 'active'
ON CONFLICT DO NOTHING;

-- ── 7. BOOKINGS ───────────────────────────────────────────────
INSERT INTO bookings (customer_id, driver_id, pickup, dropoff, vehicle_type, fare, status, payment_status, created_at)
SELECT
  c.id, d.id,
  origin_dest.pickup, origin_dest.dropoff,
  d.vehicle_type,
  ROUND((10 + random()*40)::numeric, 2),
  status_val,
  CASE WHEN status_val = 'completed' THEN 'paid' ELSE 'pending' END,
  NOW() - (random()*60 || ' days')::interval
FROM
  (VALUES
    ('c2000001-0000-0000-0000-000000000001'::uuid, 'd1000001-0000-0000-0000-000000000001'::uuid),
    ('c2000001-0000-0000-0000-000000000002'::uuid, 'd1000001-0000-0000-0000-000000000002'::uuid),
    ('c2000001-0000-0000-0000-000000000003'::uuid, 'd1000001-0000-0000-0000-000000000005'::uuid),
    ('c2000001-0000-0000-0000-000000000004'::uuid, 'd1000001-0000-0000-0000-000000000004'::uuid),
    ('c2000001-0000-0000-0000-000000000005'::uuid, 'd1000001-0000-0000-0000-000000000006'::uuid),
    ('c2000001-0000-0000-0000-000000000007'::uuid, 'd1000001-0000-0000-0000-000000000001'::uuid),
    ('c2000001-0000-0000-0000-000000000008'::uuid, 'd1000001-0000-0000-0000-000000000005'::uuid),
    ('c2000001-0000-0000-0000-000000000002'::uuid, 'd1000001-0000-0000-0000-000000000004'::uuid),
    ('c2000001-0000-0000-0000-000000000003'::uuid, 'd1000001-0000-0000-0000-000000000002'::uuid),
    ('c2000001-0000-0000-0000-000000000001'::uuid, 'd1000001-0000-0000-0000-000000000006'::uuid),
    ('c2000001-0000-0000-0000-000000000005'::uuid, 'd1000001-0000-0000-0000-000000000001'::uuid),
    ('c2000001-0000-0000-0000-000000000007'::uuid, 'd1000001-0000-0000-0000-000000000002'::uuid),
    ('c2000001-0000-0000-0000-000000000008'::uuid, 'd1000001-0000-0000-0000-000000000004'::uuid),
    ('c2000001-0000-0000-0000-000000000004'::uuid, 'd1000001-0000-0000-0000-000000000005'::uuid),
    ('c2000001-0000-0000-0000-000000000002'::uuid, 'd1000001-0000-0000-0000-000000000006'::uuid)
  ) AS pairs(cid, did)
  JOIN users c ON c.id = pairs.cid
  JOIN drivers d ON d.id = pairs.did,
  (VALUES ('completed'),('completed'),('completed'),('pending'),('cancelled')) AS statuses(status_val),
  (VALUES
    ('City Hall', 'Brgy. Rawis'),
    ('Public Market', 'Nijaga Park'),
    ('Calbayog Port', 'City Hall'),
    ('Brgy. Lonoy', 'Public Market'),
    ('Calbayog Airport', 'Downtown')
  ) AS origin_dest(pickup, dropoff)
LIMIT 40
ON CONFLICT DO NOTHING;

-- ── 8. PAYMENTS ──────────────────────────────────────────────
INSERT INTO payments (booking_id, driver_id, amount, method, status, paid_at, created_at)
SELECT
  b.id, b.driver_id, b.fare,
  (ARRAY['cash','gcash','maya'])[1 + (random()*2)::int],
  CASE WHEN b.payment_status = 'paid' THEN 'paid' ELSE 'pending' END,
  CASE WHEN b.payment_status = 'paid' THEN b.created_at + INTERVAL '10 minutes' ELSE NULL END,
  b.created_at
FROM bookings b
WHERE b.status = 'completed'
ON CONFLICT DO NOTHING;

-- ── 9. RATINGS ────────────────────────────────────────────────
INSERT INTO ratings (booking_id, customer_id, driver_id, rating, comment, created_at)
SELECT
  b.id, b.customer_id, b.driver_id,
  ROUND(3.5 + random()*1.5)::int,
  (ARRAY[
    'Magaling mag-drive, maayos ang serbisyo!',
    'Mabait ang driver, maayos ang biyahe.',
    'Malinaw ang ruta, komportable ang sakay.',
    'Okay ang driver, on time.',
    'Maganda ang serbisyo, babalik ulit!',
    'Malinis ang sasakyan, magalang ang driver.',
    'Mabilis sumagot, maayos ang byahe.',
    'Nai-drop off sa tamang lugar, salamat!'
  ])[1 + (random()*7)::int],
  b.created_at + INTERVAL '30 minutes'
FROM bookings b
WHERE b.status = 'completed' AND random() > 0.3
ON CONFLICT DO NOTHING;

-- ── 10. REPORTS ───────────────────────────────────────────────
INSERT INTO reports (customer_id, driver_id, issue_type, description, severity, status, created_at) VALUES
  ('c2000001-0000-0000-0000-000000000003', (SELECT id FROM drivers WHERE name='Eduardo Reyes'),    'Overcharging', 'Siningil ng higit sa tamang pamasahe para sa City Hall Loop.', 'High',   'pending',      NOW() - INTERVAL '5 days'),
  ('c2000001-0000-0000-0000-000000000004', (SELECT id FROM drivers WHERE name='Marites Abundo'),   'Reckless Driving', 'Mabilis na nagmamaneho sa may Brgy. Rawis area.', 'Medium', 'under review', NOW() - INTERVAL '12 days'),
  ('c2000001-0000-0000-0000-000000000002', (SELECT id FROM drivers WHERE name='Florencio Mangubat'),'No Show', 'Hindi dumating ang driver pagkatapos tanggapin ang booking.', 'Low',  'resolved',     NOW() - INTERVAL '20 days'),
  ('c2000001-0000-0000-0000-000000000007', (SELECT id FROM drivers WHERE name='Gloria Catalan'),   'Discourtesy', 'Hindi magalang ang driver sa pasahero.', 'Medium', 'pending',       NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- ── 11. NOTIFICATIONS ─────────────────────────────────────────
INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
SELECT u.id,
  notif.title, notif.message, notif.type, false,
  NOW() - (random()*7 || ' days')::interval
FROM users u,
  (VALUES
    ('New booking received',    'A new ride booking has been placed on your route.',     'booking'),
    ('Payment confirmed',       'Your fare payment of ₱35.00 has been confirmed.',       'payment'),
    ('System maintenance',      'Scheduled maintenance on May 28, 2026 from 2–4 AM.',   'system'),
    ('New complaint filed',     'A complaint has been submitted against a driver.',      'report'),
    ('Driver verified',         'Driver Ramon Dela Cruz has been verified.',             'system')
  ) AS notif(title, message, type)
WHERE u.role IN ('driver', 'customer')
LIMIT 30
ON CONFLICT DO NOTHING;

-- ── 12. ACTIVITY LOG ──────────────────────────────────────────
INSERT INTO activity_log (icon, text, user_id, created_at) VALUES
  ('🛺', 'New driver registered — Ramon Dela Cruz · Tricycle · SAM-1234',         'd1000001-0000-0000-0000-000000000001', NOW() - INTERVAL '90 days'),
  ('🛺', 'New driver registered — Jose Peñaranda · Pedicab · SAM-9012',           'd1000001-0000-0000-0000-000000000002', NOW() - INTERVAL '85 days'),
  ('✅', 'Driver verified — Lourdes Buenaventura · SAM-5678',                      'd1000001-0000-0000-0000-000000000004', NOW() - INTERVAL '74 days'),
  ('✅', 'Driver verified — Eduardo Reyes · SAM-7890',                             'd1000001-0000-0000-0000-000000000005', NOW() - INTERVAL '69 days'),
  ('🚫', 'Driver suspended — Florencio Mangubat · SAM-3344 · Inactive',           'd1000001-0000-0000-0000-000000000007', NOW() - INTERVAL '58 days'),
  ('⚠️', 'Report filed — Overcharging complaint against Eduardo Reyes',            'c2000001-0000-0000-0000-000000000003', NOW() - INTERVAL '5 days'),
  ('💰', 'Payment confirmed — ₱45.00 · Cash · Ramon Dela Cruz',                   'c2000001-0000-0000-0000-000000000001', NOW() - INTERVAL '3 days'),
  ('⭐', 'New rating submitted — 5 stars for Ramon Dela Cruz',                     'c2000001-0000-0000-0000-000000000005', NOW() - INTERVAL '2 days'),
  ('🗺️', 'New route added — Airport Connector · 7.2 km',                          NULL,                                   NOW() - INTERVAL '1 day'),
  ('🔔', 'System broadcast sent — Scheduled maintenance notice',                   NULL,                                   NOW() - INTERVAL '12 hours')
ON CONFLICT DO NOTHING;

-- ── Done ──────────────────────────────────────────────────────
SELECT 'Seed complete!' AS result,
  (SELECT COUNT(*) FROM drivers)       AS drivers,
  (SELECT COUNT(*) FROM users WHERE role='customer') AS customers,
  (SELECT COUNT(*) FROM bookings)      AS bookings,
  (SELECT COUNT(*) FROM payments)      AS payments,
  (SELECT COUNT(*) FROM ratings)       AS ratings,
  (SELECT COUNT(*) FROM routes)        AS routes,
  (SELECT COUNT(*) FROM reports)       AS reports,
  (SELECT COUNT(*) FROM fare_matrix)   AS fare_matrix,
  (SELECT COUNT(*) FROM activity_log)  AS activity_log;
