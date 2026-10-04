import "server-only"

import { UserFacingError } from "@/lib/action-result"
import { DEFAULT_PAGE_SIZE, pageRange, paginated, type PageRequest } from "@/lib/pagination"
import type { Tables } from "@/lib/supabase/database.types"
import type { Client } from "@/lib/supabase/types"

import { MAX_PHOTOS, PHOTO_BUCKET } from "./photos"
import type { ChecklistItem, FormFilters, SafetyFormValues } from "./schemas"

// Signed photo URLs last long enough to view a submission, not to share one around.
const PHOTO_URL_TTL_SECONDS = 60 * 60

// Errors raised by submit_safety_form, mapped to messages the farmer can act on.
const SUBMIT_ERRORS: Record<string, string> = {
  not_authenticated: "Your session has expired. Please log in again.",
  farmers_only: "Only farmers can submit safety forms.",
  invalid_job_site: "That job site isn't available. Choose another.",
  invalid_date: "Date can't be in the future.",
  invalid_photo_count: `Add between 1 and ${MAX_PHOTOS} photos.`,
  invalid_photos: "Some photos didn't finish uploading. Remove them and try again.",
}

export async function submitSafetyForm(supabase: Client, values: SafetyFormValues) {
  const { data, error } = await supabase.rpc("submit_safety_form", {
    p_job_site_id: values.jobSiteId,
    p_date: values.date,
    p_hard_hat_worn: values.hardHatWorn,
    p_vest_worn: values.vestWorn,
    p_boots_worn: values.bootsWorn,
    p_eye_protection_worn: values.eyeProtectionWorn,
    p_fall_protection_inspected: values.fallProtectionInspected,
    p_scaffolding_inspected: values.scaffoldingInspected,
    p_ladders_inspected: values.laddersInspected,
    p_tools_inspected: values.toolsInspected,
    p_cords_inspected: values.cordsInspected,
    p_hazards_identified: values.hazardsIdentified,
    p_notes: values.notes ?? "",
    p_photo_paths: values.photoPaths,
  })

  if (error) {
    if (SUBMIT_ERRORS[error.message]) throw new UserFacingError(SUBMIT_ERRORS[error.message])
    if (error.code === "23505") throw new UserFacingError("Those photos are already attached to another form.")
    throw error
  }
  return data
}

// The stamp_review trigger fills in who reviewed it and when.
export async function setReviewStatus(supabase: Client, formId: number, status: "submitted" | "reviewed") {
  const { data, error } = await supabase.from("safety_forms").update({ status }).eq("id", formId).select("id")
  if (error) throw error
  if (data.length === 0) throw new UserFacingError("Safety form not found.")
}

const LIST_COLUMNS = `
  id, date, status, created_at,
  job_site:job_sites (id, name),
  worker:profiles!safety_forms_worker_id_fkey (id, first_name, last_name)
`

// RLS limits farmers to their own forms, so the same query serves both dashboards.
// An exact count is cheap at tens of thousands of rows, and gives the "of N" and last page.
function selectForms(supabase: Client, filters: FormFilters, { head = false } = {}) {
  let query = supabase.from("safety_forms").select(LIST_COLUMNS, { count: "exact", head })
  if (filters.jobSiteId) query = query.eq("job_site_id", filters.jobSiteId)
  if (filters.workerId) query = query.eq("worker_id", filters.workerId)
  if (filters.from) query = query.gte("date", filters.from)
  if (filters.to) query = query.lte("date", filters.to)
  if (filters.status) query = query.eq("status", filters.status)
  return query
}

