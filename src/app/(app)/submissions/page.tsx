import { ClipboardListIcon, PlusIcon, SearchXIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { requirePageUser } from "@/features/auth/dal"
import { listJobSites } from "@/features/job-sites/data"
import { listSafetyForms, listWorkers } from "@/features/safety-forms/data"
import { SubmissionFilters } from "@/features/safety-forms/components/submission-filters"
import { SubmissionList } from "@/features/safety-forms/components/submission-list"
import { formFiltersSchema, type FormFilters } from "@/features/safety-forms/schemas"
import { todayInRasTimeZone } from "@/lib/dates"
import { pageHref, parsePage, type Paginated } from "@/lib/pagination"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Submissions" }

const PATH = "/submissions"

type SearchParams = Record<string, string | string[] | undefined>

export default async function SubmissionsPage({ searchParams }: PageProps<"/submissions">) {
  const user = await requirePageUser()
  const supabase = await createClient()
  const params = await searchParams
  const page = parsePage(params.page)

  if (user.role === "farmer") {
    const forms = await listSafetyForms(supabase, {}, { page })
    redirectPastLastPage(forms, params)
    return (
      <>
        <PageHeader
          title="My forms"
          description="Every safety form you've submitted."
          actions={
            <Button asChild size="lg">
              <Link href="/submissions/new">
                <PlusIcon data-icon="inline-start" />
                New safety form
              </Link>
            </Button>
          }
        />
        {forms.total ? (
          <>
            <SubmissionList forms={forms.items} />
            <Pagination result={forms} pathname={PATH} searchParams={params} />
          </>
        ) : (
          <EmptyState icon={ClipboardListIcon} title="No forms yet" description="Submit your first safety form to see it here." />
        )}
      </>
    )
  }

  const filters = parseFilters(params)
  const [forms, sites, workers] = await Promise.all([
    listSafetyForms(supabase, filters, { page }),
    listJobSites(supabase, { includeArchived: true }),
    listWorkers(supabase),
  ])
  redirectPastLastPage(forms, params)

  return (
    <>
      <PageHeader title="Submissions" />
      <SubmissionFilters filters={filters} sites={sites} workers={workers} today={todayInRasTimeZone()} />
      {forms.total ? (
        <>
          {/* The count sits on the results, where the eye lands after changing a filter. */}
          <div className="flex flex-col gap-2">
            <ResultCount total={forms.total} filtered={Object.values(filters).some(Boolean)} />
            <SubmissionList forms={forms.items} showWorker />
          </div>
          <Pagination result={forms} pathname={PATH} searchParams={params} />
        </>
      ) : (
        <EmptyState icon={SearchXIcon} title="No matching forms" description="Try widening the dates or clearing a filter." />
      )}
    </>
  )
}

function ResultCount({ total, filtered }: { total: number; filtered: boolean }) {
  const count = (
    <span className="font-semibold text-foreground">
      {total.toLocaleString("en-CA")} {total === 1 ? "form" : "forms"}
    </span>
  )
  return (
    <p className="text-sm text-muted-foreground">
      {filtered ? <>Found {count} matching your filters</> : <>{count} in total</>}
    </p>
  )
}

// A stale or hand-edited page number past the end goes to the last page (or the first, if nothing matches).
function redirectPastLastPage(result: Paginated<unknown>, params: SearchParams) {
  if (result.page > Math.max(result.pageCount, 1)) redirect(pageHref(PATH, params, result.pageCount))
}

// A hand-edited URL with a bad filter drops that filter rather than showing an error page.
function parseFilters(params: SearchParams): FormFilters {
  const raw = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]))
  const parsed = formFiltersSchema.safeParse(raw)
  if (parsed.success) return parsed.data
  for (const issue of parsed.error.issues) delete raw[String(issue.path[0])]
  return formFiltersSchema.safeParse(raw).data ?? {}
}
