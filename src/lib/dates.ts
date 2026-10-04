// RAS works in BC, so "today" means local time there, not UTC or the server's zone.
export const RAS_TIME_ZONE = "America/Vancouver"

export function todayInRasTimeZone(now = new Date()) {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: RAS_TIME_ZONE }).format(now)
}

// Calendar dates (YYYY-MM-DD) are handled as UTC midnight so the arithmetic and formatting
// below never shift a day, whatever zone the server or browser is in.
function parseIsoDate(date: string) {
  return new Date(`${date}T00:00:00Z`)
}

export function addDays(date: string, days: number) {
  const d = parseIsoDate(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// Every date from `from` to `to`, inclusive.
export function dateRange(from: string, to: string) {
  const dates: string[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) dates.push(d)
  return dates
}

// The calendar component works in local Date objects; the app passes YYYY-MM-DD strings around.
export function toCalendarDate(date: string) {
  // A date-time without an offset parses as local time.
  return new Date(`${date}T00:00:00`)
}

export function fromCalendarDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Work weeks start on Monday.
export function startOfWeek(date: string) {
  const daysSinceMonday = (parseIsoDate(date).getUTCDay() + 6) % 7
  return addDays(date, -daysSinceMonday)
}

export function startOfMonth(date: string) {
  return `${date.slice(0, 8)}01`
}

export type DateRangePreset = { id: string; label: string; from: string; to: string }

// Quick picks for date filters. Every range ends today, because there's nothing to find in the future.
export function dateRangePresets(today: string): DateRangePreset[] {
  return [
    { id: "today", label: "Today", from: today, to: today },
    { id: "yesterday", label: "Yesterday", from: addDays(today, -1), to: addDays(today, -1) },
    { id: "this-week", label: "This week", from: startOfWeek(today), to: today },
    { id: "last-7-days", label: "Last 7 days", from: addDays(today, -6), to: today },
    { id: "this-month", label: "This month", from: startOfMonth(today), to: today },
    { id: "last-30-days", label: "Last 30 days", from: addDays(today, -29), to: today },
  ]
}

// The first preset covering exactly this range, if any (on a Monday "Today" wins over "This week").
export function matchDateRangePreset(today: string, from?: string, to?: string) {
  return dateRangePresets(today).find((preset) => preset.from === from && preset.to === to)
}

const dateFormats = {
  long: new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }),
  medium: new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }),
  short: new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "UTC" }),
}

// "Sat, Oct 3, 2026", "Oct 3, 2026" or "Oct 3"
export function formatDate(date: string, style: keyof typeof dateFormats = "long") {
  return dateFormats[style].format(parseIsoDate(date))
}

// "Sep 28 – Oct 3". The year is only shown when the range isn't within `currentYear`.
export function formatDateRange(from: string, to: string, currentYear: string) {
  const style = from.startsWith(currentYear) && to.startsWith(currentYear) ? "short" : "medium"
  return from === to
    ? formatDate(from, style)
    : `${formatDate(from, style)} – ${formatDate(to, style)}`
}

const dateTimeFormat = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: RAS_TIME_ZONE,
})

// For timestamps (submitted at, reviewed at), shown in BC time.
export function formatDateTime(timestamp: string) {
  return dateTimeFormat.format(new Date(timestamp))
}
