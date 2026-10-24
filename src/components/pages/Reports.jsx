// src/components/pages/Reports.jsx
// Objective 4: organize reports, ratings, and complaints
import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAdmin } from '@/lib/AdminContext'
import { useToastCtx } from '@/lib/ToastContext'
import { StatCard, Card, CardHead, StatusBadge, DataTable, Modal, Avatar } from '@/components/ui'
import {
  AlertTriangle, Search, CheckCircle2, Eye,
  Check, Clock, Filter, FileText, User,
  Car, Calendar, AlertCircle, ShieldAlert, Info
} from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import { formatDateTime } from '@/lib/timestamps'
import { SEVERITY_LEVELS, OTHER_TYPE, severityInfo, needsReview } from '@/lib/severity'
import TimestampCell from '@/components/ui/TimestampCell'

// Colors and icons for the three severity levels. Bold on purpose, to match the
// panel's gradient banners: solid colored headers with white text. White on bright
// amber is only 2.1:1, so Medium uses a deeper amber-to-orange header (3.2:1 or
// better, used only for large bold text) and a dark label when it is "selected".
// Every light-mode color has a dark-mode counterpart.
const SEVERITY_STYLE = {
  High: {
    Icon: ShieldAlert,
    header:   'from-red-600 to-red-700',
    chip:     'border-red-500 text-red-700 dark:text-red-300',
    accent:   'border-red-500',
    bar:      'bg-red-400',
    selected: 'bg-red-600 border-red-600 text-white',
  },
  Medium: {
    Icon: AlertTriangle,
    header:   'from-amber-600 to-orange-600',
    chip:     'border-amber-500 text-amber-700 dark:text-amber-300',
    accent:   'border-amber-500',
    bar:      'bg-amber-400',
    selected: 'bg-amber-500 border-amber-500 text-navy',
  },
  Low: {
    Icon: Info,
    header:   'from-green to-green-dark',
    chip:     'border-green text-green dark:text-green-light',
    accent:   'border-green',
    bar:      'bg-emerald-400',
    selected: 'bg-green border-green text-white',
  },
}

