import { AppHeader } from "@/components/app-shell/app-header"
import { requirePageUser } from "@/features/auth/dal"

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requirePageUser()

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:py-8">
        {children}
      </main>
    </>
  )
}
