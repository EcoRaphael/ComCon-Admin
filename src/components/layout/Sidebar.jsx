import { useState, useEffect } from 'react'
// src/components/layout/Sidebar.jsx
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAdmin } from '@/lib/AdminContext'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/AuthContext'
import clsx from 'clsx'
import { 
  LayoutDashboard, Map, Users, UserCircle, Ticket, Route, 
  Calendar, AlertCircle, Star, CreditCard, Banknote, 
  BarChart3, History, Bell, Settings, LogOut, Car
} from 'lucide-react'

const NAV = [
  {
    section: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      { icon: Map,             label: 'Live Map',  path: '/map' },
    ],
  },
  {
    section: 'Management',
    items: [
      { icon: Car,            label: 'Drivers',   path: '/drivers',   badge: 'unverifiedDrivers' },
      { icon: UserCircle,     label: 'Commuters', path: '/customers' },
      { icon: Ticket,         label: 'Bookings',  path: '/bookings',  badge: 'pendingBookings' },
      { icon: Route,          label: 'Routes',    path: '/routes' },
      { icon: Calendar,       label: 'Schedules', path: '/schedules' },
    ],
  },
  {
    section: 'Monitoring',
    items: [
      { icon: AlertCircle,    label: 'Reports',      path: '/reports',      badge: 'openReports' },
      { icon: Star,           label: 'Ratings',      path: '/ratings' },
      { icon: CreditCard,     label: 'Payments',     path: '/payments',     badge: 'pendingPayments' },
      { icon: Banknote,       label: 'Fare Manager', path: '/fares' },
      { icon: BarChart3,      label: 'Analytics',    path: '/analytics' },
    ],
  },
  {
    section: 'Records & System',
    items: [
      { icon: History,        label: 'Ride Records',  path: '/records' },
      { icon: Bell,           label: 'Notifications', path: '/notifications', badge: 'unreadNotifications' },
      { icon: Settings,       label: 'Settings',      path: '/settings' },
    ],
  },
]

export default function Sidebar() {
  const { stats, sidebarOpen, setSidebarOpen } = useAdmin()
  const { profile, signOut }                   = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const getBadge = (badge) => stats[badge] ?? null

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error(err)
    }
  }

  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AD'

  const [avatarUrl, setAvatarUrl] = useState(() => {
    try { return localStorage.getItem('cc-avatar') || null } catch { return null }
  })

  useEffect(() => {
    // Listen for upload events from AdminProfile page
    const handler = () => {
      try { setAvatarUrl(localStorage.getItem('cc-avatar') || null) } catch {}
    }
    window.addEventListener('storage', handler)

    // Always fetch fresh from Supabase on mount
    const fetchAvatar = async () => {
      const filenames = ['admin-avatar.jpg', '20260224_075841_261.jpg']
      for (const filename of filenames) {
        const { data } = supabase.storage.from('avatar').getPublicUrl(filename)
        if (!data?.publicUrl) continue
        try {
          const res = await fetch(data.publicUrl, { method: 'HEAD' })
          if (res.ok) {
            const url = data.publicUrl + '?t=' + Date.now()
            setAvatarUrl(url)
            try { localStorage.setItem('cc-avatar', url) } catch {}
            return
          }
        } catch {}
      }
    }
    fetchAvatar()

    return () => window.removeEventListener('storage', handler)
  }, [])

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={clsx(
        'fixed top-0 left-0 h-full z-50 w-64 flex flex-col transition-transform duration-300 shadow-2xl',
        'bg-green-dark lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
          <p className="text-white font-black text-base tracking-tight">
            Commuter<span style={{ color: '#66BB6A' }}>Connect</span>
          </p>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5 bg-black/10">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-green text-white flex items-center justify-center font-black text-sm flex-shrink-0">
            {avatarUrl
              ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              : initials
            }
          </div>
          <div className="min-w-0 text-white">
            <p className="font-bold text-sm truncate">{profile?.name ?? 'Admin User'}</p>
            <p className="text-white/40 text-[10px] truncate uppercase font-bold">Authorized Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {NAV.map(section => (
            <div key={section.section}>
              <p className="px-4 mb-2 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                {section.section}
              </p>
              <div className="space-y-1">
                {section.items.map(item => {
                  const badgeVal = item.badge ? getBadge(item.badge) : null
                  const isActive = item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path)

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-bold text-sm',
                        isActive
                          ? 'bg-green text-white shadow-lg'
                          : 'text-white/50 hover:bg-[#FF851B]/15 hover:text-[#FF851B]'
                      )}
                    >
                      <item.icon className={clsx(
                        'w-5 h-5 transition-colors duration-200',
                        isActive ? 'text-white' : 'text-white/30 group-hover:text-[#FF851B]'
                      )} />
                      <span>{item.label}</span>
                      {badgeVal > 0 && (
                        <span className={clsx(
                          'ml-auto text-[10px] font-black rounded-lg px-2 py-0.5',
                          isActive ? 'bg-green-dark text-white' : 'bg-green text-white'
                        )}>
                          {badgeVal}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sign Out — red hover */}
        <div className="px-4 py-4 border-t border-white/5">
          <button
            className="
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              text-white/40 font-bold text-sm
              transition-all duration-200 group
              hover:bg-red-500/15 hover:text-red-400
              active:scale-[0.98]
            "
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 transition-colors duration-200 group-hover:text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}