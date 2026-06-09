// src/components/ui/index.jsx
// All small reusable UI primitives

import clsx from 'clsx'

/* ── Badge ── */
export function Badge({ children, variant = 'gray', className }) {
  const variants = {
    green:  'badge-green',
    red:    'badge-red',
    amber:  'badge-amber',
    blue:   'badge-blue',
    purple: 'badge-purple',
    gray:   'badge-gray',
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
    active:       { v: 'green',  label: 'Active' },
    inactive:     { v: 'red',    label: 'Off Duty' },
    completed:    { v: 'green',  label: 'Completed' },
    ongoing:      { v: 'blue',   label: 'Ongoing' },
    pending:      { v: 'amber',  label: 'Pending' },
    cancelled:    { v: 'red',    label: 'Cancelled' },
    resolved:     { v: 'green',  label: 'Resolved' },
    'under review': { v: 'blue', label: 'Under Review' },
    suspended:    { v: 'red',    label: 'Suspended' },
    High:         { v: 'red',    label: 'High' },
    Medium:       { v: 'amber',  label: 'Medium' },
    Low:          { v: 'green',  label: 'Low' },
  }
  const { v, label } = map[status] || { v: 'gray', label: status }
  return <Badge variant={v}>{label}</Badge>
}

/* ── Avatar ── */
export function Avatar({ initials, color, size = 'md', className }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' }
  return (
    <div
      className={clsx('rounded-full flex items-center justify-center font-extrabold text-white flex-shrink-0', sizes[size], className)}
      style={{ background: color || '#00b86b' }}
    >
      {initials}
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
  if (!open) return null
  return (
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
    </div>
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
