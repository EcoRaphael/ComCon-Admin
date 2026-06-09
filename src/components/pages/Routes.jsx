// src/components/pages/Routes.jsx
// Chapter 1 Scope: Route Viewing & Trip Planning
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAdmin } from '@/lib/AdminContext'
import { useToastCtx } from '@/lib/ToastContext'
import { StatCard, Card, CardHead, DataTable, EmptyState } from '@/components/ui'
// Import Lucide icons
import { 
  Map, 
  MapPin, 
  Plus, 
  X, 
  Bike, 
  Car, 
  Activity, 
  Power, 
  PowerOff,
  Navigation
} from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

const VEHICLE_TYPES = ['Tricycle', 'Pedicab', 'Timbol', 'Multicab']

export default function Routes() {
  const { routes, addRoute, toggleRouteStatus, loading } = useAdmin()
  const { toast } = useToastCtx()
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
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

  const [form, setForm] = useState({
    name: '', from: '', to: '', distance: '', vehicleTypes: [], status: 'active',
  })

  const toggleVehicle = (v) => setForm(p => ({
    ...p,
    vehicleTypes: p.vehicleTypes.includes(v)
      ? p.vehicleTypes.filter(x => x !== v)
      : [...p.vehicleTypes, v],
  }))

  const handleAdd = async () => {
    if (!form.name || !form.from || !form.to) {
      toast('Please fill in Route Name, Origin, and Destination')
      return
    }
    setSaving(true)
    await addRoute(form)
    toast('Route added successfully')
    setModalOpen(false)
    setForm({ name: '', from: '', to: '', distance: '', vehicleTypes: [], status: 'active' })
    setSaving(false)
  }

  const activeRoutes   = routes.filter(r => r.status === 'active')
  const tricycleRoutes = routes.filter(r => r.vehicle_types?.includes('Tricycle'))
  const pedicabRoutes  = routes.filter(r => r.vehicle_types?.includes('Pedicab'))

  return (
    <div className="space-y-5 page-enter">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Map size={20} />}     iconBg="bg-green-light" value={activeRoutes.length}   label="Active Routes" />
        <StatCard icon={<Car size={20} />}     iconBg="bg-blue-50"     value={tricycleRoutes.length} label="Tricycle Routes" />
        <StatCard icon={<Bike size={20} />}    iconBg="bg-amber-50"    value={pedicabRoutes.length}  label="Pedicab Routes" />
      </div>

      <Card>
        <CardHead
          title="Calbayog City Routes"
          subtitle="Route Viewing & Trip Planning — manage all transport routes"
          action={
            <button className="btn-primary btn-sm flex items-center gap-1.5" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Add Route
            </button>
          }
        />
        <div className="card-body-np">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner size={32} />
            </div>
          ) : routes.length === 0 ? (
            <EmptyState icon={<MapPin size={40} className="text-sub" />} title="No routes yet" subtitle="Add your first Calbayog City route" />
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <th>Route Name</th><th>Origin</th><th>Destination</th>
                  <th>Distance</th><th>Vehicle Types</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map(r => (
                  <tr key={r.id}>
                    <td className="font-semibold text-sm">{r.name}</td>
                    <td className="text-sm">{r.origin}</td>
                    <td className="text-sm">{r.destination}</td>
                    <td className="text-sm text-sub">{r.distance_km ? `${r.distance_km} km` : '—'}</td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {(r.vehicle_types || []).map(v => (
                          <span key={v} className="badge badge-blue text-[10px]">{v}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${r.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                        <span className="badge-dot" />{r.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-ghost btn-sm flex items-center gap-1.5"
                        onClick={() => { toggleRouteStatus(r.id); toast(`Route ${r.name} status updated`) }}>
                        {r.status === 'active' ? (
                          <><PowerOff size={14} /> Deactivate</>
                        ) : (
                          <><Power size={14} /> Activate</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </div>
      </Card>

      {/* Add Route Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Navigation size={20} className="text-green" />
                Add New Route
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-sub hover:text-navy transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="field-label">Route Name *</label>
              <input className="field-input" placeholder="e.g. City Hall Loop"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="field-label">From (Origin) *</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" />
                  <input className="field-input pl-9" placeholder="e.g. City Hall"
                    value={form.from} onChange={e => setForm(p => ({ ...p, from: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="field-label">To (Destination) *</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" />
                  <input className="field-input pl-9" placeholder="e.g. Nijaga Park"
                    value={form.to} onChange={e => setForm(p => ({ ...p, to: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="field-label">Distance (km)</label>
              <input className="field-input" type="number" step="0.1" placeholder="e.g. 2.1"
                value={form.distance} onChange={e => setForm(p => ({ ...p, distance: e.target.value }))} />
            </div>

            <div className="mb-5">
              <label className="field-label">Vehicle Types</label>
              <div className="flex gap-2 flex-wrap">
                {VEHICLE_TYPES.map(v => (
                  <button key={v} onClick={() => toggleVehicle(v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      form.vehicleTypes.includes(v)
                        ? 'bg-green text-white border-green'
                        : 'bg-surface text-sub border-border'
                    }`}>{v}</button>
                ))}
              </div>
            </div>

            <button 
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60" 
              onClick={handleAdd} 
              disabled={saving}
            >
              {saving ? (
                <>Adding...</>
              ) : (
                <><Plus size={18} /> Add Route</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}