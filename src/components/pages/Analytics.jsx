// src/components/pages/Analytics.jsx
// Objective 3: monitor system activity and record transactions
import { useMemo } from 'react'
import { useAdmin } from '@/lib/AdminContext'
import { StatCard, Card, CardHead, ProgressBar } from '@/components/ui'
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Map as MapIcon, 
  Star, 
  Calendar,
  Zap
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const VEHICLE_COLORS = { 
  Tricycle: 'var(--color-primary)', // Green
  Timbol: '#3b82f6',   // Blue
  Multicab: '#a855f7'   // Purple
}

export default function Analytics() {
  const { bookings, payments, stats } = useAdmin()

  // Build last 7 days chart data from real bookings
  const weeklyData = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - i))
      const dateStr = d.toISOString().split('T')[0]
      
      const dayBookings = bookings.filter(b => b.created_at?.startsWith(dateStr))
      const dayRevenue = payments
        .filter(p => p.status === 'paid' && p.created_at?.startsWith(dateStr))
        .reduce((s, p) => s + Number(p.amount || 0), 0)

      return {
        day: DAYS[d.getDay()],
        bookings: dayBookings.length,
        revenue: dayRevenue,
        fullDate: dateStr
      }
    })
  }, [bookings, payments])

  // Vehicle type breakdown
  const vehicleBreakdown = useMemo(() => {
    const types = ['Tricycle', 'Timbol', 'Multicab']
    const total = bookings.length || 1
    return types.map(t => ({
      label: t,
      count: bookings.filter(b => b.vehicle_type === t).length,
      pct: Math.round((bookings.filter(b => b.vehicle_type === t).length / total) * 100),
      color: VEHICLE_COLORS[t]
    }))
  }, [bookings])

  return (
    <div className="space-y-6 page-enter">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<TrendingUp size={20} />} 
          iconBg="bg-green-light text-green" 
          value={`₱${stats.totalRevenue.toLocaleString()}`} 
          label="Total Revenue" 
          trendUp 
        />
        <StatCard 
          icon={<Zap size={20} />} 
          iconBg="bg-blue-50 text-blue-600" 
          value={stats.totalBookings} 
          label="Total Bookings" 
        />
        <StatCard 
          icon={<Star size={20} />} 
          iconBg="bg-amber-50 text-amber-600" 
          value={stats.avgRating} 
          label="Platform Rating" 
        />
        <StatCard 
          icon={<MapIcon size={20} className="text-purple-600" />} 
          iconBg="bg-purple-50" 
          value={stats.totalRoutes} 
          label="Active Routes" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings bar chart */}
        <Card className="overflow-hidden">
          <CardHead 
            title="Daily Ride Volume" 
            subtitle="7-day activity monitor" 
          />
          <div className="card-body h-[250px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="bookings" fill="#2E7D32" radius={[4, 4, 0, 0]} name="Rides" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue line chart */}
        <Card className="overflow-hidden">
          <CardHead 
            title="Revenue Performance" 
            subtitle="Daily transaction records (₱)" 
          />
          <div className="card-body h-[250px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => `₱${val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Line 
                  type="monotone"
                  dataKey="revenue" 
                  stroke="#2E7D32" 
                  strokeWidth={3} 
                  dot={{ fill: '#2E7D32', r: 4, strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="Revenue" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Vehicle breakdown */}
      <Card>
        <CardHead 
          title="Vehicle Utilization" 
          subtitle="Breakdown of native Calbayog City transport types" 
        />
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {vehicleBreakdown.map(({ label, count, pct, color }) => (
            <div key={label} className="group">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-sub mb-0.5">Type</p>
                  <p className="font-bold text-navy">{label}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-navy">{pct}%</span>
                  <p className="text-[10px] text-sub font-medium">{count} completed rides</p>
                </div>
              </div>
              <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}