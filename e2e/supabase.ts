import { randomUUID } from "node:crypto"

import { createClient } from "@supabase/supabase-js"

import { PHOTO_BUCKET } from "../src/features/safety-forms/photos"
import type { Database } from "../src/lib/supabase/database.types"
import { todayInRasTimeZone } from "../src/lib/dates"

// Seeded in supabase/seed.sql (password for all: password123).
export const USERS = {
  framer: { id: "11111111-1111-1111-1111-111111111111", email: "framer@ras.test" },
  otherFramer: { id: "33333333-3333-3333-3333-333333333333", email: "priya.sandhu@ras.test" },
  // Only the sign-in tests use Tom: signing out ends every session he has.
  signInFramer: { id: "44444444-4444-4444-4444-444444444444", email: "tom.bergstrom@ras.test" },
  // Only the dashboard test uses Mei, so nothing else changes whether she's submitted today.
  idleFramer: { id: "55555555-5555-5555-5555-555555555555", email: "mei.chen@ras.test" },
  admin: { id: "22222222-2222-2222-2222-222222222222", email: "admin@ras.test" },
} as const

export const PASSWORD = "password123"

// Every job site the tests create starts with this, so leftovers are easy to find and sweep.
export const SITE_PREFIX = "E2E Site"

export function uniqueSiteName() {
  return `${SITE_PREFIX} ${randomUUID().slice(0, 8)}`
}

// Bypasses RLS. Only for test setup and cleanup, never for the code under test.
function serviceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.E2E_SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

// A 1x1 PNG.
export const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
)

export type Site = { id: number; name: string }

export async function createSite(): Promise<Site> {
  const name = uniqueSiteName()
  const { data, error } = await serviceClient()
    .from("job_sites")
    .insert({ name, address: "1 Test Rd, Saanichton, BC" })
    .select("id, name")
    .single()
  if (error) throw error
  return data
}

// Inserts a submitted form with one photo, skipping the UI for tests that only need one to exist.
export async function createForm({
  workerId,
  siteId,
  date = todayInRasTimeZone(),
}: {
  workerId: string
  siteId: number
  date?: string
}) {
  const service = serviceClient()
  const { data: form, error } = await service
    .from("safety_forms")
    .insert({
      worker_id: workerId,
      job_site_id: siteId,
      date,
      hard_hat_worn: true,
      vest_worn: true,
      boots_worn: true,
      eye_protection_worn: true,
      fall_protection_inspected: true,
      scaffolding_inspected: true,
      ladders_inspected: true,
      tools_inspected: true,
      cords_inspected: true,
      hazards_identified: true,
    })
    .select("id")
    .single()
  if (error) throw error

  const path = `${workerId}/${randomUUID()}.png`
  const upload = await service.storage
    .from(PHOTO_BUCKET)
    .upload(path, PNG, { contentType: "image/png" })
  if (upload.error) throw upload.error
  const photo = await service.from("safety_form_photos").insert({
    safety_form_id: form.id,
    path,
    content_type: "image/png",
    size_bytes: PNG.length,
  })
  if (photo.error) throw photo.error

  return form.id
}

// Deletes the given sites with their forms and photos, or every test site when no ids are given.
export async function deleteSites(ids?: number[]) {
  const service = serviceClient()
  let query = service.from("job_sites").select("id")
  query = ids ? query.in("id", ids) : query.like("name", `${SITE_PREFIX} %`)
  const { data: sites, error } = await query
  if (error) throw error
  const siteIds = sites.map((site) => site.id)
  if (!siteIds.length) return

  const { data: forms, error: formsError } = await service
    .from("safety_forms")
    .select("id, photos:safety_form_photos (path)")
    .in("job_site_id", siteIds)
  if (formsError) throw formsError

  const paths = forms.flatMap((form) => form.photos.map((photo) => photo.path))
  if (paths.length) {
    const { error } = await service.storage.from(PHOTO_BUCKET).remove(paths)
    if (error) throw error
  }
  // Forms first: they reference the sites. Their photo rows go with them (on delete cascade).
  const deletedForms = await service
    .from("safety_forms")
    .delete()
    .in(
      "id",
      forms.map((form) => form.id),
    )
  if (deletedForms.error) throw deletedForms.error
  const deletedSites = await service.from("job_sites").delete().in("id", siteIds)
  if (deletedSites.error) throw deletedSites.error
}
