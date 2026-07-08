-- ============================================================
-- CommuterConnect — Demo Seed Data
-- Calbayog City, Samar
-- Run in Supabase SQL Editor → New Query → Run
-- ============================================================

-- ── CLEANUP (optional - removes old seed data first) ────────
DELETE FROM activity_log WHERE icon IN ('🛺','✅','🚫','⚠️','💰','⭐','🗺️','🔔');
DELETE FROM ratings     WHERE comment LIKE '%Magaling%' OR comment LIKE '%Mabait%';
DELETE FROM payments    WHERE method IN ('cash','gcash','maya');
DELETE FROM bookings    WHERE pickup IN ('City Hall','Public Market','Calbayog Port','Calbayog Airport','Nijaga Park');
DELETE FROM schedules   WHERE day_of_week IN ('Mon','Tue','Wed','Thu','Fri','Sat');
DELETE FROM drivers     WHERE plate LIKE 'SAM-%';
DELETE FROM users       WHERE email LIKE '%@commuterconnect.ph';
DELETE FROM routes      WHERE name IN ('City Hall Loop','Nijaga Park Route','Oquendo Circuit','Hamorawon Expressway','Lonoy Barangay Route','Downtown Loop','Airport Connector');

-- ── 1. FARE MATRIX ──────────────────────────────────────────
INSERT INTO fare_matrix (vehicle_type, base_fare, per_km, peak_surcharge, updated_at) VALUES
  ('Tricycle', 10.00, 2.50, 10, NOW()),
  ('Pedicab',   8.00, 2.00,  0, NOW()),
  ('Timbol',   12.00, 3.00, 15, NOW()),
  ('Multicab', 15.00, 3.50, 15, NOW())
ON CONFLICT (vehicle_type) DO UPDATE
  SET base_fare      = EXCLUDED.base_fare,
      per_km         = EXCLUDED.per_km,
      peak_surcharge = EXCLUDED.peak_surcharge;

-- ── 2. ROUTES ───────────────────────────────────────────────
INSERT INTO routes (name, origin, destination, distance_km, vehicle_types, status, created_at) VALUES
  ('City Hall Loop',       'Calbayog City Hall', 'Brgy. Rawis',        3.2, ARRAY['Tricycle','Pedicab'],           'active',   NOW() - INTERVAL '60 days'),
  ('Nijaga Park Route',    'Nijaga Park',         'Public Market',      2.8, ARRAY['Tricycle','Multicab'],           'active',   NOW() - INTERVAL '58 days'),
  ('Oquendo Circuit',      'Calbayog Airport',    'Brgy. Oquendo',      5.1, ARRAY['Tricycle','Timbol','Multicab'],  'active',   NOW() - INTERVAL '55 days'),
  ('Hamorawon Expressway', 'City Hall',            'Brgy. Hamorawon',   6.4, ARRAY['Timbol','Multicab'],             'active',   NOW() - INTERVAL '50 days'),
  ('Lonoy Barangay Route', 'Public Market',        'Brgy. Lonoy',       4.0, ARRAY['Tricycle','Pedicab'],           'active',   NOW() - INTERVAL '45 days'),
  ('Downtown Loop',        'Calbayog Port',        'Calbayog Cathedral', 1.5, ARRAY['Tricycle','Pedicab'],           'active',   NOW() - INTERVAL '40 days'),
  ('Airport Connector',    'Calbayog Airport',     'City Hall',          7.2, ARRAY['Timbol','Multicab'],             'active',   NOW() - INTERVAL '35 days')
ON CONFLICT DO NOTHING;

