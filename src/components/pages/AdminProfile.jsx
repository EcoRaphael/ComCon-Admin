// src/components/pages/AdminProfile.jsx
// Dedicated admin profile page — accessible via avatar button in Topbar
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useToastCtx } from '@/lib/ToastContext'
import { supabase } from '@/lib/supabase/client'
import { Card, CardHead } from '@/components/ui'
import {
  User, Mail, Phone, Lock, Save, Edit3,
  ShieldCheck, AlertTriangle, RefreshCw, LogOut, Camera
} from 'lucide-react'

export default function AdminProfile() {
  const { profile, setProfile, signOut } = useAuth()
  const { toast } = useToastCtx()

  const [editing,       setEditing]      = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [showPw,        setShowPw]        = useState(false)
  const [savingPw,      setSavingPw]      = useState(false)
  const [pwError,       setPwError]       = useState('')
  const [profileForm,   setProfileForm]   = useState({
    name:  profile?.name  || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
  })
  const [pwForm, setPwForm] = useState({ next: '', confirm: '' })

  const [avatarUrl,       setAvatarUrl]       = useState(() => {
    try { return localStorage.getItem('cc-avatar') || null } catch { return null }
  })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // On mount — check Supabase Storage for existing avatar
  // Covers the case where image was uploaded directly in Supabase dashboard
  useEffect(() => {
    // On every mount — always fetch fresh URL from Supabase so latest upload shows
    // Try app-uploaded filename first, then fall back to manually uploaded file
    const tryFiles = ['admin-avatar.jpg', '20260224_075841_261.jpg']
    const load = async () => {
      for (const filename of tryFiles) {
        const { data } = supabase.storage.from('avatar').getPublicUrl(filename)
        if (!data?.publicUrl) continue
        // Add timestamp to bust any browser cache
        const url = data.publicUrl + '?t=' + Date.now()
        try {
          const res = await fetch(url, { method: 'HEAD' })
          if (res.ok) {
            setAvatarUrl(url)
            try { localStorage.setItem('cc-avatar', url) } catch {}
            return
          }
        } catch {}
      }
    }
    load()
  }, [])

  const initials = profile?.name
    ?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AD'

  // ── Upload avatar ─────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast('Image must be under 5MB'); return }
    if (!file.type.startsWith('image/')) { toast('Please select an image file'); return }

    setUploadingAvatar(true)
    try {
      // Upload to Supabase Storage bucket 'avatars'
      const ext  = file.name.split('.').pop().toLowerCase()
      const path = 'admin-avatar.jpg'  // fixed name — always overwrites same file

      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      // Get public URL with cache-busting
      const { data } = supabase.storage
        .from('avatar')
        .getPublicUrl(path)

      const url = data.publicUrl + '?t=' + Date.now()

      // Save to state + localStorage cache for instant display everywhere
      setAvatarUrl(url)
      try {
        localStorage.setItem('cc-avatar', url)
        // Notify Sidebar + Topbar to refresh
        window.dispatchEvent(new Event('storage'))
      } catch {}

      toast('Profile photo updated')
    } catch (err) {
      console.error('Avatar upload error:', err)
      toast('Upload failed: ' + (err.message || 'Check your storage bucket settings'))
    } finally {
      setUploadingAvatar(false)
    }
  }

  // ── Save profile ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!profileForm.name.trim()) { toast('Name is required'); return }
    setSaving(true)
    try {
      if (profileForm.email !== profile?.email) {
        const { error } = await supabase.auth.updateUser({ email: profileForm.email })
        if (error) throw error
      }
      const { error } = await supabase
        .from('users')
        .update({ name: profileForm.name, phone: profileForm.phone })
        .eq('id', profile?.id)
      if (error) throw error
      if (setProfile) setProfile(p => ({ ...p, ...profileForm }))
      // Update localStorage cache
      try {
        const cached = JSON.parse(localStorage.getItem('cc-profile') || '{}')
        localStorage.setItem('cc-profile', JSON.stringify({ ...cached, ...profileForm }))
      } catch {}
      toast('Profile updated successfully')
      setEditing(false)
    } catch (err) {
      toast('Failed to update: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Change password ───────────────────────────────────────────────
  const handleChangePassword = async () => {
    setPwError('')
    if (pwForm.next.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match.'); return }
    setSavingPw(true)
    try {
      const result = await Promise.race([
        supabase.auth.updateUser({ password: pwForm.next }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out.')), 10000))
      ])
      if (result.error) throw result.error
      toast('Password changed successfully')
      setPwForm({ next: '', confirm: '' })
      setShowPw(false)
    } catch (err) {
      setPwError(err.message || 'Failed to change password.')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-5 page-enter">

      {/* Avatar hero */}
      <div className="brand-gradient rounded-2xl p-6 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg border-2 border-white/30 bg-white/20 flex items-center justify-center">
            {avatarUrl
              ? <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={() => {
                    // Try original filename if current URL fails
                    const { data } = supabase.storage.from('avatar').getPublicUrl('20260224_075841_261.jpg')
                    if (data?.publicUrl && avatarUrl !== data.publicUrl) {
                      const url = data.publicUrl + '?t=' + Date.now()
                      setAvatarUrl(url)
                      try { localStorage.setItem('cc-avatar', url) } catch {}
                    } else {
                      setAvatarUrl(null)
                    }
                  }}
                />
              : <span className="text-white font-black text-2xl">{initials}</span>
            }
          </div>
          {/* Upload button */}
          <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-gray-50 transition-colors border border-gray-200">
            {uploadingAvatar
              ? <RefreshCw size={13} className="text-green animate-spin" />
              : <Camera size={13} className="text-navy" />
            }
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
          </label>
        </div>
        <div>
          <p className="text-white font-black text-xl">{profile?.name || 'Admin User'}</p>
          <p className="text-white/60 text-sm mt-0.5">{profile?.email || '—'}</p>
          <div className="flex gap-2 mt-2">
            <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck size={10} /> {profile?.role || 'admin'}
            </span>
            <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              {profile?.status || 'active'}
            </span>
          </div>
        </div>
      </div>

      {/* Profile info / edit */}
      <Card>
        <CardHead
          title="Profile Information"
          subtitle="Manage your admin account details"
          action={
            <button
              className="btn-ghost btn-sm flex items-center gap-1.5"
              onClick={() => {
                setEditing(e => !e)
                setProfileForm({ name: profile?.name || '', email: profile?.email || '', phone: profile?.phone || '' })
                setShowPw(false)
              }}
            >
              <Edit3 size={13} />
              {editing ? 'Cancel' : 'Edit'}
            </button>
          }
        />
        <div className="card-body space-y-4">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="field-label flex items-center gap-1.5"><User size={11} /> Full Name</label>
                <input className="field-input" value={profileForm.name}
                  onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your full name" />
              </div>
              <div>
                <label className="field-label flex items-center gap-1.5"><Mail size={11} /> Email Address</label>
                <input className="field-input" type="email" value={profileForm.email}
                  onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="admin@commuterconnect.ph" />
              </div>
              <div>
                <label className="field-label flex items-center gap-1.5"><Phone size={11} /> Phone Number</label>
                <input className="field-input" value={profileForm.phone}
                  onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+63 9XX XXX XXXX" />
              </div>
              <button
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
                onClick={handleSave} disabled={saving}
              >
                {saving
                  ? <RefreshCw size={14} className="animate-spin" />
                  : <><Save size={14} /> Save Changes</>
                }
              </button>
            </div>
          ) : (
            <div className="space-y-0 border border-border rounded-xl overflow-hidden">
              {[
                { icon: <User size={13} />,  label: 'Full Name', val: profile?.name  || '—' },
                { icon: <Mail size={13} />,  label: 'Email',     val: profile?.email || '—' },
                { icon: <Phone size={13} />, label: 'Phone',     val: profile?.phone || 'Not set' },
              ].map((row, i, arr) => (
                <div key={row.label}
                  className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-border' : ''}`}>
                  <span className="flex items-center gap-2 text-xs text-sub font-bold uppercase tracking-wider">
                    {row.icon} {row.label}
                  </span>
                  <span className="text-sm text-navy font-medium">{row.val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Change password */}
      <Card>
        <CardHead title="Security" subtitle="Change your account password" />
        <div className="card-body space-y-3">
          <button
            className="text-xs font-bold flex items-center gap-1.5 text-sub hover:text-navy transition-colors"
            onClick={() => { setShowPw(s => !s); setPwError(''); setEditing(false) }}
          >
            <Lock size={12} />
            {showPw ? 'Cancel password change' : 'Change password'}
          </button>

          {showPw && (
            <div className="space-y-3 pt-2 border-t border-border">
              {pwError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                  <AlertTriangle size={13} className="text-brand-red mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-brand-red font-medium">{pwError}</p>
                </div>
              )}
              <div>
                <label className="field-label">New Password</label>
                <input className="field-input" type="password" placeholder="At least 8 characters"
                  value={pwForm.next} onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">Confirm New Password</label>
                <input className="field-input" type="password" placeholder="Repeat password"
                  value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
              </div>
              <button
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
                onClick={handleChangePassword} disabled={savingPw}
              >
                {savingPw
                  ? <RefreshCw size={14} className="animate-spin" />
                  : <><Lock size={14} /> Update Password</>
                }
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Sign out */}
      <button
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-brand-red bg-red-50 hover:bg-red-100 font-semibold text-sm transition-colors"
        onClick={signOut}
      >
        <LogOut size={16} /> Sign Out
      </button>

    </div>
  )
}