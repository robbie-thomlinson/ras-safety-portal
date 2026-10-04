import { expect, fillSafetyForm, signedInAs, test } from "./fixtures"

test.use(signedInAs("framer"))

test("submits a safety form from a phone", async ({ page, site }) => {
  await page.goto("/")
  await page.getByRole("link", { name: "My forms" }).click()
  await page.getByRole("link", { name: "New safety form" }).click()

  await fillSafetyForm(page, { site })
  await page.getByRole("button", { name: "Submit safety form" }).click()
  await expect(page.getByRole("heading", { name: site.name })).toBeVisible()

  // Phones get a list of tappable links instead of the table.
  await page.getByRole("link", { name: "My forms" }).first().click()
  await expect(page.getByRole("link").filter({ hasText: site.name })).toBeVisible()
})
