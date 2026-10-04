import { test as base, expect, type Page } from "@playwright/test"

import { CHECKLIST_ITEMS } from "../src/features/safety-forms/schemas"
import { createSite, deleteSites, PNG, type Site } from "./supabase"

export { expect }

// Saved by auth.setup.ts, so most tests start signed in.
export function signedInAs(role: "framer" | "admin") {
  return { storageState: `e2e/.auth/${role}.json` }
}

// `site` is a fresh job site for the test, deleted afterwards with any forms submitted for it.
export const test = base.extend<{ site: Site }>({
  // Playwright requires the first argument to be destructured, even when no fixtures are used.
  site: async ({}, use) => {
    const site = await createSite()
    await use(site)
    await deleteSites([site.id])
  },
})

// Fills in a safety form on /submissions/new, answering No to `noItem` and Yes to everything else.
export async function fillSafetyForm(
  page: Page,
  { site, noItem, notes }: { site: Site; noItem?: string; notes?: string },
) {
  await page.getByLabel("Job site").selectOption({ label: site.name })
  for (const item of Object.values(CHECKLIST_ITEMS)) {
    await page
      .getByRole("radiogroup", { name: item })
      .getByRole("radio", { name: item === noItem ? "No" : "Yes" })
      .click()
  }
  if (notes) await page.getByLabel("Notes").fill(notes)
  await page
    .getByLabel("Add photos")
    .setInputFiles({ name: "site.png", mimeType: "image/png", buffer: PNG })
  await expect(page.getByRole("img", { name: "site.png" })).toBeVisible()
}
