import type { JobSite } from "./data"

export const SITE_STATUSES = ["active", "archived", "all"] as const
export type SiteStatus = (typeof SITE_STATUSES)[number]

// A missing or hand-edited status falls back to active sites, the ones admins usually want.
export function parseSiteStatus(value: unknown): SiteStatus {
  return SITE_STATUSES.find((status) => status === value) ?? "active"
}

export function matchesStatus(site: Pick<JobSite, "archivedAt">, status: SiteStatus) {
  if (status === "all") return true
  return status === "archived" ? !!site.archivedAt : !site.archivedAt
}

// Matches the name or the address, so typing a street or city finds a site too.
export function matchesQuery(site: Pick<JobSite, "name" | "address">, query: string) {
  const search = query.trim().toLowerCase()
  if (!search) return true
  return site.name.toLowerCase().includes(search) || site.address.toLowerCase().includes(search)
}
