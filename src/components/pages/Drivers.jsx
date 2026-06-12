// src/components/pages/Drivers.jsx
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAdmin } from '@/lib/AdminContext'
import { useToastCtx } from '@/lib/ToastContext'
import { supabase } from '@/lib/supabase/client'
import { 
  StatCard, Card, CardHead, StatusBadge, DataTable, 
  Avatar, Modal, Field, EmptyState 
} from '@/components/ui'
import { 
  User, 
  Car, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Plus, 
  Star, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2, Trash2,
  Power, 
  ArrowRight, 
  ArrowLeft,
  Calendar,
  CreditCard,
  MapPin,
  ClipboardCheck
} from 'lucide-react'

const VEHICLE_TYPES = ['Tricycle', 'Pedicab', 'Timbol', 'Multicab']

const TYPE_ICONS = { 
  Tricycle: <Car className="w-4 h-4" />, 
  Pedicab: <Car className="w-4 h-4" />, 
  Timbol: <Car className="w-4 h-4" />, 
  Multicab: <Car className="w-4 h-4" /> 
}

const EMPTY_FORM = {
  name: '', phone: '', email: '', route: '', licenseNo: '',
  plate: '', type: 'Tricycle', color: '', year: '',
  brand: '', orNumber: '', crNumber: '', ltfrbPermit: '',
}

