import { afterAll, describe, expect, it } from "vitest"

import { anonClient, serviceClient, signIn, USERS } from "@/test/supabase"

import { getUserFromClient } from "./data"

describe("getUserFromClient", () => {
  it("returns the farmer with their role from profiles", async () => {
    const user = await getUserFromClient(await signIn("farmer"))
    expect(user).toEqual({
      id: USERS.farmer.id,
      email: USERS.farmer.email,
      role: "farmer",
      firstName: "Frank",
      lastName: "Farmer",
    })
  })

  it("returns the admin role", async () => {
    expect((await getUserFromClient(await signIn("admin")))?.role).toBe("admin")
  })

  it("returns null when signed out", async () => {
    expect(await getUserFromClient(anonClient())).toBeNull()
  })

  it("rejects a wrong password", async () => {
    const { error } = await anonClient().auth.signInWithPassword({ email: USERS.farmer.email, password: "wrong" })
    expect(error).not.toBeNull()
  })
})

// The auth server inserts the user, then sets app_metadata in a separate update, so the role
// isn't there yet when on_auth_user_created runs.
describe("accounts created through the admin API", () => {
  const email = "new.admin@ras.test"
  const password = "password123"
  let userId: string | undefined

  afterAll(async () => {
    if (userId) await serviceClient().auth.admin.deleteUser(userId)
  })

  it("get the role from app_metadata, and keep it in sync when it changes", async () => {
    const service = serviceClient()
    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "admin" },
      user_metadata: { first_name: "New", last_name: "Admin" },
    })
    if (error) throw error
    userId = data.user.id

    const signInAs = async () => {
      const client = anonClient()
      const { error } = await client.auth.signInWithPassword({ email, password })
      if (error) throw error
      return getUserFromClient(client)
    }
    expect(await signInAs()).toMatchObject({ role: "admin", firstName: "New", lastName: "Admin" })

    await service.auth.admin.updateUserById(userId, { app_metadata: { role: "farmer" } })
    expect((await signInAs())?.role).toBe("farmer")
  })
})
