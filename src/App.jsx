// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }  from '@/lib/AuthContext'
import { AdminProvider } from '@/lib/AdminContext'
import { ToastProvider } from '@/lib/ToastContext'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AdminLayout    from '@/components/layout/AdminLayout'
import LoginPage      from '@/components/auth/LoginPage'
import ForgotPassword from '@/components/auth/ForgotPassword'
import ResetPassword  from '@/components/auth/ResetPassword'

// Pages
import Dashboard     from '@/components/pages/Dashboard'
import LiveMap       from '@/components/pages/LiveMap'
import Drivers       from '@/components/pages/Drivers'
import Customers     from '@/components/pages/Customers'
import Bookings      from '@/components/pages/Bookings'
import RoutesPage    from '@/components/pages/Routes'
import Schedules     from '@/components/pages/Schedules'
import Reports       from '@/components/pages/Reports'
import Ratings       from '@/components/pages/Ratings'
import Payments      from '@/components/pages/Payments'
import Fares         from '@/components/pages/Fares'
import Analytics     from '@/components/pages/Analytics'
import Records       from '@/components/pages/Records'
import Notifications from '@/components/pages/Notifications'
import Settings      from '@/components/pages/Settings'
import AdminProfile  from '@/components/pages/AdminProfile'

// Wrap each page in ProtectedRoute + AdminLayout
function AdminPage({ children }) {
  return (
    <ProtectedRoute>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
      <AuthProvider>
        <ToastProvider>
          <AdminProvider>
            <Routes>
              {/* Public */}
              <Route path="/login"           element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password"  element={<ResetPassword />} />

              {/* Protected — flat routes, no nesting */}
              <Route path="/"              element={<AdminPage><Dashboard /></AdminPage>} />
              <Route path="/map"           element={<AdminPage><LiveMap /></AdminPage>} />
              <Route path="/drivers"       element={<AdminPage><Drivers /></AdminPage>} />
              <Route path="/customers"     element={<AdminPage><Customers /></AdminPage>} />
              <Route path="/bookings"      element={<AdminPage><Bookings /></AdminPage>} />
              <Route path="/routes"        element={<AdminPage><RoutesPage /></AdminPage>} />
              <Route path="/schedules"     element={<AdminPage><Schedules /></AdminPage>} />
              <Route path="/reports"       element={<AdminPage><Reports /></AdminPage>} />
              <Route path="/ratings"       element={<AdminPage><Ratings /></AdminPage>} />
              <Route path="/payments"      element={<AdminPage><Payments /></AdminPage>} />
              <Route path="/fares"         element={<AdminPage><Fares /></AdminPage>} />
              <Route path="/analytics"     element={<AdminPage><Analytics /></AdminPage>} />
              <Route path="/records"       element={<AdminPage><Records /></AdminPage>} />
              <Route path="/notifications" element={<AdminPage><Notifications /></AdminPage>} />
              <Route path="/settings"      element={<AdminPage><Settings /></AdminPage>} />
              <Route path="/profile"       element={<AdminPage><AdminProfile /></AdminPage>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AdminProvider>
        </ToastProvider>
      </AuthProvider>
  )
}