// src/components/pages/Ratings.jsx
// Objective 4: organize ratings and commuter reviews
import { useState, useEffect } from 'react'
import { useAdmin } from '@/lib/AdminContext'
import { useToastCtx } from '@/lib/ToastContext'
import { supabase } from '@/lib/supabase/client'
import { StatCard, Card, CardHead, DataTable, Avatar, Modal } from '@/components/ui'
import { Star, ThumbsUp, ThumbsDown, Search, Filter, Eye } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

function StarDisplay({ value, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(value) ? 'text-amber-500 fill-amber-500' : 'text-border'}
        />
      ))}
    </div>
  )
}

export default function Ratings() {
  const { drivers, loading: adminLoading } = useAdmin()
  const { toast } = useToastCtx()

  const [ratings,    setRatings]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [filterStar, setFilterStar] = useState('all')
  const [selected,   setSelected]   = useState(null)

  useEffect(() => {
    fetchRatings()
    // Realtime: re-fetch whenever a new rating is inserted by commuter app
    const channel = supabase
      .channel('ratings-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ratings' }, () => {
        fetchRatings()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchRatings() {
    setLoading(true)
    const { data, error } = await supabase
      .from('ratings')
      .select(`
      *,
      customer:users!ratings_customer_id_fkey ( name, email ),
      driver:drivers!ratings_driver_id_fkey   ( name, vehicle_type, plate )
    `)
      .order('created_at', { ascending: false })
    if (error) { toast('Failed to load ratings'); console.error(error) }
    else setRatings(data || [])
    setLoading(false)
  }

  const filtered = ratings.filter(r => {
    const matchStar = filterStar === 'all' ? true : Math.round(r.stars) === Number(filterStar)
    const q = search.toLowerCase()
    const matchSearch = search === '' ||
      r.customer?.name?.toLowerCase().includes(q) ||
      r.driver?.name?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q)
    return matchStar && matchSearch
  })

  const total    = ratings.length
  const avgScore = total ? (ratings.reduce((s, r) => s + Number(r.stars), 0) / total).toFixed(1) : '0.0'
  const positive = ratings.filter(r => r.stars >= 4).length
  const negative = ratings.filter(r => r.stars <= 2).length
  const r = selected

  return (
    <div className="space-y-5 page-enter">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Star size={20} />}       iconBg="bg-amber-50"    value={avgScore} label="Platform Avg Rating" />
        <StatCard icon={<Star size={20} />}       iconBg="bg-green-light" value={total}    label="Total Reviews" />
        <StatCard icon={<ThumbsUp size={20} />}   iconBg="bg-blue-50"     value={positive} label="Positive (4–5 ★)" />
        <StatCard icon={<ThumbsDown size={20} />} iconBg="bg-red-50"      value={negative} label="Negative (1–2 ★)" />
      </div>

      {/* Driver leaderboard */}
      <Card>
        <CardHead title="Driver Rating Summary" subtitle="Average scores across all active drivers" />
        <div className="card-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {drivers
            .filter(d => d.status === 'active')
            .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
            .slice(0, 8)
            .map(d => {
              const initials = d.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'DR'
              return (
                <div key={d.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: d.color || 'var(--color-primary)' }}>
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-navy truncate">{d.name}</p>
                    <StarDisplay value={Number(d.rating || 0)} size={11} />
                  </div>
                  <span className="text-sm font-black text-amber-500 flex-shrink-0">
                    {Number(d.rating || 0).toFixed(1)}
                  </span>
                </div>
              )
            })}
          {drivers.filter(d => d.status === 'active').length === 0 && (
            <p className="col-span-4 text-center text-sub py-6 text-sm">No active drivers yet</p>
          )}
        </div>
      </Card>

      {/* Reviews table */}
      <Card>
        <CardHead title="All Commuter Reviews" subtitle="Objective 4 — organize ratings and commuter feedback" />

        <div className="px-5 py-3 border-b border-border flex flex-wrap gap-2 items-center">
          <div className="relative max-w-xs w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" />
            <input
              className="field-input text-sm py-2 pl-9"
              placeholder="Search commuter, driver, review..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={13} className="text-sub" />
            {['all', '5', '4', '3', '2', '1'].map(f => (
              <button key={f} onClick={() => setFilterStar(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  filterStar === f ? 'bg-green text-white' : 'bg-surface text-sub hover:text-navy'
                }`}>
                {f === 'all' ? 'All' : `${f} ★`}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body-np">
          {loading || adminLoading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner size={32} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-sub">
              <Star size={40} className="opacity-10 mb-3" />
              <p className="font-medium text-sm">No reviews found</p>
              <p className="text-xs mt-1">Reviews appear once commuters rate their rides</p>
            </div>
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <th>Commuter</th>
                  <th>Driver</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar
                          initials={r.customer?.name?.split(' ').map(w => w[0]).join('').slice(0,2) || 'CO'}
                          color="#1565c0"
                          size="sm"
                        />
                        <span className="font-semibold text-sm">{r.customer?.name || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm font-medium">{r.driver?.name || '—'}</p>
                      <p className="text-xs text-sub">{r.driver?.vehicle_type || ''}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <StarDisplay value={r.stars} />
                        <span className="text-xs font-bold text-amber-500">{Number(r.stars).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="max-w-[200px]">
                      <p className="text-xs text-sub truncate">{r.comment || '—'}</p>
                    </td>
                    <td className="text-xs text-sub font-mono">
                      {new Date(r.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      <button className="btn-ghost btn-sm flex items-center gap-1"
                        onClick={() => setSelected(r)}>
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </div>
      </Card>

      {/* ── Rating Detail Modal ── */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Rating Detail">
        {r && (
          <div className="space-y-4">

            {/* Stars */}
            <div className="flex flex-col items-center gap-2 py-3 bg-surface rounded-xl">
              <StarDisplay value={r.stars} size={28} />
              <span className="text-3xl font-black text-navy">{Number(r.stars).toFixed(1)}</span>
              <span className="text-xs text-sub">out of 5.0</span>
            </div>

            {/* Commuter & Driver */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface rounded-xl p-3">
                <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-1">Commuter</p>
                <p className="font-semibold text-sm text-navy">{r.customer?.name || '—'}</p>
                <p className="text-xs text-sub">{r.customer?.email || ''}</p>
              </div>
              <div className="bg-surface rounded-xl p-3">
                <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-1">Driver</p>
                <p className="font-semibold text-sm text-navy">{r.driver?.name || '—'}</p>
                <p className="text-xs text-sub">{r.driver?.vehicle_type || ''} · {r.driver?.plate || ''}</p>
              </div>
            </div>

            {/* Review comment */}
            <div className="bg-surface rounded-xl p-4">
              <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-2">Review Comment</p>
              {r.comment
                ? <p className="text-sm text-navy leading-relaxed italic">"{r.comment}"</p>
                : <p className="text-sm text-sub italic">No comment provided</p>
              }
            </div>

            {/* Meta */}
            <div className="flex justify-between text-xs text-sub border-t border-border pt-3">
              <span>Submitted {new Date(r.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              {r.booking_id && <span className="font-mono">Booking #{String(r.booking_id).slice(0,8)}</span>}
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}