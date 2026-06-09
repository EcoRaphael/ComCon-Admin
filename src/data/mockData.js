// src/data/mockData.js
// CommuterConnect — Web-Based Transportation Platform for Calbayog City
// Chapter 1 aligned: vehicles are tricycle, pedicab, timbol, multicab (native Calbayog City transport)

export const VEHICLE_TYPES = ['Tricycle', 'Pedicab', 'Timbol', 'Multicab']

export const DRIVERS = [
  { id: 1, name: 'Ramon Dela Cruz',      ab: 'RD', plate: 'SAM 1234', route: 'Nijaga Park ↔ Calbayog Port',       rating: 4.9, trips: 1102, status: 'active',   type: 'Tricycle', earnings: 12480, phone: '09171234567', joined: '2025-06-01', color: '#00b86b', licenseNo: 'LTFRB-VIII-0001', verified: true  },
  { id: 2, name: 'Lourdes Buenaventura', ab: 'LB', plate: 'SAM 5678', route: 'City Hall ↔ Brgy. Dagum',           rating: 4.7, trips:  876, status: 'active',   type: 'Tricycle', earnings:  9870, phone: '09181234567', joined: '2025-07-15', color: '#1565c0', licenseNo: 'LTFRB-VIII-0002', verified: true  },
  { id: 3, name: 'Jose Peñaranda',       ab: 'JP', plate: 'SAM 9012', route: 'Public Market ↔ District Hospital', rating: 4.8, trips: 1940, status: 'active',   type: 'Pedicab',  earnings: 18200, phone: '09191234567', joined: '2025-05-20', color: '#f59e0b', licenseNo: 'LTFRB-VIII-0003', verified: true  },
  { id: 4, name: 'Marites Abundo',       ab: 'MA', plate: 'SAM 3456', route: 'Brgy. Rawis ↔ Airport',             rating: 4.6, trips:  543, status: 'inactive', type: 'Tricycle', earnings:  5430, phone: '09201234567', joined: '2025-09-10', color: '#9c27b0', licenseNo: 'LTFRB-VIII-0004', verified: false },
  { id: 5, name: 'Eduardo Reyes',        ab: 'ER', plate: 'SAM 7890', route: 'Oquendo ↔ Downtown Calbayog',       rating: 4.9, trips: 1650, status: 'active',   type: 'Timbol',   earnings: 16500, phone: '09211234567', joined: '2025-04-03', color: '#e53935', licenseNo: 'LTFRB-VIII-0005', verified: true  },
  { id: 6, name: 'Salvacion Torralba',   ab: 'ST', plate: 'SAM 1122', route: 'Brgy. Lonoy ↔ Calbayog Port',       rating: 4.5, trips:  389, status: 'active',   type: 'Pedicab',  earnings:  3890, phone: '09221234567', joined: '2025-10-01', color: '#00838f', licenseNo: 'LTFRB-VIII-0006', verified: true  },
  { id: 7, name: 'Fernando Bautista',    ab: 'FB', plate: 'SAM 3344', route: 'Tinaplacan ↔ City Center',          rating: 4.8, trips:  810, status: 'active',   type: 'Tricycle', earnings:  8100, phone: '09231234567', joined: '2025-08-22', color: '#558b2f', licenseNo: 'LTFRB-VIII-0007', verified: true  },
  { id: 8, name: 'Gloria Catalan',       ab: 'GC', plate: 'SAM 5566', route: 'Hamorawon ↔ Public Market',         rating: 4.9, trips: 1320, status: 'inactive', type: 'Multicab', earnings: 11200, phone: '09241234567', joined: '2025-11-05', color: '#ad1457', licenseNo: 'LTFRB-VIII-0008', verified: false },
]

