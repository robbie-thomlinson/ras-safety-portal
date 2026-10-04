import { describe, expect, it } from "vitest"

import { matchesQuery, matchesStatus, parseSiteStatus } from "./filter"

const site = { name: "Mount Newton Townhomes", address: "2250 Mount Newton X Rd, Saanichton" }

describe("matchesQuery", () => {
  it("matches any part of the name or address, ignoring case and surrounding spaces", () => {
    expect(matchesQuery(site, "newton")).toBe(true)
    expect(matchesQuery(site, "  SAANICH ")).toBe(true)
    expect(matchesQuery(site, "langford")).toBe(false)
  })

  it("matches everything when the query is blank", () => {
    expect(matchesQuery(site, "")).toBe(true)
    expect(matchesQuery(site, "   ")).toBe(true)
  })
})

describe("matchesStatus", () => {
  const active = { archivedAt: null }
  const archived = { archivedAt: "2026-10-01T00:00:00Z" }

  it("splits sites by whether they're archived", () => {
    expect(matchesStatus(active, "active")).toBe(true)
    expect(matchesStatus(archived, "active")).toBe(false)
    expect(matchesStatus(active, "archived")).toBe(false)
    expect(matchesStatus(archived, "archived")).toBe(true)
    expect(matchesStatus(active, "all")).toBe(true)
    expect(matchesStatus(archived, "all")).toBe(true)
  })
})

describe("parseSiteStatus", () => {
  it("keeps a valid status and falls back to active otherwise", () => {
    expect(parseSiteStatus("archived")).toBe("archived")
    expect(parseSiteStatus("all")).toBe("all")
    expect(parseSiteStatus(undefined)).toBe("active")
    expect(parseSiteStatus("deleted")).toBe("active")
    expect(parseSiteStatus(["archived"])).toBe("active")
  })
})
