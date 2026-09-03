// src/lib/AdminContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/AuthContext'

const AdminContext = createContext(null)

// Subscribes to postgres_changes for `table` and calls `refetch()` on any
// insert/update/delete, once `ready`. Used for every table below so the
// whole admin panel reflects changes live — a commuter booking, a driver
// going online, a new signup, etc. — instead of only updating on the next
// manual page refresh. Refetching via the same joined query (rather than
// trying to hand-merge the raw payload) keeps related driver/customer
// names and photos correct, matching how the driver app already does
// this in DriverBookings.jsx.
function useRealtimeSync(table, refetch, ready) {
  useEffect(() => {
    if (!ready) return
    const channel = supabase
      .channel(`admin_${table}_realtime`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => refetch())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [ready, refetch, table])
}

export function AdminProvider({ children }) {
  const { loadingAuth, isLoggedIn } = useAuth()
  const [drivers,       setDrivers]       = useState([])
  const [bookings,      setBookings]      = useState([])
  const [reports,       setReports]       = useState([])
  const [ratings,       setRatings]       = useState([])
  const [customers,     setCustomers]     = useState([])
  const [routes,        setRoutes]        = useState([])
  const [vehicles,      setVehicles]      = useState([])
  const [payments,      setPayments]      = useState([])
  const [notifications, setNotifications] = useState([])
  const [fareMatrix,    setFareMatrix]    = useState([])
  const [activityLog,   setActivityLog]   = useState([])
  const [loading,       setLoading]       = useState(true)
  const [sidebarOpen,   setSidebarOpen]   = useState(false)

  // ── FETCH ALL DATA ────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [
        { data: driversData },
        { data: bookingsData },
        { data: reportsData },
        { data: ratingsData },
        { data: customersData },
        { data: routesData },
        { data: vehiclesData },
        { data: paymentsData },
        { data: notificationsData },
        { data: fareData },
        { data: activityData },
      ] = await Promise.all([
        supabase.from('drivers').select('*').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*, users!customer_id(name,phone,email), drivers!driver_id(name,plate,vehicle_type,user_id,color)').order('created_at', { ascending: false }),
        supabase.from('reports').select('*, users!customer_id(name), drivers!driver_id(name,plate,user_id,color)').order('created_at', { ascending: false }),
        supabase.from('ratings').select('*, customer:users!customer_id(id, name, email), driver:drivers!driver_id(id, name, vehicle_type, plate, color, user_id)').order('created_at', { ascending: false }),
        supabase.from('users').select('*').eq('role', 'customer').order('created_at', { ascending: false }),
        supabase.from('routes').select('*').order('created_at', { ascending: false }),
        supabase.from('vehicles').select('*, drivers!driver_id(name,route,status)').order('created_at', { ascending: false }),
        supabase.from('payments').select('*, bookings!booking_id(pickup,dropoff,vehicle_type), drivers!driver_id(name,plate)').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('fare_matrix').select('*').order('vehicle_type'),
        supabase.from('activity_log').select('*, users!user_id(name)').order('created_at', { ascending: false }).limit(50),
      ])

      setDrivers(driversData            || [])
      setBookings(bookingsData           || [])
      setReports(reportsData             || [])
      setRatings(ratingsData             || [])
      setCustomers(customersData         || [])
      setRoutes(routesData               || [])
      setVehicles(vehiclesData           || [])
      setPayments(paymentsData           || [])
      setNotifications(notificationsData || [])
      setFareMatrix(fareData             || [])
      setActivityLog(activityData        || [])
    } catch (err) {
      console.error('[AdminContext] fetchAll error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Wait for auth to actually resolve before fetching anything. Without
  // this, fetchAll() can fire before Supabase's session is attached to
  // the client — every request goes out as anonymous, RLS returns zero
  // rows for every table, and the dashboard shows all zeros until a
  // refresh happens to win the race. If there's no session at all, skip
  // fetching (ProtectedRoute will redirect to /login).
  useEffect(() => {
    if (loadingAuth) return
    if (!isLoggedIn) { setLoading(false); return }
    fetchAll()
  }, [loadingAuth, isLoggedIn, fetchAll])

  // ── REALTIME ──────────────────────────────────────────────
  // Everything here was previously a one-time fetch on mount — nothing
  // in the admin panel updated after that unless the admin manually
  // refreshed. Each table gets its own dedicated refetch (matching its
  // exact select+joins from fetchAll) plus a subscription via the shared
  // useRealtimeSync hook above.
  const ready = !loadingAuth && isLoggedIn

  const fetchBookings = useCallback(async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, users!customer_id(name,phone,email), drivers!driver_id(name,plate,vehicle_type,user_id,color)')
      .order('created_at', { ascending: false })
    setBookings(data || [])
  }, [])
  useRealtimeSync('bookings', fetchBookings, ready)

  const fetchDrivers = useCallback(async () => {
    const { data } = await supabase.from('drivers').select('*').order('created_at', { ascending: false })
    setDrivers(data || [])
  }, [])
  useRealtimeSync('drivers', fetchDrivers, ready)

  const fetchReports = useCallback(async () => {
    const { data } = await supabase
      .from('reports')
      .select('*, users!customer_id(name), drivers!driver_id(name,plate,user_id,color)')
      .order('created_at', { ascending: false })
    setReports(data || [])
  }, [])
  useRealtimeSync('reports', fetchReports, ready)

  const fetchRatings = useCallback(async () => {
    const { data } = await supabase
      .from('ratings')
      .select('*, customer:users!customer_id(id, name, email), driver:drivers!driver_id(id, name, vehicle_type, plate, color, user_id)')
      .order('created_at', { ascending: false })
    setRatings(data || [])
  }, [])
  useRealtimeSync('ratings', fetchRatings, ready)

  const fetchCustomers = useCallback(async () => {
    const { data } = await supabase.from('users').select('*').eq('role', 'customer').order('created_at', { ascending: false })
    setCustomers(data || [])
  }, [])
  // Customers live in the shared `users` table alongside drivers/admins,
  // so this listens to the whole table — the fetch itself already
  // filters to role='customer', so a driver/admin change just triggers a
  // harmless refetch rather than incorrectly appearing in this list.
  useRealtimeSync('users', fetchCustomers, ready)

  const fetchRoutesTable = useCallback(async () => {
    const { data } = await supabase.from('routes').select('*').order('created_at', { ascending: false })
    setRoutes(data || [])
  }, [])
  useRealtimeSync('routes', fetchRoutesTable, ready)

  const fetchVehicles = useCallback(async () => {
    const { data } = await supabase
      .from('vehicles')
      .select('*, drivers!driver_id(name,route,status)')
      .order('created_at', { ascending: false })
    setVehicles(data || [])
  }, [])
  useRealtimeSync('vehicles', fetchVehicles, ready)

  const fetchPayments = useCallback(async () => {
    const { data } = await supabase
      .from('payments')
      .select('*, bookings!booking_id(pickup,dropoff,vehicle_type), drivers!driver_id(name,plate)')
      .order('created_at', { ascending: false })
    setPayments(data || [])
  }, [])
  useRealtimeSync('payments', fetchPayments, ready)

  const fetchFareMatrix = useCallback(async () => {
    const { data } = await supabase.from('fare_matrix').select('*').order('vehicle_type')
    setFareMatrix(data || [])
  }, [])
  useRealtimeSync('fare_matrix', fetchFareMatrix, ready)

  const fetchActivityLog = useCallback(async () => {
    const { data } = await supabase
      .from('activity_log')
      .select('*, users!user_id(name)')
      .order('created_at', { ascending: false })
      .limit(50)
    setActivityLog(data || [])
  }, [])
  useRealtimeSync('activity_log', fetchActivityLog, ready)

  // notifications is intentionally NOT synced here — Notifications.jsx
  // already manages its own independent realtime subscription with its
  // own local state, and this context's `notifications`/`setNotifications`
  // are unused everywhere else in the app.

  // ── DRIVERS ───────────────────────────────────────────────
  const toggleDriverStatus = useCallback(async (id) => {
    const driver = drivers.find(d => d.id === id)
    if (!driver) return { error: { message: 'Driver not found.' } }
    const newStatus = driver.status === 'active' ? 'inactive' : 'active'
    const { error } = await supabase.from('drivers').update({ status: newStatus }).eq('id', id)
    if (!error) setDrivers(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d))
    return { error }
  }, [drivers])

  const verifyDriver = useCallback(async (id) => {
    const driver = drivers.find(d => d.id === id)
    if (driver?.plate?.startsWith('PENDING-')) {
      return { error: { message: 'Set this driver\'s real plate number (from their License/OR/CR photos) before verifying.' } }
    }
    const { error } = await supabase.from('drivers').update({ verified: true }).eq('id', id)
    if (!error) setDrivers(prev => prev.map(d => d.id === id ? { ...d, verified: true } : d))
    return { error }
  }, [drivers])

  // Self-registered drivers (see LoginPage.jsx) don't submit a plate or
  // license number up front — admin reads those off the uploaded
  // License/OR/CR photos and fills them in here before verifying. Their
  // plate starts as a unique "PENDING-XXXXXXXX" placeholder until this
  // runs at least once.
  const updateDriverDetails = useCallback(async (id, { plate, licenseNo }) => {
    const patch = {}
    if (plate !== undefined) patch.plate = plate.trim().toUpperCase()
    if (licenseNo !== undefined) patch.license_no = licenseNo.trim()
    if (Object.keys(patch).length === 0) return { error: null }

    const { error } = await supabase.from('drivers').update(patch).eq('id', id)
    if (!error) {
      setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d))
    }
    return { error }
  }, [])

  // ── ADD DRIVER + VEHICLE together ─────────────────────────
  // Optimized: UI updates after step 2, vehicles+log run in parallel (non-blocking)
  const addDriver = useCallback(async (form) => {
    // Step 1: Create user (need ID for driver)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({ name: form.name, email: form.email || null, phone: form.phone || null, role: 'driver', status: 'active' })
      .select('id').single()
    if (userError) { console.error('[addDriver] user error:', userError); return }

    // Step 2: Create driver (need ID for vehicle)
    const { data: driverData, error: driverError } = await supabase
      .from('drivers')
      .insert({ user_id: userData.id, name: form.name, plate: form.plate, vehicle_type: form.type, route: form.route, license_no: form.licenseNo || null, status: 'inactive', verified: false })
      .select().single()
    if (driverError) { console.error('[addDriver] driver error:', driverError); return }

    // Step 3: Update UI immediately — modal closes, driver appears in list
    setDrivers(prev => [driverData, ...prev])

    // Step 4: Insert vehicle + activity log in parallel (background, non-blocking)
    Promise.all([
      supabase.from('vehicles').insert({
        driver_id: driverData.id, plate_number: form.plate, type: form.type,
        color: form.color || null, year: form.year ? parseInt(form.year) : null,
        brand: form.brand || null, or_number: form.orNumber || null,
        cr_number: form.crNumber || null, ltfrb_permit: form.ltfrbPermit || null,
        is_verified: false, status: 'active',
      }),
      supabase.from('activity_log')
        .insert({ icon: '🛺', text: `New driver registered — ${form.name} · ${form.type} · ${form.plate}`, user_id: userData.id })
        .select('id, icon, text, created_at').single()
    ]).then(([_, logResult]) => {
      if (logResult.data) setActivityLog(prev => [logResult.data, ...prev].slice(0, 50))
    }).catch(err => console.error('[addDriver] background inserts:', err))
  }, [])

  // ── DELETE DRIVER ─────────────────────────────────────────
  const deleteDriver = useCallback(async (id) => {
    const driver = drivers.find(d => d.id === id)
    // Delete child records first (FK constraints), then driver + user
    await Promise.all([
      supabase.from('vehicles').delete().eq('driver_id', id),
      supabase.from('schedules').delete().eq('driver_id', id),
    ])
    await supabase.from('drivers').delete().eq('id', id)
    if (driver?.user_id) {
      await supabase.from('users').delete().eq('id', driver.user_id)
    }
    setDrivers(prev => prev.filter(d => d.id !== id))
    setVehicles(prev => prev.filter(v => v.driver_id !== id))
  }, [drivers])

  // ── BOOKINGS ──────────────────────────────────────────────
  // ── BOOKINGS ──────────────────────────────────────────────
  // Booking status is intentionally NOT editable from the Admin Panel.
  // The ride lifecycle (accept/decline/start/complete) belongs to the
  // Driver App, and notifications for it are created automatically by a
  // DB trigger (see supabase/migrations/booking_notifications_trigger.sql)
  // regardless of which app changes the row. No update function is
  // exposed here on purpose — see Bookings.jsx, which is read-only.

  // ── REPORTS ───────────────────────────────────────────────
  const resolveReport = useCallback(async (id) => {
    const report = reports.find(r => r.id === id)
    const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', id)
    if (error) return { error }
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r))

    if (report?.customer_id) {
      const { data: notif, error: notifError } = await supabase.from('notifications').insert({
        user_id: report.customer_id,
        report_id: id,
        type: 'report',
        title: 'Report Resolved',
        message: `Your report about "${report.issue_type}" has been resolved.`,
      }).select().single()
      if (notifError) console.error('[resolveReport] notification insert failed:', notifError)
      if (notif) setNotifications(prev => [notif, ...prev])
    } else if (report) {
      console.warn('[resolveReport] report has no customer_id — no notification created:', report.id)
    }
    return { error: null }
  }, [reports])

  const updateReportStatus = useCallback(async (id, status) => {
    const report = reports.find(r => r.id === id)
    const { error } = await supabase.from('reports').update({ status }).eq('id', id)
    if (error) return { error }
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))

    if (report?.customer_id) {
      const { data: notif, error: notifError } = await supabase.from('notifications').insert({
        user_id: report.customer_id,
        report_id: id,
        type: 'report',
        title: `Report ${status}`,
        message: `Your report about "${report.issue_type}" is now ${status}.`,
      }).select().single()
      if (notifError) console.error('[updateReportStatus] notification insert failed:', notifError)
      if (notif) setNotifications(prev => [notif, ...prev])
    } else if (report) {
      console.warn('[updateReportStatus] report has no customer_id — no notification created:', report.id)
    }
    return { error: null }
  }, [reports])

  // ── CUSTOMERS ─────────────────────────────────────────────
  const toggleCustomerStatus = useCallback(async (id) => {
    const customer = customers.find(c => c.id === id)
    if (!customer) return { error: { message: 'Customer not found.' } }
    const newStatus = customer.status === 'active' ? 'suspended' : 'active'
    const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', id)
    if (!error) setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
    return { error }
  }, [customers])

  // ── ROUTES ────────────────────────────────────────────────
  const addRoute = useCallback(async (form) => {
    const { data, error } = await supabase.from('routes').insert({
      name: form.name, origin: form.from, destination: form.to,
      distance_km: parseFloat(form.distance) || 0,
      vehicle_types: form.vehicleTypes, status: 'active',
    }).select().single()
    if (data) setRoutes(prev => [data, ...prev])
    return { error }
  }, [])

  const toggleRouteStatus = useCallback(async (id) => {
    const route = routes.find(r => r.id === id)
    if (!route) return { error: { message: 'Route not found.' } }
    const newStatus = route.status === 'active' ? 'inactive' : 'active'
    const { error } = await supabase.from('routes').update({ status: newStatus }).eq('id', id)
    if (!error) setRoutes(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
    return { error }
  }, [routes])

  // ── FARE MATRIX ───────────────────────────────────────────
  const updateFare = useCallback(async (vehicleType, updates) => {
    const { error } = await supabase.from('fare_matrix').update({ ...updates, updated_at: new Date().toISOString() }).eq('vehicle_type', vehicleType)
    if (!error) setFareMatrix(prev => prev.map(f => f.vehicle_type === vehicleType ? { ...f, ...updates } : f))
    return { error }
  }, [])

  // ── VEHICLES ──────────────────────────────────────────────
  const verifyVehicle = useCallback(async (id) => {
    await supabase.from('vehicles').update({ is_verified: true, verified_at: new Date().toISOString() }).eq('id', id)
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, is_verified: true } : v))
  }, [])

  // ── NOTIFICATIONS ─────────────────────────────────────────
  const markNotificationRead = useCallback(async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }, [])

  const markAllNotificationsRead = useCallback(async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }, [])

  // ── ACTIVITY LOG ──────────────────────────────────────────
  const logActivity = useCallback(async (icon, text, userId = null) => {
    const { data: entry } = await supabase
      .from('activity_log')
      .insert({ icon, text, user_id: userId })
      .select().single()
    if (entry) setActivityLog(prev => [entry, ...prev].slice(0, 50))
  }, [])

  // ── SCHEDULE TEMPLATE + AUTO-GENERATE ──────────────────────
  // Admin sets the default days/hours in Settings; "Auto-Generate
  // Schedules" in Schedules.jsx uses it to bulk-create one schedule row
  // per day for every verified driver who doesn't have any schedule yet.
  const getScheduleTemplate = useCallback(async () => {
    const { data, error } = await supabase
      .from('app_settings').select('value').eq('key', 'default_schedule_template').single()
    if (error || !data) {
      // Fall back to a sensible default if the settings row is somehow
      // missing (e.g. migration not run yet) rather than hard-failing.
      return { template: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], start_time: '06:00', end_time: '18:00' }, error: null }
    }
    return { template: data.value, error: null }
  }, [])

  const saveScheduleTemplate = useCallback(async (template) => {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'default_schedule_template', value: template, updated_at: new Date().toISOString() })
    return { error }
  }, [])

  const generateSchedulesForVerifiedDrivers = useCallback(async () => {
    const { template, error: templateError } = await getScheduleTemplate()
    if (templateError) return { error: templateError }
    if (!template?.days?.length || !template.start_time || !template.end_time) {
      return { error: { message: 'Set a default schedule template in Settings first.' } }
    }

    const verifiedDrivers = drivers.filter(d => d.verified)
    if (verifiedDrivers.length === 0) {
      return { error: null, created: 0, skipped: 0 }
    }

    // Fill in gaps per (driver, day) rather than skipping a driver
    // entirely just because they already have SOME schedule. Without
    // this, updating the template (e.g. adding Sunday) after drivers
    // already had Mon–Sat generated would never actually add the new
    // day for them — they'd be silently skipped forever.
    const { data: existing, error: existingError } = await supabase
      .from('schedules')
      .select('driver_id, day_of_week')
      .in('driver_id', verifiedDrivers.map(d => d.id))
    if (existingError) return { error: existingError }

    const existingSet = new Set((existing || []).map(s => `${s.driver_id}::${s.day_of_week}`))

    const rows = []
    for (const d of verifiedDrivers) {
      for (const day of template.days) {
        if (!existingSet.has(`${d.id}::${day}`)) {
          rows.push({
            driver_id: d.id,
            day_of_week: day,
            start_time: template.start_time,
            end_time: template.end_time,
            is_active: true,
          })
        }
      }
    }

    if (rows.length === 0) {
      return { error: null, created: 0, skipped: verifiedDrivers.length }
    }

    const driversAffected = new Set(rows.map(r => r.driver_id)).size

    const { data: inserted, error: insertError } = await supabase
      .from('schedules')
      .insert(rows)
      .select('*, drivers(name, vehicle_type, plate, color, status, route)')
    if (insertError) return { error: insertError }

    return {
      error: null,
      created: driversAffected,
      skipped: verifiedDrivers.length - driversAffected,
      slotsAdded: rows.length,
      inserted,
    }
  }, [drivers, getScheduleTemplate])

  // ── STATS ─────────────────────────────────────────────────
  const stats = {
    activeDrivers:       drivers.filter(d => d.status === 'active').length,
    totalDrivers:        drivers.length,
    unverifiedDrivers:   drivers.filter(d => !d.verified).length,
    totalCustomers:      customers.length,
    activeCustomers:     customers.filter(c => c.status === 'active').length,
    totalBookings:       bookings.length,
    completedBookings:   bookings.filter(b => b.status === 'completed').length,
    pendingBookings:     bookings.filter(b => b.status === 'pending').length,
    ongoingBookings:     bookings.filter(b => b.status === 'ongoing').length,
    cancelledBookings:   bookings.filter(b => b.status === 'cancelled').length,
    openReports:         reports.filter(r => r.status !== 'resolved').length,
    highSeverityReports: reports.filter(r => r.severity === 'High').length,
    totalRevenue:        payments.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount || 0), 0),
    avgRating:           drivers.length ? (drivers.reduce((s, d) => s + Number(d.rating || 0), 0) / drivers.length).toFixed(1) : '0.0',
    totalRoutes:         routes.filter(r => r.status === 'active').length,
    totalVehicles:       vehicles.length,
    unverifiedVehicles:  vehicles.filter(v => !v.is_verified).length,
    unreadNotifications: notifications.filter(n => !n.is_read).length,
    totalPayments:       payments.length,
    pendingPayments:     payments.filter(p => p.status === 'pending').length,
  }

  return (
    <AdminContext.Provider value={{
      drivers, bookings, reports, ratings, customers,
      routes, vehicles, payments, notifications, fareMatrix, activityLog,
      loading, sidebarOpen, setSidebarOpen,
      fetchAll,
      toggleDriverStatus, verifyDriver, updateDriverDetails, addDriver, deleteDriver,
      resolveReport, updateReportStatus,
      toggleCustomerStatus,
      addRoute, toggleRouteStatus,
      updateFare,
      verifyVehicle,
      markNotificationRead, markAllNotificationsRead,
      logActivity,
      getScheduleTemplate, saveScheduleTemplate, generateSchedulesForVerifiedDrivers,
      stats,
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}