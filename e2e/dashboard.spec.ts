import { expect, signedInAs, test } from "./fixtures"
import { createForm, USERS } from "./supabase"

test.describe("admin", () => {
  test.use(signedInAs("admin"))

  test("drops a framer from 'Not submitted today' once they submit", async ({ page, site }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
    const notSubmitted = page
      .locator("[data-slot=card]")
      .filter({ has: page.getByText("Not submitted today", { exact: true }) })
    await expect(notSubmitted).toContainText("Mei Chen")

    await createForm({ workerId: USERS.idleFramer.id, siteId: site.id })
    await page.reload()
    await expect(notSubmitted).not.toContainText("Mei Chen")
  })
})

test.describe("framer", () => {
  test.use(signedInAs("framer"))

  test("shows today's form on the home page", async ({ page, site }) => {
    await createForm({ workerId: USERS.framer.id, siteId: site.id })

    await page.goto("/")
    await expect(page.getByText("You've submitted today's safety form")).toBeVisible()
    await expect(page.getByText(`Submitted for`)).toContainText(site.name)
  })
})