-- ── 3. USERS (drivers) ──────────────────────────────────────
INSERT INTO users (id, name, email, phone, role, status, address, created_at) VALUES
  ('d1000001-0000-0000-0000-000000000001', 'Ramon Dela Cruz',       'ramon@commuterconnect.ph',    '+63 912 345 6789', 'driver',   'active',   'Brgy. Rawis, Calbayog City',      NOW() - INTERVAL '90 days'),
  ('d1000001-0000-0000-0000-000000000002', 'Jose Peñaranda',        'jose@commuterconnect.ph',     '+63 923 456 7890', 'driver',   'active',   'Brgy. Lonoy, Calbayog City',      NOW() - INTERVAL '85 days'),
  ('d1000001-0000-0000-0000-000000000003', 'Lourdes Buenaventura',  'lourdes@commuterconnect.ph',  '+63 945 678 9012', 'driver',   'active',   'Brgy. Hamorawon, Calbayog City',  NOW() - INTERVAL '75 days'),
  ('d1000001-0000-0000-0000-000000000004', 'Eduardo Reyes',         'eduardo@commuterconnect.ph',  '+63 956 789 0123', 'driver',   'active',   'Downtown, Calbayog City',         NOW() - INTERVAL '70 days'),
  ('d1000001-0000-0000-0000-000000000005', 'Salvacion Torralba',    'salvacion@commuterconnect.ph','+63 967 890 1234', 'driver',   'active',   'Brgy. Aguit-itan, Calbayog City', NOW() - INTERVAL '65 days'),
  ('d1000001-0000-0000-0000-000000000006', 'Florencio Mangubat',    'florencio@commuterconnect.ph','+63 978 901 2345', 'driver',   'inactive', 'Brgy. Rawis, Calbayog City',      NOW() - INTERVAL '60 days'),
  ('d1000001-0000-0000-0000-000000000007', 'Gloria Catalan',        'gloria@commuterconnect.ph',   '+63 989 012 3456', 'driver',   'active',   'Brgy. Lonoy, Calbayog City',      NOW() - INTERVAL '55 days'),
  ('d1000001-0000-0000-0000-000000000008', 'Marites Abundo',        'marites@commuterconnect.ph',  '+63 934 567 8901', 'driver',   'inactive', 'Brgy. Oquendo, Calbayog City',    NOW() - INTERVAL '50 days')
ON CONFLICT (id) DO NOTHING;

