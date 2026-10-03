import { describe, expect, it } from "vitest"

import { anonClient, signIn, USERS } from "@/test/supabase"

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
