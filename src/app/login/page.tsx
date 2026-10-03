import type { Metadata } from "next"
import Image from "next/image"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "@/features/auth/components/login-form"

export const metadata: Metadata = { title: "Sign in" }

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-brand-paper px-4 py-10">
      <Image src="/brand/ras-logo.png" alt="Ron Anderson & Sons Ltd." width={144} height={120} priority />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-primary uppercase">Site Safety</CardTitle>
          <CardDescription>Sign in to submit or review daily safety checklists.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </CardContent>
      </Card>
    </main>
  )
}
