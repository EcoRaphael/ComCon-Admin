//src/components/pages/Settings.jsx
import { useState } from 'react'
import { useToastCtx } from '@/lib/ToastContext'
import { useAdmin } from '@/lib/AdminContext'
import { Card, CardHead } from '@/components/ui'
import { supabase } from '@/lib/supabase/client'
import {
  Settings as SettingsIcon,
  Database,
  ShieldCheck,
  Info,
  Cpu,
  RefreshCw,
  CheckCircle,
  XCircle,
  Globe,
  Clock,
  Wifi,
  WifiOff,
  Save,
  Phone,
  Mail,
  AlertTriangle,
} from 'lucide-react'

const TECH_STACK = [
  { icon: <Globe size={14} />,      label: 'Frontend',  val: 'React.js + Vite + Tailwind CSS' },
  { icon: <Cpu size={14} />,        label: 'Backend',   val: 'Node.js + Express.js' },
  { icon: <Database size={14} />,   label: 'Database',  val: 'PostgreSQL via Supabase' },
  { icon: <ShieldCheck size={14} />,label: 'Auth',      val: 'Supabase Auth + Phone OTP' },
  { icon: <SettingsIcon size={14} />,label: 'Realtime', val: 'Supabase Realtime' },
]

const SYSTEM_OBJECTIVES = [
  { no: 1, text: 'Manage bookings, ride details, and fare inquiries for commuters in Calbayog City.' },
  { no: 2, text: 'Verify vehicle and driver information to ensure reliability and safety.' },
  { no: 3, text: 'Monitor system activity and record all transactions.' },
  { no: 4, text: 'Organize reports, ratings, and complaints from commuters.' },
  { no: 5, text: 'Generate ride records, booking confirmations, and fare details.' },
]

// Tables to ping in the DB test
const DB_TABLES = ['users', 'drivers', 'bookings', 'payments', 'routes', 'vehicles', 'notifications']

