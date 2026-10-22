// src/components/ui/TimestampCell.jsx
// The two-line "Timestamp" cell used in report tables: the date with a
// calendar icon, and the time underneath, smaller and lighter, with a clock
// icon. Always Philippine time. Hover shows the full date, time and timezone.
import { Calendar, Clock } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/timestamps'

export default function TimestampCell({ value }) {
  const date = formatDate(value)
  if (!date) return <span className="text-sub">—</span>
  const time = formatTime(value)
  return (
    <div className="whitespace-nowrap leading-tight" title={`${date}, ${time} (Philippine time)`}>
      <div className="flex items-center gap-1.5 text-[13px] font-medium text-navy">
        <Calendar size={13} className="text-sub flex-shrink-0" aria-hidden="true" />
        <span>{date}</span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] font-mono text-sub mt-1">
        <Clock size={13} className="flex-shrink-0" aria-hidden="true" />
        <span>{time}</span>
      </div>
    </div>
  )
}