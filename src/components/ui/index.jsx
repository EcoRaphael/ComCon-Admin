// src/components/ui/index.jsx
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
// All small reusable UI primitives

import clsx from 'clsx'
import { supabase } from '@/lib/supabase/client'

/* ── Badge ── */
export function Badge({ children, variant = 'gray', className }) {
  const variants = {
    green: 'badge-green',
    red: 'badge-red',
    amber: 'badge-amber',
    blue: 'badge-blue',
    purple: 'badge-purple',
    gray: 'badge-gray',
  }
  return (
    <span className={clsx(variants[variant] || 'badge-gray', className)}>
      <span className="badge-dot" />
      {children}
    </span>
  )
}

/* ── Status Badge (maps strings → variants) ── */
export function StatusBadge({ status }) {
  const map = {
    active: { v: 'green', label: 'Active' },
    inactive: { v: 'red', label: 'Off Duty' },
    completed: { v: 'green', label: 'Completed' },
    ongoing: { v: 'blue', label: 'Ongoing' },
    pending: { v: 'amber', label: 'Pending' },
    cancelled: { v: 'red', label: 'Cancelled' },
    resolved: { v: 'green', label: 'Resolved' },
    'under review': { v: 'blue', label: 'Under Review' },
    suspended: { v: 'red', label: 'Suspended' },
    High: { v: 'red', label: 'High' },
    Medium: { v: 'amber', label: 'Medium' },
    Low: { v: 'green', label: 'Low' },
  }
  const { v, label } = map[status] || { v: 'gray', label: status }
  return <Badge variant={v}>{label}</Badge>
}

/* ── Avatar ── */
export function Avatar({ initials, color, size = 'md', className, userId }) {
  const [broken, setBroken] = useState(false)
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' }

  // If a userId is given, check for a real uploaded photo (same bucket +
  // path convention as AdminProfile.jsx / the commuter+driver app) and
  // show it instead of initials. getPublicUrl is a pure client-side
  // string construction — no network call — so this is cheap even in a
  // long list.
  const publicUrl = userId
    ? supabase.storage.from('avatar').getPublicUrl(`avatar-${userId}.jpg`).data?.publicUrl
    : null
  const showImg = publicUrl && !broken

  return (
    <div
      className={clsx('rounded-full flex items-center justify-center font-extrabold text-white flex-shrink-0 overflow-hidden', sizes[size], className)}
      style={{ background: showImg ? undefined : (color || '#00b86b') }}
    >
      {showImg
        ? <img src={publicUrl} alt="" className="w-full h-full object-cover" onError={() => setBroken(true)} />
        : initials}
    </div>
  )
}

/* ── Stat Card ── */
export function StatCard({ icon, iconBg, value, label, trend, trendUp }) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center text-xl', iconBg || 'bg-green-light')}>
          {icon}
        </div>
        {trend && (
          <span className={clsx('text-xs font-bold px-2 py-1 rounded-lg', trendUp ? 'bg-green-light text-green' : 'bg-red-50 text-brand-red')}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-navy leading-none">{value}</p>
      <p className="text-sm text-sub mt-1">{label}</p>
    </div>
  )
}

/* ── Card ── */
export function Card({ children, className }) {
  return <div className={clsx('card', className)}>{children}</div>
}
export function CardHead({ title, subtitle, action }) {
  return (
    <div className="card-head">
      <div>
        <h3 className="font-bold text-navy">{title}</h3>
        {subtitle && <p className="text-xs text-sub mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ── Modal ── */
export function Modal({ open, onClose, title, children }) {
  // Lock body scroll while open so the page behind it can't also scroll —
  // hook must run unconditionally (before the `if (!open)` early return)
  // per React's rules, so the open-check lives inside the effect instead.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [open])

  if (!open) return null
  // Rendered via a portal directly into document.body — NOT as a normal
  // nested child of the page. AdminLayout locks the whole app to
  // `h-screen overflow-hidden` at the root, with <main> as the actual
  // scrolling container; a `position: fixed` element nested deep inside
  // that structure can end up positioned relative to the wrong ancestor
  // instead of the real browser viewport, which is exactly what caused
  // the modal to only be visible after scrolling. Portaling out to
  // document.body sidesteps that entirely, regardless of how any page's
  // layout is structured, now or in the future.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-extrabold text-navy">{title}</h3>
          <button
            onClick={onClose}
            className="text-sub hover:text-navy text-xl leading-none transition-colors"
          >✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}

/* ── Form Field ── */
export function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}

/* ── Progress Bar ── */
export function ProgressBar({ value, color = 'bg-green', className }) {
  return (
    <div className={clsx('bg-surface rounded-full h-2 overflow-hidden', className)}>
      <div className={clsx('h-full rounded-full transition-all duration-500', color)} style={{ width: `${value}%` }} />
    </div>
  )
}

/* ── Mini Bar Chart (inline sparkline) ── */
export function MiniBarChart({ data, valueKey = 'value' }) {
  const max = Math.max(...data.map(d => d[valueKey]))
  return (
    <div className="mini-bar-chart">
      {data.map((d, i) => (
        <div
          key={i}
          className={clsx('mini-bar', i === data.length - 2 && 'active')}
          style={{ height: `${(d[valueKey] / max) * 100}%` }}
          title={`${d.day}: ${d[valueKey]}`}
        />
      ))}
    </div>
  )
}

/* ── Table wrapper ── */
export function DataTable({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">{children}</table>
    </div>
  )
}

/* ── Empty state ── */
export function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="py-16 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="font-bold text-navy">{title}</p>
      {subtitle && <p className="text-sm text-sub mt-1">{subtitle}</p>}
    </div>
  )
}