import { todayInRasTimeZone } from "../src/lib/dates"
import { expect, signedInAs, test } from "./fixtures"
import { createForm, USERS } from "./supabase"

test.use(signedInAs("admin"))

test("filters submissions by site, worker and date", async ({ page, site }) => {
  await createForm({ workerId: USERS.framer.id, siteId: site.id })

  await page.goto("/submissions")
  await page.getByRole("combobox", { name: "Job site" }).fill(site.name)
  await page.getByRole("option", { name: site.name }).click()
  await expect(page).toHaveURL(`/submissions?jobSiteId=${site.id}`)
  await expect(page.getByText("Found 1 form matching your filters")).toBeVisible()
  await expect(page.getByRole("row").filter({ hasText: site.name })).toContainText("Frank Framer")

  await page.getByRole("combobox", { name: "Worker" }).fill("Priya")
  await page.getByRole("option", { name: "Priya Sandhu" }).click()
  await expect(page.getByText("No matching forms")).toBeVisible()

  await page.getByRole("button", { name: "Clear all" }).click()
  await expect(page).toHaveURL("/submissions")

  // The date range picker has its own component tests; here, check the server applies the range.
  const today = todayInRasTimeZone()
  await page.goto(`/submissions?jobSiteId=${site.id}&from=${today}&to=${today}`)
  await expect(page.getByText("Found 1 form matching your filters")).toBeVisible()
  await page.goto(`/submissions?jobSiteId=${site.id}&from=2020-01-01&to=2020-01-31`)
  await expect(page.getByText("No matching forms")).toBeVisible()
})

test("opens a submission and marks it reviewed", async ({ page, site }) => {
  await createForm({ workerId: USERS.framer.id, siteId: site.id })

  await page.goto(`/submissions?jobSiteId=${site.id}`)
  await page.getByRole("link", { name: "View" }).click()
  await expect(page.getByRole("heading", { name: site.name })).toBeVisible()
  await expect(page.getByText("Frank Framer").first()).toBeVisible()
  await expect(page.getByRole("img", { name: "Photo 1" })).toBeVisible()

  await page.getByRole("button", { name: "Mark as reviewed" }).click()
  await expect(page.getByText("Marked as reviewed")).toBeVisible()
  await expect(page.getByText(/by Alex Admin$/)).toBeVisible()

  await page.getByRole("button", { name: "Mark as not reviewed" }).click()
  await expect(page.getByText("Marked as not reviewed")).toBeVisible()
  await expect(page.getByRole("button", { name: "Mark as reviewed" })).toBeVisible()
  await expect(page.getByText(/by Alex Admin$/)).toHaveCount(0)
})
