import { MapPinIcon, PlusIcon } from "lucide-react"
import type { Metadata } from "next"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { requirePageUser } from "@/features/auth/dal"
import { JobSiteDialog } from "@/features/job-sites/components/job-site-dialog"
import { JobSiteList } from "@/features/job-sites/components/job-site-list"
import { listJobSites } from "@/features/job-sites/data"
import { parseSiteStatus } from "@/features/job-sites/filter"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Job sites" }

export default async function SitesPage({ searchParams }: PageProps<"/sites">) {
  await requirePageUser("admin")
  const [sites, params] = await Promise.all([
    listJobSites(await createClient(), { includeArchived: true }),
    searchParams,
  ])
  // Active sites first, then archived, each alphabetical (the query already sorts by name).
  const sorted = [...sites].sort((a, b) => Number(!!a.archivedAt) - Number(!!b.archivedAt))

  return (
    <>
      <PageHeader
        title="Job sites"
        description="Archived sites are hidden from new forms but kept on past ones."
        actions={
          <JobSiteDialog
            trigger={
              <Button size="lg">
                <PlusIcon data-icon="inline-start" />
                Add job site
              </Button>
            }
          />
        }
      />
      {sorted.length ? (
        <JobSiteList
          sites={sorted}
          initialQuery={firstValue(params.q) ?? ""}
          initialStatus={parseSiteStatus(firstValue(params.status))}
        />
      ) : (
        <EmptyState
          icon={MapPinIcon}
          title="No job sites"
          description="Add a site so framers can submit forms for it."
        />
      )}
    </>
  )
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
