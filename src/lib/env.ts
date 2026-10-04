import { z } from "zod"

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
})

// Fails fast with a readable message instead of an obscure Supabase error. Each variable is
// referenced in full because Next only inlines literal `process.env.NEXT_PUBLIC_*` reads.
const result = schema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
})
if (!result.success) {
  throw new Error(
    `Invalid environment variables (see .env.example):\n${z.prettifyError(result.error)}`,
  )
}

export const env = result.data
