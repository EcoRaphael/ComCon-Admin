// src/lib/reportPdf.js
// Builds the admin reports as real PDF files, in one layout for every report:
//
//   1. HEADER   a green band with the logo and the organization name
//   2. TITLE    the report name, how many records, and the period they cover
//   3. SUMMARY  the key figures first (tiles), then short breakdown lines
//   4. DETAILS  the full table, its heading row repeated on every page
//   5. FOOTER   on every page: report name, "Page 1 of 3", and when it was generated
//               (Philippine time)
//
// LOGO: the reports use the logo already in your public folder. They look for it
// by name, in the order listed in REPORT_LOGO_URLS below, and use the first PNG or
// JPG they find that is big enough to print well (128 px or more on both sides, so
// a 16 px favicon can never be picked). If your logo has a different name, put its
// path at the top of that list, for example '/images/commuterconnect.png'. If none
// is found, a simple "CC" mark is drawn, so a report is never blocked by a missing
// image. SVG logos are not supported: save a PNG copy.
//
// jsPDF and its table plugin are loaded only when someone presses an export
// button (dynamic import), so they do not slow down the rest of the admin panel.
import { formatDateTime, formatDate, fileStamp } from '@/lib/timestamps'
import { needsReview } from '@/lib/severity'

export const ORG_NAME = 'CommuterConnect'
export const ORG_TAGLINE = 'Calbayog City, Samar'
export const REPORT_LOGO_URLS = [
  '/report-logo.png', '/report-logo.jpg',
  '/logo.png', '/logo.jpg', '/images/logo.png', '/images/logo.jpg',
  '/icon-512x512.png', '/apple-touch-icon.png', '/icon-192x192.png',
]
export const MIN_LOGO_PX = 128

const GREEN     = [27, 94, 32]        // brand green (dark)
const GREEN_MID = [46, 125, 50]       // brand green
const ACCENT    = [255, 133, 27]      // the panel's orange accent
const INK       = [17, 17, 17]
const MUTED     = [85, 85, 85]
const TILE_BG   = [245, 247, 245]
const LINE      = [224, 224, 224]
const WHITE     = [255, 255, 255]

