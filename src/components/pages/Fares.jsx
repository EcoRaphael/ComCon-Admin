// src/components/pages/Fares.jsx
// Objective 1: manage fare inquiries — Calbayog City native vehicle types
import { useState } from 'react'
import { useAdmin } from '@/lib/AdminContext'
import { useToastCtx } from '@/lib/ToastContext'
import { Card, CardHead, DataTable } from '@/components/ui'
import { 
  Calculator, 
  Settings2, 
  FileText, 
  AlertCircle, 
  Bike, 
  Car, 
  Bus, 
  Info,
  ArrowRight,
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
    per_km: '', 
    peak_surcharge: '', 
    effective_date: '', 
    order_no: '' 
  })
  
  const [calcType, setCalcType] = useState('Tricycle')
  const [calcDist, setCalcDist] = useState('')
  const [calcResult, setCalcResult] = useState(null)

  const handleUpdateFare = async () => {
    if (!form.base_fare || !form.per_km) {
      toast('⚠️ Base fare and per KM rate are required')
      return
    }
    
    setUpdating(true)
    try {
      await updateFare(selectedType, {
        base_fare: parseFloat(form.base_fare),
        per_km: parseFloat(form.per_km),
        peak_surcharge: parseFloat(form.peak_surcharge) || 0,
      })
      toast(`✅ ${selectedType} fare registry updated!`)
      setForm({ base_fare: '', per_km: '', peak_surcharge: '', effective_date: '', order_no: '' })
    } catch (err) {
      toast('❌ Failed to update fare')
    } finally {
      setUpdating(false)
    }
  }

  const handleCalculate = () => {
    const fare = fareMatrix.find(f => f.vehicle_type === calcType)
    const dist = parseFloat(calcDist) || 0
    if (!fare) return
    
    const total = Number(fare.base_fare) + Number(fare.per_km) * dist
    setCalcResult({ total, fare, dist })
  }

  return (
    <div className="space-y-6 page-enter pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Current fare matrix */}
        <Card>
          <CardHead 
            title="Current Fare Matrix" 
            subtitle="LTFRB Region VIII regulated fares for Calbayog City" 
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
                    <th>Per KM</th>
                    <th>Peak</th>
                  </tr>
                </thead>
                <tbody>
                  {fareMatrix.map(f => (
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
                      <td className="text-sub text-xs">₱{Number(f.per_km).toFixed(2)}</td>
                      <td>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                          Number(f.peak_surcharge) > 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-400'
                        }`}>
                          {Number(f.peak_surcharge) > 0 ? `+${f.peak_surcharge}%` : 'Standard'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </div>
          <div className="px-5 py-4 bg-amber-50 border-t border-amber-100 flex gap-3 items-start">
            <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
              Fares are strictly regulated by LTFRB Region VIII. Any updates submitted here must align with the official 
              Local Public Transport Route Plan (LPTRP).
            </p>
          </div>
        </Card>

        {/* Update fare form */}
        <Card>
          <CardHead 
            title="Update Rate Structure" 
            subtitle="Submit new fare parameters for administrative review" 
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
                <label className="field-label text-[11px] font-bold text-navy uppercase tracking-wider">Per KM (₱)</label>
                <input className="field-input text-sm" type="number" step="0.01" placeholder="2.00"
                  value={form.per_km} onChange={e => setForm(p => ({ ...p, per_km: e.target.value }))} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label text-[11px] font-bold text-navy uppercase tracking-wider">Peak Surcharge (%)</label>
                <input className="field-input text-sm" type="number" placeholder="0"
                  value={form.peak_surcharge} onChange={e => setForm(p => ({ ...p, peak_surcharge: e.target.value }))} />
              </div>
              <div>
                <label className="field-label text-[11px] font-bold text-navy uppercase tracking-wider">Effective Date</label>
                <input className="field-input text-sm" type="date"
                  value={form.effective_date} onChange={e => setForm(p => ({ ...p, effective_date: e.target.value }))} />
              </div>
            </div>
            
            <div>
              <label className="field-label text-[11px] font-bold text-navy uppercase tracking-wider">LTFRB Order No.</label>
              <input className="field-input text-sm" placeholder="e.g. R8-MC-2026-001"
                value={form.order_no} onChange={e => setForm(p => ({ ...p, order_no: e.target.value }))} />
            </div>

            {/* Fixed Button Styling */}
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

      {/* Fare calculator */}
      <Card>
        <CardHead 
          title="Fare Inquiry Tool" 
          subtitle="Real-time fare estimation based on current regulated distance matrix" 
        />
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="field-label text-navy font-bold">Vehicle Type</label>
              <select className="field-select w-full" value={calcType} onChange={e => setCalcType(e.target.value)}>
                {VEHICLE_TYPES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="field-label text-navy font-bold">Distance (kilometers)</label>
              <input className="field-input w-full" type="number" step="0.1" placeholder="e.g. 2.5"
                value={calcDist} onChange={e => setCalcDist(e.target.value)} />
            </div>
            <button className="btn-primary w-full sm:w-auto px-10 h-[46px] font-bold shadow-sm" onClick={handleCalculate}>
              Calculate Fare
            </button>
          </div>

          {calcResult && (
            <div className="mt-6 border-2 border-green-light bg-green-light/10 rounded-3xl p-8 relative overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
              <div className="absolute -right-6 -bottom-6 opacity-[0.03] rotate-12 scale-150 text-navy pointer-events-none">
                {VEHICLE_ICONS[calcType]}
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div>
                  <div className="flex items-center gap-2 text-green font-black text-[10px] uppercase tracking-widest mb-2">
                    <Info size={14} /> Total Estimated Fare
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-navy tracking-tight">₱{calcResult.total.toFixed(2)}</span>
                    <span className="text-sub font-bold text-sm">PHP</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 text-sm bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-green-light/30 shadow-sm">
                   <div className="space-y-1">
                      <p className="text-[9px] uppercase font-black text-sub tracking-widest">Base Rate</p>
                      <p className="font-bold text-navy">₱{Number(calcResult.fare.base_fare).toFixed(2)}</p>
                   </div>
                   <div className="flex items-center text-sub opacity-20 pt-4">
                      <ArrowRight size={16} />
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] uppercase font-black text-sub tracking-widest">Distance ({calcResult.dist}km)</p>
                      <p className="font-bold text-navy">₱{(Number(calcResult.fare.per_km) * calcResult.dist).toFixed(2)}</p>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}