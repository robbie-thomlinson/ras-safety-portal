import { afterAll, beforeAll, describe, expect, it } from "vitest"

import type { Client } from "@/lib/supabase/types"
import { cleanUp, serviceClient, signIn, uploadPhoto, USERS } from "@/test/supabase"

import { getSafetyForm, listSafetyForms, listWorkers, setReviewStatus, submitSafetyForm } from "./data"
import { PHOTO_BUCKET, photoPath } from "./photos"
import type { SafetyFormValues } from "./schemas"

let farmer: Client
let otherFarmer: Client
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

async function submit(client: Client, values: Partial<SafetyFormValues> & Pick<SafetyFormValues, "photoPaths">) {
  const id = await submitSafetyForm(client, { jobSiteId: 1, date: "2026-09-15", notes: "Test", ...checklist, ...values })
  formIds.push(id)
  return id
}

let farmerFormId: number
let otherFormId: number

beforeAll(async () => {
  ;[farmer, otherFarmer, admin] = await Promise.all([signIn("farmer"), signIn("otherFarmer"), signIn("admin")])

  farmerFormId = await submit(farmer, {
    jobSiteId: 2,
    date: "2026-09-14",
    photoPaths: [await upload(farmer, USERS.farmer.id), await upload(farmer, USERS.farmer.id)],
  })
  otherFormId = await submit(otherFarmer, {
    jobSiteId: 3,
    date: "2026-09-16",
    photoPaths: [await upload(otherFarmer, USERS.otherFarmer.id)],
  })
})

afterAll(() => cleanUp({ formIds, paths }))

describe("submitting", () => {
  it("records the form with its photos and viewable links", async () => {
    const form = await getSafetyForm(farmer, farmerFormId)
    expect(form).toMatchObject({
      date: "2026-09-14",
      status: "submitted",
      jobSite: { id: 2 },
      worker: { id: USERS.farmer.id, name: "Frank Farmer" },
      checklist,
      notes: "Test",
      review: null,
    })
    expect(form?.photos).toHaveLength(2)

    const response = await fetch(form!.photos[0].url!)
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("image/png")
  })

  it("rejects another farmer's photo", async () => {
    const theirs = await upload(otherFarmer, USERS.otherFarmer.id)
    await expect(submit(farmer, { photoPaths: [theirs] })).rejects.toThrow("Some photos didn't finish uploading")
  })

  it("rejects a photo that's already on another form", async () => {
    const [attached] = (await serviceClient().from("safety_form_photos").select("path").eq("safety_form_id", farmerFormId))
      .data!
    await expect(submit(farmer, { photoPaths: [attached.path] })).rejects.toThrow("already attached to another form")
  })

  it("rejects an archived job site", async () => {
    const service = serviceClient()
    const { data: site } = await service
      .from("job_sites")
      .insert({ name: "Archived", address: "x", archived_at: new Date().toISOString() })
      .select("id")
      .single()
    try {
      const photo = await upload(farmer, USERS.farmer.id)
      await expect(submit(farmer, { jobSiteId: site!.id, photoPaths: [photo] })).rejects.toThrow("job site isn't available")
    } finally {
      await service.from("job_sites").delete().eq("id", site!.id)
    }
  })

  it("doesn't let an admin submit", async () => {
    const photo = await upload(farmer, USERS.farmer.id)
    await expect(submit(admin, { photoPaths: [photo] })).rejects.toThrow("Only farmers can submit")
  })
})

describe("photo storage", () => {
  it("doesn't let a farmer upload into someone else's folder", async () => {
    const { error } = await uploadPhoto(farmer, photoPath(USERS.otherFarmer.id, "image/png"))
    expect(error).not.toBeNull()
  })

  it("rejects files that aren't images", async () => {
    const { error } = await uploadPhoto(farmer, `${USERS.farmer.id}/${crypto.randomUUID()}.png`, "text/html")
    expect(error).not.toBeNull()
  })

  it("lets a farmer delete a photo they haven't submitted yet", async () => {
    const path = await upload(farmer, USERS.farmer.id)
    const { data } = await farmer.storage.from(PHOTO_BUCKET).remove([path])
    expect(data).toHaveLength(1)
  })

  it("doesn't let a farmer delete a submitted photo", async () => {
    const [attached] = (await serviceClient().from("safety_form_photos").select("path").eq("safety_form_id", farmerFormId))
      .data!
    const { data } = await farmer.storage.from(PHOTO_BUCKET).remove([attached.path])
    expect(data ?? []).toHaveLength(0)

    const form = await getSafetyForm(admin, farmerFormId)
    expect((await fetch(form!.photos[0].url!)).status).toBe(200)
  })
})

describe("reading", () => {
  it("shows a farmer only their own forms", async () => {
    const forms = await listSafetyForms(farmer)
    expect(forms.map((f) => f.id)).toContain(farmerFormId)
    expect(forms.every((f) => f.worker.id === USERS.farmer.id)).toBe(true)
  })

  it("hides another farmer's form", async () => {
    expect(await getSafetyForm(farmer, otherFormId)).toBeNull()
  })

  it("shows an admin every farmer's forms", async () => {
    const ids = (await listSafetyForms(admin)).map((f) => f.id)
    expect(ids).toEqual(expect.arrayContaining([farmerFormId, otherFormId]))
  })

  it("filters by worker, site and date range", async () => {
    const byWorker = await listSafetyForms(admin, { workerId: USERS.otherFarmer.id })
    expect(byWorker.map((f) => f.id)).toContain(otherFormId)
    expect(byWorker.every((f) => f.worker.id === USERS.otherFarmer.id)).toBe(true)

    const bySite = await listSafetyForms(admin, { jobSiteId: 2 })
    expect(bySite.map((f) => f.id)).toContain(farmerFormId)
    expect(bySite.every((f) => f.jobSite.id === 2)).toBe(true)

    const byDate = await listSafetyForms(admin, { from: "2026-09-16", to: "2026-09-16" })
    expect(byDate.map((f) => f.id)).toContain(otherFormId)
    expect(byDate.every((f) => f.date === "2026-09-16")).toBe(true)
  })

  it("lists farmers (not admins) for the worker filter", async () => {
    const workers = await listWorkers(admin)
    expect(workers.map((w) => w.id)).toContain(USERS.farmer.id)
    expect(workers.map((w) => w.id)).not.toContain(USERS.admin.id)
  })
})

describe("reviewing", () => {
  it("lets an admin mark a form reviewed, stamped with their name", async () => {
    await setReviewStatus(admin, otherFormId, "reviewed")
    const form = await getSafetyForm(admin, otherFormId)
    expect(form?.status).toBe("reviewed")
    expect(form?.review?.reviewerName).toBe("Alex Admin")
  })

  it("shows the farmer it was reviewed, without the reviewer's profile", async () => {
    const form = await getSafetyForm(otherFarmer, otherFormId)
    expect(form?.status).toBe("reviewed")
    expect(form?.review).toMatchObject({ reviewerName: null })
  })

  it("doesn't let a farmer review a form", async () => {
    await expect(setReviewStatus(farmer, farmerFormId, "reviewed")).rejects.toThrow("Safety form not found.")
  })
})
