import { afterAll, beforeAll, describe, expect, it } from "vitest"

import type { Client } from "@/lib/supabase/types"
import { cleanUp, serviceClient, signIn, uploadPhoto, USERS } from "@/test/supabase"

import {
  getSafetyForm,
  listSafetyForms,
  listWorkers,
  setReviewStatus,
  submitSafetyForm,
} from "./data"
import { PHOTO_BUCKET, photoPath } from "./photos"
import type { FormFilters, SafetyFormValues } from "./schemas"

let framer: Client
let otherFramer: Client
let admin: Client
const formIds: number[] = []
const paths: string[] = []

const checklist = {
  hardHatWorn: true,
  vestWorn: true,
  bootsWorn: true,
  eyeProtectionWorn: true,
  fallProtectionInspected: true,
  scaffoldingInspected: false,
  laddersInspected: true,
  toolsInspected: true,
  cordsInspected: true,
  hazardsIdentified: true,
}

async function upload(client: Client, userId: string) {
  const path = photoPath(userId, "image/png")
  const { error } = await uploadPhoto(client, path)
  if (error) throw error
  paths.push(path)
  return path
}

async function submit(
  client: Client,
  values: Partial<SafetyFormValues> & Pick<SafetyFormValues, "photoPaths">,
) {
  const id = await submitSafetyForm(client, {
    jobSiteId: 1,
    date: "2026-09-15",
    notes: "Test",
    ...checklist,
    ...values,
  })
  formIds.push(id)
  return id
}

let framerFormId: number
let otherFormId: number

beforeAll(async () => {
  ;[framer, otherFramer, admin] = await Promise.all([
    signIn("framer"),
    signIn("otherFramer"),
    signIn("admin"),
  ])

  framerFormId = await submit(framer, {
    jobSiteId: 2,
    date: "2026-09-14",
    photoPaths: [await upload(framer, USERS.framer.id), await upload(framer, USERS.framer.id)],
  })
  otherFormId = await submit(otherFramer, {
    jobSiteId: 3,
    date: "2026-09-16",
    photoPaths: [await upload(otherFramer, USERS.otherFramer.id)],
  })
})

afterAll(() => cleanUp({ formIds, paths }))

describe("submitting", () => {
  it("records the form with its photos and viewable links", async () => {
    const form = await getSafetyForm(framer, framerFormId)
    expect(form).toMatchObject({
      date: "2026-09-14",
      status: "submitted",
      jobSite: { id: 2 },
      worker: { id: USERS.framer.id, name: "Frank Framer" },
      checklist,
      notes: "Test",
      review: null,
    })
    expect(form?.photos).toHaveLength(2)

    const response = await fetch(form!.photos[0]!.url!)
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("image/png")
  })

  it("rejects another framer's photo", async () => {
    const theirs = await upload(otherFramer, USERS.otherFramer.id)
    await expect(submit(framer, { photoPaths: [theirs] })).rejects.toThrow(
      "Some photos didn't finish uploading",
    )
  })

  it("rejects a photo that's already on another form", async () => {
    const [attached] = (
      await serviceClient()
        .from("safety_form_photos")
        .select("path")
        .eq("safety_form_id", framerFormId)
    ).data!
    await expect(submit(framer, { photoPaths: [attached!.path] })).rejects.toThrow(
      "already attached to another form",
    )
  })

  it("rejects an archived job site", async () => {
    const service = serviceClient()
    const { data: site } = await service
      .from("job_sites")
      .insert({ name: "Archived", address: "x", archived_at: new Date().toISOString() })
      .select("id")
      .single()
    try {
      const photo = await upload(framer, USERS.framer.id)
      await expect(submit(framer, { jobSiteId: site!.id, photoPaths: [photo] })).rejects.toThrow(
        "job site isn't available",
      )
    } finally {
      await service.from("job_sites").delete().eq("id", site!.id)
    }
  })

  it("doesn't let an admin submit", async () => {
    const photo = await upload(framer, USERS.framer.id)
    await expect(submit(admin, { photoPaths: [photo] })).rejects.toThrow("Only framers can submit")
  })
})

