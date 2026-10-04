import { ArrowLeftIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { PageHeader } from "@/components/page-header"
import { requirePageUser } from "@/features/auth/dal"
import { getSafetyForm } from "@/features/safety-forms/data"
import { ReviewButton } from "@/features/safety-forms/components/review-button"
import { StatusBadge } from "@/features/safety-forms/components/status-badge"
import { SubmissionDetail } from "@/features/safety-forms/components/submission-detail"
import { formatDate } from "@/lib/dates"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Safety form" }

export default async function SubmissionPage({ params }: PageProps<"/submissions/[id]">) {
  const { id } = await params
  const user = await requirePageUser()

  const formId = Number(id)
  if (!Number.isSafeInteger(formId) || formId <= 0) notFound()
  // RLS returns nothing for another framer's form, so it 404s like a missing one.
  const form = await getSafetyForm(await createClient(), formId)
  if (!form) notFound()

  const isAdmin = user.role === "admin"

  return (
    <>
      <Link
        href="/submissions"
        className="flex w-fit items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        {isAdmin ? "Submissions" : "My forms"}
      </Link>
      <PageHeader
        title={form.jobSite.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {formatDate(form.date)}
            {isAdmin && <> · {form.worker.name}</>}
            <StatusBadge status={form.status} />
          </span>
        }
        actions={isAdmin && <ReviewButton formId={form.id} status={form.status} />}
      />
      <SubmissionDetail form={form} showWorker={isAdmin} />
    </>
  )
}
