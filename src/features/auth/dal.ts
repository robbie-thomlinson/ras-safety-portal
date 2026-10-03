import "server-only"

import { redirect } from "next/navigation"
import { cache } from "react"

import { UserFacingError } from "@/lib/action-result"
import { createClient } from "@/lib/supabase/server"

import { getUserFromClient, type Role } from "./data"

// Cached per request, so pages, layouts and actions can all call it without extra round trips.
export const getCurrentUser = cache(async () => getUserFromClient(await createClient()))

// For pages and layouts: send signed-out users to log in, and the wrong role home.
export async function requirePageUser(role?: Role) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (role && user.role !== role) redirect("/")
  return user
}

// For server actions, which are public endpoints: fail with an error instead of redirecting.
export async function requireActionUser(role?: Role) {
  const user = await getCurrentUser()
  if (!user) throw new UserFacingError("Your session has expired. Please log in again.")
  if (role && user.role !== role) throw new UserFacingError("You don't have permission to do that.")
  const supabase = await createClient()
  return { user, supabase }
}
