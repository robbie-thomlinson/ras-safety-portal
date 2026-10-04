import { requirePageUser } from "@/features/auth/dal"
import { AdminDashboard } from "@/features/dashboard/components/admin-dashboard"
import { FramerHome } from "@/features/dashboard/components/framer-home"
import { getDashboardSummary } from "@/features/dashboard/data"
import { listSafetyForms } from "@/features/safety-forms/data"
import { todayInRasTimeZone } from "@/lib/dates"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const user = await requirePageUser()
  const supabase = await createClient()
  const today = todayInRasTimeZone()

  if (user.role === "admin") {
    return <AdminDashboard summary={await getDashboardSummary(supabase, today)} />
  }

  const [recent, todays] = await Promise.all([
    listSafetyForms(supabase, {}, { pageSize: 5 }),
    listSafetyForms(supabase, { from: today, to: today }),
  ])
  return <FramerHome user={user} today={today} todaysForms={todays.items} recentForms={recent.items} />
}
