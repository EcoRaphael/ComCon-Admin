// src/components/pages/LiveMap.jsx
// Real-time driver map — uses live data from Supabase
import { useState, useEffect } from 'react'
import { useAdmin } from '@/lib/AdminContext'
import { Card, CardHead } from '@/components/ui'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import Spinner from '@/components/ui/Spinner'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const CALBAYOG_CENTER = [12.0674, 124.5946]

// TEMPORARY: no real GPS integration yet, so every driver falls back to
// the same center point. This spreads them into a small deterministic
// circle around the center — based on the driver's own id, so a given
// driver always lands in the same spot (not random each refresh) —
// purely so multiple drivers are visually distinguishable on the map.
// Remove this once real driver_locations tracking is wired up.
const getFallbackPosition = (driver, index, total) => {
  if (driver.latitude && driver.longitude) {
    return [driver.latitude, driver.longitude]
  }
  const angle = (index / Math.max(total, 1)) * 2 * Math.PI
  const radius = 0.008 // roughly ~800m spread around the center
  return [
    CALBAYOG_CENTER[0] + radius * Math.sin(angle),
    CALBAYOG_CENTER[1] + radius * Math.cos(angle),
  ]
}

const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
        <div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>
      </div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  })
}

function MapController({ selectedPosition }) {
  const map = useMap()
  useEffect(() => {
    if (selectedPosition) {
      map.flyTo(selectedPosition, 16, {
        animate: true,
        duration: 1.5,
      })
    }
  }, [selectedPosition, map])
  return null
}

export default function LiveMap() {
  const { drivers, loading } = useAdmin()
  const [selectedDriver, setSelectedDriver] = useState(null)

  const activeDrivers   = drivers.filter(d => d.status === 'active')
  const inactiveDrivers = drivers.filter(d => d.status === 'inactive')

  // Stable position per driver — computed once per render from the
  // same activeDrivers order, so markers and the fly-to target always agree.
  const positionsById = {}
  activeDrivers.forEach((d, i) => {
    positionsById[d.id] = getFallbackPosition(d, i, activeDrivers.length)
  })

  const initials = (name) =>
    name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'DR'

  return (
    <div className="space-y-4 md:space-y-5 page-enter px-2 sm:px-4 md:px-0">

      {/* Stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white rounded-xl p-4 border border-border shadow-sm flex md:flex-col justify-between items-center md:items-start">
          <p className="text-sub text-xs uppercase tracking-wide">Active Drivers</p>
          <p className="text-2xl font-extrabold text-green mt-0 md:mt-1">{activeDrivers.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border shadow-sm flex md:flex-col justify-between items-center md:items-start">
          <p className="text-sub text-xs uppercase tracking-wide">Off Duty</p>
          <p className="text-2xl font-extrabold text-navy mt-0 md:mt-1">{inactiveDrivers.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border shadow-sm flex md:flex-col justify-between items-center md:items-start">
          <p className="text-sub text-xs uppercase tracking-wide">Total Fleet</p>
          <p className="text-2xl font-extrabold text-navy mt-0 md:mt-1">{drivers.length}</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHead
          title="Live Driver Map"
          subtitle="Calbayog City, Samar — fleet tracking"
          action={
            <span className="badge badge-green text-xs">
              <span className="badge-dot animate-pulse" />
              {activeDrivers.length} <span className="hidden sm:inline">Active</span>
            </span>
          }
        />
        <div className="p-3 md:p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size={32} />
            </div>
          ) : (
            <>
              {/* Map Container */}
              <div className="relative rounded-card overflow-hidden border border-green-mid h-[50vh] md:h-[500px] z-0">
                <MapContainer 
                  center={CALBAYOG_CENTER} 
                  zoom={14} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  
                  // MOBILE HIJACK PROTECTION: 
                  // Disables single-finger dragging and accidental taps on mobile devices
                  dragging={!L.Browser.mobile}
                  tap={!L.Browser.mobile}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapController selectedPosition={selectedDriver ? positionsById[selectedDriver.id] : null} />

                  {activeDrivers.map((d, i) => {
                    const [lat, lng] = positionsById[d.id]
                    const driverColor = d.color || '#2E7D32'

                    return (
                      <Marker 
                        key={d.id} 
                        position={[lat, lng]}
                        icon={createCustomIcon(driverColor)}
                        eventHandlers={{
                          click: () => setSelectedDriver(selectedDriver?.id === d.id ? null : d),
                        }}
                      >
                        <Popup>
                          <div className="text-navy p-0.5 font-sans">
                            <p className="font-bold text-sm m-0">{d.name}</p>
                            <p className="text-xs text-slate-500 m-0">{d.vehicle_type} · {d.plate}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  })}
                </MapContainer>

                {/* Map badges overlay */}
                <div className="absolute bottom-3 left-3 bg-white/90 rounded-lg px-2.5 py-1 text-[10px] sm:text-xs font-bold text-navy shadow z-[400]">
                  📍 Calbayog City
                </div>

                <div className="absolute bottom-3 right-3 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 text-[10px] sm:text-xs font-bold text-amber-700 shadow z-[400]">
                  ⚠️ Placeholder positions — live GPS not yet connected
                </div>
                
                {/* Conditional hint text to let mobile users know how to interact */}
                <div className="absolute top-3 right-3 bg-white/90 rounded-lg px-3 py-1.5 text-xs text-sub shadow z-[400]">
                  <span className="block md:hidden">Use two fingers to move map</span>
                  <span className="hidden md:block">Tap a driver pin for details</span>
                </div>
              </div>

              {/* Active Fleet Legend */}
              <div className="mt-4">
                <p className="text-xs font-bold text-sub uppercase tracking-wide mb-2">Active Fleet</p>
                <div className="flex flex-nowrap md:flex-wrap gap-2 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 scrollbar-none snap-x">
                  {activeDrivers.map(d => (
                    <button key={d.id}
                      onClick={() => setSelectedDriver(selectedDriver?.id === d.id ? null : d)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors border snap-coordinate flex-shrink-0 ${
                        selectedDriver?.id === d.id
                          ? 'bg-green text-white border-green'
                          : 'bg-surface text-navy border-border'
                      }`}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: d.color || 'var(--color-primary)' }} />
                      <span className="whitespace-nowrap">{d.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Driver Detail Card */}
              {selectedDriver && (
                <div className="mt-4 bg-surface border border-border rounded-xl p-4 flex items-center gap-3 sm:gap-4 shadow-sm animate-fadeIn">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-extrabold text-xs sm:text-sm flex-shrink-0"
                    style={{ background: selectedDriver.color || 'var(--color-primary)' }}>
                    {initials(selectedDriver.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-navy text-sm sm:text-base truncate">{selectedDriver.name}</p>
                    <p className="text-xs text-sub truncate">{selectedDriver.vehicle_type} · {selectedDriver.plate}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-amber-500 font-bold text-xs sm:text-sm">★ {Number(selectedDriver.rating || 0).toFixed(1)}</p>
                    <p className="text-[10px] sm:text-xs text-sub">{selectedDriver.trips || 0} trips</p>
                  </div>
                  <button onClick={() => setSelectedDriver(null)} className="text-sub hover:text-navy ml-1 sm:ml-2 p-1 text-lg">✕</button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  )
}