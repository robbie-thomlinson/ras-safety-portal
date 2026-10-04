import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { submitSafetyForm } from "@/features/safety-forms/data"
import { photoPath } from "@/features/safety-forms/photos"
import type { Client } from "@/lib/supabase/types"
import { cleanUp, signIn, uploadPhoto, USERS } from "@/test/supabase"

import { getDashboardSummary } from "./data"

// A fixed day well away from other tests and demo data, so the counts are exact.
const TODAY = "2025-08-15"

let admin: Client
const formIds: number[] = []
const paths: string[] = []

beforeAll(async () => {
  const framer = await signIn("framer")
  admin = await signIn("admin")

  const path = photoPath(USERS.framer.id, "image/png")
  const { error } = await uploadPhoto(framer, path)
  if (error) throw error
  paths.push(path)

  formIds.push(
    await submitSafetyForm(framer, {
      jobSiteId: 1,
      date: TODAY,
      hardHatWorn: false,
      vestWorn: true,
      bootsWorn: true,
      eyeProtectionWorn: true,
      fallProtectionInspected: true,
      scaffoldingInspected: true,
      laddersInspected: true,
      toolsInspected: true,
      cordsInspected: true,
      hazardsIdentified: true,
      photoPaths: [path],
    })
  )
})

afterAll(() => cleanUp({ formIds, paths }))

describe("getDashboardSummary", () => {
  it("summarizes the day's forms for an admin", async () => {
    const summary = await getDashboardSummary(admin, TODAY)

    expect(summary.totals.submittedToday).toBe(1)
    expect(summary.totals.formsWithIssues).toBe(1)
    expect(summary.notSubmittedToday.map((w) => w.id)).not.toContain(USERS.framer.id)
    expect(summary.notSubmittedToday.map((w) => w.id)).toContain(USERS.otherFramer.id)
    expect(summary.perSite.find((s) => s.site === "Mount Newton Townhomes")?.count).toBe(1)
    expect(summary.missedItems).toEqual([{ item: "Hard hat worn", count: 1 }])
  })
})
