// src/components/pages/Payments.jsx
// Part 2: Payment management and fare records
// Objective 1: manage fare inquiries and payment records

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToastCtx } from '@/lib/ToastContext'
import { StatCard } from '@/components/ui'
import Spinner from '@/components/ui/Spinner'
import { 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCcw 
} from 'lucide-react'

const STATUS_STYLES = {
  paid:     'bg-green-100 text-green-800 border-green-200',
  pending:  'bg-amber-100 text-amber-800 border-amber-200',
  refunded: 'bg-blue-100 text-blue-800 border-blue-200',
  failed:   'bg-red-100 text-red-800 border-red-200',
}

const METHOD_ICONS = {
  cash:  <Banknote size={14} className="text-green-600" />,
  gcash: <Smartphone size={14} className="text-blue-500" />,
  maya:  <Smartphone size={14} className="text-emerald-500" />,
  other: <CreditCard size={14} className="text-slate-500" />,
}

export default function Payments() {
  const { toast } = useToastCtx()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [updating, setUpdating] = useState(null)

  useEffect(() => { fetchPayments() }, [])

  async function fetchPayments() {
    setLoading(true)
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        bookings!booking_id ( pickup, dropoff, vehicle_type ),
        drivers!driver_id ( name, plate )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      toast('Failed to load payments')
      console.error(error)
    } else {
      setPayments(data || [])
    }
    setLoading(false)
  }

  async function handleStatusChange(id, newStatus) {
    setUpdating(id)
    const { error } = await supabase
      .from('payments')
      .update({
        status:  newStatus,
        paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
      })
      .eq('id', id)

    if (error) {
      toast('Failed to update payment')
    } else {
      toast(`Payment marked as ${newStatus}`)
      setPayments(prev => prev.map(p =>
        p.id === id ? { ...p, status: newStatus, paid_at: newStatus === 'paid' ? new Date().toISOString() : p.paid_at } : p
      ))
    }
    setUpdating(null)
  }

  const filtered = useMemo(() => payments.filter(p => {
    const matchFilter = filter === 'all' ? true : p.status === filter
    const q = search.toLowerCase()
    const matchSearch = search === '' ||
      
      p.drivers?.name?.toLowerCase().includes(q) ||
      p.drivers?.plate?.toLowerCase().includes(q) ||
      p.bookings?.pickup?.toLowerCase().includes(q)
    const matchFrom = !dateFrom || new Date(p.created_at) >= new Date(dateFrom)
    const matchTo   = !dateTo   || new Date(p.created_at) <= new Date(dateTo + 'T23:59:59')
    return matchFilter && matchSearch && matchFrom && matchTo
  }), [payments, filter, search, dateFrom, dateTo])

  function handleExport() {
    if (filtered.length === 0) return
    const rows = filtered.map(p => ({
      Customer:  'Unknown' || '—',
      
      Driver:    p.drivers?.name || '—',
      Amount:    Number(p.amount).toFixed(2),
      Method:    p.method,
      Status:    p.status,
      Date:      new Date(p.created_at).toLocaleDateString('en-PH'),
    }))
    const headers = Object.keys(rows[0]).join(',')
    const csv = [headers, ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast('📄 Payments exported successfully')
  }

  const stats = {
    total: payments.length,
    revenue: payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0),
    pending: payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount || 0), 0),
    refunded: payments.filter(p => p.status === 'refunded').length
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight">Fare Management</h1>
          <p className="text-sub text-sm">Review transaction history and manage payment statuses</p>
        </div>
        <button 
          onClick={handleExport} 
          className="btn-primary flex items-center gap-2 self-start"
          disabled={filtered.length === 0}
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<CreditCard size={20} />} iconBg="bg-blue-50 text-blue-600" value={stats.total} label="Total Transactions" />
        <StatCard icon={<CheckCircle2 size={20} />} iconBg="bg-green-light text-green" value={`₱${stats.revenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} label="Confirmed Revenue" />
        <StatCard icon={<Clock size={20} />} iconBg="bg-amber-50 text-amber-600" value={`₱${stats.pending.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} label="Pending Collection" />
        <StatCard icon={<RefreshCcw size={20} />} iconBg="bg-red-50 text-red-600" value={stats.refunded} label="Total Refunds" />
      </div>

      {/* Filters & Tools */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" size={16} />
            <input
              type="text"
              placeholder="Search by name, plate, or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="field-input pl-10 w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <Calendar className="absolute left-3 text-sub" size={14} />
              <input type="date" className="field-input pl-9 text-xs w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <span className="text-sub text-xs">to</span>
            <div className="relative flex items-center">
              <Calendar className="absolute left-3 text-sub" size={14} />
              <input type="date" className="field-input pl-9 text-xs w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
          <div className="flex gap-1.5 overflow-x-auto">
            {['all', 'paid', 'pending', 'refunded', 'failed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all border ${
                  filter === f ? 'bg-green text-white border-green' : 'bg-white text-sub border-border hover:border-green'
                }`}>
                {f}
              </button>
            ))}
          </div>
          <p className="text-[11px] font-bold text-sub uppercase tracking-wider">
            Showing {filtered.length} Records
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Spinner size={40} />
            <p className="text-sm text-sub animate-pulse">Syncing fare records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-sub opacity-60">
            <XCircle size={48} strokeWidth={1} />
            <p className="font-medium mt-3">No transactions found</p>
            <button onClick={() => {setFilter('all'); setSearch('')}} className="text-xs text-navy underline mt-1">Clear all filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left">
                  <th className="px-5 py-4 text-sub font-bold uppercase text-[10px] tracking-widest">Client & Trip</th>
                  <th className="px-5 py-4 text-sub font-bold uppercase text-[10px] tracking-widest">Provider</th>
                  <th className="px-5 py-4 text-sub font-bold uppercase text-[10px] tracking-widest">Payment</th>
                  <th className="px-5 py-4 text-sub font-bold uppercase text-[10px] tracking-widest">Status</th>
                  <th className="px-5 py-4 text-sub font-bold uppercase text-[10px] tracking-widest">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-surface/40 transition-colors group">
                    <td className="px-5 py-4">
                      <p className="font-bold text-navy group-hover:text-black transition-colors">{p.booking_id ? `Booking #${String(p.booking_id).slice(0,8).toUpperCase()}` : 'Unknown'}</p>
                      <p className="text-[11px] text-sub flex items-center gap-1 mt-0.5">
                        <span className="truncate max-w-[150px]">{p.bookings?.pickup}</span>
                        <span>→</span>
                        <span className="truncate max-w-[150px]">{p.bookings?.dropoff}</span>
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-navy">{p.drivers?.name || '—'}</p>
                      <p className="text-[10px] font-mono bg-surface px-1.5 py-0.5 rounded border border-border inline-block mt-1">{p.drivers?.plate || 'NO-PLATE'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-extrabold text-navy">₱{Number(p.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {METHOD_ICONS[p.method] || METHOD_ICONS.other}
                        <span className="text-[10px] font-bold uppercase text-sub">{p.method}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={p.status}
                        disabled={updating === p.id}
                        onChange={e => handleStatusChange(p.id, e.target.value)}
                        className={`text-[10px] px-3 py-1 rounded-full border font-bold uppercase tracking-tighter cursor-pointer appearance-none text-center ${STATUS_STYLES[p.status]}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="refunded">Refunded</option>
                        <option value="failed">Failed</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-[11px] text-sub">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(p.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 opacity-60 font-mono">
                        <Clock size={12} />
                        {new Date(p.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}