"use client"

import { SearchIcon, SearchXIcon, XIcon } from "lucide-react"
import { useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { cn } from "@/lib/utils"

import type { JobSite } from "../data"
import { matchesQuery, matchesStatus, SITE_STATUSES, type SiteStatus } from "../filter"
import { ArchiveButton } from "./archive-button"
import { JobSiteDialog } from "./job-site-dialog"

const STATUS_LABELS: Record<SiteStatus, string> = {
  active: "Active",
  archived: "Archived",
  all: "All sites",
}

// Every site is already loaded (there are few enough), so filtering happens here as you type, with no
// server round trip. The search is still mirrored into the URL so a refresh or Back keeps it.
export function JobSiteList({
  sites,
  initialQuery,
  initialStatus,
}: {
  sites: JobSite[]
  initialQuery: string
  initialStatus: SiteStatus
}) {
  const [query, setQuery] = useState(initialQuery)
  const [status, setStatus] = useState(initialStatus)

  function change(next: { query?: string; status?: SiteStatus }) {
    const q = next.query ?? query
    const s = next.status ?? status
    setQuery(q)
    setStatus(s)
    const params = new URLSearchParams()
    if (q.trim()) params.set("q", q.trim())
    if (s !== "active") params.set("status", s)
    // The native history API updates the URL without re-rendering the page on the server.
    window.history.replaceState(null, "", params.size ? `?${params}` : window.location.pathname)
  }

  const found = sites.filter((site) => matchesQuery(site, query))
  const shown = found.filter((site) => matchesStatus(site, status))

  return (
    <div className="flex flex-col gap-3">
      <div role="search" className="flex flex-col gap-2 sm:flex-row">
        <InputGroup className="h-9 bg-card sm:flex-1">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search job sites"
            placeholder="Search by name or address"
            value={query}
            onChange={(e) => change({ query: e.target.value })}
            onKeyDown={(e) => e.key === "Escape" && change({ query: "" })}
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label="Clear"
                className="text-muted-foreground"
                onClick={() => change({ query: "" })}
              >
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <NativeSelect
          aria-label="Status"
          className="w-full bg-card sm:w-44 [&>select]:h-9"
          value={status}
          onChange={(e) => change({ status: e.target.value as SiteStatus })}
        >
          {/* Counts follow the search, so a match hiding under another status is easy to spot. */}
          {SITE_STATUSES.map((s) => (
            <NativeSelectOption key={s} value={s}>
              {STATUS_LABELS[s]} ({found.filter((site) => matchesStatus(site, s)).length})
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {shown.length ? (
        <ul className="divide-y rounded-xl border bg-card">
          {shown.map((site) => (
            <li key={site.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div
                className={cn(
                  "flex min-w-0 flex-1 flex-col gap-0.5",
                  site.archivedAt && "opacity-60",
                )}
              >
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
        <EmptyState
          icon={SearchXIcon}
          title="No matching sites"
          description={
            found.length
              ? "Sites match your search, but none with this status."
              : "Try a different name or address."
          }
        >
          {found.length ? (
            <Button variant="outline" onClick={() => change({ status: "all" })}>
              Show all sites
            </Button>
          ) : (
            <Button variant="outline" onClick={() => change({ query: "" })}>
              Clear search
            </Button>
          )}
        </EmptyState>
      )}
    </div>
  )
}
