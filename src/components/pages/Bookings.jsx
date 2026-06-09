// src/components/pages/Bookings.jsx
// Objective 1: manage bookings, ride details, fare inquiries
import { useState } from 'react'
import { useAdmin } from '@/lib/AdminContext'
import { useToastCtx } from '@/lib/ToastContext'
import { StatCard, Card, CardHead, StatusBadge, DataTable, Modal } from '@/components/ui'
import {
  CheckCircle2, Clock, XCircle, Activity, Search,
  Eye, Ban, Wallet, Car, Bike, Bus,
  MapPin, User, Calendar, ArrowRight
} from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

export default function Bookings() {
  const { bookings, updateBookingStatus, stats, loading } = useAdmin()
  const { toast } = useToastCtx()
  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = bookings.filter(b => {
    const matchFilter = filter === 'all' ? true : b.status === filter
    const q = search.toLowerCase()
    const matchSearch = search === '' ||
      b.users?.name?.toLowerCase().includes(q) ||
      b.drivers?.name?.toLowerCase().includes(q) ||
      b.pickup?.toLowerCase().includes(q) ||
      b.dropoff?.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const totalRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((s, b) => s + Number(b.fare || 0), 0)

  const counts = {
    completed: stats.completedBookings,
    ongoing:   stats.ongoingBookings,
    pending:   stats.pendingBookings,
    cancelled: stats.cancelledBookings,
  }

  const vehicleIcons = {
    'Tricycle': <Car size={18} />,
    'Pedicab':  <Bike size={18} />,
    'Timbol':   <Bus size={18} />,
    'Multicab': <Bus size={18} />,
  }

  const handleCancel = (id) => {
    updateBookingStatus(id, 'cancelled')
    toast('Booking cancelled')
    setSelected(null)
  }

  const b = selected

  return (
    <div className="space-y-5 page-enter">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<CheckCircle2 size={20} />} iconBg="bg-green-light" value={counts.completed} label="Completed" trendUp />
        <StatCard icon={<Activity size={20} />}     iconBg="bg-blue-50"     value={counts.ongoing}   label="Ongoing" />
        <StatCard icon={<Clock size={20} />}        iconBg="bg-amber-50"    value={counts.pending}   label="Pending" />
        <StatCard icon={<XCircle size={20} />}      iconBg="bg-red-50"      value={counts.cancelled} label="Cancelled" />
      </div>

      {/* Revenue banner */}
      <div className="brand-gradient rounded-xl2 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-lg text-white">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-0.5">Total Confirmed Revenue</p>
            <p className="text-white text-3xl font-black">₱{totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="flex gap-4">
          {['Tricycle', 'Pedicab', 'Timbol', 'Multicab'].map(v => (
            <div key={v} className="text-center">
              <div className="text-white/70 mb-1 flex justify-center">{vehicleIcons[v]}</div>
              <p className="text-white font-bold text-sm">
                {bookings.filter(b => b.vehicle_type === v && b.status === 'completed').length}
              </p>
              <p className="text-white/40 text-[10px] uppercase tracking-tighter">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHead title="All Bookings" subtitle="Objective 1 — booking management, ride details & fare inquiries" />

        <div className="px-5 py-3 border-b border-border flex flex-wrap gap-2 items-center">
          <div className="relative max-w-xs w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" />
            <input
              className="field-input text-sm py-2 pl-9"
              placeholder="Search commuter, driver, or route..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'completed', 'ongoing', 'pending', 'cancelled'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${
                  filter === f ? 'bg-green text-white' : 'bg-surface text-sub hover:text-navy'
                }`}>
                {f}{f !== 'all' ? ` (${counts[f] ?? 0})` : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body-np">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner size={32} />
            </div>
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <th>Commuter</th><th>Driver</th><th>Route</th><th>Vehicle</th>
                  <th>Fare</th><th>Payment</th><th>Date</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td>
                      <p className="font-medium text-sm">{b.users?.name || '—'}</p>
                      <p className="text-xs text-sub">{b.users?.phone || ''}</p>
                    </td>
                    <td>
                      <p className="text-sm">{b.drivers?.name || '—'}</p>
                      <p className="text-xs text-sub font-mono">{b.drivers?.plate || ''}</p>
                    </td>
                    <td className="text-xs text-sub">{b.pickup} → {b.dropoff}</td>
                    <td className="text-sm">{b.vehicle_type}</td>
                    <td className="font-bold text-green">₱{Number(b.fare || 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${
                        b.payment_status === 'paid'     ? 'badge-green' :
                        b.payment_status === 'refunded' ? 'badge-blue'  : 'badge-amber'
                      }`}>
                        <span className="badge-dot" />{b.payment_status}
                      </span>
                    </td>
                    <td className="text-xs text-sub">
                      {new Date(b.created_at).toLocaleDateString('en-PH')}
                      <span className="block">{new Date(b.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      <div className="flex gap-1.5">
                        <button className="btn-ghost btn-sm flex items-center gap-1"
                          onClick={() => setSelected(b)}>
                          <Eye size={14} /> View
                        </button>
                        {b.status === 'pending' && (
                          <button className="btn-ghost btn-sm flex items-center gap-1 hover:border-brand-red hover:text-brand-red"
                            onClick={() => handleCancel(b.id)}>
                            <Ban size={14} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </div>
      </Card>

      {/* ── Booking Detail Modal ── */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Booking Detail">
        {b && (
          <div className="space-y-4">

            {/* Booking ID + Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-sub font-mono">#{String(b.id).slice(0,8).toUpperCase()}</span>
              <StatusBadge status={b.status} />
            </div>

            {/* Route */}
            <div className="bg-surface rounded-xl p-4">
              <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin size={11} /> Route
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-[10px] text-sub mb-0.5">Pickup</p>
                  <p className="font-bold text-sm text-navy">{b.pickup || '—'}</p>
                </div>
                <ArrowRight size={16} className="text-sub flex-shrink-0" />
                <div className="flex-1 text-right">
                  <p className="text-[10px] text-sub mb-0.5">Dropoff</p>
                  <p className="font-bold text-sm text-navy">{b.dropoff || '—'}</p>
                </div>
              </div>
            </div>

            {/* Commuter + Driver */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface rounded-xl p-3">
                <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <User size={10} /> Commuter
                </p>
                <p className="font-semibold text-sm text-navy">{b.users?.name || '—'}</p>
                <p className="text-xs text-sub mt-0.5">{b.users?.phone || '—'}</p>
              </div>
              <div className="bg-surface rounded-xl p-3">
                <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Car size={10} /> Driver
                </p>
                <p className="font-semibold text-sm text-navy">{b.drivers?.name || '—'}</p>
                <p className="text-xs text-sub font-mono mt-0.5">{b.drivers?.plate || '—'}</p>
              </div>
            </div>

            {/* Fare + Payment + Vehicle */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-1">Fare</p>
                <p className="font-black text-green text-lg">₱{Number(b.fare || 0).toFixed(2)}</p>
              </div>
              <div className="bg-surface rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-1.5">Payment</p>
                <span className={`badge text-[10px] ${
                  b.payment_status === 'paid'     ? 'badge-green' :
                  b.payment_status === 'refunded' ? 'badge-blue'  : 'badge-amber'
                }`}>
                  <span className="badge-dot" />{b.payment_status || 'unpaid'}
                </span>
              </div>
              <div className="bg-surface rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-1">Vehicle</p>
                <p className="text-xs font-bold text-navy">{b.vehicle_type || '—'}</p>
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex items-center justify-between text-xs text-sub pt-1 border-t border-border">
              <span className="flex items-center gap-1.5">
                <Calendar size={11} />
                {new Date(b.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span>{new Date(b.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            {/* Cancel action */}
            {b.status === 'pending' && (
              <button
                className="btn-danger w-full flex items-center justify-center gap-2 py-2.5 mt-2"
                onClick={() => handleCancel(b.id)}
              >
                <Ban size={15} /> Cancel This Booking
              </button>
            )}
          </div>
        )}
      </Modal>

    </div>
  )
}