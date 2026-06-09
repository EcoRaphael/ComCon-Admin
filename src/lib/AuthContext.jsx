// src/lib/AuthContext.jsx
// Part 2: Authentication
// Wraps Supabase Auth — provides session, user, role, login, logout
// to the entire app via React Context

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session,        setSession]        = useState(undefined)
  const [profile,        setProfile]        = useState(null)
  const [loadingAuth,    setLoading]        = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  // true while we're still fetching profile (even silently in background)
  const [profileFetching, setProfileFetching] = useState(true)

  const finishLoading = useCallback(() => {
    setLoading(false)
  }, [])

  // Fetch the admin profile row from the users table
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      setProfileLoading(false)
      setProfileFetching(false)
      return
    }

    setProfileLoading(true)
    setProfileFetching(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, status, address')
        .eq('id', userId)
        .single()

      if (error) {
        console.warn('[AuthContext] fetchProfile error:', error.message)
        setProfile(null)
      } else {
        setProfile(data)
        try { localStorage.setItem('cc-profile', JSON.stringify(data)) } catch {}
      }
    } catch (err) {
      console.error('[AuthContext] fetchProfile threw:', err)
      setProfile(null)
    } finally {
      setProfileLoading(false)
      setProfileFetching(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    // ── Official Supabase session check + auth listener ────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          setSession(session)
          return
        }

        // INITIAL_SESSION fires on mount with the current session (or null)
        // SIGNED_IN fires after login
        // SIGNED_OUT fires after logout
        setSession(session ?? null)

        if (session?.user?.id) {
          // Try cached profile first for instant load
          const cachedProfile = (() => {
            try {
              const p = localStorage.getItem('cc-profile')
              return p ? JSON.parse(p) : null
            } catch { return null }
          })()

          if (cachedProfile?.id === session.user.id) {
            setProfile(cachedProfile)
            setProfileLoading(false)
            finishLoading()
            // Silently refresh in background
            fetchProfile(session.user.id).catch(() => {})
          } else {
            setProfileLoading(false)
            finishLoading()
            fetchProfile(session.user.id).catch(() => {})
          }
        } else {
          setProfile(null)
          setProfileLoading(false)
          finishLoading()
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, finishLoading])

  // Sign in with email + password
  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    let userRow = null

    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 800))

      const { data: row } = await supabase
        .from('users')
        .select('role, status')
        .eq('id', data.user.id)
        .single()

      if (row) { userRow = row; break }
    }

    if (!userRow) {
      await supabase.auth.signOut()
      throw new Error('Account not found. Contact your administrator.')
    }
    if (userRow.role !== 'admin') {
      await supabase.auth.signOut()
      throw new Error('Access denied. This panel is for administrators only.')
    }
    if (userRow.status === 'suspended') {
      await supabase.auth.signOut()
      throw new Error('Your account has been suspended. Contact support.')
    }

    return data
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    try { localStorage.removeItem('cc-profile') } catch {}
  }, [])

  const isLoggedIn = !!session
  const isAdmin    = profile?.role === 'admin'

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      setProfile,   // exposed so Settings.jsx can update local state after profile save
      loadingAuth,
      profileLoading,
      profileFetching,
      isAdmin,
      isLoggedIn,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}