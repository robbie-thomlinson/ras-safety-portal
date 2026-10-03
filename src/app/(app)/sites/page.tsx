import { MapPinIcon, PlusIcon } from "lucide-react"
import type { Metadata } from "next"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { requirePageUser } from "@/features/auth/dal"
import { ArchiveButton } from "@/features/job-sites/components/archive-button"
import { JobSiteDialog } from "@/features/job-sites/components/job-site-dialog"
import { listJobSites } from "@/features/job-sites/data"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Job sites" }

export default async function SitesPage() {
  await requirePageUser("admin")
  const sites = await listJobSites(await createClient(), { includeArchived: true })
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
        <ul className="divide-y rounded-xl border bg-card">
          {sorted.map((site) => (
            <li key={site.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", site.archivedAt && "opacity-60")}>
                <span className="flex items-center gap-2 font-semibold">
                  {site.name}
                  {site.archivedAt && <Badge variant="outline">Archived</Badge>}
                </span>
                <span className="text-sm text-muted-foreground">{site.address}</span>
              </div>
              <div className="flex gap-1 self-end sm:self-auto">
                <JobSiteDialog
                  site={site}
                  trigger={
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  }
                />
                <ArchiveButton id={site.id} archived={!!site.archivedAt} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={MapPinIcon} title="No job sites" description="Add a site so farmers can submit forms for it." />
      )}
    </>
  )
}
