import { defineConfig, devices } from "@playwright/test"

import { readLocalSupabase } from "./src/test/local-supabase"

// The app and the tests both point at the local Supabase stack (`npm run db:start`), never a hosted one.
// Workers load this file again but inherit the env set here, so `supabase status` only runs once.
if (!process.env.E2E_SUPABASE_SECRET_KEY) {
  const { url, publishableKey, secretKey } = readLocalSupabase()
  process.env.NEXT_PUBLIC_SUPABASE_URL = url
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = publishableKey
  process.env.E2E_SUPABASE_SECRET_KEY = secretKey
}

const PORT = 3100

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: "auth.setup.ts" },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      testIgnore: "mobile.spec.ts",
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      dependencies: ["setup"],
      testMatch: "mobile.spec.ts",
    },
  ],
  // A production build, as the Next.js testing guide recommends. Port 3100 leaves 3000 free for `npm run dev`.
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