export async function listSafetyForms(
  supabase: Client,
  filters: FormFilters = {},
  { page = 1, pageSize = DEFAULT_PAGE_SIZE }: Partial<PageRequest> = {}
) {
  // id breaks ties so no form is repeated or skipped between pages.
  const { data, count, error } = await selectForms(supabase, filters)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(...pageRange({ page, pageSize }))

  // PostgREST refuses a page past the end; return it empty with the real total so the caller can redirect.
  if (error?.code === "PGRST103") {
    const { count, error } = await selectForms(supabase, filters, { head: true })
    if (error) throw error
    return paginated([], count ?? 0, { page, pageSize })
  }
  if (error) throw error

  const items = data.map((form) => ({
    id: form.id,
    date: form.date,
    status: form.status,
    createdAt: form.created_at,
    jobSite: form.job_site,
    worker: {
      id: form.worker.id,
      name: `${form.worker.first_name} ${form.worker.last_name}`.trim(),
    },
  }))
  return paginated(items, count ?? 0, { page, pageSize })
}

export type SafetyFormListItem = Awaited<ReturnType<typeof listSafetyForms>>["items"][number]

const DETAIL_COLUMNS = `
  *,
  job_site:job_sites (id, name, address),
  worker:profiles!safety_forms_worker_id_fkey (id, first_name, last_name),
  reviewer:profiles!safety_forms_reviewed_by_fkey (first_name, last_name),
  photos:safety_form_photos (id, path, content_type)
`

// Returns null when the form doesn't exist or the user can't see it; the two look the same.
export async function getSafetyForm(supabase: Client, id: number) {
  const { data: form, error } = await supabase.from("safety_forms").select(DETAIL_COLUMNS).eq("id", id).maybeSingle()
  if (error) throw error
  if (!form) return null

  const paths = form.photos.map((photo) => photo.path)
  const { data: signed, error: signError } = paths.length
    ? await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, PHOTO_URL_TTL_SECONDS)
    : { data: [], error: null }
  if (signError) throw signError
  const urls = new Map(signed.map((s) => [s.path, s.signedUrl]))

  return {
    id: form.id,
    date: form.date,
    status: form.status,
    createdAt: form.created_at,
    jobSite: form.job_site,
    worker: {
      id: form.worker.id,
      name: `${form.worker.first_name} ${form.worker.last_name}`.trim(),
    },
    checklist: toChecklist(form),
    notes: form.notes,
    // Farmers can't read other profiles, so they see that a form was reviewed but not by whom.
    review: form.reviewed_at
      ? {
          reviewedAt: form.reviewed_at,
          reviewerName: form.reviewer ? `${form.reviewer.first_name} ${form.reviewer.last_name}`.trim() : null,
        }
      : null,
    photos: form.photos.map((photo) => ({
      id: photo.id,
      contentType: photo.content_type,
      url: urls.get(photo.path) ?? null,
    })),
  }
}

export type SafetyFormDetail = NonNullable<Awaited<ReturnType<typeof getSafetyForm>>>

export const CHECKLIST_COLUMNS = `
  hard_hat_worn, vest_worn, boots_worn, eye_protection_worn,
  fall_protection_inspected, scaffolding_inspected, ladders_inspected,
  tools_inspected, cords_inspected, hazards_identified
`

type ChecklistRow = Pick<
  Tables<"safety_forms">,
  | "hard_hat_worn"
  | "vest_worn"
  | "boots_worn"
  | "eye_protection_worn"
  | "fall_protection_inspected"
  | "scaffolding_inspected"
  | "ladders_inspected"
  | "tools_inspected"
  | "cords_inspected"
  | "hazards_identified"
>

export function toChecklist(row: ChecklistRow): Record<ChecklistItem, boolean> {
  return {
    hardHatWorn: row.hard_hat_worn,
    vestWorn: row.vest_worn,
    bootsWorn: row.boots_worn,
    eyeProtectionWorn: row.eye_protection_worn,
    fallProtectionInspected: row.fall_protection_inspected,
    scaffoldingInspected: row.scaffolding_inspected,
    laddersInspected: row.ladders_inspected,
    toolsInspected: row.tools_inspected,
    cordsInspected: row.cords_inspected,
    hazardsIdentified: row.hazards_identified,
  }
}

// For the admin worker filter.
export async function listWorkers(supabase: Client) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("role", "farmer")
    .order("last_name")
    .order("first_name")
  if (error) throw error
  return data.map((p) => ({ id: p.id, name: `${p.first_name} ${p.last_name}`.trim() }))
}
