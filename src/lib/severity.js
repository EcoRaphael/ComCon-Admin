// src/lib/severity.js
// Driver Issue Severity Categories: what each level means, which issue types
// belong to it, and what the admin should do. The Complaints page shows this.
//
// A complaint's severity is decided in three ways, all by the DATABASE
// (supabase/migrations/driver_issue_severity.sql), which uses this same grouping:
//   1. From its issue types. With several types, the highest level wins.
//   2. From the commuter's answer to "Did this put you in danger or hurt you?",
//      asked when they choose Other. Yes makes it High straight away.
//   3. By an admin, who can set any complaint to Low, Medium or High. That
//      decision is final, and the database records who made it and when.
// "Other" says nothing about what happened, so it starts at Medium and waits
// for an admin to review it.
//
// If you change an issue type or a level here, change that SQL function too,
// and the list of choices in the commuter app (MyRides.jsx), so the three never
// disagree.

export const OTHER_TYPE = 'Other'

export const SEVERITY_LEVELS = [
  {
    level: 'High',
    weight: 3,
    meaning: 'Safety risk or serious misconduct',
    issueTypes: ['Reckless Driving', 'Harassment', 'Driving Under the Influence', 'Accident or Injury', 'Unsafe Vehicle'],
    action: 'Review first. Consider suspending the driver while it is checked.',
  },
  {
    level: 'Medium',
    weight: 2,
    meaning: "Affects the commuter's money or trip",
    issueTypes: ['Overcharging', 'No Show', 'Wrong Route', OTHER_TYPE],
    action: 'Review next. Warn the driver if the complaint is confirmed.',
  },
  {
    level: 'Low',
    weight: 1,
    meaning: 'Service quality or a minor concern',
    issueTypes: ['Discourtesy'],
    action: "Note it on the driver's record. Coach the driver if it repeats.",
  },
]

const WEIGHT_BY_TYPE = Object.fromEntries(
  SEVERITY_LEVELS.flatMap(s => s.issueTypes.map(t => [t, s.weight]))
)

export const severityInfo = (level) => SEVERITY_LEVELS.find(s => s.level === level) || null

const toList = (issueTypes) => Array.isArray(issueTypes) ? issueTypes : issueTypes ? [issueTypes] : []

export const hasOther = (issueTypes) => toList(issueTypes).includes(OTHER_TYPE)

// Same rule as the database function report_severity(): a Yes to the danger
// question makes it High; otherwise the highest level among the issue types
// wins, and a type that is not listed counts as Medium so a new kind of
// complaint is never quietly marked Low.
export function severityOf(issueTypes, safetyConcern = false) {
  if (safetyConcern) return 'High'
  const list = toList(issueTypes)
  if (list.length === 0) return 'Low'
  const weight = Math.max(...list.map(t => WEIGHT_BY_TYPE[t] ?? 2))
  return weight >= 3 ? 'High' : weight === 2 ? 'Medium' : 'Low'
}

// A complaint waits for an admin when it includes Other and no admin has set
// its severity yet.
export const needsReview = (report) =>
  Boolean(report) && !report.severity_reviewed && hasOther(report.issue_type)