export default function Reports() {
  const { reports, resolveReport, updateReportStatus, updateReportSeverity, stats, loading } = useAdmin()
  const { toast } = useToastCtx()
  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)
  const [savingSeverity, setSavingSeverity] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  // Issue-type breakdown — moved here from the Reports (formerly
  // "Records") page, since it's specifically about complaints and
  // belongs alongside the actual complaint management workflow rather
  // than on a separate analytics/export page.
  const byTypeSorted = useMemo(() => {
    const byType = {}
    reports.forEach(r => {
      // issue_type is now an array (a report can flag multiple issues at
      // once) — each selected type counts toward its own bucket here,
      // rather than the whole combination being treated as one bucket.
      const types = Array.isArray(r.issue_type) ? r.issue_type : [r.issue_type].filter(Boolean)
      const keys = types.length > 0 ? types : ['Uncategorized']
      keys.forEach(key => { byType[key] = (byType[key] || 0) + 1 })
    })
    return Object.entries(byType).sort((a, b) => b[1] - a[1])
  }, [reports])

  // Deep-link support: /reports?id=<report_id> opens that report's modal directly
  // (used when navigating in from a notification).
  useEffect(() => {
    const id = searchParams.get('id')
    if (!id || !reports.length) return
    const match = reports.find(r => r.id === id)
    if (match) {
      setSelected(match)
      const next = new URLSearchParams(searchParams)
      next.delete('id')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, reports, setSearchParams])

  const filtered = reports.filter(r => {
    const matchFilter = filter === 'all' ? true :
      filter === 'needs review' ? needsReview(r) :
      ['high', 'medium', 'low'].includes(filter) ? r.severity?.toLowerCase() === filter : r.status === filter
    const q = search.toLowerCase()
    const matchSearch = search === '' ||
      r.users?.name?.toLowerCase().includes(q) ||
      r.drivers?.name?.toLowerCase().includes(q) ||
      (Array.isArray(r.issue_type) ? r.issue_type : [r.issue_type]).some(t => t?.toLowerCase().includes(q))
    return matchFilter && matchSearch
  })

  // Complaints that include Other and are waiting for an admin to set the level
  const needsReviewCount = reports.filter(needsReview).length

  // How the complaints split across the three levels (for the guide's numbers and bar)
  const severityCounts = Object.fromEntries(SEVERITY_LEVELS.map(s => [s.level, reports.filter(r => r.severity === s.level).length]))
  const severityTotal = SEVERITY_LEVELS.reduce((n, s) => n + severityCounts[s.level], 0)

  const handleSeverity = async (id, level) => {
    setSavingSeverity(true)
    const { error } = await updateReportSeverity(id, level)
    setSavingSeverity(false)
    if (error) { toast('Could not save the severity: ' + error.message, 'error'); return }
    toast(`Severity set to ${level}`)
  }

  const handleResolve = async (id) => {
    const { error } = await resolveReport(id)
    if (error) { toast('Failed: ' + error.message, 'error'); return }
    toast('Report resolved')
    setSelected(null)
  }

  const r = selected ? (reports.find(x => x.id === selected.id) || selected) : null

  return (
    <div className="space-y-5 page-enter">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<AlertCircle size={20} className="text-blue-600" />}     iconBg="bg-blue-50"     value={reports.filter(r => r.status === 'pending').length} label="Pending" />
        <StatCard icon={<Clock size={20} className="text-amber-600" />}        iconBg="bg-amber-50"    value={reports.filter(r => r.status === 'under review').length} label="Under Review" />
        <StatCard icon={<CheckCircle2 size={20} className="text-green" />}     iconBg="bg-green-light" value={reports.filter(r => r.status === 'resolved').length} label="Resolved" />
        <StatCard icon={<AlertTriangle size={20} className="text-red-600" />}  iconBg="bg-red-50"      value={stats.highSeverityReports} label="High Severity" />
      </div>

      {/* Driver Issue Severity Categories. The database rates every complaint from its
          issue types (see src/lib/severity.js); this explains how, and shows where the
          complaints stand. */}
      <section className="space-y-4">
        <div className="brand-gradient rounded-xl2 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-lg text-white"><ShieldAlert size={24} /></div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-widest font-bold mb-0.5">How complaints are rated</p>
                <h3 className="text-white text-xl font-black leading-tight">Driver Issue Severity Categories</h3>
              </div>
            </div>
            {needsReviewCount > 0 && (
              <span className="bg-amber-400 text-navy text-xs font-black px-3.5 py-2 rounded-full shadow-sm">
                {needsReviewCount} complaint{needsReviewCount === 1 ? '' : 's'} waiting for your review
              </span>
            )}
          </div>
          <p className="text-white/70 text-sm mt-3 max-w-3xl leading-relaxed">
            Every complaint is rated automatically from its issue types. A complaint with several types takes the highest level.
          </p>
          {severityTotal > 0 && (
            <div className="mt-4">
              <div className="flex h-3 rounded-full overflow-hidden bg-white/10" role="img"
                aria-label={SEVERITY_LEVELS.map(s => `${severityCounts[s.level]} ${s.level}`).join(', ')}>
                {SEVERITY_LEVELS.filter(s => severityCounts[s.level] > 0).map(s => (
                  <div key={s.level} data-bar={s.level} className={SEVERITY_STYLE[s.level].bar}
                    style={{ width: `${(severityCounts[s.level] / severityTotal) * 100}%` }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
                {SEVERITY_LEVELS.map(s => (
                  <span key={s.level} className="flex items-center gap-1.5 text-xs font-bold text-white/80">
                    <span className={`w-2.5 h-2.5 rounded-full ${SEVERITY_STYLE[s.level].bar}`} />
                    {s.level} {severityCounts[s.level]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SEVERITY_LEVELS.map(s => {
            const style = SEVERITY_STYLE[s.level]
            const count = severityCounts[s.level]
            return (
              <div key={s.level} data-severity={s.level}
                className="rounded-xl2 overflow-hidden border border-border dark:border-border-dark bg-white dark:bg-card-dm shadow-sm flex flex-col">
                <div className={`bg-gradient-to-br ${style.header} px-5 py-4 text-white flex items-center justify-between gap-3`}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <style.Icon size={22} />
                    </div>
                    <p className="text-xl font-black leading-tight">{s.level}</p>
                  </div>
                  <p className="text-right leading-none">
                    <span className="block text-3xl font-black">{count}</span>{' '}
                    <span className="block text-xs font-bold mt-1">complaint{count === 1 ? '' : 's'}</span>
                  </p>
                </div>
                <div className="p-5 flex-1 flex flex-col gap-4">
                  <p className="text-sm font-bold text-navy dark:text-text-dark-primary leading-snug">{s.meaning}</p>
                  <div>
                    <p className="text-[10px] font-bold text-sub dark:text-sub-dm uppercase tracking-widest mb-2">Issue types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {s.issueTypes.map(t => (
                        <span key={t} className={`text-[11px] font-bold px-2.5 py-1 rounded-full border-2 ${style.chip}`}>
                          {t === OTHER_TYPE ? 'Other (admin reviews)' : t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={`mt-auto rounded-xl px-4 py-3 border-l-4 ${style.accent} bg-surface dark:bg-bg-dark-secondary`}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-sub dark:text-sub-dm mb-1">Suggested action</p>
                    <p className="text-xs text-navy dark:text-text-dark-primary leading-relaxed">{s.action}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3 rounded-xl2 border border-border dark:border-border-dark bg-white dark:bg-card-dm px-4 py-3.5">
          <div className="w-8 h-8 rounded-full bg-green text-white flex items-center justify-center flex-shrink-0"><Info size={16} /></div>
          <p className="text-xs text-sub dark:text-sub-dm leading-relaxed self-center">
            <span className="font-bold text-navy dark:text-text-dark-primary">Other</span> starts at Medium until an admin reads it and sets the final level.
            If the commuter says it put them in danger or hurt them, the complaint is High right away.
          </p>
        </div>
      </section>

      {byTypeSorted.length > 0 && (
        <Card>
          <CardHead title="By Issue Type" subtitle="Which categories of complaints come up most often" />
          <div className="card-body space-y-2">
            {byTypeSorted.map(([type, count]) => {
              const pct = Math.round((count / reports.length) * 100)
              return (
                <div key={type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-navy">{type}</span>
                    <span className="text-sub">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-cta rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card>
        <CardHead title="Commuter Complaints & Incidents" />

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
              {['all', 'needs review', 'pending', 'under review', 'resolved', 'high', 'medium', 'low'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                    filter === f ? 'bg-green text-white shadow-sm' : 'bg-surface text-sub hover:bg-border/50 hover:text-navy'
                  }`}>
                  {f === 'needs review' ? `needs review (${needsReviewCount})` :
                   ['high', 'medium', 'low'].includes(f) ? `${f} severity` : f}
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
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="group hover:bg-surface/30 transition-colors">
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar userId={r.customer_id} initials={r.users?.name?.split(' ').map(w=>w[0]).join('').slice(0,2) || 'CO'} color="#1565c0" size="sm" />
                        <span className="font-semibold text-sm text-navy">{r.users?.name || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar userId={r.drivers?.user_id} initials={r.drivers?.name?.split(' ').map(w=>w[0]).join('').slice(0,2) || 'DR'} color={r.drivers?.color || 'var(--color-primary)'} size="sm" />
                        <span className="text-sm">{r.drivers?.name || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-bold uppercase tracking-wider text-navy opacity-80">
                        {Array.isArray(r.issue_type) ? r.issue_type.join(', ') : r.issue_type}
                      </span>
                    </td>
                    <td className="text-xs text-sub max-w-[180px] truncate" title={r.description || undefined}>
                      {r.description || <span className="italic opacity-70">No description</span>}
                    </td>
                    <td>
                      <StatusBadge status={r.severity} />
                      {r.safety_concern && <p className="text-[10px] font-bold text-red-600 mt-1">Danger reported</p>}
                      {needsReview(r) && <p className="text-[10px] font-bold text-amber-700 mt-0.5">Needs review</p>}
                    </td>
                    <td><TimestampCell value={r.created_at} /></td>
                    <td>
                      <select
                        value={r.status}
                        onChange={async e => {
                          const { error } = await updateReportStatus(r.id, e.target.value)
                          toast(error ? 'Failed: ' + error.message : 'Status updated', error ? 'error' : undefined)
                        }}
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
                            onClick={async () => {
                              const { error } = await resolveReport(r.id)
                              toast(error ? 'Failed: ' + error.message : 'Report resolved', error ? 'error' : undefined)
                            }}
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
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(Array.isArray(r.issue_type) ? r.issue_type : [r.issue_type]).filter(Boolean).map(t => (
                  <span key={t} className="text-xs font-bold text-navy bg-white/60 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>

            {/* What this severity means, and the suggested action */}
            {severityInfo(r.severity) && (
              <p className="text-xs text-sub leading-relaxed">
                <span className="font-bold text-navy">{r.severity} severity:</span> {severityInfo(r.severity).meaning}.{' '}
                <span className="font-bold text-navy">Suggested action:</span> {severityInfo(r.severity).action}
              </p>
            )}

            {/* The commuter said it put them in danger */}
            {r.safety_concern && (
              <div className="flex gap-2.5 rounded-xl border-l-4 border-red-600 bg-red-50 dark:bg-red-950/40 px-4 py-3">
                <AlertTriangle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 dark:text-red-200 leading-relaxed">
                  <span className="font-bold">The commuter said this put them in danger or hurt them.</span>{' '}
                  It is rated High until you decide otherwise.
                </p>
              </div>
            )}

            {/* The admin's decision on the severity */}
            <div className="rounded-xl border border-border dark:border-border-dark p-4">
              <p className="text-[10px] font-bold text-sub dark:text-sub-dm uppercase tracking-wider mb-2">Set the severity</p>
              <div className="grid grid-cols-3 gap-2">
                {['Low', 'Medium', 'High'].map(level => (
                  <button key={level} type="button" disabled={savingSeverity}
                    onClick={() => handleSeverity(r.id, level)}
                    className={`py-2.5 rounded-xl border-2 text-xs font-black transition-all disabled:opacity-60 ${
                      r.severity === level
                        ? SEVERITY_STYLE[level].selected
                        : 'border-border dark:border-border-dark text-sub dark:text-sub-dm hover:border-navy/30'
                    }`}>
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-xs text-sub mt-2.5 leading-relaxed">
                {r.severity_reviewed
                  ? `Set by an admin on ${formatDateTime(r.severity_reviewed_at)}. Click another level to change it.`
                  : needsReview(r)
                    ? 'Needs your review. The commuter chose Other, so this level is provisional. Click a level to set it, or click the current one to confirm it.'
                    : 'Rated automatically from the issue types. Click a level to change it.'}
              </p>
            </div>

            {/* Filed by + Against */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface rounded-xl p-3">
                <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <User size={10} /> Filed By
                </p>
                <div className="flex items-center gap-2">
                  <Avatar userId={r.customer_id} initials={r.users?.name?.split(' ').map(w=>w[0]).join('').slice(0,2) || 'CO'} color="#1565c0" size="sm" />
                  <div>
                    <p className="font-semibold text-sm text-navy">{r.users?.name || '—'}</p>
                    <p className="text-xs text-sub mt-0.5">{r.users?.email || ''}</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface rounded-xl p-3">
                <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Car size={10} /> Against Driver
                </p>
                <div className="flex items-center gap-2">
                  <Avatar userId={r.drivers?.user_id} initials={r.drivers?.name?.split(' ').map(w=>w[0]).join('').slice(0,2) || 'DR'} color={r.drivers?.color || 'var(--color-primary)'} size="sm" />
                  <div>
                    <p className="font-semibold text-sm text-navy">{r.drivers?.name || '—'}</p>
                    <p className="text-xs text-sub font-mono mt-0.5">{r.drivers?.plate || ''}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Full description */}
            <div className="bg-surface rounded-xl p-4">
              <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertCircle size={11} /> Full Description
              </p>
              <p className="text-sm text-navy leading-relaxed">
                {r.description || 'No description. The commuter chose the issue types above.'}
              </p>
            </div>

            {/* When it was filed, and when it was last changed (or resolved).
                updated_at is kept current by a database trigger. It is only
                shown once it differs from the filing time, so a complaint
                nobody has touched does not repeat the same time twice. */}
            <div className="text-xs text-sub border-t border-border pt-3 space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5"><Calendar size={11} /> Filed on</span>
                <span className="font-medium text-navy">{formatDateTime(r.created_at)}</span>
              </div>
              {r.updated_at && Math.abs(new Date(r.updated_at) - new Date(r.created_at)) > 60000 && (
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5">
                    <Clock size={11} /> {r.status === 'resolved' ? 'Resolved on' : 'Last updated'}
                  </span>
                  <span className="font-medium text-navy">{formatDateTime(r.updated_at)}</span>
                </div>
              )}
              <p className="text-[10px]">All times are Philippine time.</p>
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