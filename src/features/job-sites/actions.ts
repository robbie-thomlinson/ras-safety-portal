"use server"

import { refresh } from "next/cache"
import { z } from "zod"

import { requireActionUser } from "@/features/auth/dal"
import { type ActionResult, toActionError } from "@/lib/action-result"

import { createJobSite, setJobSiteArchived, updateJobSite } from "./data"
import { jobSiteSchema } from "./schemas"

const idSchema = z.coerce.number().int().positive()

type JobSiteInput = z.input<typeof jobSiteSchema>

export async function createJobSiteAction(
  input: JobSiteInput,
): Promise<ActionResult<{ id: number }>> {
  try {
    const { supabase } = await requireActionUser("admin")
    const parsed = jobSiteSchema.safeParse(input)
    if (!parsed.success) {
      return {
        ok: false,
        error: "Check the highlighted fields.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      }
    }
    const id = await createJobSite(supabase, parsed.data)
    refresh()
    return { ok: true, data: { id } }
  } catch (error) {
    return toActionError(error)
  }
}

export async function updateJobSiteAction(id: number, input: JobSiteInput): Promise<ActionResult> {
  try {
    const { supabase } = await requireActionUser("admin")
    const parsed = jobSiteSchema.safeParse(input)
    if (!parsed.success) {
      return {
        ok: false,
        error: "Check the highlighted fields.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      }
    }
    await updateJobSite(supabase, idSchema.parse(id), parsed.data)
    refresh()
    return { ok: true, data: undefined }
  } catch (error) {
    return toActionError(error)
  }
}

export async function setJobSiteArchivedAction(
  id: number,
  archived: boolean,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireActionUser("admin")
    await setJobSiteArchived(supabase, idSchema.parse(id), z.boolean().parse(archived))
    refresh()
    return { ok: true, data: undefined }
  } catch (error) {
    return toActionError(error)
  }
}
