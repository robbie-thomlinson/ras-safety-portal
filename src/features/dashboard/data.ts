import "server-only"

import { addDays, todayInRasTimeZone } from "@/lib/dates"
import type { Client } from "@/lib/supabase/types"
import { listJobSites } from "@/features/job-sites/data"
import { CHECKLIST_COLUMNS, listWorkers, toChecklist } from "@/features/safety-forms/data"

import { summarize } from "./summary"

export const SUMMARY_DAYS = 14

export async function getDashboardSummary(supabase: Client, today = todayInRasTimeZone()) {
  const from = addDays(today, -(SUMMARY_DAYS - 1))

  const [forms, awaiting, workers, sites] = await Promise.all([
    supabase
      .from("safety_forms")
      .select(`date, worker_id, job_site_id, ${CHECKLIST_COLUMNS}`)
      .gte("date", from)
      .lte("date", today),
    supabase
      .from("safety_forms")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
    listWorkers(supabase),
    listJobSites(supabase, { includeArchived: true }),
  ])
  if (forms.error) throw forms.error
  if (awaiting.error) throw awaiting.error

  return summarize({
    forms: forms.data.map((f) => ({
      date: f.date,
      workerId: f.worker_id,
      jobSiteId: f.job_site_id,
      checklist: toChecklist(f),
    })),
    workers,
    sites,
    from,
    today,
    awaitingReview: awaiting.count ?? 0,
  })
}
