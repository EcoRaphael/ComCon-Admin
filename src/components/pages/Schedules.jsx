// src/components/pages/Schedules.jsx
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAdmin } from '@/lib/AdminContext'
import { useToastCtx } from '@/lib/ToastContext'
import { StatCard, Modal } from '@/components/ui'
import Spinner from '@/components/ui/Spinner'
import {
  Calendar,
  CheckCircle2,
  Car,
  PauseCircle,
  List,
  LayoutGrid,
  Plus,
  X,
  Clock,
  Trash2,
  Play,
  Pause,
  AlertCircle,
  Edit3,
  Save
} from 'lucide-react'

// IMPORTANT: the database only accepts abbreviated codes ('Mon','Tue',...).
// DAYS below is the source of truth for form values, sorting, and filtering.
// DAY_FULL is used only for nicer display labels — never sent to the DB.
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const DAY_FULL = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
  Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
}

const DAY_SHORT = {
  Mon: 'Mon', Tue: 'Tue', Wed: 'Wed',
  Thu: 'Thu', Fri: 'Fri', Sat: 'Sat', Sun: 'Sun',
}

const DAY_COLORS = {
  Mon: 'bg-blue-50 text-blue-600',
  Tue: 'bg-purple-50 text-purple-600',
  Wed: 'bg-green-light text-green',
  Thu: 'bg-amber-50 text-amber-600',
  Fri: 'bg-red-50 text-red-600',
  Sat: 'bg-pink-100 text-pink-800',
  Sun: 'bg-gray-100 text-gray-600',
}

function calcHours(start, end) {
  const [sh, sm] = (start || '00:00').split(':').map(Number)
  const [eh, em] = (end || '00:00').split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  if (diff <= 0) return '—'
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return `${h}h${m > 0 ? ` ${m}m` : ''}`
}

const EMPTY_FORM = {
  driver_id: '', day_of_week: 'Mon',
  start_time: '06:00', end_time: '18:00', is_active: true,
}

const initials = (name) =>
  name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'

