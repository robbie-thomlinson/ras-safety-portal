import { dateRange, formatDate } from "@/lib/dates"
import { CHECKLIST_ITEMS, type ChecklistItem } from "@/features/safety-forms/schemas"

export type SummaryForm = {
  date: string
  workerId: string
  jobSiteId: number
  checklist: Record<ChecklistItem, boolean>
}

type Input = {
  forms: SummaryForm[]
  workers: { id: string; name: string }[]
  sites: { id: number; name: string; archivedAt: string | null }[]
  from: string
  today: string
  awaitingReview: number
}

// Turns the last few weeks of forms into the numbers and chart series on the admin dashboard.
export function summarize({ forms, workers, sites, from, today, awaitingReview }: Input) {
  const todaysForms = forms.filter((f) => f.date === today)
  const submittedToday = new Set(todaysForms.map((f) => f.workerId))

  const perDay = dateRange(from, today).map((date) => ({
    date,
    label: formatDate(date, "short"),
    count: forms.filter((f) => f.date === date).length,
  }))

  // Archived sites only appear if they still had forms in the window.
  const perSite = sites
    .map((site) => ({
      site: site.name,
      count: forms.filter((f) => f.jobSiteId === site.id).length,
      archived: !!site.archivedAt,
    }))
    .filter((s) => !s.archived || s.count > 0)
    .map(({ site, count }) => ({ site, count }))
    .sort((a, b) => b.count - a.count || a.site.localeCompare(b.site))

  const missedItems = (Object.keys(CHECKLIST_ITEMS) as ChecklistItem[])
    .map((item) => ({
      item: CHECKLIST_ITEMS[item],
      count: forms.filter((f) => !f.checklist[item]).length,
    }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count)

  return {
    from,
    today,
    totals: {
      submittedToday: todaysForms.length,
      awaitingReview,
      formsWithIssues: forms.filter((f) => Object.values(f.checklist).includes(false)).length,
      workers: workers.length,
    },
    notSubmittedToday: workers.filter((w) => !submittedToday.has(w.id)),
    perDay,
    perSite,
    missedItems,
  }
}

export type DashboardSummary = ReturnType<typeof summarize>