export const BOOKINGS = [
  { id: 'BK-001', customer: 'Maria Santos',  driver: 'Ramon Dela Cruz',      from: 'Calbayog City Hall', to: 'Calbayog Port',     fare: 15, status: 'completed', date: '2026-03-10', time: '8:32 AM',  vehicleType: 'Tricycle', paymentStatus: 'paid'     },
  { id: 'BK-002', customer: 'Pedro Reyes',   driver: 'Jose Peñaranda',       from: 'Public Market',      to: 'District Hospital', fare: 12, status: 'completed', date: '2026-03-10', time: '9:15 AM',  vehicleType: 'Pedicab',  paymentStatus: 'paid'     },
  { id: 'BK-003', customer: 'Ana Cruz',      driver: 'Eduardo Reyes',        from: 'Nijaga Park',        to: 'Oquendo',           fare: 18, status: 'ongoing',   date: '2026-03-10', time: '10:00 AM', vehicleType: 'Timbol',   paymentStatus: 'pending'  },
  { id: 'BK-004', customer: 'Ben Torres',    driver: 'Lourdes Buenaventura', from: 'Brgy. Rawis',        to: 'City Hall',         fare: 10, status: 'pending',   date: '2026-03-10', time: '10:30 AM', vehicleType: 'Tricycle', paymentStatus: 'pending'  },
  { id: 'BK-005', customer: 'Luz Garcia',    driver: 'Salvacion Torralba',   from: 'Brgy. Lonoy',        to: 'Calbayog Port',     fare: 20, status: 'cancelled', date: '2026-03-09', time: '4:45 PM',  vehicleType: 'Pedicab',  paymentStatus: 'refunded' },
  { id: 'BK-006', customer: 'Carlo Mendez',  driver: 'Gloria Catalan',       from: 'Hamorawon',          to: 'Public Market',     fare: 13, status: 'completed', date: '2026-03-09', time: '2:15 PM',  vehicleType: 'Multicab', paymentStatus: 'paid'     },
]

export const REPORTS = [
  { id: 'RP-001', customer: 'Maria Santos', driver: 'Ramon Dela Cruz', type: 'Overcharging',      severity: 'Medium', status: 'under review', date: '2026-03-09', description: 'Driver charged more than the app fare estimate.' },
  { id: 'RP-002', customer: 'Ben Torres',   driver: 'Eduardo Reyes',   type: 'Reckless Driving',  severity: 'High',   status: 'resolved',     date: '2026-03-08', description: 'Driver was speeding on Oquendo road.' },
  { id: 'RP-003', customer: 'Ana Cruz',     driver: 'Marites Abundo',  type: 'Route Deviation',   severity: 'Low',    status: 'pending',      date: '2026-03-07', description: 'Driver took a longer route without notice.' },
  { id: 'RP-004', customer: 'Pedro Reyes',  driver: 'Jose Peñaranda',  type: 'Driver Harassment', severity: 'High',   status: 'under review', date: '2026-03-06', description: 'Driver used offensive language toward commuter.' },
]

export const RATINGS = [
  { id: 'RT-001', customer: 'Maria Santos', driver: 'Ramon Dela Cruz', bookingId: 'BK-001', stars: 5, comment: 'Very safe, always on time!',           date: '2026-03-10' },
  { id: 'RT-002', customer: 'Pedro Reyes',  driver: 'Jose Peñaranda',  bookingId: 'BK-002', stars: 4, comment: 'Good ride, comfortable pedicab.',       date: '2026-03-10' },
  { id: 'RT-003', customer: 'Carlo Mendez', driver: 'Gloria Catalan',  bookingId: 'BK-006', stars: 5, comment: 'Very professional, highly recommended.', date: '2026-03-09' },
]

export const CUSTOMERS = [
  { id: 1, name: 'Maria Santos', email: 'maria@email.com', phone: '09301234567', rides: 24, status: 'active',    joined: '2026-01-10', address: 'Brgy. Rawis, Calbayog City'       },
  { id: 2, name: 'Pedro Reyes',  email: 'pedro@email.com', phone: '09311234567', rides: 12, status: 'active',    joined: '2026-02-01', address: 'Brgy. Dagum, Calbayog City'       },
  { id: 3, name: 'Ana Cruz',     email: 'ana@email.com',   phone: '09321234567', rides:  8, status: 'active',    joined: '2026-02-14', address: 'Tinaplacan, Calbayog City'        },
  { id: 4, name: 'Ben Torres',   email: 'ben@email.com',   phone: '09331234567', rides:  3, status: 'suspended', joined: '2026-03-01', address: 'Oquendo District, Calbayog City'  },
  { id: 5, name: 'Luz Garcia',   email: 'luz@email.com',   phone: '09341234567', rides: 31, status: 'active',    joined: '2025-12-20', address: 'Brgy. Lonoy, Calbayog City'       },
]

