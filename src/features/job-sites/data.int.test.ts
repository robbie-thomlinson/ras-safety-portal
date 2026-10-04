import { afterAll, beforeAll, describe, expect, it } from "vitest"

import type { Client } from "@/lib/supabase/types"
import { cleanUp, signIn } from "@/test/supabase"

import { createJobSite, listJobSites, setJobSiteArchived, updateJobSite } from "./data"

let framer: Client
let admin: Client
const created: number[] = []

beforeAll(async () => {
  ;[framer, admin] = await Promise.all([signIn("framer"), signIn("admin")])
})

afterAll(() => cleanUp({ jobSiteIds: created }))

describe("job sites", () => {
  it("lets framers read the seeded sites", async () => {
    const sites = await listJobSites(framer)
    expect(sites.map((s) => s.name)).toContain("Mount Newton Townhomes")
  })

  it("lets an admin add, rename and archive a site", async () => {
    const id = await createJobSite(admin, { name: "Test Duplex", address: "1 Test Rd" })
    created.push(id)

    await updateJobSite(admin, id, { name: "Test Duplex North", address: "1 Test Rd" })
    expect((await listJobSites(framer)).find((s) => s.id === id)?.name).toBe("Test Duplex North")

    await setJobSiteArchived(admin, id, true)
    expect((await listJobSites(framer)).some((s) => s.id === id)).toBe(false)
    expect((await listJobSites(framer, { includeArchived: true })).find((s) => s.id === id)?.archivedAt).not.toBeNull()

    await setJobSiteArchived(admin, id, false)
    expect((await listJobSites(framer)).some((s) => s.id === id)).toBe(true)
  })

  it("doesn't let a framer add a site", async () => {
    await expect(createJobSite(framer, { name: "Sneaky", address: "1 Road" })).rejects.toMatchObject({ code: "42501" })
  })

  it("doesn't let a framer edit or archive a site", async () => {
    await expect(updateJobSite(framer, 1, { name: "Renamed", address: "x" })).rejects.toThrow("Job site not found.")
    await expect(setJobSiteArchived(framer, 1, true)).rejects.toThrow("Job site not found.")
  })
})
