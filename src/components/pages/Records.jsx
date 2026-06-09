// src/components/pages/Records.jsx
// Objective 5: generate ride records, booking confirmations, and fare details
import { useState, useMemo } from 'react'
import { useAdmin } from '@/lib/AdminContext'
import { useToastCtx } from '@/lib/ToastContext'
import { Card, CardHead, DataTable, StatCard } from '@/components/ui'
import {
  FileSpreadsheet, History, Users, Receipt,
  Search, Calendar, ArrowRight, Download, FileText
} from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

// ── PDF generator — no external library needed, uses browser print ──────────
function generateBookingPDF(booking) {
  const b = booking
  const date = new Date(b.created_at).toLocaleDateString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric'
  })
  const time = new Date(b.created_at).toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit'
  })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Booking Confirmation — ${String(b.id).slice(0,8).toUpperCase()}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; padding: 40px; max-width: 600px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #2E7D32; }
        .brand { font-size: 22px; font-weight: 900; color: #111; }
        .brand span { color: #2E7D32; }
        .ref { font-size: 11px; color: #777; margin-top: 4px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge-paid { background: #E8F5E9; color: #2E7D32; }
        .badge-pending { background: #FFF8E1; color: #F59E0B; }
        .badge-completed { background: #E8F5E9; color: #2E7D32; }
        .badge-cancelled { background: #FFEBEE; color: #E53935; }
        h2 { font-size: 13px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.08em; margin: 24px 0 12px; }
        .route-box { background: #F5F5F5; border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .route-point { flex: 1; }
        .route-label { font-size: 10px; color: #888; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        .route-value { font-size: 15px; font-weight: 700; color: #111; }
        .arrow { font-size: 18px; color: #2E7D32; flex-shrink: 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px; }
        .info-box { background: #F5F5F5; border-radius: 10px; padding: 14px 16px; }
        .info-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .info-value { font-size: 14px; font-weight: 600; color: #111; }
        .info-sub { font-size: 11px; color: #777; margin-top: 2px; font-family: monospace; }
        .fare-box { background: #E8F5E9; border-radius: 12px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; margin: 20px 0; }
        .fare-label { font-size: 12px; color: #2E7D32; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .fare-value { font-size: 28px; font-weight: 900; color: #1B5E20; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E0E0E0; font-size: 11px; color: #999; text-align: center; line-height: 1.6; }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">Commuter<span>Connect</span></div>
          <div class="ref">Booking Confirmation Receipt</div>
          <div class="ref">Ref No: ${String(b.id).slice(0,8).toUpperCase()}</div>
        </div>
        <div style="text-align:right">
          <span class="badge badge-${b.status}">${b.status}</span>
          <div class="ref" style="margin-top:6px">${date}</div>
          <div class="ref">${time}</div>
        </div>
      </div>

      <h2>Route</h2>
      <div class="route-box">
        <div class="route-point">
          <div class="route-label">Pickup</div>
          <div class="route-value">${b.pickup || '—'}</div>
        </div>
        <div class="arrow">→</div>
        <div class="route-point" style="text-align:right">
          <div class="route-label">Dropoff</div>
          <div class="route-value">${b.dropoff || '—'}</div>
        </div>
      </div>

      <h2>Ride Details</h2>
      <div class="grid">
        <div class="info-box">
          <div class="info-label">Commuter</div>
          <div class="info-value">${b.users?.name || '—'}</div>
          <div class="info-sub">${b.users?.phone || ''}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Driver</div>
          <div class="info-value">${b.drivers?.name || '—'}</div>
          <div class="info-sub">${b.drivers?.plate || ''}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Vehicle Type</div>
          <div class="info-value">${b.vehicle_type || '—'}</div>
        </div>
        <div class="info-box">
          <div class="info-label">Payment Status</div>
          <div class="info-value">
            <span class="badge badge-${b.payment_status}">${b.payment_status || 'unpaid'}</span>
          </div>
        </div>
      </div>

      <div class="fare-box">
        <div class="fare-label">Total Fare</div>
        <div class="fare-value">₱${Number(b.fare || 0).toFixed(2)}</div>
      </div>

      <div class="footer">
        CommuterConnect · Calbayog City, Western Samar<br/>
        Regulated by LTFRB Region VIII · System Monitored by LTO Calbayog<br/>
        This is an official booking confirmation. Please keep this for your records.
      </div>

      <script>window.onload = () => { window.print(); }</script>
    </body>
    </html>
  `

  const win = window.open('', '_blank', 'width=700,height=900')
  win.document.write(html)
  win.document.close()
}

// ── CSV export (unchanged) ───────────────────────────────────────────────────
function exportCSV(type, bookings, payments, toast) {
  let csv = ''
  const filename = `commuterconnect-${type}-${new Date().toISOString().split('T')[0]}.csv`

  if (type === 'bookings') {
    csv = 'Commuter,Driver,Pickup,Dropoff,Vehicle,Fare,Payment Status,Date\n'
    csv += bookings.map(b =>
      `"${b.users?.name || ''}","${b.drivers?.name || ''}","${b.pickup}","${b.dropoff}","${b.vehicle_type}","${b.fare}","${b.payment_status}","${new Date(b.created_at).toLocaleDateString('en-PH')}"`
    ).join('\n')
  } else if (type === 'fares') {
    csv = 'Commuter,Driver,Amount,Method,Status,Date\n'
    csv += payments.map(p =>
      `"${p.users?.name || ''}","${p.drivers?.name || ''}","${p.amount}","${p.method}","${p.status}","${new Date(p.created_at).toLocaleDateString('en-PH')}"`
    ).join('\n')
  } else {
    csv = 'Commuter,Driver,Pickup,Dropoff,Vehicle,Fare,Status,Date\n'
    csv += bookings.map(b =>
      `"${b.users?.name || ''}","${b.drivers?.name || ''}","${b.pickup}","${b.dropoff}","${b.vehicle_type}","${b.fare}","${b.status}","${new Date(b.created_at).toLocaleDateString('en-PH')}"`
    ).join('\n')
  }

  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  toast(`${type} exported as CSV`)
}

export default function Records() {
  const { bookings, payments, stats, loading } = useAdmin()
  const { toast } = useToastCtx()
  const [search,     setSearch]     = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const completed = bookings.filter(b => b.status === 'completed')
  const totalFare = completed.reduce((s, b) => s + Number(b.fare || 0), 0)

  const filteredRecords = useMemo(() => bookings.filter(b => {
    const matchesSearch = !search ||
      b.users?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.drivers?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.pickup?.toLowerCase().includes(search.toLowerCase())
    const matchesDate = !dateFilter || b.created_at?.startsWith(dateFilter)
    return matchesSearch && matchesDate
  }), [bookings, search, dateFilter])

  return (
    <div className="space-y-6 page-enter">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<History       size={20} className="text-green"      />} iconBg="bg-green-light" value={completed.length}                label="Completed Rides"   />
        <StatCard icon={<Receipt       size={20} className="text-blue-600"  />} iconBg="bg-blue-50"    value={`₱${totalFare.toLocaleString()}`} label="Confirmed Fares"   />
        <StatCard icon={<FileSpreadsheet size={20} className="text-amber-600"/>} iconBg="bg-amber-50"   value={stats.totalBookings}              label="Total Records"     />
        <StatCard icon={<Users         size={20} className="text-purple-600"/>} iconBg="bg-purple-50"  value={stats.totalCustomers}             label="Commuter Records"  />
      </div>

      {/* Export cards */}
      <Card>
        <CardHead
          title="Reporting & Exports"
          subtitle="Generate official ride records and fare summaries for LTFRB auditing"
        />
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Booking Confirmations', desc: 'Detailed log of passenger assignments', type: 'bookings', icon: <Users size={16} /> },
              { label: 'Fare Details Report',   desc: 'Financial records and payment methods', type: 'fares',    icon: <Receipt size={16} /> },
              { label: 'Full Ride History',      desc: 'End-to-end trip data and timestamps',  type: 'rides',    icon: <History size={16} /> },
            ].map(item => (
              <div key={item.type} className="group hover:border-green transition-all bg-white rounded-xl p-5 border border-border flex flex-col justify-between">
                <div>
                  <div className="bg-surface w-8 h-8 rounded-lg flex items-center justify-center text-navy mb-3 group-hover:bg-green group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                  <p className="font-bold text-sm text-navy mb-1">{item.label}</p>
                  <p className="text-[11px] text-sub leading-relaxed mb-4">{item.desc}</p>
                </div>
                <button
                  className="btn-primary btn-sm w-full py-2 flex items-center justify-center gap-2"
                  onClick={() => exportCSV(item.type, bookings, payments, toast)}
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Master log with PDF per row */}
      <Card>
        <CardHead
          title="Master Transaction Log"
          subtitle="Real-time record monitoring — click any row to print PDF confirmation"
          action={
            <div className="flex gap-2">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" size={14} />
                <input
                  type="text"
                  placeholder="Search passenger..."
                  className="field-input pl-9 py-1.5 text-xs w-48"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="relative hidden sm:block">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" size={14} />
                <input
                  type="date"
                  className="field-input pl-9 py-1.5 text-xs"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                />
              </div>
              <button className="btn-ghost btn-sm flex items-center gap-2" onClick={() => exportCSV('all', bookings, payments, toast)}>
                <Download size={14} /> Export All
              </button>
            </div>
          }
        />
        <div className="card-body-np overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DataTable>
                <thead>
                  <tr>
                    <th>Commuter</th>
                    <th>Driver</th>
                    <th>Route Detail</th>
                    <th>Vehicle</th>
                    <th>Fare</th>
                    <th>Payment</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRecords.map(b => (
                    <tr key={b.id} className="hover:bg-surface/50 transition-colors">
                      <td className="font-bold text-navy py-4">{b.users?.name || '—'}</td>
                      <td className="text-sm font-medium">{b.drivers?.name || 'Unassigned'}</td>
                      <td className="max-w-[200px]">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-sub">
                          <span className="truncate">{b.pickup}</span>
                          <ArrowRight size={10} className="flex-shrink-0" />
                          <span className="truncate">{b.dropoff}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-surface border border-border rounded">
                          {b.vehicle_type}
                        </span>
                      </td>
                      <td className="font-black text-navy">₱{Number(b.fare || 0).toFixed(2)}</td>
                      <td>
                        <div className={`badge ${b.payment_status === 'paid' ? 'badge-green' : 'badge-amber'}`}>
                          <span className="badge-dot" />{b.payment_status}
                        </div>
                      </td>
                      <td className="text-[11px] text-sub font-mono">
                        {new Date(b.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td>
                        <div className={`badge ${
                          b.status === 'completed' ? 'badge-green' :
                          b.status === 'ongoing'   ? 'badge-blue'  :
                          b.status === 'cancelled' ? 'badge-red'   : 'badge-amber'
                        }`}>
                          {b.status}
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn-ghost btn-sm flex items-center gap-1 hover:border-green hover:text-green"
                          onClick={() => generateBookingPDF(b)}
                          title="Print PDF confirmation"
                        >
                          <FileText size={13} /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}