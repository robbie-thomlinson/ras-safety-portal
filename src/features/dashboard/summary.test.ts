import { describe, expect, it } from "vitest"

import { CHECKLIST_ITEMS, type ChecklistItem } from "@/features/safety-forms/schemas"

import { summarize } from "./summary"

const noneMissed = Object.fromEntries(Object.keys(CHECKLIST_ITEMS).map((k) => [k, 0])) as Record<
  ChecklistItem,
  number
>

const workers = [
  { id: "frank", name: "Frank Framer" },
  { id: "priya", name: "Priya Sandhu" },
  { id: "tom", name: "Tom Bergstrom" },
]

const sites = [
  { id: 1, name: "Mount Newton Townhomes", archivedAt: null },
  { id: 2, name: "Happy Valley Residence", archivedAt: null },
  { id: 3, name: "Old Yard", archivedAt: "2026-09-01T00:00:00Z" },
]

const summary = summarize({
  // As if Frank sent two forms on Oct 3 (one missing a hard hat) and Priya one on Oct 2
  // (missing a hard hat and ladders).
  counts: {
    perDay: [
      { date: "2026-10-03", count: 2 },
      { date: "2026-10-02", count: 1 },
    ],
    perSite: [
      { jobSiteId: 1, count: 2 },
      { jobSiteId: 2, count: 1 },
    ],
    workersToday: ["frank"],
    withIssues: 2,
    missed: { ...noneMissed, hardHatWorn: 2, laddersInspected: 1 },
  },
  workers,
  sites,
  from: "2026-10-01",
  today: "2026-10-03",
  awaitingReview: 2,
})

describe("summarize", () => {
  it("counts today's forms and lists who hasn't submitted", () => {
    expect(summary.totals).toEqual({
      submittedToday: 2,
      awaitingReview: 2,
      formsWithIssues: 2,
      workers: 3,
    })
    expect(summary.notSubmittedToday.map((w) => w.name)).toEqual(["Priya Sandhu", "Tom Bergstrom"])
  })

  it("has a bar for every day in the window, including empty ones", () => {
    expect(summary.perDay.map((d) => [d.label, d.count])).toEqual([
      ["Oct 1", 0],
      ["Oct 2", 1],
      ["Oct 3", 2],
    ])
  })

  it("counts forms per site, hiding archived sites with none", () => {
    expect(summary.perSite).toEqual([
      { site: "Mount Newton Townhomes", count: 2 },
      { site: "Happy Valley Residence", count: 1 },
    ])
  })

  it("ranks the checklist items most often answered No", () => {
    expect(summary.missedItems).toEqual([
      { item: "Hard hat worn", count: 2 },
      { item: "Ladders inspected", count: 1 },
    ])
  })
})
