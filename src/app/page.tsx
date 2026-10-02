import Image from "next/image"

import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <Image src="/brand/ras-logo.png" alt="Ron Anderson & Sons Ltd." width={180} height={150} priority />
      <h1 className="text-4xl text-primary">Site Safety</h1>
      <p className="max-w-sm text-muted-foreground">
        Daily safety checklists for RAS job sites.
      </p>
      <Button size="lg">Get started</Button>
    </main>
  )
}
