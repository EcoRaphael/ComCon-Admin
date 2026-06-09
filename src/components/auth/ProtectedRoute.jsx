// src/components/auth/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import Spinner from '@/components/ui/Spinner'

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loadingAuth, profileLoading, profileFetching, isAdmin } = useAuth()
  const location = useLocation()

  if (loadingAuth)                        return <Spinner fullScreen label="Loading CommuterConnect..." />
  if (!isLoggedIn)                        return <Navigate to="/login" state={{ from: location }} replace />
  if (profileLoading)                     return <Spinner fullScreen label="Loading CommuterConnect..." />
  if (profileFetching && !isAdmin)        return <Spinner fullScreen label="Loading CommuterConnect..." />
  if (!isAdmin)                           return <AccessDenied />

  return children
}

function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="text-center max-w-sm px-6">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="text-xl font-bold text-navy mb-2">Access Denied</h2>
        <p className="text-sub text-sm mb-6">
          This panel is for CommuterConnect administrators only.
        </p>
        <button className="btn-primary" onClick={() => window.location.href = '/login'}>
          Back to Login
        </button>
      </div>
    </div>
  )
}