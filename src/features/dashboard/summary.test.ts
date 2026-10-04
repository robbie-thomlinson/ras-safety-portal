import { describe, expect, it } from "vitest"

import { CHECKLIST_ITEMS, type ChecklistItem } from "@/features/safety-forms/schemas"

import { summarize, type SummaryForm } from "./summary"

const allYes = Object.fromEntries(Object.keys(CHECKLIST_ITEMS).map((k) => [k, true])) as Record<
  ChecklistItem,
  boolean
>

function form(
  date: string,
  workerId: string,
  jobSiteId: number,
  no: ChecklistItem[] = [],
): SummaryForm {
  return {
    date,
    workerId,
    jobSiteId,
    checklist: { ...allYes, ...Object.fromEntries(no.map((k) => [k, false])) },
  }
}

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
  forms: [
    form("2026-10-03", "frank", 1),
    form("2026-10-03", "frank", 2, ["hardHatWorn"]),
    form("2026-10-02", "priya", 1, ["hardHatWorn", "laddersInspected"]),
  ],
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