-- ── 4. USERS (customers) ────────────────────────────────────
INSERT INTO users (id, name, email, phone, role, status, address, created_at) VALUES
  ('c2000001-0000-0000-0000-000000000001', 'Maria Santos',         'maria@commuterconnect.ph',    '+63 912 111 2222', 'customer', 'active',    'Brgy. Rawis, Calbayog City',      NOW() - INTERVAL '88 days'),
  ('c2000001-0000-0000-0000-000000000002', 'Juan dela Vega',       'juan.v@commuterconnect.ph',   '+63 923 222 3333', 'customer', 'active',    'Downtown, Calbayog City',         NOW() - INTERVAL '75 days'),
  ('c2000001-0000-0000-0000-000000000003', 'Ana Villanueva',       'ana@commuterconnect.ph',      '+63 934 333 4444', 'customer', 'active',    'Brgy. Oquendo, Calbayog City',    NOW() - INTERVAL '60 days'),
  ('c2000001-0000-0000-0000-000000000004', 'Roberto Espiritu',     'roberto@commuterconnect.ph',  '+63 945 444 5555', 'customer', 'active',    'Brgy. Hamorawon, Calbayog City',  NOW() - INTERVAL '50 days'),
  ('c2000001-0000-0000-0000-000000000005', 'Ligaya Fuentes',       'ligaya@commuterconnect.ph',   '+63 956 555 6666', 'customer', 'active',    'Brgy. Lonoy, Calbayog City',      NOW() - INTERVAL '45 days'),
  ('c2000001-0000-0000-0000-000000000006', 'Ernesto Caballero',    'ernesto@commuterconnect.ph',  '+63 967 666 7777', 'customer', 'suspended', 'Brgy. Aguit-itan, Calbayog City', NOW() - INTERVAL '40 days'),
  ('c2000001-0000-0000-0000-000000000007', 'Rosario Dimaculangan', 'rosario@commuterconnect.ph',  '+63 978 777 8888', 'customer', 'active',    'Downtown, Calbayog City',         NOW() - INTERVAL '30 days'),
  ('c2000001-0000-0000-0000-000000000008', 'Domingo Pascual',      'domingo@commuterconnect.ph',  '+63 989 888 9999', 'customer', 'active',    'Brgy. Rawis, Calbayog City',      NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- ── 5. DRIVERS ───────────────────────────────────────────────
INSERT INTO drivers (user_id, name, plate, vehicle_type, route, license_no, status, verified, rating, trips, color, created_at) VALUES
  ('d1000001-0000-0000-0000-000000000001', 'Ramon Dela Cruz',      'SAM-1234', 'Tricycle', 'City Hall Loop',       'LTO-CY-2021-001', 'active',   true,  4.9, 142, '#1565C0', NOW() - INTERVAL '90 days'),
  ('d1000001-0000-0000-0000-000000000002', 'Jose Peñaranda',       'SAM-9012', 'Pedicab',  'Nijaga Park Route',    'LTO-CY-2020-002', 'active',   true,  4.7,  98, '#2E7D32', NOW() - INTERVAL '85 days'),
  ('d1000001-0000-0000-0000-000000000003', 'Lourdes Buenaventura', 'SAM-5678', 'Tricycle', 'Hamorawon Expressway', 'LTO-CY-2021-004', 'active',   true,  4.8,  87, '#6A1B9A', NOW() - INTERVAL '75 days'),
  ('d1000001-0000-0000-0000-000000000004', 'Eduardo Reyes',        'SAM-7890', 'Timbol',   'Oquendo Circuit',      'LTO-CY-2019-005', 'active',   true,  4.6, 213, '#BF360C', NOW() - INTERVAL '70 days'),
  ('d1000001-0000-0000-0000-000000000005', 'Salvacion Torralba',   'SAM-1122', 'Pedicab',  'Downtown Loop',        'LTO-CY-2022-006', 'active',   true,  4.5,  61, '#00695C', NOW() - INTERVAL '65 days'),
  ('d1000001-0000-0000-0000-000000000006', 'Florencio Mangubat',   'SAM-3344', 'Multicab', 'Airport Connector',    'LTO-CY-2020-007', 'inactive', false, 3.8,  29, '#4527A0', NOW() - INTERVAL '60 days'),
  ('d1000001-0000-0000-0000-000000000007', 'Gloria Catalan',       'SAM-5566', 'Multicab', 'Hamorawon Expressway', 'LTO-CY-2023-008', 'active',   true,  4.3,  44, '#AD1457', NOW() - INTERVAL '55 days'),
  ('d1000001-0000-0000-0000-000000000008', 'Marites Abundo',       'SAM-3456', 'Tricycle', 'Lonoy Barangay Route', 'LTO-CY-2022-003', 'inactive', false, 4.1,  34, '#E65100', NOW() - INTERVAL '50 days')
ON CONFLICT DO NOTHING;

-- ── 6. SCHEDULES ─────────────────────────────────────────────
INSERT INTO schedules (driver_id, day_of_week, start_time, end_time, is_active)
SELECT d.id, day, '06:00', '18:00', true
FROM drivers d
CROSS JOIN UNNEST(ARRAY['Mon','Tue','Wed','Thu','Fri','Sat']) AS day
WHERE d.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM schedules s WHERE s.driver_id = d.id AND s.day_of_week = day
  );

