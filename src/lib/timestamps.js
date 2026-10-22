// src/lib/timestamps.js
// One place for how the admin panel writes dates and times on reports.
//
// Everything is written in Philippine time, whatever timezone the admin's
// computer happens to be set to, so a printout or an exported file means the
// same thing wherever it is opened.

export const PH_TZ = 'Asia/Manila'

const toDate = (value) => {
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

// "Oct 23, 2026, 3:45 PM" — for the screen and for printouts
export function formatDateTime(value) {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleString('en-PH', {
    timeZone: PH_TZ, month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

// hourCycle 'h23' keeps midnight as 00, never 24
const numericParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: PH_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})
const partsOf = (d) => Object.fromEntries(numericParts.formatToParts(d).map(p => [p.type, p.value]))

// "2026-10-23 15:45" — for CSV files. It sorts correctly as text and a
// spreadsheet opens it as a date and a time. Empty when the value is missing.
export function csvDateTime(value) {
  const d = toDate(value)
  if (!d) return ''
  const p = partsOf(d)
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`
}

// "2026-10-23_1545" — for file names, so two exports on the same day
// never share a name.
export function fileStamp(value = new Date()) {
  const d = toDate(value) || new Date()
  const p = partsOf(d)
  return `${p.year}-${p.month}-${p.day}_${p.hour}${p.minute}`
}