import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"

import { formFiltersSchema, safetyFormSchema, type SafetyFormInput } from "./schemas"

const USER_ID = "11111111-1111-1111-1111-111111111111"

const valid: SafetyFormInput = {
  jobSiteId: 1,
  date: "2026-10-03",
  hardHatWorn: true,
  vestWorn: true,
  bootsWorn: true,
  eyeProtectionWorn: true,
  fallProtectionInspected: true,
  scaffoldingInspected: true,
  laddersInspected: true,
  toolsInspected: true,
  cordsInspected: true,
  hazardsIdentified: false,
  notes: "  Wet ground near the barn  ",
  photoPaths: [`${USER_ID}/aaaaaaaa-0000-0000-0000-000000000001.jpg`],
}

function fieldErrors(input: unknown) {
  const result = safetyFormSchema.safeParse(input)
  return result.success ? {} : z.flattenError(result.error).fieldErrors
}

describe("safetyFormSchema", () => {
  // Noon in Vancouver on Oct 3.
  beforeEach(() => vi.useFakeTimers({ now: new Date("2026-10-03T19:00:00Z") }))
  afterEach(() => vi.useRealTimers())

  it("accepts a complete form and trims notes", () => {
    const result = safetyFormSchema.parse(valid)
    expect(result.notes).toBe("Wet ground near the barn")
    expect(result.jobSiteId).toBe(1)
  })

  it("accepts a job site id from a select (string)", () => {
    expect(safetyFormSchema.parse({ ...valid, jobSiteId: "2" }).jobSiteId).toBe(2)
  })

  it("requires a job site", () => {
    expect(fieldErrors({ ...valid, jobSiteId: "" }).jobSiteId).toEqual(["Choose a job site"])
  })

  it("rejects a future date", () => {
    expect(fieldErrors({ ...valid, date: "2026-10-04" }).date).toEqual(["Date can't be in the future"])
  })

  it("rejects a badly formatted date", () => {
    expect(fieldErrors({ ...valid, date: "03/10/2026" }).date).toEqual(["Choose a date"])
  })

  it("requires every checklist item to be answered", () => {
    expect(fieldErrors({ ...valid, hardHatWorn: undefined }).hardHatWorn).toEqual(["Answer this checklist item"])
  })

  it("requires at least one photo", () => {
    expect(fieldErrors({ ...valid, photoPaths: [] }).photoPaths).toEqual(["Add at least one photo"])
  })

  it("allows at most 10 photos", () => {
    const paths = Array.from({ length: 11 }, (_, i) =>
      `${USER_ID}/aaaaaaaa-0000-0000-0000-0000000000${String(i).padStart(2, "0")}.jpg`
    )
    expect(fieldErrors({ ...valid, photoPaths: paths }).photoPaths).toEqual(["Add no more than 10 photos"])
  })

  it("rejects duplicate photos", () => {
    const path = valid.photoPaths[0]
    expect(fieldErrors({ ...valid, photoPaths: [path, path] }).photoPaths).toEqual(["Each photo can only be added once"])
  })

  it("rejects notes over 2000 characters", () => {
    expect(fieldErrors({ ...valid, notes: "a".repeat(2001) }).notes).toEqual(["Notes must be 2000 characters or fewer"])
  })
})

describe("formFiltersSchema", () => {
  it("accepts empty filters", () => {
    expect(formFiltersSchema.parse({})).toEqual({})
  })

  it("coerces search params", () => {
    expect(formFiltersSchema.parse({ jobSiteId: "3", from: "2026-10-01" })).toEqual({ jobSiteId: 3, from: "2026-10-01" })
  })

  it("rejects a start date after the end date", () => {
    expect(formFiltersSchema.safeParse({ from: "2026-10-05", to: "2026-10-01" }).success).toBe(false)
  })

  it("rejects a worker id that isn't a uuid", () => {
    expect(formFiltersSchema.safeParse({ workerId: "1 or 1=1" }).success).toBe(false)
  })
})
