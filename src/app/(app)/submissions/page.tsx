import { ClipboardListIcon, PlusIcon, SearchXIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { requirePageUser } from "@/features/auth/dal"
import { listJobSites } from "@/features/job-sites/data"
import { listSafetyForms, listWorkers } from "@/features/safety-forms/data"
import { SubmissionFilters } from "@/features/safety-forms/components/submission-filters"
import { SubmissionList } from "@/features/safety-forms/components/submission-list"
import { formFiltersSchema, type FormFilters } from "@/features/safety-forms/schemas"
import { todayInRasTimeZone } from "@/lib/dates"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Submissions" }

export default async function SubmissionsPage({ searchParams }: PageProps<"/submissions">) {
  const user = await requirePageUser()
  const supabase = await createClient()

  if (user.role === "farmer") {
    const forms = await listSafetyForms(supabase)
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
        {forms.length ? (
          <SubmissionList forms={forms} />
        ) : (
          <EmptyState icon={ClipboardListIcon} title="No forms yet" description="Submit your first safety form to see it here." />
        )}
      </>
    )
  }

  const filters = parseFilters(await searchParams)
  const [forms, sites, workers] = await Promise.all([
    listSafetyForms(supabase, filters),
    listJobSites(supabase, { includeArchived: true }),
    listWorkers(supabase),
  ])

  return (
    <>
      <PageHeader title="Submissions" description={`${forms.length} ${forms.length === 1 ? "form" : "forms"}`} />
      <SubmissionFilters filters={filters} sites={sites} workers={workers} today={todayInRasTimeZone()} />
      {forms.length ? (
        <SubmissionList forms={forms} showWorker />
      ) : (
        <EmptyState icon={SearchXIcon} title="No matching forms" description="Try widening the dates or clearing a filter." />
      )}
    </>
  )
}

// A hand-edited URL with a bad filter drops that filter rather than showing an error page.
function parseFilters(params: Record<string, string | string[] | undefined>): FormFilters {
  const raw = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]))
  const parsed = formFiltersSchema.safeParse(raw)
  if (parsed.success) return parsed.data
  for (const issue of parsed.error.issues) delete raw[String(issue.path[0])]
  return formFiltersSchema.safeParse(raw).data ?? {}
}
