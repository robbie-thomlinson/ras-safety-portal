import { expect, fillSafetyForm, signedInAs, test } from "./fixtures"

test.use(signedInAs("framer"))

test("shows a message for everything missing", async ({ page }) => {
  await page.goto("/submissions/new")
  await page.getByRole("button", { name: "Submit safety form" }).click()

  const alerts = page.getByRole("alert")
  await expect(alerts.filter({ hasText: "Choose a job site" })).toHaveCount(1)
  await expect(alerts.filter({ hasText: "Answer this checklist item" })).toHaveCount(10)
  await expect(alerts.filter({ hasText: "Add at least one photo" })).toHaveCount(1)
  await expect(page).toHaveURL("/submissions/new")
})

test("submits a form with a photo and shows it back", async ({ page, site }) => {
  await page.goto("/submissions/new")
  await fillSafetyForm(page, { site, noItem: "Ladders inspected", notes: "Ladder tagged out." })
  await page.getByRole("button", { name: "Submit safety form" }).click()

  await expect(page).toHaveURL(/\/submissions\/\d+$/)
  await expect(page.getByText("Safety form submitted")).toBeVisible()
  await expect(page.getByRole("heading", { name: site.name })).toBeVisible()
  await expect(page.getByText("1 item was answered No")).toBeVisible()
  await expect(page.getByText("Ladder tagged out.")).toBeVisible()

  // The photo comes back from Storage through a signed URL, so check it actually loads.
  const photo = page.getByRole("img", { name: "Photo 1" })
  await photo.scrollIntoViewIfNeeded()
  await expect(photo).toHaveJSProperty("naturalWidth", 1)

  await page.getByRole("link", { name: "My forms" }).first().click()
  await expect(page.getByRole("row").filter({ hasText: site.name })).toContainText("Submitted")
})
