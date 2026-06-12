// src/components/pages/Reports.jsx
// Objective 4: organize reports, ratings, and complaints
import { useState } from 'react'
import { useAdmin } from '@/lib/AdminContext'
import { useToastCtx } from '@/lib/ToastContext'
import { StatCard, Card, CardHead, StatusBadge, DataTable, Modal } from '@/components/ui'
import {
  AlertTriangle, Search, CheckCircle2, Eye,
  Check, Clock, Filter, FileText, User,
  Car, Calendar, AlertCircle, ShieldAlert
} from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

export default function Reports() {
  const { reports, resolveReport, updateReportStatus, stats, loading } = useAdmin()
  const { toast } = useToastCtx()
  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = reports.filter(r => {
    const matchFilter = filter === 'all' ? true :
      filter === 'high' ? r.severity === 'High' : r.status === filter
    const q = search.toLowerCase()
    const matchSearch = search === '' ||
      r.users?.name?.toLowerCase().includes(q) ||
      r.drivers?.name?.toLowerCase().includes(q) ||
      r.issue_type?.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const handleResolve = (id) => {
    resolveReport(id)
    toast('Report resolved')
    setSelected(null)
  }

  const r = selected

  return (
    <div className="space-y-5 page-enter">

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<AlertTriangle size={20} className="text-red-600" />}  iconBg="bg-red-50"      value={stats.highSeverityReports} label="High Severity" />
        <StatCard icon={<Clock size={20} className="text-amber-600" />}        iconBg="bg-amber-50"    value={reports.filter(r => r.status === 'under review').length} label="Under Review" />
        <StatCard icon={<CheckCircle2 size={20} className="text-green" />}     iconBg="bg-green-light" value={reports.filter(r => r.status === 'resolved').length} label="Resolved" />
      </div>

      <Card>
        <CardHead title="Commuter Complaints & Reports" />

        <div className="px-5 py-3 border-b border-border flex flex-wrap gap-4 items-center justify-between">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" />
            <input
              className="field-input pl-10 text-sm py-2"
              placeholder="Search commuter, driver, issue..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-sub" />
            <div className="flex gap-1.5 flex-wrap">
              {['all', 'pending', 'under review', 'resolved', 'high'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                    filter === f ? 'bg-green text-white shadow-sm' : 'bg-surface text-sub hover:bg-border/50 hover:text-navy'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card-body-np">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Spinner size={32} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sub">
              <FileText size={40} className="opacity-10 mb-2" />
              <p className="text-sm font-medium">No reports found matching your criteria</p>
            </div>
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <th>Filed By</th>
                  <th>Against Driver</th>
                  <th>Issue Type</th>
                  <th>Description</th>
                  <th>Severity</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="group hover:bg-surface/30 transition-colors">
                    <td className="font-semibold text-sm text-navy">{r.users?.name || '—'}</td>
                    <td className="text-sm">{r.drivers?.name || '—'}</td>
                    <td>
                      <span className="text-xs font-bold uppercase tracking-wider text-navy opacity-80">
                        {r.issue_type}
                      </span>
                    </td>
                    <td className="text-xs text-sub max-w-[180px] truncate" title={r.description}>
                      {r.description}
                    </td>
                    <td><StatusBadge status={r.severity} /></td>
                    <td className="text-xs text-sub font-mono">
                      {new Date(r.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      <select
                        value={r.status}
                        onChange={e => { updateReportStatus(r.id, e.target.value); toast('Status updated') }}
                        className="text-xs font-medium px-2 py-1 rounded-lg border border-border bg-white cursor-pointer focus:ring-2 focus:ring-green/20 outline-none"
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="under review">🔍 Under Review</option>
                        <option value="resolved">✅ Resolved</option>
                      </select>
                    </td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <button
                          className="p-2 text-sub hover:text-navy hover:bg-white rounded-lg transition-colors border border-transparent hover:border-border"
                          onClick={() => setSelected(r)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {r.status !== 'resolved' && (
                          <button
                            className="p-2 text-green hover:bg-green-light/30 rounded-lg transition-colors border border-transparent hover:border-green/20"
                            onClick={() => { resolveReport(r.id); toast('Report resolved') }}
                            title="Mark as Resolved"
                          >
                            <Check size={16} />
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

      {/* ── Report Detail Modal ── */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Report Detail">
        {r && (
          <div className="space-y-4">

            {/* Severity + Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className={
                  r.severity === 'High' ? 'text-brand-red' :
                  r.severity === 'Medium' ? 'text-amber-600' : 'text-green'
                } />
                <StatusBadge status={r.severity} />
              </div>
              <StatusBadge status={r.status} />
            </div>

            {/* Issue type banner */}
            <div className={`rounded-xl px-4 py-3 border ${
              r.severity === 'High'   ? 'bg-red-50 border-red-100' :
              r.severity === 'Medium' ? 'bg-amber-50 border-amber-100' :
                                        'bg-green-light border-green/20'
            }`}>
              <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-0.5">Issue Type</p>
              <p className="font-bold text-navy text-sm">{r.issue_type}</p>
            </div>

            {/* Filed by + Against */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface rounded-xl p-3">
                <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <User size={10} /> Filed By
                </p>
                <p className="font-semibold text-sm text-navy">{r.users?.name || '—'}</p>
                <p className="text-xs text-sub mt-0.5">{r.users?.email || ''}</p>
              </div>
              <div className="bg-surface rounded-xl p-3">
                <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Car size={10} /> Against Driver
                </p>
                <p className="font-semibold text-sm text-navy">{r.drivers?.name || '—'}</p>
                <p className="text-xs text-sub font-mono mt-0.5">{r.drivers?.plate || ''}</p>
              </div>
            </div>

            {/* Full description */}
            <div className="bg-surface rounded-xl p-4">
              <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertCircle size={11} /> Full Description
              </p>
              <p className="text-sm text-navy leading-relaxed">
                {r.description || 'No description provided.'}
              </p>
            </div>

            {/* Date filed */}
            <div className="flex items-center justify-between text-xs text-sub border-t border-border pt-3">
              <span className="flex items-center gap-1.5">
                <Calendar size={11} />
                Filed on {new Date(r.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span>{new Date(r.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            {/* Resolve action */}
            {r.status !== 'resolved' && (
              <button
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
                onClick={() => handleResolve(r.id)}
              >
                <Check size={15} /> Mark as Resolved
              </button>
            )}
          </div>
        )}
      </Modal>

    </div>
  )
}