// ── Text that is safe to put in a PDF ──────────────────────────────────────
// A PDF's built-in fonts only contain Western European characters. Anything
// else (the peso sign, arrows, emoji) would print as garbage, so it is
// swapped for a plain equivalent or a "?".
const WIN_ANSI_EXTRAS = new Set([
  0x20AC, 0x201A, 0x0192, 0x201E, 0x2026, 0x2020, 0x2021, 0x02C6, 0x2030, 0x0160, 0x2039, 0x0152,
  0x017D, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014, 0x02DC, 0x2122, 0x0161, 0x203A,
  0x0153, 0x017E, 0x0178,
])
export function pdfText(value) {
  const s = String(value ?? '').replace(/₱/g, 'PHP ').replace(/→/g, ' to ').replace(/\r\n?/g, '\n')
  let out = ''
  for (const ch of s) {
    const cp = ch.codePointAt(0)
    if (ch === '\n' || cp >= 0x20 && cp <= 0xFF && cp !== 0x7F && !(cp >= 0x80 && cp <= 0x9F)) out += ch
    else if (WIN_ANSI_EXTRAS.has(cp)) out += ch
    else if (cp === 0x200B || cp === 0xFEFF || cp < 0x20 || (cp >= 0x7F && cp <= 0x9F)) continue
    else out += '?'
  }
  return out.replace(/[ \t]{2,}/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

const money = (n) => 'PHP ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const cap   = (s) => { const t = String(s ?? ''); return t ? t.charAt(0).toUpperCase() + t.slice(1) : '' }
const sum   = (arr, f) => arr.reduce((t, x) => t + Number(f(x) || 0), 0)
const tally = (arr, key) => arr.reduce((m, x) => { const k = key(x); if (k !== undefined && k !== null && k !== '') m.set(k, (m.get(k) || 0) + 1); return m }, new Map())
const tallyText = (map, order) => {
  const keys = order ? order.filter(k => map.has(k)).concat([...map.keys()].filter(k => !order.includes(k))) : [...map.keys()]
  return keys.length ? keys.map(k => `${cap(k)} ${map.get(k)}`).join(',  ') : 'None'
}
function period(items, field = 'created_at') {
  const t = items.map(i => new Date(i?.[field]).getTime()).filter(Number.isFinite)
  if (!t.length) return null
  const a = formatDate(new Date(Math.min(...t))), b = formatDate(new Date(Math.max(...t)))
  return a === b ? a : `${a} to ${b}`
}
const plateText = (p) => (p && !String(p).startsWith('PENDING-')) ? p : 'Pending'
const personOf  = (r) => r.customer?.name || r.users?.name || ''
const driverOf  = (r) => r.driver?.name || r.drivers?.name || ''
const tile = (label, value) => ({ label, value: String(value) })

// ── What each report contains ──────────────────────────────────────────────
// columns: header, get(row), align, w (fixed width in mm; the rest share what is left)
// summary(rows): the tiles and breakdown lines that go on top of the report
const BOOKING_COLS = (statusHeader, statusGet) => [
  { header: 'Commuter', get: b => b.users?.name, w: 32 },
  { header: 'Driver',   get: b => b.drivers?.name, w: 32 },
  { header: 'Pickup',   get: b => b.pickup },
  { header: 'Dropoff',  get: b => b.dropoff },
  { header: 'Vehicle',  get: b => b.vehicle_type, w: 20 },
  { header: 'Fare',     get: b => money(b.fare), align: 'right', w: 24 },
  { header: statusHeader, get: statusGet, w: 26 },
  { header: 'Date and time', get: b => formatDateTime(b.created_at), w: 38 },
]
const RIDE_SUMMARY = (rows) => ({
  tiles: [
    tile('Total rides', rows.length),
    tile('Completed', rows.filter(b => b.status === 'completed').length),
    tile('Cancelled', rows.filter(b => b.status === 'cancelled').length),
    tile('Confirmed fares', money(sum(rows.filter(b => b.status === 'completed'), b => b.fare))),
  ],
  lines: [
    { label: 'By status',  value: tallyText(tally(rows, b => b.status), ['completed', 'ongoing', 'pending', 'cancelled']) },
    { label: 'By vehicle', value: tallyText(tally(rows, b => b.vehicle_type), ['Tricycle', 'Timbol', 'Multicab']) },
  ],
  period: period(rows),
})

export const REPORTS = {
  bookings: {
    title: 'Booking Confirmations', orientation: 'landscape', source: d => d.bookings,
    columns: BOOKING_COLS('Payment status', b => cap(b.payment_status)),
    summary: (rows) => ({
      tiles: [
        tile('Total bookings', rows.length),
        tile('Paid', rows.filter(b => b.payment_status === 'paid').length),
        tile('Awaiting payment', rows.filter(b => b.payment_status === 'pending').length),
        tile('Fare collected', money(sum(rows.filter(b => b.payment_status === 'paid'), b => b.fare))),
      ],
      lines: [
        { label: 'By status',  value: tallyText(tally(rows, b => b.status), ['completed', 'ongoing', 'pending', 'cancelled']) },
        { label: 'By vehicle', value: tallyText(tally(rows, b => b.vehicle_type), ['Tricycle', 'Timbol', 'Multicab']) },
      ],
      period: period(rows),
    }),
  },
  fares: {
    title: 'Fare Details Report', orientation: 'portrait', source: d => d.payments,
    columns: [
      { header: 'Commuter', get: p => p.users?.name },
      { header: 'Driver',   get: p => p.drivers?.name },
      { header: 'Amount',   get: p => money(p.amount), align: 'right', w: 28 },
      { header: 'Method',   get: p => cap(p.method), w: 20 },
      { header: 'Status',   get: p => cap(p.status), w: 24 },
      { header: 'Date and time', get: p => formatDateTime(p.created_at), w: 38 },
    ],
    summary: (rows) => ({
      tiles: [
        tile('Payments', rows.length),
        tile('Total amount', money(sum(rows, p => p.amount))),
        tile('Completed', money(sum(rows.filter(p => p.status === 'completed'), p => p.amount))),
        tile('Pending', money(sum(rows.filter(p => p.status === 'pending'), p => p.amount))),
      ],
      lines: [
        { label: 'By method', value: tallyText(tally(rows, p => p.method), ['cash', 'gcash', 'maya', 'bank']) },
        { label: 'By status', value: tallyText(tally(rows, p => p.status), ['completed', 'pending', 'failed', 'refunded']) },
      ],
      period: period(rows),
    }),
  },
  rides: {
    title: 'Full Ride History', orientation: 'landscape', source: d => d.bookings,
    columns: BOOKING_COLS('Status', b => cap(b.status)), summary: RIDE_SUMMARY,
  },
  all: {
    title: 'Master Transaction Log', orientation: 'landscape', source: d => d.bookings,
    columns: BOOKING_COLS('Status', b => cap(b.status)), summary: RIDE_SUMMARY,
  },
  complaints: {
    title: 'Complaint Report', orientation: 'landscape', source: d => d.reports,
    columns: [
      { header: 'Filed by',       get: r => personOf(r), w: 34 },
      { header: 'Against driver', get: r => driverOf(r), w: 34 },
      { header: 'Issue type',     get: r => Array.isArray(r.issue_type) ? r.issue_type.join(', ') : r.issue_type, w: 46 },
      { header: 'Severity',       get: r => r.severity, w: 20, tone: v => ({ High: [185, 28, 28], Medium: [180, 83, 9], Low: [46, 125, 50] })[v] },
      { header: 'Status',         get: r => cap(r.status), w: 24 },
      { header: 'Description',    get: r => r.description || '-' },
      { header: 'Date and time',  get: r => formatDateTime(r.created_at), w: 36 },
    ],
    summary: (rows) => {
      const types = new Map()
      rows.forEach(r => (Array.isArray(r.issue_type) ? r.issue_type : [r.issue_type]).filter(Boolean).forEach(t => types.set(t, (types.get(t) || 0) + 1)))
      const top = [...types.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, n]) => `${t} ${n}`).join(',  ')
      return {
        tiles: [
          tile('Total complaints', rows.length),
          tile('High severity', rows.filter(r => r.severity === 'High').length),
          tile('Needs review', rows.filter(needsReview).length),
          tile('Resolved', rows.filter(r => r.status === 'resolved').length),
        ],
        lines: [
          { label: 'By status',   value: tallyText(tally(rows, r => r.status), ['pending', 'under review', 'resolved']) },
          { label: 'By severity', value: tallyText(tally(rows, r => r.severity), ['High', 'Medium', 'Low']) },
          { label: 'Top issues',  value: top || 'None' },
        ],
        period: period(rows),
      }
    },
  },
  compliance: {
    title: 'Driver Compliance Report', orientation: 'landscape', source: d => d.drivers,
    columns: [
      { header: 'Driver', get: d => d.name },
      { header: 'Plate', get: d => plateText(d.plate), w: 28 },
      { header: 'Vehicle type', get: d => d.vehicle_type, w: 26 },
      { header: 'Verified', get: d => d.verified ? 'Yes' : 'No', w: 20 },
      { header: 'License', get: d => d.license_photo_path ? 'Yes' : 'No', w: 20 },
      { header: 'OR', get: d => d.or_photo_path ? 'Yes' : 'No', w: 16 },
      { header: 'CR', get: d => d.cr_photo_path ? 'Yes' : 'No', w: 16 },
      { header: 'Status', get: d => cap(d.status), w: 22 },
      { header: 'Registered', get: d => formatDateTime(d.created_at), w: 38 },
    ],
    summary: (rows) => ({
      tiles: [
        tile('Total drivers', rows.length),
        tile('Verified', rows.filter(d => d.verified).length),
        tile('Pending verification', rows.filter(d => !d.verified).length),
        tile('Missing documents', rows.filter(d => !d.license_photo_path || !d.or_photo_path || !d.cr_photo_path).length),
      ],
      lines: [
        { label: 'By vehicle', value: tallyText(tally(rows, d => d.vehicle_type), ['Tricycle', 'Timbol', 'Multicab']) },
        { label: 'Plates', value: `${rows.filter(d => plateText(d.plate) === 'Pending').length} pending, ${rows.filter(d => plateText(d.plate) !== 'Pending').length} confirmed` },
      ],
      period: period(rows),
    }),
  },
  performance: {
    title: 'Driver Performance Report', orientation: 'portrait', source: d => d.driverPerformance,
    columns: [
      { header: 'Driver', get: d => d.name },
      { header: 'Plate', get: d => plateText(d.plate), w: 24 },
      { header: 'Vehicle', get: d => d.vehicleType, w: 20 },
      { header: 'Completed', get: d => d.completedTrips, align: 'right', w: 20 },
      { header: 'Cancelled', get: d => d.cancelledTrips, align: 'right', w: 20 },
      { header: 'Cancel rate', get: d => `${d.cancellationRate}%`, align: 'right', w: 20 },
      { header: 'Avg rating', get: d => d.ratingCount > 0 ? Number(d.avgRating).toFixed(1) : '-', align: 'right', w: 18 },
      { header: 'Ratings', get: d => d.ratingCount, align: 'right', w: 16 },
    ],
    summary: (rows) => {
      const rated = rows.filter(d => d.ratingCount > 0)
      const trips = sum(rows, d => d.totalTrips), cancelled = sum(rows, d => d.cancelledTrips)
      const best = [...rated].sort((a, b) => b.avgRating - a.avgRating)[0]
      const busiest = [...rows].sort((a, b) => b.completedTrips - a.completedTrips)[0]
      return {
        tiles: [
          tile('Drivers', rows.length),
          tile('Completed trips', sum(rows, d => d.completedTrips)),
          tile('Average rating', rated.length ? (sum(rated, d => d.avgRating) / rated.length).toFixed(1) : '-'),
          tile('Cancellation rate', trips > 0 ? `${Math.round((cancelled / trips) * 100)}%` : '0%'),
        ],
        lines: [
          { label: 'Top rated',  value: best ? `${best.name} (${Number(best.avgRating).toFixed(1)} from ${best.ratingCount} rating${best.ratingCount === 1 ? '' : 's'})` : 'No ratings yet' },
          { label: 'Most trips', value: busiest && busiest.completedTrips > 0 ? `${busiest.name} (${busiest.completedTrips} completed)` : 'No completed trips yet' },
        ],
        period: null,
      }
    },
  },
  earnings: {
    title: 'Driver Earnings Report', orientation: 'portrait', source: d => d.driverEarnings,
    columns: [
      { header: 'Driver', get: d => d.name },
      { header: 'Plate', get: d => plateText(d.plate), w: 30 },
      { header: 'Vehicle', get: d => d.vehicleType, w: 26 },
      { header: 'Total earnings', get: d => money(d.totalEarnings), align: 'right', w: 38 },
      { header: 'Payments', get: d => d.paymentCount, align: 'right', w: 22 },
    ],
    summary: (rows) => {
      const total = sum(rows, d => d.totalEarnings), earners = rows.filter(d => d.totalEarnings > 0)
      const top = [...rows].sort((a, b) => b.totalEarnings - a.totalEarnings)[0]
      return {
        tiles: [
          tile('Drivers', rows.length),
          tile('Total earnings', money(total)),
          tile('Completed payments', sum(rows, d => d.paymentCount)),
          tile('Average per earner', money(earners.length ? total / earners.length : 0)),
        ],
        lines: [
          { label: 'Top earner', value: top && top.totalEarnings > 0 ? `${top.name} (${money(top.totalEarnings)})` : 'No earnings yet' },
          { label: 'Earning drivers', value: `${earners.length} of ${rows.length}` },
        ],
        period: null,
      }
    },
  },
}

