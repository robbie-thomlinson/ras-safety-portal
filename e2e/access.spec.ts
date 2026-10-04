import { expect, signedInAs, test } from "./fixtures"
import { createForm, USERS } from "./supabase"

test.describe("framer", () => {
  test.use(signedInAs("framer"))

  test("can't see another framer's form", async ({ page, site }) => {
    const formId = await createForm({ workerId: USERS.otherFramer.id, siteId: site.id })

    await page.goto(`/submissions/${formId}`)
    await expect(page.getByRole("heading", { name: "Not found" })).toBeVisible()

    await page.goto("/submissions")
    await expect(page.getByRole("heading", { name: "My forms" })).toBeVisible()
    await expect(page.getByText(site.name)).toHaveCount(0)
  })

  test("is sent home from admin pages", async ({ page }) => {
    await page.goto("/sites")
    await expect(page).toHaveURL("/")
  })
})

test.describe("admin", () => {
  test.use(signedInAs("admin"))

  test("is sent home from the new form page", async ({ page }) => {
    await page.goto("/submissions/new")
    await expect(page).toHaveURL("/")
  })
})
