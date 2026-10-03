import "server-only"

import type { Client } from "@/lib/supabase/types"

export type Role = "farmer" | "admin"

export type CurrentUser = {
  id: string
  email: string
  role: Role
  firstName: string
  lastName: string
}

// Role comes from profiles, the same table RLS checks, so the app and the database agree.
export async function getUserFromClient(supabase: Client): Promise<CurrentUser | null> {
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (error || !claims?.sub) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", claims.sub)
    .single()
  if (!profile) return null

  return {
    id: claims.sub,
    email: claims.email ?? "",
    role: profile.role,
    firstName: profile.first_name,
    lastName: profile.last_name,
  }
}
