"use client"

import { SearchIcon, SearchXIcon, XIcon } from "lucide-react"
import { useRef, useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { Pagination } from "@/components/pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DEFAULT_PAGE_SIZE, pageHref, pageRange, paginated } from "@/lib/pagination"
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

const PATH = "/sites"

// The filters as URL params, leaving the defaults off.
function filterParams(query: string, status: SiteStatus) {
  return {
    q: query.trim() || undefined,
    status: status === "active" ? undefined : status,
  }
}

// Every site is already loaded (there are few enough), so filtering and paging happen here, with no
// server round trip. Both are still mirrored into the URL so a refresh or Back keeps them.
export function JobSiteList({
  sites,
  initialQuery,
  initialStatus,
  initialPage = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  sites: JobSite[]
  initialQuery: string
  initialStatus: SiteStatus
  initialPage?: number
  pageSize?: number
}) {
  const [query, setQuery] = useState(initialQuery)
  const [status, setStatus] = useState(initialStatus)
  const [requestedPage, setRequestedPage] = useState(initialPage)
  const top = useRef<HTMLDivElement>(null)

  // A new search or status starts again from the first page.
  function change(next: { query?: string; status?: SiteStatus; page?: number }) {
    const q = next.query ?? query
    const s = next.status ?? status
    const p = next.page ?? 1
    setQuery(q)
    setStatus(s)
    setRequestedPage(p)
    // The native history API updates the URL without re-rendering the page on the server.
    window.history.replaceState(null, "", pageHref(PATH, filterParams(q, s), p))
  }

  function changePage(p: number) {
    change({ page: p })
    // Like following a link, a new page starts at the top of the results.
    if (top.current && top.current.getBoundingClientRect().top < 0) top.current.scrollIntoView?.()
  }

  const found = sites.filter((site) => matchesQuery(site, query))
  const shown = found.filter((site) => matchesStatus(site, status))
  // A stale or hand-edited page past the end shows the last page.
  const page = Math.min(requestedPage, Math.max(Math.ceil(shown.length / pageSize), 1))
  const [from, to] = pageRange({ page, pageSize })
  const result = paginated(shown.slice(from, to + 1), shown.length, { page, pageSize })

  return (
    <div ref={top} className="flex scroll-mt-4 flex-col gap-3">
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
        <>
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Name</TableHead>
                  <TableHead className="hidden md:table-cell">Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((site) => (
                  <TableRow key={site.id}>
                    {/* Phones have no room for the address column, so it goes under the name. */}
                    <TableCell
                      className={cn(
                        "pl-4 whitespace-normal",
                        site.archivedAt && "text-muted-foreground",
                      )}
                    >
                      <span className="font-semibold">{site.name}</span>
                      <span className="block text-muted-foreground md:hidden">{site.address}</span>
                    </TableCell>
                    <TableCell className="hidden whitespace-normal text-muted-foreground md:table-cell">
                      {site.address}
                    </TableCell>
                    <TableCell>
                      {site.archivedAt ? (
                        <Badge variant="outline">Archived</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-1">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            result={result}
            pathname={PATH}
            searchParams={filterParams(query, status)}
            onPageChange={changePage}
          />
        </>
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
