import { ChevronRightIcon } from "lucide-react"
import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/dates"

import type { SafetyFormListItem } from "../data"
import { StatusBadge } from "./status-badge"

// A table on wider screens and tappable rows on phones. Admins also see who submitted each form.
export function SubmissionList({
  forms,
  showWorker = false,
}: {
  forms: SafetyFormListItem[]
  showWorker?: boolean
}) {
  return (
    <>
      <ul className="divide-y rounded-xl border bg-card md:hidden">
        {forms.map((form) => (
          <li key={form.id}>
            <Link
              href={`/submissions/${form.id}`}
              className="flex items-center gap-3 p-4 active:bg-muted"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate font-semibold">{form.jobSite.name}</span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(form.date)}
                  {showWorker && ` · ${form.worker.name}`}
                </span>
              </div>
              <StatusBadge status={form.status} />
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Date</TableHead>
              {showWorker && <TableHead>Worker</TableHead>}
              <TableHead>Job site</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4">
                <span className="sr-only">Open</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.map((form) => (
              <TableRow key={form.id} className="relative">
                <TableCell className="pl-4">{formatDate(form.date)}</TableCell>
                {showWorker && <TableCell className="font-medium">{form.worker.name}</TableCell>}
                <TableCell>{form.jobSite.name}</TableCell>
                <TableCell>
                  <StatusBadge status={form.status} />
                </TableCell>
                <TableCell className="pr-4 text-right">
                  {/* The link's ::after covers the row, so the whole row is clickable. */}
                  <Link
                    href={`/submissions/${form.id}`}
                    className="text-sm font-semibold text-primary after:absolute after:inset-0 hover:underline"
                  >
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
