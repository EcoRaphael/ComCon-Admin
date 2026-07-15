// src/components/pages/Dashboard.jsx
import { useMemo } from 'react'
import { useAdmin } from '@/lib/AdminContext'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  Ticket, 
  AlertTriangle, 
  Car, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Star, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react'
import { StatCard, Card, CardHead, StatusBadge, DataTable, MiniBarChart, Avatar } from '@/components/ui'
import Spinner from '@/components/ui/Spinner'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Dashboard() {
  const { stats, bookings, reports, drivers, payments, activityLog, loading } = useAdmin()
  const navigate = useNavigate()

  const weeklyStats = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - i))
      const dateStr = d.toISOString().split('T')[0]
      const dayBookings = bookings.filter(b => b.created_at?.startsWith(dateStr))
      const dayRevenue  = payments
        .filter(p => p.status === 'completed' && p.created_at?.startsWith(dateStr))
        .reduce((s, p) => s + Number(p.amount || 0), 0)
      return {
        day:      DAYS[d.getDay()],
        bookings: dayBookings.length,
        revenue:  dayRevenue,
      }
    })
  }, [bookings, payments])

  const vehicleBreakdown = useMemo(() => {
    const types = ['Tricycle', 'Pedicab', 'Timbol', 'Multicab']
    const total = bookings.filter(b => b.status === 'completed').length || 1
    return types.map(t => ({
      label: t,
      // Removed emojis, you can add specific icons here if needed
      pct:   Math.round((bookings.filter(b => b.vehicle_type === t && b.status === 'completed').length / total) * 100),
    }))
  }, [bookings])

  const initials = (name) =>
    name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'

  return (
    <div className="space-y-6 page-enter">

      {/* Header banner */}
      <div className="brand-gradient rounded-xl2 p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-1">
            A Transport Network Vehicle Service
          </p>
          <h2 className="text-xl font-extrabold leading-tight">CommuterConnect · Calbayog City, Samar</h2>
          <p className="text-white/60 text-sm mt-1">
            Managing tricycles, pedicabs, timbols & multicabs across Calbayog City
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <div className="text-center bg-white/10 rounded-xl px-4 py-2">
            <p className="text-white font-extrabold text-xl">{stats.activeDrivers}</p>
            <p className="text-white/50 text-xs">Active Drivers</p>
          </div>
          <div className="text-center bg-white/10 rounded-xl px-4 py-2">
            <p className="text-white font-extrabold text-xl">{stats.totalRoutes}</p>
            <p className="text-white/50 text-xs">Routes</p>
          </div>
          <div className="text-center bg-white/10 rounded-xl px-4 py-2">
            <p className="text-white font-extrabold text-xl">
              ₱{stats.totalRevenue.toLocaleString()}
            </p>
            <p className="text-white/50 text-xs">Revenue</p>
          </div>
        </div>
      </div>

      {/* Stat cards - Emojis replaced with Lucide Components */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Car size={20} className="text-green" />} iconBg="bg-green-light" value={stats.activeDrivers}  label="Active Drivers"  trendUp />
        <StatCard icon={<Users size={20} className="text-blue-600" />} iconBg="bg-blue-50"     value={stats.totalCustomers} label="Commuters"       trendUp />
        <StatCard icon={<Ticket size={20} className="text-amber-600" />} iconBg="bg-amber-50"    value={stats.totalBookings}  label="Total Bookings"  trendUp />
        <StatCard icon={<AlertTriangle size={20} className="text-red-600" />} iconBg="bg-red-50"      value={stats.openReports}    label="Open Complaints" trendUp={false} />
      </div>

      {/* Verification alerts */}
      {stats.unverifiedDrivers > 0 && (
        <div
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => navigate('/drivers')}
        >
          <AlertTriangle className="text-amber-600" size={24} />
          <div>
            <p className="font-bold text-amber-800 text-sm">
              {stats.unverifiedDrivers} driver{stats.unverifiedDrivers > 1 ? 's' : ''} pending vehicle verification
            </p>
            <p className="text-amber-600 text-xs mt-0.5">
              Click to review and verify vehicle & driver information
            </p>
          </div>
          <ChevronRight className="ml-auto text-amber-400" size={20} />
        </div>
      )}

      {stats.unverifiedVehicles > 0 && (
        <div
          className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => navigate('/vehicles')}
        >
          <ShieldCheck className="text-blue-600" size={24} />
          <div>
            <p className="font-bold text-blue-800 text-sm">
              {stats.unverifiedVehicles} vehicle{stats.unverifiedVehicles > 1 ? 's' : ''} pending verification
            </p>
            <p className="text-blue-600 text-xs mt-0.5">
              Click to review vehicle LTFRB permits and documents
            </p>
          </div>
          <ChevronRight className="ml-auto text-blue-400" size={20} />
        </div>
      )}

      {/* Bookings chart + Revenue breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHead title="Bookings This Week" subtitle="Daily ride volume — Calbayog City" />
          <div className="card-body">
            {loading ? (
              <div className="h-24 flex items-center justify-center">
                <Spinner size={22} />
              </div>
            ) : (
              <>
                <MiniBarChart data={weeklyStats} valueKey="bookings" />
                <div className="flex justify-between mt-2">
                  {weeklyStats.map(d => (
                    <span key={d.day} className="text-[10px] text-sub flex-1 text-center">{d.day}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>

        <Card>
          <CardHead title="Revenue" subtitle="From completed ride fares" />
          <div className="card-body space-y-3">
            <p className="text-3xl font-black text-navy">
              ₱{stats.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-sub">From {stats.completedBookings} completed rides</p>
            <div className="pt-2 space-y-2">
              {vehicleBreakdown.map(({ label, pct }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{label}</span>
                    <span className="font-bold">{pct}%</span>
                  </div>
                  <div className="bg-surface rounded-full h-1.5">
                    <div className="h-full rounded-full bg-green transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent bookings + complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHead
            title="Recent Bookings"
            action={<button className="btn-ghost btn-sm" onClick={() => navigate('/bookings')}>View all</button>}
          />
          <div className="card-body-np">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Spinner size={22} />
              </div>
            ) : (
              <DataTable>
                <thead>
                  <tr><th>Commuter</th><th>Vehicle</th><th>Fare</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 4).map(b => (
                    <tr key={b.id}>
                      <td className="font-medium">{b.users?.name || '—'}</td>
                      <td className="text-xs text-sub">{b.vehicle_type}</td>
                      <td className="font-bold text-green">₱{Number(b.fare || 0).toFixed(2)}</td>
                      <td><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr><td colSpan={4} className="text-center text-sub py-6">No bookings yet</td></tr>
                  )}
                </tbody>
              </DataTable>
            )}
          </div>
        </Card>

        <Card>
          <CardHead
            title="Recent Complaints"
            action={<button className="btn-ghost btn-sm" onClick={() => navigate('/reports')}>View all</button>}
          />
          <div className="card-body-np">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Spinner size={22} />
              </div>
            ) : (
              <DataTable>
                <thead>
                  <tr><th>Commuter</th><th>Issue</th><th>Severity</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {reports.slice(0, 4).map(r => (
                    <tr key={r.id}>
                      <td className="font-medium">{r.users?.name || '—'}</td>
                      <td className="text-xs text-sub">{r.issue_type}</td>
                      <td><StatusBadge status={r.severity} /></td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr><td colSpan={4} className="text-center text-sub py-6">No reports yet</td></tr>
                  )}
                </tbody>
              </DataTable>
            )}
          </div>
        </Card>
      </div>

      {/* Top drivers + Activity log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHead
            title="Top Drivers"
            action={<button className="btn-ghost btn-sm" onClick={() => navigate('/drivers')}>View all</button>}
          />
          <div className="card-body divide-y divide-border">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Spinner size={22} />
              </div>
            ) : (
              drivers
                .filter(d => d.status === 'active')
                .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
                .slice(0, 4)
                .map(d => (
                  <div key={d.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Avatar initials={initials(d.name)} color={d.color || 'var(--color-primary)'} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{d.name}</p>
                        {d.verified && (
                          <span className="text-[10px] bg-green-light text-green font-bold rounded-full px-1.5 py-0.5 flex items-center gap-1">
                            <ShieldCheck size={10} /> Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-sub truncate">{d.vehicle_type} · {d.plate}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-amber-500 text-sm flex items-center justify-end gap-1">
                        <Star size={12} fill="currentColor" /> {Number(d.rating || 0).toFixed(1)}
                      </p>
                      <p className="text-xs text-sub">{(d.trips || 0).toLocaleString()} trips</p>
                    </div>
                  </div>
                ))
            )}
            {!loading && drivers.filter(d => d.status === 'active').length === 0 && (
              <p className="text-center text-sub py-6 text-sm">No active drivers</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHead title="System Activity Log" />
          <div className="card-body space-y-3">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Spinner size={22} />
              </div>
            ) : activityLog.length === 0 ? (
              <p className="text-center text-sub py-6 text-sm">No activity yet</p>
            ) : (
              activityLog.slice(0, 6).map(item => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-light flex items-center justify-center text-green flex-shrink-0">
                    <Clock size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-snug">{item.text}</p>
                    <p className="text-xs text-sub mt-0.5">
                      {new Date(item.created_at).toLocaleString('en-PH', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

    </div>
  )
}