export const FARE_MATRIX = [
  { type: 'Tricycle', base: 10, perKm: 2.0, peak: 10, icon: '🛺' },
  { type: 'Pedicab',  base: 8,  perKm: 1.5, peak: 0,  icon: '🚲' },
  { type: 'Timbol',   base: 12, perKm: 2.5, peak: 10, icon: '🚐' },
  { type: 'Multicab', base: 15, perKm: 3.0, peak: 15, icon: '🚌' },
]

export const ROUTES = [
  { id: 1, name: 'City Hall Loop',     from: 'Calbayog City Hall', to: 'Nijaga Park',       distance: '2.1 km', vehicleTypes: ['Tricycle','Pedicab'],  status: 'active' },
  { id: 2, name: 'Port Route',         from: 'Downtown Calbayog',  to: 'Calbayog Port',     distance: '3.4 km', vehicleTypes: ['Tricycle','Timbol'],    status: 'active' },
  { id: 3, name: 'Hospital Route',     from: 'Public Market',      to: 'District Hospital', distance: '1.8 km', vehicleTypes: ['Pedicab','Tricycle'],   status: 'active' },
  { id: 4, name: 'Airport Connection', from: 'City Center',        to: 'Calbayog Airport',  distance: '5.2 km', vehicleTypes: ['Multicab','Timbol'],    status: 'active' },
  { id: 5, name: 'Oquendo District',   from: 'Oquendo',            to: 'Downtown Calbayog', distance: '4.0 km', vehicleTypes: ['Tricycle','Multicab'],  status: 'active' },
  { id: 6, name: 'Rawis Route',        from: 'Brgy. Rawis',        to: 'Calbayog City Hall',distance: '2.6 km', vehicleTypes: ['Pedicab','Tricycle'],   status: 'active' },
]

export const WEEKLY_STATS = [
  { day: 'Mon', bookings: 30, revenue: 450 },
  { day: 'Tue', bookings: 50, revenue: 720 },
  { day: 'Wed', bookings: 45, revenue: 640 },
  { day: 'Thu', bookings: 70, revenue: 980 },
  { day: 'Fri', bookings: 60, revenue: 860 },
  { day: 'Sat', bookings: 85, revenue: 1200 },
  { day: 'Sun', bookings: 65, revenue: 910 },
]

export const ACTIVITY_LOG = [
  { id: 1, icon: '✅', text: 'Booking confirmed — BK-004 · Ben Torres',                   time: 'Just now'  },
  { id: 2, icon: '🚨', text: 'Complaint filed — RP-004 · Pedro Reyes vs Jose Peñaranda',  time: '2 hrs ago' },
  { id: 3, icon: '👤', text: 'New commuter registered — Ben Torres',                       time: '3 hrs ago' },
  { id: 4, icon: '🛺', text: 'Driver verified — Eduardo Reyes · Timbol · SAM 7890',        time: '4 hrs ago' },
  { id: 5, icon: '💰', text: 'Fare updated — Tricycle base fare set to ₱10.00',            time: 'Yesterday' },
  { id: 6, icon: '🗺️', text: 'New route added — Brgy. Rawis ↔ City Hall',                 time: 'Yesterday' },
]

export const SYSTEM_OBJECTIVES = [
  { no: 1, text: 'To manage bookings, user information, ride details, and fare inquiries.' },
  { no: 2, text: 'To verify vehicle and driver information for reliability and safety.' },
  { no: 3, text: 'To monitor system activity and record transactions.' },
  { no: 4, text: 'To organize reports, ratings, and complaints.' },
  { no: 5, text: 'To generate ride records, booking confirmations, and fare details.' },
]
