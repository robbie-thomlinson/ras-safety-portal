import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "./database.types"

// Data functions take the client as an argument so tests can pass one signed in as a seeded user.
export type Client = SupabaseClient<Database>
