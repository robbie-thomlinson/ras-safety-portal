import { expect, test as setup } from "@playwright/test"

import { signedInAs } from "./fixtures"
import { PASSWORD, USERS } from "./supabase"

// Signs in through the real login form once per role and saves the session for the other tests.
for (const role of ["framer", "admin"] as const) {
  setup(`sign in as ${role}`, async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill(USERS[role].email)
    await page.getByLabel("Password").fill(PASSWORD)
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page).toHaveURL("/")
    await page.context().storageState({ path: signedInAs(role).storageState })
  })
}