describe("photo storage", () => {
  it("doesn't let a framer upload into someone else's folder", async () => {
    const { error } = await uploadPhoto(framer, photoPath(USERS.otherFramer.id, "image/png"))
    expect(error).not.toBeNull()
  })

  it("rejects files that aren't images", async () => {
    const { error } = await uploadPhoto(
      framer,
      `${USERS.framer.id}/${crypto.randomUUID()}.png`,
      "text/html",
    )
    expect(error).not.toBeNull()
  })

  it("lets a framer delete a photo they haven't submitted yet", async () => {
    const path = await upload(framer, USERS.framer.id)
    const { data } = await framer.storage.from(PHOTO_BUCKET).remove([path])
    expect(data).toHaveLength(1)
  })

  it("doesn't let a framer delete a submitted photo", async () => {
    const [attached] = (
      await serviceClient()
        .from("safety_form_photos")
        .select("path")
        .eq("safety_form_id", framerFormId)
    ).data!
    const { data } = await framer.storage.from(PHOTO_BUCKET).remove([attached!.path])
    expect(data ?? []).toHaveLength(0)

    const form = await getSafetyForm(admin, framerFormId)
    expect((await fetch(form!.photos[0]!.url!)).status).toBe(200)
  })
})

// Big enough that the test forms land on the first page whatever else is in the local database.
const everything = async (client: Client, filters: FormFilters = {}) =>
  (await listSafetyForms(client, filters, { pageSize: 1000 })).items

describe("reading", () => {
  it("shows a framer only their own forms", async () => {
    const forms = await everything(framer)
    expect(forms.map((f) => f.id)).toContain(framerFormId)
    expect(forms.every((f) => f.worker.id === USERS.framer.id)).toBe(true)
  })

  it("hides another framer's form", async () => {
    expect(await getSafetyForm(framer, otherFormId)).toBeNull()
  })

  it("shows an admin every framer's forms", async () => {
    const ids = (await everything(admin)).map((f) => f.id)
    expect(ids).toEqual(expect.arrayContaining([framerFormId, otherFormId]))
  })

  it("filters by worker, site and date range", async () => {
    const byWorker = await everything(admin, { workerId: USERS.otherFramer.id })
    expect(byWorker.map((f) => f.id)).toContain(otherFormId)
    expect(byWorker.every((f) => f.worker.id === USERS.otherFramer.id)).toBe(true)

    const bySite = await everything(admin, { jobSiteId: 2 })
    expect(bySite.map((f) => f.id)).toContain(framerFormId)
    expect(bySite.every((f) => f.jobSite.id === 2)).toBe(true)

    const byDate = await everything(admin, { from: "2026-09-16", to: "2026-09-16" })
    expect(byDate.map((f) => f.id)).toContain(otherFormId)
    expect(byDate.every((f) => f.date === "2026-09-16")).toBe(true)

    const awaiting = await everything(admin, { status: "submitted" })
    expect(awaiting.every((f) => f.status === "submitted")).toBe(true)
  })

  it("lists framers (not admins) for the worker filter", async () => {
    const workers = await listWorkers(admin)
    expect(workers.map((w) => w.id)).toContain(USERS.framer.id)
    expect(workers.map((w) => w.id)).not.toContain(USERS.admin.id)
  })
})

describe("paging", () => {
  it("returns one slice of the full list, with the total", async () => {
    const all = await everything(admin)
    const page = await listSafetyForms(admin, {}, { page: 2, pageSize: 2 })
    expect(page.items.map((f) => f.id)).toEqual(all.slice(2, 4).map((f) => f.id))
    expect(page).toMatchObject({
      page: 2,
      pageSize: 2,
      total: all.length,
      pageCount: Math.ceil(all.length / 2),
    })
  })

  it("counts only the filtered forms", async () => {
    const filters = { workerId: USERS.otherFramer.id }
    const page = await listSafetyForms(admin, filters, { pageSize: 1 })
    expect(page.total).toBe((await everything(admin, filters)).length)
  })

  it("returns a page past the end empty, with the real total", async () => {
    const page = await listSafetyForms(admin, {}, { page: 10_000 })
    expect(page.items).toEqual([])
    expect(page.total).toBe((await everything(admin)).length)
  })
})

describe("reviewing", () => {
  it("lets an admin mark a form reviewed, stamped with their name", async () => {
    await setReviewStatus(admin, otherFormId, "reviewed")
    const form = await getSafetyForm(admin, otherFormId)
    expect(form?.status).toBe("reviewed")
    expect(form?.review?.reviewerName).toBe("Alex Admin")
  })

  it("shows the framer it was reviewed, without the reviewer's profile", async () => {
    const form = await getSafetyForm(otherFramer, otherFormId)
    expect(form?.status).toBe("reviewed")
    expect(form?.review).toMatchObject({ reviewerName: null })
  })

  it("doesn't let a framer review a form", async () => {
    await expect(setReviewStatus(framer, framerFormId, "reviewed")).rejects.toThrow(
      "Safety form not found.",
    )
  })
})
