import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { useToastCtx } from '@/lib/ToastContext'
import { useDarkMode } from '@/hooks/useDarkMode'
import { Eye, EyeOff, Sun, Moon } from 'lucide-react'
import AppLogo from '@/assets/logo.png'

export default function LoginPage() {
  const { signIn, isLoggedIn, loadingAuth } = useAuth()
  const { toast }               = useToastCtx()
  const { isDark, toggle }      = useDarkMode()
  const navigate                = useNavigate()
  const location                = useLocation()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)

  if (loadingAuth) return null

  if (isLoggedIn) {
    const dest = location.state?.from?.pathname || '/'
    return <Navigate to={dest} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    try {
      await signIn(email.trim(), password)
      toast('✅ Authentication successful!')
      const dest = location.state?.from?.pathname || '/'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message || 'Verification failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5 relative bg-cover bg-center"
      style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #1B5E20 100%)' }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Dark mode toggle — top right corner */}
      <button
        onClick={toggle}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="absolute top-5 right-5 z-20 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all"
      >
        {isDark
          ? <Sun  size={18} className="text-amber-400" />
          : <Moon size={18} className="text-white" />
        }
      </button>

      <div className="w-full max-w-[400px] z-10">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={AppLogo} alt="CommuterConnect" className="h-28 w-auto object-contain drop-shadow-2xl" />
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-card-dm rounded-[2.5rem] p-8 md:p-10 shadow-2xl transition-colors duration-200">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-navy tracking-tight">Admin Portal</h2>
            <p className="text-sub text-xs mt-1 font-medium">Authorized Access Only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-brand-red text-sm rounded-2xl px-4 py-3">
                ⚠️ {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-navy text-[10px] font-bold uppercase tracking-widest ml-1">
                Email Address
              </label>
              <input
                type="email"
                className="w-full h-12 px-4 mt-2 bg-surface border-2 border-transparent focus:border-cta/30 rounded-2xl outline-none text-sm font-medium text-navy transition-all"
                placeholder="admin@commuterconnect.ph"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-navy text-[10px] font-bold uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="w-full h-12 px-4 bg-surface border-2 border-transparent focus:border-cta/30 rounded-2xl outline-none text-sm font-medium text-navy transition-all pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sub hover:text-navy p-1 transition-colors"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-cta hover:bg-green-dark text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                       style={{ animation: 'cc-spin 1s linear infinite', transition: 'none' }} />
                : 'Sign In'
              }
            </button>

            <p className="text-center text-sub text-xs font-medium pt-1">
              System Monitored by LTO Calbayog
            </p>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-white/40 text-xs font-medium">
            CommuterConnect © 2026 · Calbayog City
          </p>
        </div>
      </div>
    </div>
  )
}