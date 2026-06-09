// src/components/auth/ForgotPassword.jsx
// Sends a password reset email via Supabase Auth

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'

export default function ForgotPassword() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Please enter your email address.'); return }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message || 'Failed to send reset email.')
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
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="text-lg font-bold text-navy mb-2">Check your email</h2>
              <p className="text-sm text-sub mb-6">
                We sent a password reset link to <strong>{email}</strong>.
                Check your inbox and follow the instructions.
              </p>
              <Link to="/login" className="btn-primary inline-flex">Back to login</Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-extrabold text-navy">Reset password</h2>
                <p className="text-sub text-sm mt-1">
                  Enter your email and we'll send a reset link.
                </p>
              </div>
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-brand-red text-sm rounded-card px-4 py-3 mb-4">
                    ⚠️ {error}
                  </div>
                )}
                <div className="mb-5">
                  <label className="field-label">Email address</label>
                  <input
                    type="email"
                    className="field-input"
                    placeholder="admin@commuterconnect.ph"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3 disabled:opacity-60"
                >
                  {loading ? 'Sending...' : 'Send reset link →'}
                </button>
              </form>
              <p className="text-center text-xs text-sub mt-5">
                <Link to="/login" className="text-green font-semibold hover:underline">
                  ← Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}