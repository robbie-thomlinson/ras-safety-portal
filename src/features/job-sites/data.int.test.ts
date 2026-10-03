import { afterAll, beforeAll, describe, expect, it } from "vitest"

import type { Client } from "@/lib/supabase/types"
import { cleanUp, signIn } from "@/test/supabase"

import { createJobSite, listJobSites, setJobSiteArchived, updateJobSite } from "./data"

let farmer: Client
let admin: Client
const created: number[] = []

beforeAll(async () => {
  ;[farmer, admin] = await Promise.all([signIn("farmer"), signIn("admin")])
})

afterAll(() => cleanUp({ jobSiteIds: created }))

describe("job sites", () => {
  it("lets farmers read the seeded sites", async () => {
    const sites = await listJobSites(farmer)
    expect(sites.map((s) => s.name)).toContain("Saanichton Dairy Barn")
  })

  it("lets an admin add, rename and archive a site", async () => {
    const id = await createJobSite(admin, { name: "Test Orchard", address: "1 Test Rd" })
    created.push(id)

    await updateJobSite(admin, id, { name: "Test Orchard North", address: "1 Test Rd" })
    expect((await listJobSites(farmer)).find((s) => s.id === id)?.name).toBe("Test Orchard North")

    await setJobSiteArchived(admin, id, true)
    expect((await listJobSites(farmer)).some((s) => s.id === id)).toBe(false)
    expect((await listJobSites(farmer, { includeArchived: true })).find((s) => s.id === id)?.archivedAt).not.toBeNull()

    await setJobSiteArchived(admin, id, false)
    expect((await listJobSites(farmer)).some((s) => s.id === id)).toBe(true)
  })

  it("doesn't let a farmer add a site", async () => {
    await expect(createJobSite(farmer, { name: "Sneaky", address: "1 Road" })).rejects.toMatchObject({ code: "42501" })
  })

  it("doesn't let a farmer edit or archive a site", async () => {
    await expect(updateJobSite(farmer, 1, { name: "Renamed", address: "x" })).rejects.toThrow("Job site not found.")
    await expect(setJobSiteArchived(farmer, 1, true)).rejects.toThrow("Job site not found.")
  })
})