-- ── 7. BOOKINGS ───────────────────────────────────────────────
INSERT INTO bookings (customer_id, driver_id, pickup, dropoff, vehicle_type, fare, status, payment_status, created_at)
VALUES
  ('c2000001-0000-0000-0000-000000000001',(SELECT id FROM drivers WHERE plate='SAM-1234'),'City Hall','Brgy. Rawis','Tricycle',18.00,'completed','paid',NOW()-INTERVAL '45 days'),
  ('c2000001-0000-0000-0000-000000000002',(SELECT id FROM drivers WHERE plate='SAM-9012'),'Nijaga Park','Public Market','Pedicab',13.60,'completed','paid',NOW()-INTERVAL '43 days'),
  ('c2000001-0000-0000-0000-000000000003',(SELECT id FROM drivers WHERE plate='SAM-7890'),'Calbayog Airport','Brgy. Oquendo','Timbol',27.30,'completed','paid',NOW()-INTERVAL '40 days'),
  ('c2000001-0000-0000-0000-000000000004',(SELECT id FROM drivers WHERE plate='SAM-5678'),'City Hall','Brgy. Hamorawon','Tricycle',26.00,'completed','paid',NOW()-INTERVAL '38 days'),
  ('c2000001-0000-0000-0000-000000000005',(SELECT id FROM drivers WHERE plate='SAM-1122'),'Calbayog Port','Calbayog Cathedral','Pedicab',11.00,'completed','paid',NOW()-INTERVAL '35 days'),
  ('c2000001-0000-0000-0000-000000000007',(SELECT id FROM drivers WHERE plate='SAM-1234'),'Brgy. Rawis','City Hall','Tricycle',18.00,'completed','paid',NOW()-INTERVAL '32 days'),
  ('c2000001-0000-0000-0000-000000000008',(SELECT id FROM drivers WHERE plate='SAM-7890'),'City Hall','Calbayog Airport','Timbol',33.60,'completed','paid',NOW()-INTERVAL '30 days'),
  ('c2000001-0000-0000-0000-000000000001',(SELECT id FROM drivers WHERE plate='SAM-5566'),'Public Market','Brgy. Hamorawon','Multicab',37.40,'completed','paid',NOW()-INTERVAL '28 days'),
  ('c2000001-0000-0000-0000-000000000002',(SELECT id FROM drivers WHERE plate='SAM-5678'),'Brgy. Hamorawon','City Hall','Tricycle',26.00,'completed','paid',NOW()-INTERVAL '25 days'),
  ('c2000001-0000-0000-0000-000000000003',(SELECT id FROM drivers WHERE plate='SAM-9012'),'Public Market','Nijaga Park','Pedicab',13.60,'completed','paid',NOW()-INTERVAL '22 days'),
  ('c2000001-0000-0000-0000-000000000004',(SELECT id FROM drivers WHERE plate='SAM-1234'),'City Hall','Brgy. Rawis','Tricycle',18.00,'completed','paid',NOW()-INTERVAL '20 days'),
  ('c2000001-0000-0000-0000-000000000005',(SELECT id FROM drivers WHERE plate='SAM-7890'),'Calbayog Airport','Brgy. Oquendo','Timbol',27.30,'completed','paid',NOW()-INTERVAL '18 days'),
  ('c2000001-0000-0000-0000-000000000007',(SELECT id FROM drivers WHERE plate='SAM-1122'),'Calbayog Port','Calbayog Cathedral','Pedicab',11.00,'completed','paid',NOW()-INTERVAL '15 days'),
  ('c2000001-0000-0000-0000-000000000008',(SELECT id FROM drivers WHERE plate='SAM-5678'),'City Hall','Brgy. Hamorawon','Tricycle',26.00,'completed','paid',NOW()-INTERVAL '12 days'),
  ('c2000001-0000-0000-0000-000000000001',(SELECT id FROM drivers WHERE plate='SAM-7890'),'City Hall','Calbayog Airport','Timbol',33.60,'completed','paid',NOW()-INTERVAL '10 days'),
  ('c2000001-0000-0000-0000-000000000002',(SELECT id FROM drivers WHERE plate='SAM-1234'),'Brgy. Rawis','City Hall','Tricycle',18.00,'completed','paid',NOW()-INTERVAL '8 days'),
  ('c2000001-0000-0000-0000-000000000003',(SELECT id FROM drivers WHERE plate='SAM-5566'),'Public Market','Brgy. Hamorawon','Multicab',37.40,'completed','paid',NOW()-INTERVAL '6 days'),
  ('c2000001-0000-0000-0000-000000000004',(SELECT id FROM drivers WHERE plate='SAM-9012'),'Nijaga Park','Public Market','Pedicab',13.60,'completed','paid',NOW()-INTERVAL '4 days'),
  ('c2000001-0000-0000-0000-000000000005',(SELECT id FROM drivers WHERE plate='SAM-1234'),'City Hall','Brgy. Rawis','Tricycle',18.00,'pending','pending',NOW()-INTERVAL '1 day'),
  ('c2000001-0000-0000-0000-000000000007',(SELECT id FROM drivers WHERE plate='SAM-7890'),'Calbayog Airport','City Hall','Timbol',33.60,'cancelled','pending',NOW()-INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- ── 8. PAYMENTS ──────────────────────────────────────────────
INSERT INTO payments (booking_id, driver_id, amount, method, status, paid_at, created_at)
SELECT
  b.id,
  b.driver_id,
  b.fare,
  (ARRAY['cash','gcash','maya'])[1 + (random()*2)::int],
  'completed',
  b.created_at + INTERVAL '10 minutes',
  b.created_at
FROM bookings b
WHERE b.status = 'completed'
ON CONFLICT DO NOTHING;

-- ── 9. RATINGS ────────────────────────────────────────────────
INSERT INTO ratings (booking_id, customer_id, driver_id, stars, comment, created_at)
SELECT
  b.id,
  b.customer_id,
  b.driver_id,
  (ARRAY[4,5,5,5,4,5,3,5,4,5])[1 + (random()*9)::int],
  (ARRAY[
    'Magaling mag-drive, maayos ang serbisyo!',
    'Mabait ang driver, maayos ang biyahe.',
    'Malinaw ang ruta, komportable ang sakay.',
    'Okay ang driver, on time ang dating.',
    'Maganda ang serbisyo, babalik ulit!',
    'Malinis ang sasakyan, magalang ang driver.',
    'Mabilis sumagot, maayos ang byahe.',
    'Nai-drop off sa tamang lugar, salamat!',
    'Maayos at mabilis, highly recommended!',
    'Swak ang presyo, magaling ang driver.'
  ])[1 + (random()*9)::int],
  b.created_at + INTERVAL '30 minutes'
FROM bookings b
WHERE b.status = 'completed'
  AND random() > 0.2
ON CONFLICT DO NOTHING;

-- ── 10. REPORTS ───────────────────────────────────────────────
INSERT INTO reports (customer_id, driver_id, issue_type, description, severity, status, created_at) VALUES
  ('c2000001-0000-0000-0000-000000000003',(SELECT id FROM drivers WHERE plate='SAM-7890'),'Overcharging',    'Siningil ng higit sa tamang pamasahe para sa Oquendo Circuit.',   'High',   'pending',      NOW()-INTERVAL '5 days'),
  ('c2000001-0000-0000-0000-000000000004',(SELECT id FROM drivers WHERE plate='SAM-3456'),'Reckless Driving','Mabilis na nagmamaneho sa may Brgy. Rawis area nang walang ingat.','Medium', 'under review', NOW()-INTERVAL '12 days'),
  ('c2000001-0000-0000-0000-000000000002',(SELECT id FROM drivers WHERE plate='SAM-3344'),'No Show',         'Hindi dumating ang driver pagkatapos tanggapin ang booking.',      'Low',    'resolved',     NOW()-INTERVAL '20 days'),
  ('c2000001-0000-0000-0000-000000000007',(SELECT id FROM drivers WHERE plate='SAM-5566'),'Discourtesy',     'Hindi magalang ang driver sa pasahero sa buong biyahe.',           'Medium', 'pending',      NOW()-INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- ── 11. NOTIFICATIONS ─────────────────────────────────────────
INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
SELECT
  u.id,
  n.title, n.message, n.type, false,
  NOW() - (random()*7 || ' days')::interval
FROM users u,
  (VALUES
    ('New booking received',  'A new ride booking has been placed on your route.',   'booking'),
    ('Payment confirmed',     'Your fare payment has been confirmed successfully.',   'payment'),
    ('Driver verified',       'Driver Ramon Dela Cruz has been verified.',            'system'),
    ('New complaint filed',   'A complaint has been submitted and is under review.',  'report'),
    ('Route update',          'City Hall Loop route schedule has been updated.',      'system')
  ) AS n(title, message, type)
WHERE u.role IN ('driver','customer')
LIMIT 25
ON CONFLICT DO NOTHING;

-- ── 12. ACTIVITY LOG ──────────────────────────────────────────
INSERT INTO activity_log (icon, text, user_id, created_at) VALUES
  ('🛺','New driver registered — Ramon Dela Cruz · Tricycle · SAM-1234',   'd1000001-0000-0000-0000-000000000001', NOW()-INTERVAL '90 days'),
  ('🛺','New driver registered — Jose Peñaranda · Pedicab · SAM-9012',     'd1000001-0000-0000-0000-000000000002', NOW()-INTERVAL '85 days'),
  ('🛺','New driver registered — Eduardo Reyes · Timbol · SAM-7890',       'd1000001-0000-0000-0000-000000000004', NOW()-INTERVAL '70 days'),
  ('✅','Driver verified — Ramon Dela Cruz · SAM-1234',                     'd1000001-0000-0000-0000-000000000001', NOW()-INTERVAL '89 days'),
  ('✅','Driver verified — Lourdes Buenaventura · SAM-5678',                'd1000001-0000-0000-0000-000000000003', NOW()-INTERVAL '74 days'),
  ('✅','Driver verified — Eduardo Reyes · SAM-7890',                       'd1000001-0000-0000-0000-000000000004', NOW()-INTERVAL '69 days'),
  ('🚫','Driver suspended — Florencio Mangubat · SAM-3344 · Inactive',     'd1000001-0000-0000-0000-000000000006', NOW()-INTERVAL '58 days'),
  ('⚠️','Report filed — Overcharging complaint against Eduardo Reyes',      'c2000001-0000-0000-0000-000000000003', NOW()-INTERVAL '5 days'),
  ('⚠️','Report filed — No Show complaint against Florencio Mangubat',      'c2000001-0000-0000-0000-000000000002', NOW()-INTERVAL '20 days'),
  ('💰','Payment confirmed — ₱33.60 · GCash · Eduardo Reyes',              'c2000001-0000-0000-0000-000000000001', NOW()-INTERVAL '10 days'),
  ('💰','Payment confirmed — ₱18.00 · Cash · Ramon Dela Cruz',             'c2000001-0000-0000-0000-000000000002', NOW()-INTERVAL '8 days'),
  ('⭐','New rating — 5 stars for Ramon Dela Cruz by Maria Santos',         'c2000001-0000-0000-0000-000000000001', NOW()-INTERVAL '7 days'),
  ('⭐','New rating — 4 stars for Eduardo Reyes by Ana Villanueva',         'c2000001-0000-0000-0000-000000000003', NOW()-INTERVAL '4 days'),
  ('🗺️','New route added — Airport Connector · 7.2 km',                    NULL,                                   NOW()-INTERVAL '35 days'),
  ('🔔','System broadcast — Welcome to CommuterConnect Calbayog City!',     NULL,                                   NOW()-INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- ── Verify ────────────────────────────────────────────────────
SELECT 'Demo data loaded!' AS result,
  (SELECT COUNT(*) FROM drivers)                       AS drivers,
  (SELECT COUNT(*) FROM users WHERE role='customer')   AS customers,
  (SELECT COUNT(*) FROM routes)                        AS routes,
  (SELECT COUNT(*) FROM bookings)                      AS bookings,
  (SELECT COUNT(*) FROM payments)                      AS payments,
  (SELECT COUNT(*) FROM ratings)                       AS ratings,
  (SELECT COUNT(*) FROM reports)                       AS reports,
  (SELECT COUNT(*) FROM schedules)                     AS schedules,
  (SELECT COUNT(*) FROM activity_log)                  AS activity_log;