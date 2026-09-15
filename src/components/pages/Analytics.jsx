// src/components/pages/Analytics.jsx
// Objective 3: monitor system activity and record transactions
import { useMemo } from 'react'
import { useAdmin } from '@/lib/AdminContext'
import { StatCard, Card, CardHead, ProgressBar } from '@/components/ui'
import { 
  TrendingUp, 
  Map as MapIcon, 
  Star, 
  Zap
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell, LabelList,
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
        .filter(p => p.status === 'completed' && p.created_at?.startsWith(dateStr))
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

  // Peak Hours Analysis — groups all-time bookings by hour of day
  // (0-23) rather than by date, to show WHEN during the day demand is
  // highest, independent of which specific day it fell on. Same
  // all-time-snapshot approach as the other reports in Records.jsx,
  // rather than bounding to a rolling window, for consistency.
  const hourlyData = useMemo(() => {
    const counts = Array.from({ length: 24 }, () => 0)
    bookings.forEach(b => {
      if (!b.created_at) return
      const hour = new Date(b.created_at).getHours()
      counts[hour]++
    })
    const formatHour = (h) => {
      if (h === 0) return '12AM'
      if (h === 12) return '12PM'
      return h < 12 ? `${h}AM` : `${h - 12}PM`
    }
    return counts.map((count, hour) => ({ hour, label: formatHour(hour), bookings: count }))
  }, [bookings])

  const peakHour = useMemo(() => {
    if (bookings.length === 0) return null
    return [...hourlyData].sort((a, b) => b.bookings - a.bookings)[0]
  }, [hourlyData, bookings.length])

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
                <Bar dataKey="bookings" radius={[4, 4, 0, 0]} name="Rides">
                  {weeklyData.map((entry, i) => (
                    // Same convention as the Dashboard's chart — today
                    // (always the last of the 7 days built above)
                    // highlighted in orange, everything else green.
                    <Cell key={i} fill={i === weeklyData.length - 1 ? '#E84C27' : '#2E7D32'} />
                  ))}
                </Bar>
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

      {/* Peak Hours Analysis */}
      <Card className="overflow-hidden">
        <CardHead
          title="Peak Hours Analysis"
          subtitle="All-time bookings by hour of day — when demand is highest"
        />
        <div className="card-body h-[260px] pt-6">
          {bookings.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sub text-sm">
              No booking data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} barSize={10} margin={{ top: 24, left: 0, right: 0, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tick={(props) => {
                    const { x, y, payload } = props
                    const isPeak = peakHour && payload.value === peakHour.label
                    return (
                      <text
                        x={x} y={y + 12} textAnchor="middle"
                        fontSize={8} fontWeight={isPeak ? 800 : 600}
                        fill={isPeak ? '#E84C27' : '#94a3b8'}
                      >
                        {payload.value}
                      </text>
                    )
                  }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="bookings" radius={[8, 8, 8, 8]} name="Rides">
                  {hourlyData.map((entry) => (
                    <Cell key={entry.hour} fill={peakHour && entry.hour === peakHour.hour ? '#E84C27' : '#e2e8f0'} />
                  ))}
                  <LabelList
                    dataKey="bookings"
                    content={(props) => {
                      const { x, y, width, value, index } = props
                      const entry = hourlyData[index]
                      if (!peakHour || entry.hour !== peakHour.hour) return null
                      return (
                        <text x={x + width / 2} y={y - 10} textAnchor="middle" fill="#E84C27" fontSize={14} fontWeight={800}>
                          {value}
                        </text>
                      )
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  )
}