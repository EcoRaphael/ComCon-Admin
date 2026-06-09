// src/lib/AdminContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
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
        supabase.from('bookings').select('*, users!customer_id(name,phone,email), drivers!driver_id(name,plate,vehicle_type)').order('created_at', { ascending: false }),
        supabase.from('reports').select('*, users!customer_id(name), drivers!driver_id(name,plate)').order('created_at', { ascending: false }),
        supabase.from('ratings').select('*, users!customer_id(name), drivers!driver_id(name,vehicle_type)').order('created_at', { ascending: false }),
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

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── DRIVERS ───────────────────────────────────────────────
  const toggleDriverStatus = useCallback(async (id) => {
    const driver = drivers.find(d => d.id === id)
    if (!driver) return
    const newStatus = driver.status === 'active' ? 'inactive' : 'active'
    await supabase.from('drivers').update({ status: newStatus }).eq('id', id)
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d))
  }, [drivers])

  const verifyDriver = useCallback(async (id) => {
    await supabase.from('drivers').update({ verified: true }).eq('id', id)
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, verified: true } : d))
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
  const updateBookingStatus = useCallback(async (id, status) => {
    await supabase.from('bookings').update({ status }).eq('id', id)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
  }, [])

  // ── REPORTS ───────────────────────────────────────────────
  const resolveReport = useCallback(async (id) => {
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', id)
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r))
  }, [])

  const updateReportStatus = useCallback(async (id, status) => {
    await supabase.from('reports').update({ status }).eq('id', id)
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }, [])

  // ── CUSTOMERS ─────────────────────────────────────────────
  const toggleCustomerStatus = useCallback(async (id) => {
    const customer = customers.find(c => c.id === id)
    if (!customer) return
    const newStatus = customer.status === 'active' ? 'suspended' : 'active'
    await supabase.from('users').update({ status: newStatus }).eq('id', id)
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
  }, [customers])

  // ── ROUTES ────────────────────────────────────────────────
  const addRoute = useCallback(async (form) => {
    const { data } = await supabase.from('routes').insert({
      name: form.name, origin: form.from, destination: form.to,
      distance_km: parseFloat(form.distance) || 0,
      vehicle_types: form.vehicleTypes, status: 'active',
    }).select().single()
    if (data) setRoutes(prev => [data, ...prev])
  }, [])

  const toggleRouteStatus = useCallback(async (id) => {
    const route = routes.find(r => r.id === id)
    if (!route) return
    const newStatus = route.status === 'active' ? 'inactive' : 'active'
    await supabase.from('routes').update({ status: newStatus }).eq('id', id)
    setRoutes(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
  }, [routes])

  // ── FARE MATRIX ───────────────────────────────────────────
  const updateFare = useCallback(async (vehicleType, updates) => {
    await supabase.from('fare_matrix').update({ ...updates, updated_at: new Date().toISOString() }).eq('vehicle_type', vehicleType)
    setFareMatrix(prev => prev.map(f => f.vehicle_type === vehicleType ? { ...f, ...updates } : f))
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
    totalRevenue:        payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0),
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
      toggleDriverStatus, verifyDriver, addDriver, deleteDriver,
      updateBookingStatus,
      resolveReport, updateReportStatus,
      toggleCustomerStatus,
      addRoute, toggleRouteStatus,
      updateFare,
      verifyVehicle,
      markNotificationRead, markAllNotificationsRead,
      logActivity,
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