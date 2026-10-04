import { execSync } from "node:child_process"

import type { TestProject } from "vitest/node"

declare module "vitest" {
  export interface ProvidedContext {
    supabase: { url: string; publishableKey: string; secretKey: string }
  }
}

// Reads URLs and keys from the running local stack, so nothing needs copying into an env file.
export default function setup(project: TestProject) {
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

  project.provide("supabase", {
    url: status.API_URL,
    publishableKey: status.PUBLISHABLE_KEY,
    secretKey: status.SECRET_KEY,
  })
}
