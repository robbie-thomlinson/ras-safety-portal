import "server-only"

import { UserFacingError } from "@/lib/action-result"
import type { Client } from "@/lib/supabase/types"

import type { JobSiteValues } from "./schemas"

// Archived sites are hidden from the farmer's dropdown but kept for past forms.
export async function listJobSites(supabase: Client, { includeArchived = false } = {}) {
  let query = supabase.from("job_sites").select("id, name, address, archived_at").order("name")
  if (!includeArchived) query = query.is("archived_at", null)

  const { data, error } = await query
  if (error) throw error
  return data.map((site) => ({ id: site.id, name: site.name, address: site.address, archivedAt: site.archived_at }))
}

export type JobSite = Awaited<ReturnType<typeof listJobSites>>[number]

export async function createJobSite(supabase: Client, values: JobSiteValues) {
  const { data, error } = await supabase.from("job_sites").insert(values).select("id").single()
  if (error) throw error
  return data.id
}

export async function updateJobSite(supabase: Client, id: number, values: JobSiteValues) {
  await updateOne(supabase, id, values)
}

export async function setJobSiteArchived(supabase: Client, id: number, archived: boolean) {
  await updateOne(supabase, id, { archived_at: archived ? new Date().toISOString() : null })
}

async function updateOne(
  supabase: Client,
  id: number,
  values: { name?: string; address?: string; archived_at?: string | null }
) {
  const { data, error } = await supabase.from("job_sites").update(values).eq("id", id).select("id")
  if (error) throw error
  // RLS hides rows the user can't update, so "not found" also covers "not allowed".
  if (data.length === 0) throw new UserFacingError("Job site not found.")
}