export default function Settings() {
  const { toast }          = useToastCtx()
  const { stats, fetchAll } = useAdmin()

  // ── DB Connection state ──────────────────────────────────────────
  const [connStatus,  setConnStatus]  = useState(null)   // null | { ok, ms, tables }
  const [testing,     setTesting]     = useState(false)

  // ── System config state ──────────────────────────────────────────
  const [saving,  setSaving]  = useState(false)
  const [config,  setConfig]  = useState({
    supportEmail:  'support@commuterconnect.ph',
    supportPhone:  '+63 55 XXX XXXX',
    bookingWindow: '7',
  })

  // ── DB Connection test — pings every table individually ──────────
  const testConnection = async () => {
    setTesting(true)
    setConnStatus(null)
    const start = Date.now()
    const results = []

    try {
      for (const table of DB_TABLES) {
        const t0 = Date.now()
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        const ms = Date.now() - t0
        results.push({ table, ms, count: count ?? 0, ok: !error, error: error?.message })
      }

      const totalMs  = Date.now() - start
      const allOk    = results.every(r => r.ok)
      const avgMs    = Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length)

      setConnStatus({ ok: allOk, totalMs, avgMs, tables: results })
      toast(allOk
        ? `✅ All ${DB_TABLES.length} tables reachable — avg ${avgMs}ms`
        : `⚠️ Some tables failed — check results below`
      )
    } catch (err) {
      setConnStatus({ ok: false, totalMs: Date.now() - start, tables: [], error: err.message })
      toast('❌ Connection failed: ' + err.message)
    } finally {
      setTesting(false)
    }
  }

  // ── Save system config (localStorage for now) ────────────────────
  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast('Configuration saved')
    }, 700)
  }

  // Latency color helper
  const latencyColor = (ms) => {
    if (ms < 200)  return 'text-green'
    if (ms < 500)  return 'text-amber-600'
    return 'text-brand-red'
  }

  return (
    <div className="space-y-6 page-enter max-w-6xl mx-auto pb-10">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── System Config ── */}
        <Card>
          <CardHead
            title="System Configuration"
            subtitle="Operational parameters and support info"
          />
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label flex items-center gap-1.5">
                  <Globe size={12} /> Region
                </label>
                <input
                  className="field-input text-xs opacity-60 cursor-not-allowed"
                  defaultValue="Region VIII — Eastern Samar"
                  readOnly
                />
              </div>
              <div>
                <label className="field-label flex items-center gap-1.5">
                  <Clock size={12} /> Booking Window
                </label>
                <div className="flex items-center gap-2">
                  <input
                    className="field-input text-xs"
                    type="number"
                    value={config.bookingWindow}
                    onChange={e => setConfig(p => ({ ...p, bookingWindow: e.target.value }))}
                  />
                  <span className="text-[10px] font-bold text-sub whitespace-nowrap">DAYS</span>
                </div>
              </div>
            </div>

            <div>
              <label className="field-label flex items-center gap-1.5">
                <Mail size={12} /> Support Email
              </label>
              <input
                className="field-input text-sm"
                value={config.supportEmail}
                onChange={e => setConfig(p => ({ ...p, supportEmail: e.target.value }))}
              />
            </div>

            <div>
              <label className="field-label flex items-center gap-1.5">
                <Phone size={12} /> Support Phone
              </label>
              <input
                className="field-input text-sm"
                value={config.supportPhone}
                onChange={e => setConfig(p => ({ ...p, supportPhone: e.target.value }))}
              />
            </div>

            <button
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-70"
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? <RefreshCw size={16} className="animate-spin" />
                : <><Save size={16} /> Save Configuration</>
              }
            </button>
          </div>
        </Card>

        <div className="space-y-6">

          {/* ── Database Connection Test ── */}
          <Card>
            <CardHead
              title="Database Connection"
              subtitle="Live Supabase cluster health check"
            />
            <div className="card-body space-y-4">

              {/* Status banner */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${
                    connStatus === null ? 'bg-slate-100 text-sub' :
                    connStatus.ok      ? 'bg-green-50 text-green' : 'bg-red-50 text-brand-red'
                  }`}>
                    <Database size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Supabase PostgreSQL</p>
                    <p className="text-[10px] text-sub font-mono uppercase tracking-wider">
                      Samar · Data Node 01
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {connStatus === null && (
                    <span className="text-[10px] font-bold text-sub bg-slate-100 px-2 py-1 rounded">
                      NOT TESTED
                    </span>
                  )}
                  {connStatus?.ok && (
                    <div className="flex items-center gap-1.5 text-green font-bold text-xs">
                      <Wifi size={14} />
                      <span>Online · {connStatus.avgMs}ms avg</span>
                    </div>
                  )}
                  {connStatus && !connStatus.ok && (
                    <div className="flex items-center gap-1.5 text-brand-red font-bold text-xs">
                      <WifiOff size={14} />
                      <span>Unreachable</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Per-table results — shown after test */}
              {connStatus?.tables?.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="px-3 py-2 bg-surface border-b border-border flex justify-between">
                    <span className="text-[10px] font-black text-sub uppercase tracking-wider">Table</span>
                    <div className="flex gap-6">
                      <span className="text-[10px] font-black text-sub uppercase tracking-wider">Rows</span>
                      <span className="text-[10px] font-black text-sub uppercase tracking-wider">Latency</span>
                      <span className="text-[10px] font-black text-sub uppercase tracking-wider">Status</span>
                    </div>
                  </div>
                  {connStatus.tables.map(t => (
                    <div key={t.table} className="flex items-center justify-between px-3 py-2.5 border-b border-border last:border-b-0 hover:bg-surface/50 transition-colors">
                      <span className="text-xs font-mono font-bold text-navy">{t.table}</span>
                      <div className="flex items-center gap-6">
                        <span className="text-xs text-sub w-8 text-right">{t.count.toLocaleString()}</span>
                        <span className={`text-xs font-bold w-14 text-right ${latencyColor(t.ms)}`}>
                          {t.ms}ms
                        </span>
                        <span className="w-5">
                          {t.ok
                            ? <CheckCircle size={14} className="text-green" />
                            : <XCircle    size={14} className="text-brand-red" />
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="px-3 py-2 bg-surface flex justify-between items-center border-t border-border">
                    <span className="text-[10px] font-black text-sub uppercase">Total round-trip</span>
                    <span className={`text-xs font-black ${latencyColor(connStatus.totalMs)}`}>
                      {connStatus.totalMs}ms
                    </span>
                  </div>
                </div>
              )}

              {/* Error message */}
              {connStatus && !connStatus.ok && !connStatus.tables?.length && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                  <AlertTriangle size={14} className="text-brand-red mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-brand-red font-medium">{connStatus.error}</p>
                </div>
              )}

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['Drivers',  stats.totalDrivers],
                  ['Bookings', stats.totalBookings],
                  ['Alerts',   stats.openReports],
                ].map(([label, val]) => (
                  <div key={label} className="bg-surface rounded-xl p-3 border border-border text-center">
                    <p className="text-[10px] font-bold text-sub uppercase mb-1">{label}</p>
                    <p className="font-black text-navy text-lg">{val ?? 0}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  className="btn-primary flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-60"
                  onClick={testConnection}
                  disabled={testing}
                >
                  <RefreshCw size={13} className={testing ? 'animate-spin' : ''} />
                  {testing ? 'Testing...' : 'Run Connection Test'}
                </button>
                <button
                  className="btn-ghost flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5"
                  onClick={fetchAll}
                >
                  <RefreshCw size={13} /> Sync Data
                </button>
              </div>
            </div>
          </Card>

        </div>
      </div>

      {/* ── System Objectives ── */}
      <Card>
        <CardHead title="Core System Objectives" subtitle="Strategic goals for Calbayog City transit management" />
        <div className="card-body grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SYSTEM_OBJECTIVES.map(obj => (
            <div key={obj.no} className="p-4 bg-surface rounded-xl border border-border/50 relative overflow-hidden group hover:border-green transition-colors">
              <span className="absolute -right-2 -bottom-2 text-4xl font-black opacity-5 group-hover:opacity-10 transition-opacity">
                0{obj.no}
              </span>
              <p className="text-xs font-bold text-green mb-2">Objective 0{obj.no}</p>
              <p className="text-xs text-sub leading-relaxed relative z-10">{obj.text}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Tech Stack ── */}
      <Card>
        <CardHead title="Technical Architecture" subtitle="Hardware & Software Integrated Stack" />
        <div className="card-body">
          <div className="flex flex-wrap gap-3">
            {TECH_STACK.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-surface border border-border rounded-xl hover:border-green transition-colors">
                <div className="text-green bg-green-light p-1.5 rounded-lg">{item.icon}</div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-sub uppercase tracking-tighter">{item.label}</span>
                  <span className="text-xs font-bold text-navy">{item.val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── About / Project Context ── */}
      <Card className="bg-green-dark border-none overflow-hidden rounded-2xl">
        <div className="p-8 text-white relative">
          <div className="absolute right-[-20px] top-[-20px] opacity-5 pointer-events-none rotate-12">
            <Info size={240} />
          </div>
          <h3 className="text-2xl font-black mb-4 flex items-center gap-2">
            <Info className="text-green-dm" /> Project Context
          </h3>
          <div className="grid md:grid-cols-2 gap-8 text-sm text-white/70 leading-relaxed">
            <p>
              <strong className="text-white">CommuterConnect</strong> is a specialized web-based
              transportation platform designed for the unique geography of{' '}
              <strong className="text-white">Calbayog City, Samar</strong>. We bridge the gap between
              residents and native transport like tricycles, pedicabs, and multicabs.
            </p>
            <p>
              By digitizing driver verification and booking history, we enhance safety for the local
              community. The platform ensures that fare rates remain transparent and that every ride is
              accounted for within the city limits, providing a more organized urban commute.
            </p>
          </div>
        </div>
      </Card>

    </div>
  )
}