export default function Schedules() {
  const { drivers } = useAdmin()
  const { toast } = useToastCtx()

  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [filterDriver, setFilterDriver] = useState('all')
  const [filterDay, setFilterDay] = useState('all')
  const [view, setView] = useState('list')

  // Add form state
  const [form, setForm] = useState(EMPTY_FORM)

  // Edit modal state
  const [editTarget, setEditTarget] = useState(null)   // schedule being edited
  const [editForm, setEditForm] = useState(null)   // edit form values
  const [updating, setUpdating] = useState(false)

  useEffect(() => { fetchSchedules() }, [])

  async function fetchSchedules() {
    setLoading(true)
    const { data, error } = await supabase
      .from('schedules')
      .select('*, drivers(name, vehicle_type, plate, color, status, route)')
      .order('driver_id')
      .order('day_of_week')
    if (error) { toast('Failed to load schedules'); console.error(error) }
    else setSchedules(data || [])
    setLoading(false)
  }

  // ── Add new schedule ────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault()
    if (!form.driver_id) { toast('Please select a driver'); return }
    if (form.start_time >= form.end_time) { toast('End time must be after start time'); return }

    const exists = schedules.find(
      s => s.driver_id === form.driver_id && s.day_of_week === form.day_of_week
    )
    if (exists) { toast(`This driver already has a ${form.day_of_week} schedule`); return }

    setSaving(true)
    const { data, error } = await supabase.from('schedules').insert({
      driver_id: form.driver_id,
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      is_active: form.is_active,
    }).select('*, drivers(name, vehicle_type, plate, color, status, route)').single()

    if (error) {
      toast('Failed to save schedule')
    } else {
      setSchedules(prev => [...prev, data])
      toast('Schedule added successfully')
      setForm(EMPTY_FORM)
      setShowForm(false)
    }
    setSaving(false)
  }

  // ── Open edit modal ─────────────────────────────────────────────
  function openEdit(s) {
    setEditTarget(s)
    setEditForm({
      driver_id: s.driver_id,
      day_of_week: s.day_of_week,
      start_time: s.start_time?.slice(0, 5) || '06:00',
      end_time: s.end_time?.slice(0, 5) || '18:00',
      is_active: s.is_active,
    })
  }

  // ── Update schedule ─────────────────────────────────────────────
  async function handleUpdate() {
    if (!editForm || !editTarget) return
    if (editForm.start_time >= editForm.end_time) {
      toast('End time must be after start time')
      return
    }

    // Check for conflict with another schedule (excluding self)
    const conflict = schedules.find(
      s => s.driver_id === editForm.driver_id &&
        s.day_of_week === editForm.day_of_week &&
        s.id !== editTarget.id
    )
    if (conflict) { toast(`This driver already has a ${editForm.day_of_week} schedule`); return }

    setUpdating(true)
    const { error } = await supabase
      .from('schedules')
      .update({
        day_of_week: editForm.day_of_week,
        start_time: editForm.start_time,
        end_time: editForm.end_time,
        is_active: editForm.is_active,
      })
      .eq('id', editTarget.id)

    if (error) {
      toast('Failed to update schedule')
    } else {
      setSchedules(prev => prev.map(s =>
        s.id === editTarget.id ? { ...s, ...editForm } : s
      ))
      toast('Schedule updated successfully')
      setEditTarget(null)
      setEditForm(null)
    }
    setUpdating(false)
  }

  // ── Toggle active/paused ────────────────────────────────────────
  async function handleToggle(id, current) {
    const { error } = await supabase
      .from('schedules').update({ is_active: !current }).eq('id', id)
    if (!error) {
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s))
      toast(!current ? 'Schedule activated' : 'Schedule paused')
    }
  }

  // ── Delete schedule ─────────────────────────────────────────────
  async function handleDelete(id) {
    setDeleting(id)
    const { error } = await supabase.from('schedules').delete().eq('id', id)
    if (!error) {
      setSchedules(prev => prev.filter(s => s.id !== id))
      toast('Schedule removed')
    } else {
      toast('Failed to remove schedule')
    }
    setDeleting(null)
  }

  const filtered = useMemo(() => schedules.filter(s => {
    const matchDriver = filterDriver === 'all' ? true : s.driver_id === filterDriver
    const matchDay = filterDay === 'all' ? true : s.day_of_week === filterDay
    return matchDriver && matchDay
  }), [schedules, filterDriver, filterDay])

  const grouped = useMemo(() => filtered.reduce((acc, s) => {
    const key = s.driver_id
    if (!acc[key]) acc[key] = { driver: s.drivers, schedules: [] }
    acc[key].schedules.push(s)
    return acc
  }, {}), [filtered])

  const activeCount = schedules.filter(s => s.is_active).length
  const uniqueDrivers = [...new Set(schedules.map(s => s.driver_id))].length

  const weeklyData = useMemo(() =>
    DAYS.map(day => ({
      day,
      count: schedules.filter(s => s.day_of_week === day && s.is_active).length,
    }))
    , [schedules])

  const maxCount = Math.max(...weeklyData.map(d => d.count), 1)

  // ── Action buttons used in both list and grid ───────────────────
  const ActionButtons = ({ s, size = 16 }) => (
    <div className="flex gap-1.5 justify-end">
      {/* Edit */}
      <button
        onClick={() => openEdit(s)}
        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
        title="Edit Schedule"
      >
        <Edit3 size={size} />
      </button>
      {/* Pause / Activate */}
      <button
        onClick={() => handleToggle(s.id, s.is_active)}
        className={`p-1.5 rounded-lg transition-colors ${s.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-green hover:bg-green-light'
          }`}
        title={s.is_active ? 'Pause' : 'Activate'}
      >
        {s.is_active ? <Pause size={size} /> : <Play size={size} />}
      </button>
      {/* Delete */}
      <button
        onClick={() => handleDelete(s.id)}
        disabled={deleting === s.id}
        className="p-1.5 rounded-lg text-brand-red hover:bg-red-50 transition-colors disabled:opacity-40"
        title="Delete Schedule"
      >
        {deleting === s.id
          ? <Spinner size={size} />
          : <Trash2 size={size} />
        }
      </button>
    </div>
  )

  return (
    <div className="space-y-6 page-enter">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Driver Schedules</h1>
          <p className="text-sub text-sm mt-1">Manage driver availability and working hours</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-surface rounded-lg p-1 border border-border">
            <button onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${view === 'list' ? 'bg-white text-navy shadow-sm' : 'text-sub hover:text-navy'
                }`}>
              <List size={16} /> List
            </button>
            <button onClick={() => setView('grid')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${view === 'grid' ? 'bg-white text-navy shadow-sm' : 'text-sub hover:text-navy'
                }`}>
              <LayoutGrid size={16} /> Grid
            </button>
          </div>
          <button className="btn-primary btn-sm flex items-center gap-1.5" onClick={() => setShowForm(f => !f)}>
            {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Schedule</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Calendar size={20} className="text-green" />} iconBg="bg-green-light" value={schedules.length} label="Total Schedules" />
        <StatCard icon={<CheckCircle2 size={20} className="text-blue-600" />} iconBg="bg-blue-50" value={activeCount} label="Active" />
        <StatCard icon={<Car size={20} className="text-amber-600" />} iconBg="bg-amber-50" value={uniqueDrivers} label="Drivers Scheduled" />
        <StatCard icon={<PauseCircle size={20} className="text-red-600" />} iconBg="bg-red-50" value={schedules.length - activeCount} label="Paused" />
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-bold text-navy mb-5 flex items-center gap-2">
            <Plus size={18} className="text-green" /> Add Driver Schedule
          </h3>
          <form onSubmit={handleSave} className="space-y-4">

            {/* Row 1: Driver (full width) */}
            <div>
              <label className="field-label">Driver *</label>
              <select className="field-select w-full" value={form.driver_id}
                onChange={e => setForm(p => ({ ...p, driver_id: e.target.value }))}>
                <option value="">Select a driver...</option>
                {drivers.filter(d => d.status === 'active').map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.vehicle_type} · {d.plate}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 2: Day | Start | End */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="field-label">Day *</label>
                <select className="field-select" value={form.day_of_week}
                  onChange={e => setForm(p => ({ ...p, day_of_week: e.target.value }))}>
                  {DAYS.map(d => <option key={d} value={d}>{DAY_FULL[d]}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label flex items-center gap-1.5">
                  <Clock size={11} /> Start Time
                </label>
                <input type="time" className="field-input" value={form.start_time}
                  onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} />
              </div>
              <div>
                <label className="field-label flex items-center gap-1.5">
                  <Clock size={11} /> End Time
                </label>
                <input type="time" className="field-input" value={form.end_time}
                  onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} />
              </div>
            </div>

            {/* Duration preview */}
            {form.start_time && form.end_time && (
              <div className="flex items-center justify-between px-4 py-2 bg-surface rounded-lg border border-border text-sm">
                <span className="text-sub font-medium">Duration</span>
                <span className="font-bold text-navy">{calcHours(form.start_time, form.end_time)}</span>
              </div>
            )}

            {/* Row 3: Active toggle + Submit */}
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.is_active}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-green" />
                <span className="text-sm font-medium text-navy">Active immediately</span>
              </label>
              <button type="submit" disabled={saving}
                className="btn-primary disabled:opacity-60 ml-auto flex items-center gap-2 px-6">
                {saving ? <Spinner size={16} /> : <><Plus size={16} /> Add Schedule</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select className="field-select sm:w-64" value={filterDriver}
          onChange={e => setFilterDriver(e.target.value)}>
          <option value="all">All Drivers</option>
          {drivers.map(d => (
            <option key={d.id} value={d.id}>{d.name} — {d.vehicle_type}</option>
          ))}
        </select>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterDay('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterDay === 'all' ? 'bg-green text-white' : 'bg-white border border-border text-sub hover:border-green'
              }`}>All Days</button>
          {DAYS.map(d => (
            <button key={d} onClick={() => setFilterDay(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterDay === d ? 'bg-green text-white' : 'bg-white border border-border text-sub hover:border-green'
                }`}>{DAY_SHORT[d]}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-sub bg-white rounded-xl border border-border">
          <AlertCircle size={32} className="mb-2 opacity-20" />
          <p className="font-medium">No schedules found</p>
          <p className="text-xs mt-1">Add a schedule to get started</p>
        </div>
      ) : view === 'list' ? (

        /* ── LIST VIEW ── */
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left">
                  <th className="px-4 py-3 text-sub font-medium">Driver</th>
                  <th className="px-4 py-3 text-sub font-medium">Day</th>
                  <th className="px-4 py-3 text-sub font-medium">Hours</th>
                  <th className="px-4 py-3 text-sub font-medium">Duration</th>
                  <th className="px-4 py-3 text-sub font-medium">Status</th>
                  <th className="px-4 py-3 text-sub font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered
                  .sort((a, b) => {
                    if (a.drivers?.name < b.drivers?.name) return -1
                    if (a.drivers?.name > b.drivers?.name) return 1
                    return DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week)
                  })
                  .map(s => (
                    <tr key={s.id} className={`hover:bg-surface/50 transition-colors ${!s.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: s.drivers?.color || 'var(--color-primary)' }}>
                            {initials(s.drivers?.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-navy text-sm">{s.drivers?.name || '—'}</p>
                            <p className="text-xs text-sub">{s.drivers?.vehicle_type} · {s.drivers?.plate}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${DAY_COLORS[s.day_of_week]}`}>
                          {s.day_of_week}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-navy">
                        {s.start_time?.slice(0, 5)} → {s.end_time?.slice(0, 5)}
                      </td>
                      <td className="px-4 py-3 text-xs text-sub">
                        {calcHours(s.start_time, s.end_time)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${s.is_active ? 'badge-green' : 'badge-gray'}`}>
                          <span className="badge-dot" />{s.is_active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ActionButtons s={s} size={16} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

      ) : (

        /* ── GRID VIEW ── */
        <div className="space-y-4">
          {Object.values(grouped).map(({ driver, schedules: driverSchedules }) => (
            <div key={driverSchedules[0].driver_id}
              className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 bg-surface border-b border-border">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: driver?.color || 'var(--color-primary)' }}>
                  {initials(driver?.name)}
                </div>
                <div>
                  <p className="font-bold text-navy text-sm">{driver?.name || '—'}</p>
                  <p className="text-xs text-sub">{driver?.vehicle_type} · {driver?.plate} · {driver?.route}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-sub">{driverSchedules.length} day{driverSchedules.length !== 1 ? 's' : ''}</span>
                  <span className={`badge ${driver?.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                    <span className="badge-dot" />{driver?.status}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-border">
                {driverSchedules
                  .sort((a, b) => DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week))
                  .map(s => (
                    <div key={s.id}
                      className={`flex items-center gap-4 px-5 py-3 transition-colors ${!s.is_active ? 'opacity-50 bg-gray-50' : 'hover:bg-surface/50'
                        }`}>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full w-20 text-center flex-shrink-0 ${DAY_COLORS[s.day_of_week]}`}>
                        {DAY_SHORT[s.day_of_week]}
                      </span>
                      <span className="font-mono text-sm text-navy flex-1">
                        {s.start_time?.slice(0, 5)} → {s.end_time?.slice(0, 5)}
                        <span className="text-sub text-xs ml-2">({calcHours(s.start_time, s.end_time)})</span>
                      </span>
                      <ActionButtons s={s} size={14} />
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly overview */}
      {schedules.length > 0 && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-bold text-navy text-sm mb-1 flex items-center gap-2">
            <Calendar size={16} className="text-sub" /> Weekly Availability Overview
          </h3>
          <p className="text-xs text-sub mb-4">Active drivers per day of the week</p>
          <div className="grid grid-cols-7 gap-2">
            {weeklyData.map(({ day, count }) => (
              <div key={day} className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-sub">{DAY_SHORT[day]}</span>
                <div className="w-full bg-surface rounded-lg h-20 flex items-end p-1">
                  <div
                    className="w-full bg-green rounded transition-all duration-500"
                    style={{ height: `${Math.max((count / maxCount) * 100, count > 0 ? 8 : 0)}%` }}
                  />
                </div>
                <span className={`text-xs font-bold ${count > 0 ? 'text-navy' : 'text-sub'}`}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Edit Schedule Modal ── */}
      <Modal
        open={!!editTarget}
        onClose={() => { setEditTarget(null); setEditForm(null) }}
        title="Edit Schedule"
      >
        {editTarget && editForm && (
          <div className="space-y-4">

            {/* Driver info — read only */}
            <div className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: editTarget.drivers?.color || 'var(--color-primary)' }}>
                {initials(editTarget.drivers?.name)}
              </div>
              <div>
                <p className="font-semibold text-sm text-navy">{editTarget.drivers?.name}</p>
                <p className="text-xs text-sub">{editTarget.drivers?.vehicle_type} · {editTarget.drivers?.plate}</p>
              </div>
              <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${DAY_COLORS[editTarget.day_of_week]}`}>
                {editTarget.day_of_week}
              </span>
            </div>

            {/* Day */}
            <div>
              <label className="field-label">Day of Week</label>
              <select className="field-select" value={editForm.day_of_week}
                onChange={e => setEditForm(p => ({ ...p, day_of_week: e.target.value }))}>
                {DAYS.map(d => <option key={d} value={d}>{DAY_FULL[d]}</option>)}
              </select>
            </div>

            {/* Time range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label flex items-center gap-1.5">
                  <Clock size={11} /> Start Time
                </label>
                <input type="time" className="field-input" value={editForm.start_time}
                  onChange={e => setEditForm(p => ({ ...p, start_time: e.target.value }))} />
              </div>
              <div>
                <label className="field-label flex items-center gap-1.5">
                  <Clock size={11} /> End Time
                </label>
                <input type="time" className="field-input" value={editForm.end_time}
                  onChange={e => setEditForm(p => ({ ...p, end_time: e.target.value }))} />
              </div>
            </div>

            {/* Duration preview */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-surface rounded-xl border border-border">
              <span className="text-xs text-sub font-medium">Total Duration</span>
              <span className="font-bold text-navy text-sm">
                {calcHours(editForm.start_time, editForm.end_time)}
              </span>
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-surface rounded-xl border border-border">
              <input type="checkbox" checked={editForm.is_active}
                onChange={e => setEditForm(p => ({ ...p, is_active: e.target.checked }))}
                className="w-4 h-4 accent-green" />
              <div>
                <p className="text-sm font-semibold text-navy">Active Schedule</p>
                <p className="text-xs text-sub">Driver will appear as scheduled on this day</p>
              </div>
              <span className={`ml-auto badge ${editForm.is_active ? 'badge-green' : 'badge-gray'}`}>
                <span className="badge-dot" />{editForm.is_active ? 'Active' : 'Paused'}
              </span>
            </label>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                className="btn-danger flex items-center justify-center gap-2 py-2.5"
                onClick={() => {
                  handleDelete(editTarget.id)
                  setEditTarget(null)
                  setEditForm(null)
                }}
              >
                <Trash2 size={15} /> Delete Schedule
              </button>
              <button
                className="btn-primary flex items-center justify-center gap-2 py-2.5 disabled:opacity-60"
                onClick={handleUpdate}
                disabled={updating}
              >
                {updating ? <Spinner size={16} /> : <><Save size={15} /> Save Changes</>}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}