// src/components/layout/Topbar.jsx
import { useLocation, useNavigate } from 'react-router-dom'
import { useAdmin } from '@/lib/AdminContext'
import { useAuth } from '@/lib/AuthContext'
import { useToastCtx } from '@/lib/ToastContext'
import { useDarkMode } from '@/hooks/useDarkMode'
import { Menu, Bell, Settings, Sun, Moon } from 'lucide-react'

const PAGE_META = {
  '/':               { title: 'Dashboard',       sub: 'CommuterConnect · Calbayog City, Samar',    cta: null              },
  '/map':            { title: 'Live Map',        sub: 'Real-time driver tracking',                 cta: null              },
  '/drivers':        { title: 'Drivers',         sub: null,   cta: '+ Add Driver'    },
  '/customers':      { title: 'Commuters',       sub: null,   cta: null              },
  '/bookings':       { title: 'Bookings',        sub: null,   cta: null              },
  '/routes':         { title: 'Routes',          sub: null,   cta: '+ Add Route'     },
  '/schedules':      { title: 'Schedules',       sub: null,   cta: null              },
  '/reports':        { title: 'Reports',         sub: null,   cta: null              },
  '/ratings':        { title: 'Ratings',         sub: null,   cta: null              },
  '/payments':       { title: 'Payments',        sub: null,   cta: null              },
  '/fares':          { title: 'Fare Manager',    sub: null,   cta: null              },
  '/analytics':      { title: 'Analytics',       sub: null,   cta: null              },
  '/records':        { title: 'Ride Records',    sub: null,   cta: null              },
  '/notifications':  { title: 'Notifications',   sub: null,   cta: null              },
  '/settings':       { title: 'Settings',        sub: 'System configuration & objectives',           cta: null              },
  '/profile':        { title: 'My Profile',      sub: 'Manage your admin account',                    cta: null              },
}

// CTA actions — if already on the page dispatch a custom event,
// otherwise navigate with state to trigger the modal on arrival
const CTA_ACTIONS = {
  '/drivers': (navigate, currentPath) => {
    if (currentPath === '/drivers') {
      window.dispatchEvent(new CustomEvent('cc:openModal', { detail: 'driver' }))
    } else {
      navigate('/drivers', { state: { openModal: true } })
    }
  },
  '/routes': (navigate, currentPath) => {
    if (currentPath === '/routes') {
      window.dispatchEvent(new CustomEvent('cc:openModal', { detail: 'route' }))
    } else {
      navigate('/routes', { state: { openModal: true } })
    }
  },
}

export default function Topbar() {
  const { setSidebarOpen, stats } = useAdmin()
  const { profile, signOut }      = useAuth()
  const { toast }                 = useToastCtx()
  const { isDark, toggle }        = useDarkMode()
  const location = useLocation()
  const navigate = useNavigate()
  const meta = PAGE_META[location.pathname] || PAGE_META['/']

  const firstName = profile?.name?.split(' ')[0] ?? 'Admin'

  const handleCta = () => {
    const action = CTA_ACTIONS[location.pathname]
    if (action) action(navigate, location.pathname)
  }

  return (
    <header className="h-16 bg-white dark:bg-card-dm border-b border-border dark:border-border-dark flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 flex-shrink-0 transition-colors duration-200">

      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-2 rounded-xl hover:bg-surface dark:hover:bg-bg-dark-secondary transition-colors"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} className="text-navy dark:text-text-dark-primary" />
        </button>
        <div>
          <h1 className="text-base font-extrabold text-navy dark:text-text-dark-primary leading-tight tracking-tight">
            {meta.title}
          </h1>
          <p className="text-xs text-sub dark:text-sub-dm hidden sm:block">
            {meta.sub}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">

        {/* Notification bell */}
        <button
          className="relative p-2 rounded-xl hover:bg-surface dark:hover:bg-bg-dark-secondary border border-border dark:border-border-dark transition-colors"
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
        >
          <Bell size={18} className="text-sub dark:text-sub-dm" />
          {stats.openReports > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-cta rounded-full animate-pulse" />
          )}
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-xl border border-border dark:border-border-dark hover:bg-surface dark:hover:bg-bg-dark-secondary transition-colors"
        >
          {isDark
            ? <Sun  size={18} className="text-amber-400" />
            : <Moon size={18} className="text-sub" />
          }
        </button>

        {/* Settings */}
        <button
          className="hidden sm:flex p-2 rounded-xl hover:bg-surface dark:hover:bg-bg-dark-secondary border border-border dark:border-border-dark transition-colors"
          onClick={() => navigate('/settings')}
          aria-label="Settings"
        >
          <Settings size={18} className="text-sub dark:text-sub-dm" />
        </button>

        {/* CTA — only shown on pages that have one, navigates + triggers modal */}
        {meta.cta && (
          <button className="btn-primary btn-sm" onClick={handleCta}>
            {meta.cta}
          </button>
        )}

        {/* User avatar — click to open profile page */}
        <button
          className="hidden sm:flex items-center gap-2 pl-3 border-l border-border dark:border-border-dark ml-1 hover:opacity-75 transition-opacity"
          onClick={() => navigate('/profile')}
          title="My Profile"
        >
          <div className="w-8 h-8 rounded-full bg-cta flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
            {(() => { try { const a = localStorage.getItem('cc-avatar'); return a ? <img src={a} alt="" className="w-full h-full object-cover" /> : null } catch { return null } })()
              || (profile?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'AD')}
          </div>
          <span className="text-sm font-semibold text-navy dark:text-text-dark-primary hidden md:block">
            {firstName}
          </span>
        </button>
      </div>
    </header>
  )
}