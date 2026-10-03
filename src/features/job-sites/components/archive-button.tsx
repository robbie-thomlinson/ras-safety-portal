"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { setJobSiteArchivedAction } from "../actions"

// Archiving is reversible and keeps past forms intact, so it doesn't need a confirmation step.
export function ArchiveButton({ id, archived }: { id: number; archived: boolean }) {
  const [pending, startTransition] = useTransition()

  function onClick() {
    startTransition(async () => {
      const result = await setJobSiteArchivedAction(id, !archived)
      if (!result.ok) toast.error(result.error)
      else toast.success(archived ? "Job site restored" : "Job site archived")
    })
  }

  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={pending}>
      {archived ? "Restore" : "Archive"}
    </Button>
  )
}
