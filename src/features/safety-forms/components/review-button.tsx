"use client"

import { CheckIcon, RotateCcwIcon } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { Enums } from "@/lib/supabase/database.types"

import { reviewSafetyFormAction } from "../actions"

export function ReviewButton({ formId, status }: { formId: number; status: Enums<"form_status"> }) {
  const [pending, startTransition] = useTransition()
  const next = status === "reviewed" ? "submitted" : "reviewed"

  function onClick() {
    startTransition(async () => {
      const result = await reviewSafetyFormAction({ formId, status: next })
      if (!result.ok) toast.error(result.error)
      else toast.success(next === "reviewed" ? "Marked as reviewed" : "Marked as not reviewed")
    })
  }

  return next === "reviewed" ? (
    <Button onClick={onClick} disabled={pending} size="lg">
      <CheckIcon data-icon="inline-start" />
      {pending ? "Saving…" : "Mark as reviewed"}
    </Button>
  ) : (
    <Button onClick={onClick} disabled={pending} size="lg" variant="outline">
      <RotateCcwIcon data-icon="inline-start" />
      {pending ? "Saving…" : "Mark as not reviewed"}
    </Button>
  )
}