export const reportTitle = (type) => (REPORTS[type] || REPORTS.all).title

// ── Logo ───────────────────────────────────────────────────────────────────
// Reads the pixel size of a PNG or JPEG straight from its bytes (no decoding
// needed). Returns { type, width, height }, or null if it is neither.
export function imageSize(b) {
  if (!b || b.length < 24) return null
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) {            // PNG
    const u32 = (i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0
    return { type: 'png', width: u32(16), height: u32(20) }
  }
  if (b[0] === 0xFF && b[1] === 0xD8) {                                             // JPEG
    let i = 2
    while (i + 9 < b.length) {
      if (b[i] !== 0xFF) { i++; continue }
      const marker = b[i + 1]
      if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
        return { type: 'jpeg', height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] }
      }
      i += 2 + ((b[i + 2] << 8) | b[i + 3])
    }
  }
  return null
}

function toDataUrl(bytes, mime) {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
  return `data:${mime};base64,${btoa(bin)}`
}

// Returns the logo as a data URL, or null when none is found. The checks matter:
// a missing file can come back as the app's own page (not an image), and a tiny
// image would print blurry, so both are skipped and the next name is tried.
export async function loadLogo(urls = REPORT_LOGO_URLS) {
  for (const url of urls) {
    try {
      const res = await fetch(url)
      const mime = ((res.headers.get('content-type') || '').toLowerCase().match(/image\/(png|jpe?g)/) || [])[0]
      if (!res.ok || !mime) continue
      const bytes = new Uint8Array(await res.arrayBuffer())
      const size = imageSize(bytes)
      if (!size) continue
      if (Math.min(size.width, size.height) < MIN_LOGO_PX) {
        console.warn(`[reportPdf] ${url} is only ${size.width}x${size.height}px, too small for a printed report. Skipped.`)
        continue
      }
      return toDataUrl(bytes, mime === 'image/jpg' ? 'image/jpeg' : mime)
    } catch { /* this name is not usable: try the next one */ }
  }
  return null
}

