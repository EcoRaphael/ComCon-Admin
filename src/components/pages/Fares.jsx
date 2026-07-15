// src/components/pages/Fares.jsx
// Objective 1: manage fare inquiries — Calbayog City native vehicle types
// FARE MODEL: seat-based, not distance-based.
// Total Fare = base_fare + (seat_count * per_seat)
// seat_count is a fixed property of the vehicle type.
import { useState } from 'react'
import { useAdmin } from '@/lib/AdminContext'
import { useToastCtx } from '@/lib/ToastContext'
import { Card, CardHead, DataTable } from '@/components/ui'
import { 
  Calculator, 
  Settings2, 
  FileText, 
  AlertCircle, 
  Car, 
  Bus, 
  Info,
  Users,
  Plus,
  Save,
  RefreshCw
} from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

const VEHICLE_TYPES = ['Tricycle', 'Timbol', 'Multicab']

const VEHICLE_ICONS = {
  Tricycle: <Car size={18} className="text-blue-600" />,
  Timbol: <Bus size={18} className="text-amber-600" />,
  Multicab: <Bus size={18} className="text-indigo-600" />
}

export default function Fares() {
  const { fareMatrix, updateFare, loading } = useAdmin()
  const { toast } = useToastCtx()
  const [updating, setUpdating] = useState(false)
  const [selectedType, setSelectedType] = useState('Tricycle')
  const [form, setForm] = useState({ 
    base_fare: '', 
    seat_count: '',
    per_seat: '', 
    peak_surcharge: '', 
    effective_date: '', 
    order_no: '' 
  })

  const totalPreview = (Number(form.base_fare) || 0) + (Number(form.seat_count) || 0) * (Number(form.per_seat) || 0)

  const handleUpdateFare = async () => {
    if (!form.base_fare || !form.seat_count || !form.per_seat) {
      toast('⚠️ Base fare, seat count, and per-seat rate are all required')
      return
    }
    
    setUpdating(true)
    try {
      await updateFare(selectedType, {
        base_fare: parseFloat(form.base_fare),
        seat_count: parseInt(form.seat_count, 10),
        per_seat: parseFloat(form.per_seat),
        peak_surcharge: parseFloat(form.peak_surcharge) || 0,
      })
      toast(`✅ ${selectedType} fare registry updated!`)
      setForm({ base_fare: '', seat_count: '', per_seat: '', peak_surcharge: '', effective_date: '', order_no: '' })
    } catch (err) {
      toast('❌ Failed to update fare')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-6 page-enter pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Current fare matrix */}
        <Card>
          <CardHead 
            title="Current Fare Matrix" 
            subtitle="Seat-based fares — Calbayog City native vehicles" 
          />
          <div className="card-body-np">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <Spinner size={32} />
              </div>
            ) : (
              <DataTable>
                <thead>
                  <tr>
                    <th>Vehicle Type</th>
                    <th>Base Fare</th>
                    <th>Seats</th>
                    <th>Per Seat</th>
                    <th>Total Fare</th>
                    <th>Peak</th>
                  </tr>
                </thead>
                <tbody>
                  {fareMatrix.map(f => {
                    const total = Number(f.base_fare) + Number(f.seat_count || 0) * Number(f.per_seat || 0)
                    return (
                      <tr key={f.vehicle_type} className="hover:bg-surface transition-colors">
                        <td className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-surface rounded-lg border border-border">
                              {VEHICLE_ICONS[f.vehicle_type] || <Car size={18} />}
                            </div>
                            <span className="text-navy font-bold">{f.vehicle_type}</span>
                          </div>
                        </td>
                        <td className="font-bold text-navy text-sm">₱{Number(f.base_fare).toFixed(2)}</td>
                        <td className="text-sub text-xs">
                          <span className="inline-flex items-center gap-1">
                            <Users size={12} /> {f.seat_count || 0}
                          </span>
                        </td>
                        <td className="text-sub text-xs">₱{Number(f.per_seat || 0).toFixed(2)}</td>
                        <td className="font-black text-green text-sm">₱{total.toFixed(2)}</td>
                        <td>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                            Number(f.peak_surcharge) > 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {Number(f.peak_surcharge) > 0 ? `+${f.peak_surcharge}%` : 'Standard'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </DataTable>
            )}
          </div>
          <div className="px-5 py-4 bg-amber-50 border-t border-amber-100 flex gap-3 items-start">
            <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
              Fares are calculated per vehicle's total seat capacity, not by trip distance —
              <strong> Total Fare = Base Fare + (Seats × Per-Seat Rate)</strong>. Any updates
              submitted here must align with the official Local Public Transport Route Plan (LPTRP).
            </p>
          </div>
        </Card>

        {/* Update fare form */}
        <Card>
          <CardHead 
            title="Update Rate Structure" 
            subtitle="Submit new seat-based fare parameters for administrative review" 
          />
          <div className="card-body space-y-4">
            <div>
              <label className="field-label text-navy font-bold">Vehicle Type</label>
              <select className="field-select" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                {VEHICLE_TYPES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label text-[11px] font-bold text-navy uppercase tracking-wider">Base Fare (₱)</label>
                <input className="field-input text-sm" type="number" step="0.01" placeholder="10.00"
                  value={form.base_fare} onChange={e => setForm(p => ({ ...p, base_fare: e.target.value }))} />
              </div>
              <div>
                <label className="field-label text-[11px] font-bold text-navy uppercase tracking-wider">Seat Count</label>
                <input className="field-input text-sm" type="number" step="1" placeholder="4"
                  value={form.seat_count} onChange={e => setForm(p => ({ ...p, seat_count: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label text-[11px] font-bold text-navy uppercase tracking-wider">Per Seat Rate (₱)</label>
                <input className="field-input text-sm" type="number" step="0.01" placeholder="5.00"
                  value={form.per_seat} onChange={e => setForm(p => ({ ...p, per_seat: e.target.value }))} />
              </div>
              <div>
                <label className="field-label text-[11px] font-bold text-navy uppercase tracking-wider">Peak Surcharge (%)</label>
                <input className="field-input text-sm" type="number" placeholder="0"
                  value={form.peak_surcharge} onChange={e => setForm(p => ({ ...p, peak_surcharge: e.target.value }))} />
              </div>
            </div>

            {/* Live total preview */}
            {(form.base_fare || form.seat_count || form.per_seat) && (
              <div className="rounded-2xl bg-green-light/20 border border-green-light p-4 flex items-center justify-between">
                <span className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator size={14} /> Preview Total
                </span>
                <span className="text-xl font-black text-green">₱{totalPreview.toFixed(2)}</span>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label text-[11px] font-bold text-navy uppercase tracking-wider">Effective Date</label>
                <input className="field-input text-sm" type="date"
                  value={form.effective_date} onChange={e => setForm(p => ({ ...p, effective_date: e.target.value }))} />
              </div>
              <div>
                <label className="field-label text-[11px] font-bold text-navy uppercase tracking-wider">LTFRB Order No.</label>
                <input className="field-input text-sm" placeholder="e.g. R8-MC-2026-001"
                  value={form.order_no} onChange={e => setForm(p => ({ ...p, order_no: e.target.value }))} />
              </div>
            </div>

            <div className="pt-2">
              <button 
                className="btn-primary w-full py-4 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-70" 
                onClick={handleUpdateFare}
                disabled={updating}
              >
                {updating ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    <span className="font-bold uppercase tracking-wider text-sm">Submit to Registry</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}