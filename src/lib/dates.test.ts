import { describe, expect, it } from "vitest"

import {
  addDays,
  dateRange,
  dateRangePresets,
  formatDate,
  formatDateRange,
  matchDateRangePreset,
  startOfMonth,
  startOfWeek,
  todayInRasTimeZone,
} from "./dates"

describe("todayInRasTimeZone", () => {
  it("uses BC time, not UTC", () => {
    // 3am UTC on Oct 4 is still Oct 3 in Vancouver.
    expect(todayInRasTimeZone(new Date("2026-10-04T03:00:00Z"))).toBe("2026-10-03")
    expect(todayInRasTimeZone(new Date("2026-10-04T08:00:00Z"))).toBe("2026-10-04")
  })
})

describe("calendar dates", () => {
  it("adds days across month boundaries", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01")
    expect(addDays("2026-10-01", -1)).toBe("2026-09-30")
  })

  it("lists every date in a range", () => {
    expect(dateRange("2026-09-29", "2026-10-02")).toEqual([
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
    ])
  })

  it("formats without shifting the day", () => {
    expect(formatDate("2026-10-03")).toBe("Sat, Oct 3, 2026")
    expect(formatDate("2026-10-03", "short")).toBe("Oct 3")
  })

  it("starts weeks on Monday and months on the 1st", () => {
    expect(startOfWeek("2026-10-03")).toBe("2026-09-28") // Saturday
    expect(startOfWeek("2026-09-28")).toBe("2026-09-28") // Monday
    expect(startOfWeek("2026-10-04")).toBe("2026-09-28") // Sunday ends the week
    expect(startOfMonth("2026-10-03")).toBe("2026-10-01")
  })
})

describe("date range presets", () => {
  const today = "2026-10-03"

  it("builds ranges that end today", () => {
    expect(Object.fromEntries(dateRangePresets(today).map((p) => [p.id, [p.from, p.to]]))).toEqual({
      today: ["2026-10-03", "2026-10-03"],
      yesterday: ["2026-10-02", "2026-10-02"],
      "this-week": ["2026-09-28", "2026-10-03"],
      "last-7-days": ["2026-09-27", "2026-10-03"],
      "this-month": ["2026-10-01", "2026-10-03"],
      "last-30-days": ["2026-09-04", "2026-10-03"],
    })
  })

  it("matches a range back to its preset", () => {
    expect(matchDateRangePreset(today, "2026-09-28", "2026-10-03")?.label).toBe("This week")
    expect(matchDateRangePreset(today, "2026-09-28", "2026-10-02")).toBeUndefined()
    expect(matchDateRangePreset(today)).toBeUndefined()
    // On a Monday, "Today" and "This week" are the same range; the narrower name wins.
    expect(matchDateRangePreset("2026-09-28", "2026-09-28", "2026-09-28")?.label).toBe("Today")
  })

  it("formats ranges, adding the year only when it isn't this year", () => {
    expect(formatDateRange("2026-09-28", "2026-10-03", "2026")).toBe("Sep 28 – Oct 3")
    expect(formatDateRange("2026-10-03", "2026-10-03", "2026")).toBe("Oct 3")
    expect(formatDateRange("2025-12-29", "2026-01-02", "2026")).toBe("Dec 29, 2025 – Jan 2, 2026")
  })
})
