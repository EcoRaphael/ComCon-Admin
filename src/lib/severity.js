// src/lib/severity.js
// Driver Issue Severity Categories: what each level means, which issue types
// belong to it, and what the admin should do. The Complaints page shows this.
//
// The DATABASE decides each complaint's severity, using this same grouping
// (supabase/migrations/driver_issue_severity.sql). If you change an issue type
// or a level here, change that SQL function too, so the two never disagree.
// A complaint with several issue types takes the highest level among them.

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
    issueTypes: ['Overcharging', 'No Show', 'Wrong Route'],
    action: 'Review next. Warn the driver if the complaint is confirmed.',
  },
  {
    level: 'Low',
    weight: 1,
    meaning: 'Service quality or a minor concern',
    issueTypes: ['Discourtesy', 'Other'],
    action: "Note it on the driver's record. Coach the driver if it repeats.",
  },
]

const WEIGHT_BY_TYPE = Object.fromEntries(
  SEVERITY_LEVELS.flatMap(s => s.issueTypes.map(t => [t, s.weight]))
)

export const severityInfo = (level) => SEVERITY_LEVELS.find(s => s.level === level) || null

// Same rule as the database function issue_severity(): the highest level among
// the issue types wins, and a type that is not listed counts as Medium so a
// new kind of complaint is never quietly marked Low.
export function severityOf(issueTypes) {
  const list = Array.isArray(issueTypes) ? issueTypes : issueTypes ? [issueTypes] : []
  if (list.length === 0) return 'Low'
  const weight = Math.max(...list.map(t => WEIGHT_BY_TYPE[t] ?? 2))
  return weight >= 3 ? 'High' : weight === 2 ? 'Medium' : 'Low'
}