import { createBrowserClient } from "@supabase/ssr"

import { env } from "@/lib/env"

import type { Database } from "./database.types"

// Only used to upload photos straight to Storage; everything else goes through server actions.
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )
}
