import type { Metadata } from "next"

import { PageHeader } from "@/components/page-header"
import { requirePageUser } from "@/features/auth/dal"
import { listJobSites } from "@/features/job-sites/data"
import { SafetyForm } from "@/features/safety-forms/components/safety-form"
import { todayInRasTimeZone } from "@/lib/dates"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "New safety form" }

export default async function NewSubmissionPage() {
  const user = await requirePageUser("framer")
  const sites = await listJobSites(await createClient())

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="New safety form" description="Complete this before starting work at the site." />
      <SafetyForm userId={user.id} jobSites={sites} today={todayInRasTimeZone()} />
    </div>
  )
}
