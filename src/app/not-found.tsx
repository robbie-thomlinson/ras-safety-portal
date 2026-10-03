import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl text-primary">Not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </main>
  )
}
