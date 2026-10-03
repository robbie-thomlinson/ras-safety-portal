// RAS works in BC, so "today" means local time there, not UTC or the server's zone.
export const RAS_TIME_ZONE = "America/Vancouver"

export function todayInRasTimeZone(now = new Date()) {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: RAS_TIME_ZONE }).format(now)
}
