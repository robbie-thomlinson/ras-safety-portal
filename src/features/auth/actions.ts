"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import type { ActionResult } from "@/lib/action-result"
import { createClient } from "@/lib/supabase/server"

import { safeRedirectPath } from "./redirect"
import { loginSchema } from "./schemas"

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) {
    return { ok: false, error: "Check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    // Same message for unknown email and wrong password, so accounts can't be enumerated.
    const message = error.status === 429 ? "Too many attempts. Please wait and try again." : "Invalid email or password."
    return { ok: false, error: message }
  }

  redirect(safeRedirectPath(formData.get("next")))
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
