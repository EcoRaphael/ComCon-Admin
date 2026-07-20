// src/components/pages/Notifications.jsx
// Objective 3: monitor system activity & manage broadcasts
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToastCtx } from '@/lib/ToastContext'
import { StatCard } from '@/components/ui'
import { 
  Bell, 
  Megaphone, 
  CheckCheck, 
  Trash2, 
  Filter, 
  Search,
  ShieldAlert,
  Clock
} from 'lucide-react'

const TYPE_ICONS = {
  booking: <Clock size={16} />,
  payment: <CheckCheck size={16} />,
  report:  <ShieldAlert size={16} />,
  system:  <Bell size={16} />,
  alert:   <Megaphone size={16} />,
}

const TYPE_STYLES = {
  booking: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  payment: 'bg-blue-50 text-blue-700 border-blue-100',
  report:  'bg-red-50 text-red-700 border-red-100',
  system:  'bg-slate-50 text-slate-600 border-slate-100',
  alert:   'bg-amber-50 text-amber-700 border-amber-100',
}

export default function Notifications() {
  const { toast } = useToastCtx()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', type: 'system', target: 'all' })

  useEffect(() => {
    fetchNotifications()

    // REAL-TIME MONITORING: Listen for new system alerts
    const channel = supabase
      .channel('system_activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        // Only add if it's a new record
        setNotifications(prev => [payload.new, ...prev].slice(0, 200))
        toast(`🔔 New activity: ${payload.new.title}`)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchNotifications() {
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) toast('Failed to load activity log')
    else setNotifications(data || [])
    setLoading(false)
  }

  async function handleBroadcast(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) return toast('⚠️ Missing fields')
    
    setSending(true)
    try {
      let query = supabase.from('users').select('id').eq('status', 'active')
      if (form.target !== 'all') query = query.eq('role', form.target === 'customers' ? 'customer' : 'driver')

      const { data: users } = await query

      if (users?.length > 0) {
        const rows = users.map(u => ({
          user_id: u.id,
          title: form.title,
          message: form.message,
          type: form.type,
        }))
        const { error } = await supabase.from('notifications').insert(rows)
        if (error) throw error
        
        toast(`✅ Broadcast sent to ${users.length} users`)
        setForm({ title: '', message: '', type: 'system', target: 'all' })
        setShowForm(false)
        fetchNotifications()
      } else {
        toast('No active users found for this segment')
      }
    } catch (err) {
      toast('Failed to broadcast: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  async function handleMarkRead(id) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (!error) setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const filtered = useMemo(() => notifications.filter(n => {
    const matchFilter = filter === 'all' ? true : filter === 'unread' ? !n.is_read : n.type === filter
    const matchSearch = search === '' || 
      n.title?.toLowerCase().includes(search.toLowerCase()) || 
      n.message?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  }), [notifications, filter, search])

  const stats = {
    unread: notifications.filter(n => !n.is_read).length,
    alerts: notifications.filter(n => n.type === 'alert').length,
    total: notifications.length
  }

  return (
    <div className="space-y-6 page-enter max-w-6xl mx-auto">
      {/* Header Section */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-navy tracking-tight">System Activity</h1>
          <p className="text-sub text-sm">Monitor logs and manage commuter communications.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className={`btn-sm flex items-center gap-2 transition-all ${showForm ? 'bg-red-50 text-red-600' : 'btn-primary'}`}
        >
          {showForm ? <Trash2 size={16} /> : <Megaphone size={16} />}
          {showForm ? 'Close Form' : 'Broadcast Message'}
        </button>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Bell       size={18} className="text-sub"         />} iconBg="bg-slate-100"              value={stats.total}               label="Total Events"   />
        <StatCard icon={<ShieldAlert size={18} className="text-red-600"    />} iconBg="bg-red-50"                 value={stats.unread}               label="Pending Review" />
        <StatCard icon={<CheckCheck  size={18} className="text-green"      />} iconBg="bg-green-light"            value={stats.total - stats.unread} label="Processed"      />
        <StatCard icon={<Megaphone   size={18} className="text-amber-600"  />} iconBg="bg-amber-50"               value={stats.alerts}               label="System Alerts"  />
      </div>

      {/* Broadcast Form */}
      {showForm && (
        <div className="bg-white border-2 border-green/10 rounded-2xl p-6 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleBroadcast} className="space-y-4">
            <div className="flex items-center gap-2 text-green mb-2">
              <Megaphone size={20} className="text-amber-500" />
              <h3 className="font-bold">New System Broadcast</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-sub">Subject</label>
                <input className="field-input w-full" placeholder="Maintenance alert..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-sub">Category</label>
                <select className="field-select w-full" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="system">System Update</option>
                  <option value="alert">Critical Alert</option>
                  <option value="booking">Promotional</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-sub">Audience</label>
                <select className="field-select w-full" value={form.target} onChange={e => setForm({...form, target: e.target.value})}>
                  <option value="all">Everyone</option>
                  <option value="customers">Commuters Only</option>
                  <option value="drivers">Drivers Only</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-sub">Message Content</label>
              <textarea className="field-input w-full min-h-[80px]" placeholder="Explain the update..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full py-3">
              {sending ? 'Dispatching...' : 'Send Broadcast Now'}
            </button>
          </form>
        </div>
      )}

      {/* Activity Log */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-surface/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" size={16} />
            <input 
              className="field-input pl-10 py-2 w-full text-sm" 
              placeholder="Search logs..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <div className="flex gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {['all', 'unread', 'alert', 'booking', 'report'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-all ${
                  filter === f ? 'bg-green text-white shadow-md' : 'bg-white border border-border text-sub hover:border-green'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
          {loading ? (
             <div className="p-12 text-center text-sub animate-pulse">Loading activity streams...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sub">No matching activity found.</div>
          ) : (
            filtered.map(n => (
              <div key={n.id} className={`flex items-start gap-4 p-5 hover:bg-surface/30 transition-colors group ${!n.is_read ? 'bg-green-light/5' : ''}`}>
                <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center border ${TYPE_STYLES[n.type]}`}>
                  {TYPE_ICONS[n.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-bold truncate ${!n.is_read ? 'text-navy' : 'text-slate-600'}`}>{n.title}</h4>
                    {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                  </div>
                  <p className="text-xs text-sub mt-1 leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-4 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(n.created_at).toLocaleString()}</span>
                    <span>• System Auto</span>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.is_read && (
                    <button onClick={() => handleMarkRead(n.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                      <CheckCheck size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}