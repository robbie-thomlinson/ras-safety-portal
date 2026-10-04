import { expect, test, type Page } from "@playwright/test"

import { PASSWORD, USERS } from "./supabase"

async function signIn(page: Page, password = PASSWORD) {
  await page.getByLabel("Email").fill(USERS.signInFramer.email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
}

test("sends signed-out users to log in, then back to the page they asked for", async ({ page }) => {
  await page.goto("/submissions")
  await expect(page).toHaveURL("/login?next=%2Fsubmissions")

  await signIn(page)
  await expect(page).toHaveURL("/submissions")
  await expect(page.getByRole("heading", { name: "My forms" })).toBeVisible()
})

test("rejects a wrong password", async ({ page }) => {
  await page.goto("/login")
  await signIn(page, "not-the-password")
  await expect(page.getByText("Invalid email or password.")).toBeVisible()
  await expect(page).toHaveURL("/login")
})

test("keeps signed-in users off the login page until they sign out", async ({ page }) => {
  await page.goto("/login")
  await signIn(page)
  await expect(page.getByRole("heading", { name: "Hi, Tom" })).toBeVisible()

  await page.goto("/login")
  await expect(page).toHaveURL("/")

  await page.getByRole("button", { name: "Account menu" }).click()
  await page.getByRole("menuitem", { name: "Sign out" }).click()
  await expect(page).toHaveURL("/login")

  await page.goto("/")
  await expect(page).toHaveURL("/login?next=%2F")
})
