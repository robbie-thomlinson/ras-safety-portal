import { createClient } from "@supabase/supabase-js"
import { inject } from "vitest"

import type { Database } from "@/lib/supabase/database.types"
import type { Client } from "@/lib/supabase/types"
import { PHOTO_BUCKET } from "@/features/safety-forms/photos"

// Seeded in supabase/seed.sql.
export const USERS = {
  farmer: { id: "11111111-1111-1111-1111-111111111111", email: "farmer@ras.test" },
  otherFarmer: { id: "33333333-3333-3333-3333-333333333333", email: "priya.sandhu@ras.test" },
  admin: { id: "22222222-2222-2222-2222-222222222222", email: "admin@ras.test" },
} as const

const PASSWORD = "password123"

function newClient(key: string): Client {
  const { url } = inject("supabase")
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export function anonClient() {
  return newClient(inject("supabase").publishableKey)
}

export async function signIn(user: keyof typeof USERS) {
  const client = anonClient()
  const { error } = await client.auth.signInWithPassword({ email: USERS[user].email, password: PASSWORD })
  if (error) throw error
  return client
}

// Bypasses RLS. Only for test setup and cleanup, never for the code under test.
export function serviceClient() {
  return newClient(inject("supabase").secretKey)
}

// A 1x1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
)

export async function uploadPhoto(client: Client, path: string, contentType = "image/png") {
  return client.storage.from(PHOTO_BUCKET).upload(path, PNG, { contentType })
}

// Deletes what a test file created, using the service client.
export async function cleanUp({ formIds = [], paths = [], jobSiteIds = [] }: {
  formIds?: number[]
  paths?: string[]
  jobSiteIds?: number[]
}) {
  const service = serviceClient()
  if (formIds.length) await service.from("safety_forms").delete().in("id", formIds)
  if (paths.length) await service.storage.from(PHOTO_BUCKET).remove(paths)
  if (jobSiteIds.length) await service.from("job_sites").delete().in("id", jobSiteIds)
}
