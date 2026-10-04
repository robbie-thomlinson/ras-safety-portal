import { expect, signedInAs, test } from "./fixtures"
import { uniqueSiteName } from "./supabase"

test.use(signedInAs("admin"))

test("adds a site, and archiving it hides it from new forms", async ({ page, browser }) => {
  // Not the `site` fixture: this test creates its site through the UI. The global sweep deletes it.
  const name = uniqueSiteName()
  const framer = await (await browser.newContext(signedInAs("framer"))).newPage()
  const framerSiteOptions = framer.getByLabel("Job site").getByRole("option", { name })

  await page.goto("/sites")
  await page.getByRole("button", { name: "Add job site" }).click()
  await page.getByLabel("Name").fill(name)
  await page.getByLabel("Address").fill("2 Test Rd, Saanichton, BC")
  await page.getByRole("button", { name: "Add site" }).click()
  await expect(page.getByText("Job site added")).toBeVisible()

  await page.getByLabel("Search job sites").fill(name)
  const row = page.getByRole("row").filter({ hasText: name })
  await expect(row).toContainText("Active")
  await framer.goto("/submissions/new")
  await expect(framerSiteOptions).toHaveCount(1)

  await row.getByRole("button", { name: "Archive" }).click()
  await expect(page.getByText("Job site archived")).toBeVisible()
  await framer.reload()
  await expect(framerSiteOptions).toHaveCount(0)

  await page.getByLabel("Status").selectOption("archived")
  await row.getByRole("button", { name: "Restore" }).click()
  await expect(page.getByText("Job site restored")).toBeVisible()
  await framer.reload()
  await expect(framerSiteOptions).toHaveCount(1)
  await framer.context().close()
})
