"use server"

import { refresh } from "next/cache"
import { z } from "zod"

import { requireActionUser } from "@/features/auth/dal"
import { type ActionResult, toActionError } from "@/lib/action-result"

import { setReviewStatus, submitSafetyForm } from "./data"
import { reviewSchema, safetyFormSchema, type SafetyFormInput } from "./schemas"

// Photos must already be uploaded to Storage; this records the form and attaches them atomically.
export async function submitSafetyFormAction(input: SafetyFormInput): Promise<ActionResult<{ id: number }>> {
  try {
    const { user, supabase } = await requireActionUser("framer")

    const parsed = safetyFormSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: "Check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors }
    }
    if (parsed.data.photoPaths.some((path) => !path.startsWith(`${user.id}/`))) {
      return { ok: false, error: "Invalid photo.", fieldErrors: { photoPaths: ["Invalid photo"] } }
    }

    const id = await submitSafetyForm(supabase, parsed.data)
    refresh()
    return { ok: true, data: { id } }
  } catch (error) {
    return toActionError(error)
  }
}

export async function reviewSafetyFormAction(input: z.input<typeof reviewSchema>): Promise<ActionResult> {
  try {
    const { supabase } = await requireActionUser("admin")
    const { formId, status } = reviewSchema.parse(input)
    await setReviewStatus(supabase, formId, status)
    refresh()
    return { ok: true, data: undefined }
  } catch (error) {
    return toActionError(error)
  }
}