export default function Drivers() {
  const { drivers, toggleDriverStatus, verifyDriver, addDriver, deleteDriver, stats, loading } = useAdmin()
  const { toast } = useToastCtx()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewDriver, setViewDriver] = useState(null)
  const [activeTab, setActiveTab] = useState('driver')
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [driverVehicle,  setDriverVehicle]  = useState(null)
  const [loadingVehicle, setLoadingVehicle] = useState(false)
  const [confirmDelete,  setConfirmDelete]  = useState(null)
  const [deleting,       setDeleting]       = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  // Open modal if navigated here from Topbar CTA
  const location = useLocation()
  useEffect(() => {
    if (location.state?.openModal) setModalOpen(true)
  }, [location.state])

  // Also open modal when Topbar CTA clicked while already on this page
  useEffect(() => {
    const handler = () => setModalOpen(true)
    window.addEventListener('cc:openModal', handler)
    return () => window.removeEventListener('cc:openModal', handler)
  }, [])

  useEffect(() => {
    if (viewDriver) {
      setActiveTab('driver')
      fetchDriverVehicle(viewDriver.id)
    } else {
      setDriverVehicle(null)
    }
  }, [viewDriver])

  async function fetchDriverVehicle(driverId) {
    setLoadingVehicle(true)
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .eq('driver_id', driverId)
      .single()
    setDriverVehicle(data || null)
    setLoadingVehicle(false)
  }

  async function handleVerifyVehicle(vehicleId, current) {
    setVerifying(true)
    const { error } = await supabase
      .from('vehicles')
      .update({
        is_verified: !current,
        verified_at: !current ? new Date().toISOString() : null,
      })
      .eq('id', vehicleId)

    if (error) {
      toast('Failed to update vehicle verification')
    } else {
      toast(!current ? '✅ Vehicle verified!' : '⚠️ Verification removed')
      fetchDriverVehicle(viewDriver.id)
      fetchAll()
    }
    setVerifying(false)
  }

  const filtered = drivers.filter(d => {
    const q = search.toLowerCase()
    const matchSearch =
      d.name?.toLowerCase().includes(q) ||
      d.plate?.toLowerCase().includes(q) ||
      d.route?.toLowerCase().includes(q)
    const matchFilter =
      filter === 'all'        ? true :
      filter === 'active'     ? d.status === 'active' :
      filter === 'inactive'   ? d.status === 'inactive' :
      filter === 'unverified' ? !d.verified :
      d.vehicle_type === filter
    return matchSearch && matchFilter
  })

  const handleAdd = async () => {
    if (!form.name || !form.plate || !form.route) {
      toast('⚠️ Please fill in Name, Plate, and Route')
      return
    }
    setSaving(true)
    await addDriver(form)
    toast('✅ Driver & vehicle registered — pending verification')
    setModalOpen(false)
    setForm(EMPTY_FORM)
    setSaving(false)
  }

  const initials = (name) =>
    name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'

  const handleDelete = async (driver) => {
    setDeleting(true)
    await deleteDriver(driver.id)
    setDeleting(false)
    setConfirmDelete(null)
    setViewDriver(null)
    toast(driver.name + ' has been removed')
  }

  return (
    <div className="space-y-5 page-enter">

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<CheckCircle2 className="text-green-600 w-5 h-5" />} 
          iconBg="bg-green-50" 
          value={stats.activeDrivers} 
          label="Active" 
        />
        <StatCard 
          icon={<Power className="text-red-500 w-5 h-5" />} 
          iconBg="bg-red-50" 
          value={drivers.filter(d => d.status === 'inactive').length} 
          label="Off Duty" 
        />
        <StatCard 
          icon={<ShieldCheck className="text-blue-500 w-5 h-5" />} 
          iconBg="bg-blue-50" 
          value={drivers.filter(d => d.verified).length} 
          label="Verified" 
        />
        <StatCard 
          icon={<AlertCircle className="text-amber-500 w-5 h-5" />} 
          iconBg="bg-amber-50" 
          value={stats.unverifiedDrivers} 
          label="Unverified" 
        />
      </div>

      <Card>
        <CardHead
          title="Driver & Vehicle Management"
          action={
            <button className="btn-primary btn-sm flex items-center gap-2" onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4" /> Add Driver
            </button>
          }
        />

        <div className="px-5 py-3 border-b border-border flex flex-wrap gap-2 items-center">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sub" />
            <input
              className="field-input text-sm py-2 pl-9"
              placeholder="Search name, plate or route..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'active', 'inactive', 'unverified', ...VEHICLE_TYPES].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${
                  filter === f ? 'bg-green text-white' : 'bg-surface text-sub hover:text-navy'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body-np">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 text-green animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            /* FIX: Icon wrapped in centered flex container */
            <EmptyState 
              icon={
                <div className="flex flex-col items-center justify-center w-full mb-3">
                  <Car className="w-12 h-12 opacity-20" />
                </div>
              } 
              title="No drivers found" 
              subtitle="Adjust your search or filters" 
            />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <th>Driver</th><th>Vehicle</th><th>Plate</th>
                  <th>Route</th><th>Driver Verified</th><th>Rating</th>
                  <th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={initials(d.name)} color={d.color || 'var(--color-primary)'} size="sm" />
                        <div>
                          <p className="font-semibold text-sm">{d.name}</p>
                          <p className="text-xs text-sub">{d.license_no || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 text-sm">
                        {TYPE_ICONS[d.vehicle_type]} {d.vehicle_type}
                      </span>
                    </td>
                    <td className="font-mono text-sm">{d.plate}</td>
                    <td className="text-xs text-sub max-w-[150px] truncate">{d.route}</td>
                    <td>
                      {d.verified
                        ? <span className="badge badge-green flex items-center gap-1"><ShieldCheck className="w-3 h-3" />Verified</span>
                        : <span className="badge badge-amber flex items-center gap-1"><AlertCircle className="w-3 h-3" />Pending</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span className="text-sm">{Number(d.rating || 0).toFixed(1)}</span>
                      </div>
                    </td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>
                      <div className="flex gap-1.5 flex-wrap">
                        <button className="btn-ghost btn-sm" onClick={() => setViewDriver(d)}>View</button>
                        {!d.verified && (
                          <button className="btn-ghost btn-sm hover:border-green hover:text-green"
                            onClick={() => { verifyDriver(d.id); toast(`✅ ${d.name} verified!`) }}>
                            Verify
                          </button>
                        )}
                        <button className="btn-ghost btn-sm hover:border-brand-red hover:text-brand-red"
                          onClick={() => { toggleDriverStatus(d.id); toast(`⚡ ${d.name} status updated`) }}>
                          {d.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          className="btn-ghost btn-sm hover:border-red-600 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setConfirmDelete(d)}
                          title="Delete driver"
                        >
                          <Trash2 size={14} />
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

      {/* ── ADD DRIVER MODAL ── */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setForm(EMPTY_FORM) }} title="Register New Driver">
        <div className="flex gap-1 bg-surface rounded-xl p-1 mb-5">
          <button onClick={() => setActiveTab('driver')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'driver' ? 'bg-white text-navy shadow-sm' : 'text-sub hover:text-navy'
            }`}>
            <User className="w-4 h-4" /> Driver Info
          </button>
          <button onClick={() => setActiveTab('vehicle')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'vehicle' ? 'bg-white text-navy shadow-sm' : 'text-sub hover:text-navy'
            }`}>
            <Car className="w-4 h-4" /> Vehicle Info
          </button>
        </div>

        {activeTab === 'driver' && (
          <div className="space-y-1">
            <p className="text-xs text-sub mb-3">Basic driver information — all fields marked * are required.</p>
            <div className="grid grid-cols-2 gap-x-4">
              <Field label="Full Name *">
                <input className="field-input" placeholder="Juan Dela Cruz" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </Field>
              <Field label="Phone Number">
                <input className="field-input" placeholder="09XX XXX XXXX" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </Field>
            </div>
            <Field label="Email Address">
              <input className="field-input" type="email" placeholder="driver@email.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </Field>
            <Field label="Route Assignment *">
              <input className="field-input" placeholder="e.g. Nijaga Park ↔ Calbayog Port" value={form.route}
                onChange={e => setForm(p => ({ ...p, route: e.target.value }))} />
            </Field>
            <Field label="LTFRB License No.">
              <input className="field-input" placeholder="LTFRB-VIII-XXXX" value={form.licenseNo}
                onChange={e => setForm(p => ({ ...p, licenseNo: e.target.value }))} />
            </Field>
            <button className="btn-primary w-full mt-3 flex items-center justify-center gap-2" onClick={() => setActiveTab('vehicle')}>
              Next — Vehicle Info <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === 'vehicle' && (
          <div className="space-y-1">
            <p className="text-xs text-sub mb-3">Vehicle details for LTFRB verification — plate number is required.</p>
            <div className="grid grid-cols-2 gap-x-4">
              <Field label="Plate Number *">
                <input className="field-input" placeholder="SAM XXXX" value={form.plate}
                  onChange={e => setForm(p => ({ ...p, plate: e.target.value }))} />
              </Field>
              <Field label="Vehicle Type">
                <select className="field-select" value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {VEHICLE_TYPES.map(v => <option key={v}>{v}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-x-4">
              <Field label="Brand">
                <input className="field-input" placeholder="e.g. Honda, Yamaha" value={form.brand}
                  onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} />
              </Field>
              <Field label="Year">
                <input className="field-input" type="number" placeholder="e.g. 2020" value={form.year}
                  onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
              </Field>
            </div>
            <Field label="Color">
              <input className="field-input" placeholder="e.g. Green, Blue" value={form.color}
                onChange={e => setForm(p => ({ ...p, color: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-x-4">
              <Field label="OR Number">
                <input className="field-input" placeholder="Official Receipt No." value={form.orNumber}
                  onChange={e => setForm(p => ({ ...p, orNumber: e.target.value }))} />
              </Field>
              <Field label="CR Number">
                <input className="field-input" placeholder="Certificate of Registration" value={form.crNumber}
                  onChange={e => setForm(p => ({ ...p, crNumber: e.target.value }))} />
              </Field>
            </div>
            <Field label="LTFRB Franchise Permit">
              <input className="field-input" placeholder="e.g. LTFRB-VIII-XXXX" value={form.ltfrbPermit}
                onChange={e => setForm(p => ({ ...p, ltfrbPermit: e.target.value }))} />
            </Field>
            <div className="flex gap-3 mt-3">
              <button className="btn-ghost flex-1 flex items-center justify-center gap-2" onClick={() => setActiveTab('driver')}>
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button className="btn-primary flex-1 disabled:opacity-60" onClick={handleAdd} disabled={saving}>
                {saving ? 'Registering...' : 'Register Driver & Vehicle'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── VIEW DRIVER MODAL ── */}
      {viewDriver && (
        <Modal open={!!viewDriver} onClose={() => setViewDriver(null)} title={`Driver Profile`}>
          <div className="text-center mb-4">
            <Avatar initials={initials(viewDriver.name)} color={viewDriver.color || 'var(--color-primary)'} size="lg" className="mx-auto mb-3" />
            <p className="font-bold text-lg">{viewDriver.name}</p>
            <p className="text-sm text-sub flex items-center justify-center gap-2">
              {TYPE_ICONS[viewDriver.vehicle_type]} {viewDriver.vehicle_type} · {viewDriver.plate}
            </p>
            <div className="flex justify-center gap-2 mt-2">
              <StatusBadge status={viewDriver.status} />
              {viewDriver.verified
                ? <span className="badge badge-green flex items-center gap-1"><ShieldCheck className="w-3 h-3" />Verified</span>
                : <span className="badge badge-amber flex items-center gap-1"><AlertCircle className="w-3 h-3" />Unverified</span>}
            </div>
          </div>

          <div className="flex gap-1 bg-surface rounded-xl p-1 mb-4">
            <button onClick={() => setActiveTab('driver')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'driver' ? 'bg-white text-navy shadow-sm' : 'text-sub hover:text-navy'
              }`}>
              <User className="w-4 h-4" /> Info
            </button>
            <button onClick={() => setActiveTab('vehicle')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'vehicle' ? 'bg-white text-navy shadow-sm' : 'text-sub hover:text-navy'
              }`}>
              <Car className="w-4 h-4" /> Vehicle
            </button>
          </div>

          {activeTab === 'driver' && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Route', val: viewDriver.route || '—', icon: <MapPin className="w-3 h-3" /> },
                  { label: 'Rating', val: Number(viewDriver.rating || 0).toFixed(1) + ' / 5.0', icon: <Star className="w-3 h-3" /> },
                  { label: 'Trips', val: (viewDriver.trips || 0).toLocaleString(), icon: <Car className="w-3 h-3" /> },
                  { label: 'Earnings', val: '₱' + Number(viewDriver.earnings || 0).toLocaleString(), icon: <CreditCard className="w-3 h-3" /> },
                  { label: 'License', val: viewDriver.license_no || '—', icon: <ClipboardCheck className="w-3 h-3" /> },
                  { label: 'Joined', val: new Date(viewDriver.created_at).toLocaleDateString('en-PH'), icon: <Calendar className="w-3 h-3" /> },
                ].map((item) => (
                  <div key={item.label} className="bg-surface rounded-card p-3">
                    <p className="text-[10px] text-sub uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                      {item.icon} {item.label}
                    </p>
                    <p className="font-semibold text-sm break-all">{item.val}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                {!viewDriver.verified && (
                  <button className="btn-primary flex-1 flex items-center justify-center gap-2"
                    onClick={() => { verifyDriver(viewDriver.id); toast('✅ Driver verified!'); setViewDriver(null) }}>
                    <ShieldCheck className="w-4 h-4" /> Verify Driver
                  </button>
                )}
                <button className="btn-danger flex-1 flex items-center justify-center gap-2"
                  onClick={() => { toggleDriverStatus(viewDriver.id); toast('⚡ Status updated'); setViewDriver(null) }}>
                  <Power className="w-4 h-4" /> {viewDriver.status === 'active' ? 'Suspend' : 'Activate'}
                </button>
                <button
                  className="btn-ghost flex-1 flex items-center justify-center gap-2 hover:border-red-600 hover:text-red-600"
                  onClick={() => { setConfirmDelete(viewDriver); setViewDriver(null) }}
                >
                  <Trash2 className="w-4 h-4" /> Delete Driver
                </button>
              </div>
            </>
          )}

          {activeTab === 'vehicle' && (
            <>
              {loadingVehicle ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-6 h-6 text-green animate-spin" />
                </div>
              ) : driverVehicle ? (
                <>
                  <div className={`rounded-xl p-3 mb-4 flex items-center gap-3 ${
                    driverVehicle.is_verified ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                  }`}>
                    {driverVehicle.is_verified ? <ShieldCheck className="text-green-600 w-6 h-6" /> : <ShieldAlert className="text-amber-600 w-6 h-6" />}
                    <div>
                      <p className={`font-bold text-sm ${driverVehicle.is_verified ? 'text-green-800' : 'text-amber-800'}`}>
                        Vehicle {driverVehicle.is_verified ? 'Verified' : 'Pending Verification'}
                      </p>
                      {driverVehicle.verified_at && <p className="text-[11px] text-green-600">Approved on {new Date(driverVehicle.verified_at).toLocaleDateString('en-PH')}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      ['Plate', driverVehicle.plate_number], ['Type', driverVehicle.type],
                      ['Brand', driverVehicle.brand || '—'], ['Year', driverVehicle.year || '—'],
                      ['Color', driverVehicle.color || '—'], ['OR Number', driverVehicle.or_number || '—'],
                      ['CR Number', driverVehicle.cr_number || '—'], ['LTFRB Permit', driverVehicle.ltfrb_permit || '—'],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-surface rounded-card p-3">
                        <p className="text-[10px] text-sub uppercase tracking-wider font-bold mb-1">{label}</p>
                        <p className="font-semibold text-sm break-all">{val}</p>
                      </div>
                    ))}
                  </div>
                  <button className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${
                      driverVehicle.is_verified ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'btn-primary'
                    }`}
                    onClick={() => handleVerifyVehicle(driverVehicle.id, driverVehicle.is_verified)} disabled={verifying}>
                    {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : driverVehicle.is_verified ? <>Revoke Vehicle Verification</> : <><ShieldCheck className="w-4 h-4" /> Verify Vehicle</>}
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-sub border border-dashed border-border rounded-xl">
                  <Car className="w-8 h-8 mb-2 opacity-20" />
                  <p className="font-medium text-sm">No vehicle registered</p>
                </div>
              )}
            </>
          )}
        </Modal>
      )}
    {/* Confirm Delete Modal */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Driver">
        {confirmDelete && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
              <Trash2 size={20} className="text-red-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-red-800 text-sm">{confirmDelete.name}</p>
                <p className="text-red-600 text-xs mt-0.5">{confirmDelete.vehicle_type} · {confirmDelete.plate}</p>
              </div>
            </div>
            <p className="text-sm text-navy">
              Are you sure you want to permanently delete this driver? This will also remove their
              vehicle records and schedules. <span className="font-bold text-red-600">This cannot be undone.</span>
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                className="btn-ghost py-2.5"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn-danger py-2.5 flex items-center justify-center gap-2 disabled:opacity-60"
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting}
              >
                {deleting
                  ? <Loader2 size={16} className="animate-spin" />
                  : <><Trash2 size={15} /> Delete Permanently</>
                }
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}