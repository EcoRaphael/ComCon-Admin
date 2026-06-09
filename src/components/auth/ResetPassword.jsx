// src/components/auth/ResetPassword.jsx
// Handles password reset after user clicks the email link

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'

export default function ResetPassword() {
  const navigate              = useNavigate()
  const [password, setPass]   = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8)         { setError('Password must be at least 8 characters.');    return }
    if (password !== confirm)         { setError('Passwords do not match.');                    return }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-dark flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-green/10 border border-green/20 flex items-center justify-center text-3xl mx-auto mb-4">🛺</div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Commuter<span className="text-green">Connect</span>
          </h1>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          {done ? (
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-lg font-bold text-navy mb-2">Password updated!</h2>
              <p className="text-sm text-sub">Redirecting to login in 3 seconds...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-extrabold text-navy">New password</h2>
                <p className="text-sub text-sm mt-1">Choose a strong password for your account.</p>
              </div>
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-brand-red text-sm rounded-card px-4 py-3 mb-4">
                    ⚠️ {error}
                  </div>
                )}
                <div className="mb-4">
                  <label className="field-label">New password</label>
                  <input type="password" className="field-input" placeholder="At least 8 characters"
                    value={password} onChange={e => setPass(e.target.value)} disabled={loading} autoFocus />
                </div>
                <div className="mb-6">
                  <label className="field-label">Confirm password</label>
                  <input type="password" className="field-input" placeholder="Repeat password"
                    value={confirm} onChange={e => setConfirm(e.target.value)} disabled={loading} />
                </div>
                <button type="submit" disabled={loading}
                  className="btn-primary w-full justify-center py-3 disabled:opacity-60">
                  {loading ? 'Saving...' : 'Update password →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}