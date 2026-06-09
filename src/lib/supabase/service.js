// src/lib/supabase/service.js
// ============================================================
// CommuterConnect — Supabase Service Layer
// All database operations for the Admin Panel
// Chapter 1 Objectives:
//   1. Manage bookings, user info, ride details, fare inquiries
//   2. Verify vehicle and driver info
//   3. Monitor system activity and record transactions
//   4. Organize reports, ratings, complaints
//   5. Generate ride records, booking confirmations, fare details
// ============================================================

import { supabase } from './client'

// ── HELPERS ──────────────────────────────────────────────────
const handleError = (error, context) => {
  if (error) {
    console.error(`❌ Supabase error [${context}]:`, error.message)
    throw new Error(error.message)
  }
}

// ── DASHBOARD ────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const [
    { count: activeDrivers },
    { count: totalDrivers },
    { count: unverifiedDrivers },
    { count: totalCustomers },
    { count: totalBookings },
    { count: completedBookings },
    { count: pendingBookings },
    { count: openReports },
  ] = await Promise.all([
    supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('drivers').select('*', { count: 'exact', head: true }),
    supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('verified', false),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reports').select('*', { count: 'exact', head: true }).neq('status', 'resolved'),
  ])

  // Total revenue from completed bookings
  const { data: revenueData } = await supabase
    .from('bookings')
    .select('fare')
    .eq('status', 'completed')

  const totalRevenue = revenueData?.reduce((sum, b) => sum + (b.fare || 0), 0) ?? 0

  // Average driver rating
  const { data: ratingData } = await supabase
    .from('drivers')
    .select('rating')

  const avgRating = ratingData?.length
    ? (ratingData.reduce((s, d) => s + (d.rating || 0), 0) / ratingData.length).toFixed(1)
    : '0.0'

  return {
    activeDrivers:     activeDrivers ?? 0,
    totalDrivers:      totalDrivers ?? 0,
    unverifiedDrivers: unverifiedDrivers ?? 0,
    totalCustomers:    totalCustomers ?? 0,
    totalBookings:     totalBookings ?? 0,
    completedBookings: completedBookings ?? 0,
    pendingBookings:   pendingBookings ?? 0,
    openReports:       openReports ?? 0,
    totalRevenue,
    avgRating,
    totalRoutes:       6,
  }
}

export const getActivityLog = async (limit = 8) => {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  handleError(error, 'getActivityLog')
  return data ?? []
}

export const logActivity = async (icon, text) => {
  await supabase.from('activity_log').insert({ icon, text })
}

// ── DRIVERS — Objective 2 ────────────────────────────────────

export const getDrivers = async () => {
  const { data, error } = await supabase
    .from('drivers')
    .select(`
      *,
      users ( name, email, phone )
    `)
    .order('created_at', { ascending: false })

  handleError(error, 'getDrivers')

  // Flatten joined user fields
  return (data ?? []).map(d => ({
    ...d,
    name:  d.users?.name  ?? d.name,
    email: d.users?.email ?? '',
    phone: d.users?.phone ?? '',
  }))
}

export const addDriver = async (driverData) => {
  // 1. Create user account
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      name:   driverData.name,
      email:  driverData.email,
      phone:  driverData.phone,
      role:   'driver',
      status: 'active',
      address: driverData.address ?? '',
    })
    .select()
    .single()

  handleError(userError, 'addDriver:createUser')

  // 2. Create driver record
  const { data, error } = await supabase
    .from('drivers')
    .insert({
      user_id:      userData.id,
      name:         driverData.name,
      plate:        driverData.plate,
      vehicle_type: driverData.type,
      route:        driverData.route,
      license_no:   driverData.licenseNo ?? '',
      status:       'inactive',
      verified:     false,
      rating:       0,
      trips:        0,
      earnings:     0,
      color:        driverData.color ?? '#00b86b',
    })
    .select()
    .single()

  handleError(error, 'addDriver:createDriver')
  await logActivity('🛺', `New driver registered — ${driverData.name} · ${driverData.plate}`)
  return data
}

export const updateDriverStatus = async (id, status) => {
  const { error } = await supabase
    .from('drivers')
    .update({ status })
    .eq('id', id)

  handleError(error, 'updateDriverStatus')
  await logActivity('⚡', `Driver status updated to ${status} — ID ${id}`)
}

export const verifyDriver = async (id) => {
  const { data, error } = await supabase
    .from('drivers')
    .update({ verified: true })
    .eq('id', id)
    .select()
    .single()

  handleError(error, 'verifyDriver')
  await logActivity('✅', `Driver verified — ${data?.name ?? id}`)
  return data
}

// ── CUSTOMERS / COMMUTERS — Objective 1 ──────────────────────

export const getCustomers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })

  handleError(error, 'getCustomers')

  // Attach ride count per customer
  const withRides = await Promise.all(
    (data ?? []).map(async (c) => {
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', c.id)
      return { ...c, rides: count ?? 0 }
    })
  )

  return withRides
}

export const updateCustomerStatus = async (id, status) => {
  const { error } = await supabase
    .from('users')
    .update({ status })
    .eq('id', id)

  handleError(error, 'updateCustomerStatus')
}

// ── BOOKINGS — Objective 1 ────────────────────────────────────

