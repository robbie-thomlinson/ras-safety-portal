import { execSync } from "node:child_process"

// Reads URLs and keys from the running local stack, so nothing needs copying into an env file.
export function readLocalSupabase() {
  let status: Record<string, string>
  try {
    status = JSON.parse(
      execSync("npx supabase status -o json", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }),
    )
  } catch {
    throw new Error("Local Supabase isn't running. Start it with `npm run db:start`.")
  }

  const { API_URL: url, PUBLISHABLE_KEY: publishableKey, SECRET_KEY: secretKey } = status
  if (!url || !publishableKey || !secretKey) {
    throw new Error("`supabase status` didn't report the API URL and keys.")
  }
  return { url, publishableKey, secretKey }
}
