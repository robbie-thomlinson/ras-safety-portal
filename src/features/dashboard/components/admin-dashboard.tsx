import {
  CheckCircle2Icon,
  ClipboardListIcon,
  ClockIcon,
  TriangleAlertIcon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/dates"

import { SUMMARY_DAYS } from "../data"
import type { DashboardSummary } from "../summary"
import { PerDayChart, RankedBarChart } from "./charts"

export function AdminDashboard({ summary }: { summary: DashboardSummary }) {
  const { totals, today } = summary
  const range = `${formatDate(summary.from, "short")} – ${formatDate(today, "short")}`
  const submittedCount = totals.workers - summary.notSubmittedToday.length

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={formatDate(today)}
        actions={
          <Button asChild variant="outline">
            <Link href={`/submissions?from=${today}&to=${today}`}>Today&apos;s submissions</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={ClipboardListIcon} label="Forms today" value={totals.submittedToday} />
        <StatCard
          icon={UsersIcon}
          label="Framers submitted today"
          value={`${submittedCount} / ${totals.workers}`}
        />
        <StatCard
          icon={ClockIcon}
          label="Awaiting review"
          value={totals.awaitingReview}
          href={totals.awaitingReview > 0 ? "/submissions?status=submitted" : undefined}
        />
        <StatCard
          icon={TriangleAlertIcon}
          label={`Forms with a No (${SUMMARY_DAYS} days)`}
          value={totals.formsWithIssues}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Forms per day</CardTitle>
            <CardDescription>{range}</CardDescription>
          </CardHeader>
          <CardContent>
            <PerDayChart data={summary.perDay} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Not submitted today</CardTitle>
            <CardDescription>
              {summary.notSubmittedToday.length === 0
                ? "Every framer has submitted a form today."
                : `${summary.notSubmittedToday.length} of ${totals.workers} framers`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.notSubmittedToday.length === 0 ? (
              <p className="flex items-center gap-2 text-sm font-medium text-brand-green-700">
                <CheckCircle2Icon className="size-4" aria-hidden /> All caught up
              </p>
            ) : (
              <ul className="flex flex-col divide-y text-sm">
                {summary.notSubmittedToday.map((worker) => (
                  <li key={worker.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="font-medium">{worker.name}</span>
                    <Link
                      href={`/submissions?workerId=${worker.id}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      History
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Forms per site</CardTitle>
            <CardDescription>{range}</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.perSite.length ? (
              <RankedBarChart data={summary.perSite} labelKey="site" />
            ) : (
              <p className="text-sm text-muted-foreground">No job sites yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Checklist items answered No</CardTitle>
            <CardDescription>{range}</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.missedItems.length ? (
              <RankedBarChart data={summary.missedItems} labelKey="item" />
            ) : (
              <p className="text-sm text-muted-foreground">Every item was answered Yes.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  href?: string
}) {
  const body = (
    <Card className="h-full gap-2 py-4">
      <CardContent className="flex flex-col gap-2 px-4">
        <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
          <Icon className="size-4 shrink-0" />
          {label}
        </span>
        <span className="font-heading text-3xl font-semibold">{value}</span>
      </CardContent>
    </Card>
  )
  return href ? (
    <Link href={href} className="rounded-xl transition-shadow hover:shadow-md">
      {body}
    </Link>
  ) : (
    body
  )
}
