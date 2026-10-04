import { CheckCircle2Icon, ClipboardListIcon, PlusIcon } from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { CurrentUser } from "@/features/auth/data"
import type { SafetyFormListItem } from "@/features/safety-forms/data"
import { SubmissionList } from "@/features/safety-forms/components/submission-list"
import { formatDate } from "@/lib/dates"

export function FramerHome({
  user,
  today,
  todaysForms,
  recentForms,
}: {
  user: CurrentUser
  today: string
  todaysForms: SafetyFormListItem[]
  recentForms: SafetyFormListItem[]
}) {
  const done = todaysForms.length > 0

  return (
    <>
      <PageHeader title={`Hi, ${user.firstName}`} description={formatDate(today)} />

      <Card className={done ? "border-success/40 bg-secondary" : "border-warning bg-warning/10"}>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {done ? (
              <CheckCircle2Icon className="mt-0.5 size-6 shrink-0 text-success" aria-hidden />
            ) : (
              <ClipboardListIcon className="mt-0.5 size-6 shrink-0" aria-hidden />
            )}
            <div className="flex flex-col gap-0.5">
              <p className="font-semibold">
                {done ? "You've submitted today's safety form" : "Today's safety form isn't done yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {done
                  ? `Submitted for ${todaysForms.map((f) => f.jobSite.name).join(", ")}. Working at another site? Submit one for it too.`
                  : "Fill it in before you start work at each job site."}
              </p>
            </div>
          </div>
          <Button asChild size="lg" variant={done ? "outline" : "default"} className="h-11 sm:h-9">
            <Link href="/submissions/new">
              <PlusIcon data-icon="inline-start" />
              New safety form
            </Link>
          </Button>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Recent forms</h2>
          {recentForms.length > 0 && (
            <Link href="/submissions" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          )}
        </div>
        {recentForms.length ? (
          <SubmissionList forms={recentForms} />
        ) : (
          <EmptyState icon={ClipboardListIcon} title="No forms yet" description="Your submitted forms will show up here." />
        )}
      </section>
    </>
  )
}
