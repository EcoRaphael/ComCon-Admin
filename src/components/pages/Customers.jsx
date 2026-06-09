// src/components/pages/Customers.jsx
import { useState } from 'react'
import { useAdmin } from '@/lib/AdminContext'
import { useToastCtx } from '@/lib/ToastContext'
import { Card, CardHead, StatusBadge, DataTable, Avatar, StatCard, Modal } from '@/components/ui'
import { Users, CheckCircle2, Ban, Ticket, Search, Eye, UserX, UserCheck, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

export default function Customers() {
  const { customers, bookings, toggleCustomerStatus, stats, loading } = useAdmin()
  const { toast } = useToastCtx()
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')
  const [selected, setSelected] = useState(null)

  const filtered = customers.filter(c => {
    const matchFilter = filter === 'all' ? true : c.status === filter
    const q = search.toLowerCase()
    const matchSearch = search === '' ||
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const handleToggle = (id) => {
    const c = customers.find(x => x.id === id)
    toggleCustomerStatus(id)
    toast(`${c?.name || 'Commuter'} status updated`)
    setSelected(null)
  }

  // Bookings for the selected customer
  const c = selected
  const customerBookings = c
    ? bookings.filter(b => b.customer_id === c.id || b.users?.name === c.name).slice(0, 5)
    : []
  const totalSpent = customerBookings
    .filter(b => b.status === 'completed')
    .reduce((s, b) => s + Number(b.fare || 0), 0)

  return (
    <div className="space-y-5 page-enter">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={20} />}       iconBg="bg-green-light" value={stats.totalCustomers}  label="Total Commuters" />
        <StatCard icon={<CheckCircle2 size={20} />} iconBg="bg-blue-50"    value={stats.activeCustomers} label="Active" />
        <StatCard icon={<Ban size={20} />}          iconBg="bg-red-50"     value={customers.filter(c => c.status === 'suspended').length} label="Suspended" />
        <StatCard icon={<Ticket size={20} />}       iconBg="bg-amber-50"   value={stats.totalBookings}   label="Total Bookings" />
      </div>

      <Card>
        <CardHead title="Commuter Accounts" subtitle="Objective 1 — manage user information and account status" />

        <div className="px-5 py-3 border-b border-border flex flex-wrap gap-2 items-center">
          <div className="relative max-w-xs w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" />
            <input
              className="field-input text-sm py-2 pl-9"
              placeholder="Search name, email, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5">
            {['all', 'active', 'suspended'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                  filter === f ? 'bg-green text-white' : 'bg-surface text-sub hover:text-navy'
                }`}>{f}</button>
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
                  <th>Commuter</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Member Since</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={c.name?.split(' ').map(w => w[0]).join('').slice(0,2) || 'CO'} color="#1565c0" size="sm" />
                        <div>
                          <p className="font-semibold text-sm">{c.name}</p>
                          <p className="text-xs text-sub">{c.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm">{c.phone || '—'}</td>
                    <td className="text-xs text-sub">{c.address || '—'}</td>
                    <td className="text-sm text-sub">{new Date(c.created_at).toLocaleDateString('en-PH')}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      <div className="flex gap-1.5">
                        <button className="btn-ghost btn-sm flex items-center gap-1"
                          onClick={() => setSelected(c)}>
                          <Eye size={14} /> View
                        </button>
                        <button className="btn-ghost btn-sm flex items-center gap-1 hover:border-brand-red hover:text-brand-red"
                          onClick={() => handleToggle(c.id)}>
                          {c.status === 'active' ? <><UserX size={14} /> Suspend</> : <><UserCheck size={14} /> Activate</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </div>
      </Card>

      {/* ── Commuter Profile Modal ── */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Commuter Profile">
        {c && (
          <div className="space-y-4">

            {/* Avatar + name */}
            <div className="flex items-center gap-4">
              <Avatar
                initials={c.name?.split(' ').map(w => w[0]).join('').slice(0,2) || 'CO'}
                color="#1565c0"
                size="lg"
              />
              <div>
                <p className="font-bold text-navy text-lg">{c.name}</p>
                <div className="flex gap-2 mt-1">
                  <StatusBadge status={c.status} />
                  <span className="badge badge-blue text-[10px]">Commuter</span>
                </div>
              </div>
            </div>

            {/* Contact info */}
            <div className="space-y-0 border border-border rounded-xl overflow-hidden">
              {[
                { icon: <Mail size={13} />,    label: 'Email',        val: c.email   || 'Not provided' },
                { icon: <Phone size={13} />,   label: 'Phone',        val: c.phone   || 'Not provided' },
                { icon: <MapPin size={13} />,  label: 'Address',      val: c.address || 'Not provided' },
                { icon: <Calendar size={13} />,label: 'Member Since', val: new Date(c.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) },
              ].map((row, i) => (
                <div key={row.label} className={`flex items-center justify-between px-4 py-3 ${i !== 3 ? 'border-b border-border' : ''}`}>
                  <span className="flex items-center gap-2 text-xs text-sub font-bold uppercase tracking-wider">
                    {row.icon} {row.label}
                  </span>
                  <span className="text-sm text-navy font-medium text-right max-w-[55%] truncate">{row.val}</span>
                </div>
              ))}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-sub uppercase mb-1">Total Rides</p>
                <p className="font-black text-navy text-xl">{customerBookings.length}</p>
              </div>
              <div className="bg-surface rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-sub uppercase mb-1">Completed</p>
                <p className="font-black text-green text-xl">
                  {customerBookings.filter(b => b.status === 'completed').length}
                </p>
              </div>
              <div className="bg-surface rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-sub uppercase mb-1">Total Spent</p>
                <p className="font-black text-navy text-lg">₱{totalSpent.toFixed(0)}</p>
              </div>
            </div>

            {/* Recent bookings */}
            {customerBookings.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-sub uppercase tracking-wider">Recent Rides</p>
                {customerBookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-navy truncate">{b.pickup} → {b.dropoff}</p>
                      <p className="text-[10px] text-sub mt-0.5">{b.vehicle_type} · {new Date(b.created_at).toLocaleDateString('en-PH')}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="font-bold text-sm text-green">₱{Number(b.fare || 0).toFixed(0)}</span>
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action */}
            <button
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-colors border ${
                c.status === 'active'
                  ? 'bg-red-50 text-brand-red border-red-200 hover:bg-red-100'
                  : 'bg-green-light text-green border-green/20 hover:bg-green/10'
              }`}
              onClick={() => handleToggle(c.id)}
            >
              {c.status === 'active'
                ? <><UserX size={15} /> Suspend Account</>
                : <><UserCheck size={15} /> Activate Account</>
              }
            </button>
          </div>
        )}
      </Modal>

    </div>
  )
}