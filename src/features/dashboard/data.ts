import "server-only"

import { addDays, todayInRasTimeZone } from "@/lib/dates"
import type { Client } from "@/lib/supabase/types"
import { listJobSites } from "@/features/job-sites/data"
import { listWorkers } from "@/features/safety-forms/data"

import { type FormCounts, summarize } from "./summary"

export const SUMMARY_DAYS = 14

export async function getDashboardSummary(supabase: Client, today = todayInRasTimeZone()) {
  const from = addDays(today, -(SUMMARY_DAYS - 1))

  // Counted in Postgres: fetching the rows would hit PostgREST's 1,000-row cap on a busy fortnight.
  const [counts, awaiting, workers, sites] = await Promise.all([
    supabase.rpc("dashboard_summary", { p_from: from, p_to: today }),
    supabase
      .from("safety_forms")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
    listWorkers(supabase),
    listJobSites(supabase, { includeArchived: true }),
  ])
  if (counts.error) throw counts.error
  if (awaiting.error) throw awaiting.error

  return summarize({
    counts: counts.data as FormCounts,
    workers,
    sites,
    from,
    today,
    awaitingReview: awaiting.count ?? 0,
  })
}
