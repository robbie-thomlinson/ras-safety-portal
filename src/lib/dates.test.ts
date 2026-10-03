import { describe, expect, it } from "vitest"

import { todayInRasTimeZone } from "./dates"

describe("todayInRasTimeZone", () => {
  it("uses BC time, not UTC", () => {
    // 3am UTC on Oct 4 is still Oct 3 in Vancouver.
    expect(todayInRasTimeZone(new Date("2026-10-04T03:00:00Z"))).toBe("2026-10-03")
    expect(todayInRasTimeZone(new Date("2026-10-04T08:00:00Z"))).toBe("2026-10-04")
  })
})
