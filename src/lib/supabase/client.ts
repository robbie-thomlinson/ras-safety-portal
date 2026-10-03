import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "./database.types"

// Only used to upload photos straight to Storage; everything else goes through server actions.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
