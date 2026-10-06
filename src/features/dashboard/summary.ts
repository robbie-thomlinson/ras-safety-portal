import { dateRange, formatDate } from "@/lib/dates"
import { CHECKLIST_ITEMS, type ChecklistItem } from "@/features/safety-forms/schemas"

// What the dashboard_summary database function returns for the window.
export type FormCounts = {
  perDay: { date: string; count: number }[]
  perSite: { jobSiteId: number; count: number }[]
  workersToday: string[]
  withIssues: number
  missed: Record<ChecklistItem, number>
}

type Input = {
  counts: FormCounts
  workers: { id: string; name: string }[]
  sites: { id: number; name: string; archivedAt: string | null }[]
  from: string
  today: string
  awaitingReview: number
}

// Turns the last few weeks of form counts into the numbers and chart series on the admin dashboard.
export function summarize({ counts, workers, sites, from, today, awaitingReview }: Input) {
  const perDayCount = new Map(counts.perDay.map((d) => [d.date, d.count]))
  const perSiteCount = new Map(counts.perSite.map((s) => [s.jobSiteId, s.count]))
  const submittedToday = new Set(counts.workersToday)

  const perDay = dateRange(from, today).map((date) => ({
    date,
    label: formatDate(date, "short"),
    count: perDayCount.get(date) ?? 0,
  }))

  // Archived sites only appear if they still had forms in the window.
  const perSite = sites
    .map((site) => ({
      site: site.name,
      count: perSiteCount.get(site.id) ?? 0,
      archived: !!site.archivedAt,
    }))
    .filter((s) => !s.archived || s.count > 0)
    .map(({ site, count }) => ({ site, count }))
    .sort((a, b) => b.count - a.count || a.site.localeCompare(b.site))

  const missedItems = (Object.keys(CHECKLIST_ITEMS) as ChecklistItem[])
    .map((item) => ({
      item: CHECKLIST_ITEMS[item],
      count: counts.missed[item],
    }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count)

  return {
    from,
    today,
    totals: {
      submittedToday: perDayCount.get(today) ?? 0,
      awaitingReview,
      formsWithIssues: counts.withIssues,
      workers: workers.length,
    },
    notSubmittedToday: workers.filter((w) => !submittedToday.has(w.id)),
    perDay,
    perSite,
    missedItems,
  }
}

export type DashboardSummary = ReturnType<typeof summarize>