export const getBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      customer:users!bookings_customer_id_fkey ( name ),
      driver:drivers!bookings_driver_id_fkey   ( name, vehicle_type, plate )
    `)
    .order('created_at', { ascending: false })

  handleError(error, 'getBookings')

  return (data ?? []).map(b => ({
    ...b,
    customer:    b.customer?.name    ?? 'Unknown',
    driver:      b.driver?.name      ?? 'Unknown',
    vehicleType: b.driver?.vehicle_type ?? b.vehicle_type ?? '',
    plate:       b.driver?.plate     ?? '',
  }))
}

export const updateBookingStatus = async (id, status) => {
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)

  handleError(error, 'updateBookingStatus')
  await logActivity('🎫', `Booking ${id} status updated to ${status}`)
}

export const createBooking = async (bookingData) => {
  const { data, error } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single()

  handleError(error, 'createBooking')
  await logActivity('✅', `New booking created — ${bookingData.pickup} → ${bookingData.dropoff}`)
  return data
}

// ── ROUTES — Chapter 1 Scope ──────────────────────────────────

export const getRoutes = async () => {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .order('created_at', { ascending: false })

  handleError(error, 'getRoutes')
  return data ?? []
}

export const addRoute = async (routeData) => {
  const { data, error } = await supabase
    .from('routes')
    .insert({
      name:          routeData.name,
      origin:        routeData.from,
      destination:   routeData.to,
      distance_km:   parseFloat(routeData.distance) || 0,
      vehicle_types: routeData.vehicleTypes,
      status:        'active',
    })
    .select()
    .single()

  handleError(error, 'addRoute')
  await logActivity('🗺️', `New route added — ${routeData.from} ↔ ${routeData.to}`)
  return data
}

// ── REPORTS — Objective 4 ─────────────────────────────────────

export const getReports = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      customer:users!reports_customer_id_fkey ( name ),
      driver:drivers!reports_driver_id_fkey   ( name )
    `)
    .order('created_at', { ascending: false })

  handleError(error, 'getReports')

  return (data ?? []).map(r => ({
    ...r,
    customer: r.customer?.name ?? 'Unknown',
    driver:   r.driver?.name   ?? 'Unknown',
    type:     r.issue_type,
    date:     r.created_at?.slice(0, 10),
  }))
}

export const resolveReport = async (id) => {
  const { error } = await supabase
    .from('reports')
    .update({ status: 'resolved' })
    .eq('id', id)

  handleError(error, 'resolveReport')
  await logActivity('✅', `Report ${id} resolved`)
}

export const updateReportStatus = async (id, status) => {
  const { error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', id)

  handleError(error, 'updateReportStatus')
}

// ── RATINGS — Objective 4 ─────────────────────────────────────

export const getRatings = async () => {
  const { data, error } = await supabase
    .from('ratings')
    .select(`
      *,
      customer:users!ratings_customer_id_fkey ( name ),
      driver:drivers!ratings_driver_id_fkey   ( name )
    `)
    .order('created_at', { ascending: false })

  handleError(error, 'getRatings')

  return (data ?? []).map(r => ({
    ...r,
    customer: r.customer?.name ?? 'Unknown',
    driver:   r.driver?.name   ?? 'Unknown',
    date:     r.created_at?.slice(0, 10),
  }))
}

// ── FARES — Objective 1 ───────────────────────────────────────

export const getFareMatrix = async () => {
  const { data, error } = await supabase
    .from('fare_matrix')
    .select('*')
    .order('vehicle_type')

  handleError(error, 'getFareMatrix')
  return data ?? []
}

export const updateFare = async (vehicleType, updates) => {
  const { error } = await supabase
    .from('fare_matrix')
    .update(updates)
    .eq('vehicle_type', vehicleType)

  handleError(error, 'updateFare')
  await logActivity('💰', `Fare updated — ${vehicleType} base ₱${updates.base_fare}`)
}

// ── ANALYTICS — Objective 3 ───────────────────────────────────

export const getWeeklyStats = async () => {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

  // Get bookings from last 7 days grouped by day
  const { data, error } = await supabase
    .from('bookings')
    .select('created_at, fare, status')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  handleError(error, 'getWeeklyStats')

  // Build day-by-day stats
  const stats = days.map((day, i) => {
    const dayBookings = (data ?? []).filter(b => {
      const d = new Date(b.created_at)
      return d.getDay() === (i + 1) % 7
    })
    return {
      day,
      bookings: dayBookings.length,
      revenue:  dayBookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.fare || 0), 0),
    }
  })

  return stats
}

// ── RECORDS — Objective 5 ─────────────────────────────────────

export const getRideRecords = async (filters = {}) => {
  let query = supabase
    .from('bookings')
    .select(`
      *,
      customer:users!bookings_customer_id_fkey ( name ),
      driver:drivers!bookings_driver_id_fkey   ( name, vehicle_type )
    `)
    .order('created_at', { ascending: false })

  if (filters.status)      query = query.eq('status', filters.status)
  if (filters.vehicleType) query = query.eq('vehicle_type', filters.vehicleType)
  if (filters.from)        query = query.gte('created_at', filters.from)
  if (filters.to)          query = query.lte('created_at', filters.to)

  const { data, error } = await query
  handleError(error, 'getRideRecords')

  return (data ?? []).map(b => ({
    ...b,
    customer:    b.customer?.name ?? 'Unknown',
    driver:      b.driver?.name   ?? 'Unknown',
    vehicleType: b.driver?.vehicle_type ?? b.vehicle_type ?? '',
    date:        b.created_at?.slice(0, 10),
    time:        new Date(b.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
  }))
}