function drawLogo(doc, x, y, size, logo) {
  doc.setFillColor(...WHITE)
  doc.roundedRect(x, y, size, size, size * 0.2, size * 0.2, 'F')
  if (logo) {
    try {
      const p = doc.getImageProperties(logo)
      const box = size * 0.94   // logos have their own margin, so let them fill the tile
      const k = Math.min(box / p.width, box / p.height)
      doc.addImage(logo, p.fileType, x + (size - p.width * k) / 2, y + (size - p.height * k) / 2, p.width * k, p.height * k)
      return
    } catch { /* an unreadable image falls through to the drawn mark */ }
  }
  doc.setFillColor(...GREEN_MID)
  doc.roundedRect(x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.8, size * 0.16, size * 0.16, 'F')
  doc.setTextColor(...WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(size * 0.78)
  doc.text('CC', x + size / 2, y + size * 0.66, { align: 'center' })
}

// ── Building the document ──────────────────────────────────────────────────
const MARGIN = 14

export async function buildReportPdf(type, data, { generatedAt = new Date(), logo = null } = {}) {
  const def = REPORTS[type] || REPORTS.all
  const rows = (def.source(data) || []).filter(Boolean)
  const stamp = `Generated ${formatDateTime(generatedAt)} (Philippine time)`
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: def.orientation, unit: 'mm', format: 'a4' })
  doc.setProperties({ title: `${ORG_NAME}: ${def.title}`, subject: def.title, author: ORG_NAME, creator: ORG_NAME })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const usable = W - MARGIN * 2

  // 1. HEADER
  doc.setFillColor(...GREEN); doc.rect(0, 0, W, 28, 'F')
  doc.setFillColor(...ACCENT); doc.rect(0, 28, W, 1.2, 'F')
  drawLogo(doc, MARGIN, 4, 20, logo)
  doc.setTextColor(...WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(16)
  doc.text(pdfText(ORG_NAME), MARGIN + 25, 14)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(215, 232, 217)
  doc.text(pdfText(ORG_TAGLINE), MARGIN + 25, 20)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(215, 232, 217)
  doc.text('Official report', W - MARGIN, 12, { align: 'right' })
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...WHITE)
  doc.text(pdfText(formatDateTime(generatedAt)), W - MARGIN, 17.5, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(215, 232, 217)
  doc.text('Philippine time', W - MARGIN, 22.5, { align: 'right' })

  // 2. TITLE
  const summary = def.summary(rows)
  doc.setTextColor(...INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(18)
  doc.text(pdfText(def.title), MARGIN, 40)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED)
  const meta = [`${rows.length} record${rows.length === 1 ? '' : 's'}`, summary.period && `Period: ${summary.period}`].filter(Boolean).join('    |    ')
  doc.text(pdfText(meta), MARGIN, 46)

  // 3. SUMMARY (always above the details)
  let y = 55
  const heading = (text, at) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...GREEN)
    doc.text(text, MARGIN, at)
    doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.line(MARGIN, at + 2, W - MARGIN, at + 2)
  }
  heading('Summary', y); y += 7
  const gap = 4, tileW = (usable - gap * 3) / 4, tileH = 20
  summary.tiles.forEach((t, i) => {
    const x = MARGIN + i * (tileW + gap)
    doc.setFillColor(...TILE_BG); doc.roundedRect(x, y, tileW, tileH, 2.5, 2.5, 'F')
    doc.setFillColor(...GREEN_MID); doc.rect(x, y + 2, 1.6, tileH - 4, 'F')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED)
    doc.text(pdfText(t.label).toUpperCase(), x + 5, y + 7)
    let size = 15
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...INK)
    const value = pdfText(t.value)
    doc.setFontSize(size)
    while (size > 8 && doc.getTextWidth(value) > tileW - 8) { size -= 0.5; doc.setFontSize(size) }
    doc.text(value, x + 5, y + 15.5)
  })
  y += tileH + 6
  summary.lines.forEach(line => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...INK)
    doc.text(pdfText(line.label), MARGIN, y)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTED)
    const wrapped = doc.splitTextToSize(pdfText(line.value), usable - 32)
    doc.text(wrapped, MARGIN + 32, y)
    y += 5 * wrapped.length + 1
  })

  // 4. DETAILS
  y += 6
  heading('Details', y); y += 5
  const columns = def.columns
  if (rows.length === 0) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(10); doc.setTextColor(...MUTED)
    doc.text('No records to show.', MARGIN, y + 8)
  } else {
    autoTable(doc, {
      startY: y,
      head: [columns.map(c => pdfText(c.header))],
      body: rows.map(r => columns.map(c => pdfText(c.get(r)))),
      margin: { top: 20, left: MARGIN, right: MARGIN, bottom: 16 },
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
      didParseCell: (d) => {
        const col = columns[d.column.index]
        if (d.section === 'head' && col?.align === 'right') d.cell.styles.halign = 'right'
        if (d.section === 'body' && col?.tone) { const c = col.tone(d.cell.raw); if (c) { d.cell.styles.textColor = c; d.cell.styles.fontStyle = 'bold' } }
      },
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, textColor: INK, lineColor: LINE, lineWidth: 0.1, overflow: 'linebreak', valign: 'middle' },
      headStyles: { fillColor: GREEN, textColor: WHITE, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 248] },
      columnStyles: Object.fromEntries(columns.map((c, i) => [i, { ...(c.w ? { cellWidth: c.w } : {}), halign: c.align || 'left' }])),
    })
  }

  // 5. On every page: the slim header (page 2 onward) and the footer
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    if (p > 1) {
      doc.setFillColor(...GREEN); doc.rect(0, 0, W, 13, 'F')
      doc.setFillColor(...ACCENT); doc.rect(0, 13, W, 0.8, 'F')
      drawLogo(doc, MARGIN, 2.4, 8.2, logo)
      doc.setTextColor(...WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5)
      doc.text(pdfText(ORG_NAME), MARGIN + 11, 8.2)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
      doc.text(pdfText(def.title), W - MARGIN, 8.2, { align: 'right' })
    }
    doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.line(MARGIN, H - 11, W - MARGIN, H - 11)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED)
    doc.text(pdfText(`${ORG_NAME}  |  ${def.title}`), MARGIN, H - 6.5)
    doc.text(`Page ${p} of ${pages}`, W / 2, H - 6.5, { align: 'center' })
    doc.text(pdfText(stamp), W - MARGIN, H - 6.5, { align: 'right' })
  }

  return { doc, fileName: `commuterconnect-${type}-${fileStamp(generatedAt)}.pdf`, title: def.title, count: rows.length }
}

// What the Export buttons call: build the PDF and save it to the computer.
export async function downloadReportPdf(type, data) {
  const generatedAt = new Date()
  const logo = await loadLogo()
  const result = await buildReportPdf(type, data, { generatedAt, logo })
  result.doc.save(result.fileName)
  return { fileName: result.fileName, title: result.title, count: result.count }
}