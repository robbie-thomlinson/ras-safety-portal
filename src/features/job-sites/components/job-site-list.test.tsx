import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { JobSite } from "../data"
import type { SiteStatus } from "../filter"
import { JobSiteList } from "./job-site-list"

vi.mock("../actions", () => ({
  createJobSiteAction: vi.fn(),
  updateJobSiteAction: vi.fn(),
  setJobSiteArchivedAction: vi.fn(),
}))

const SITES: JobSite[] = [
  {
    id: 1,
    name: "Happy Valley Residence",
    address: "3480 Happy Valley Rd, Langford",
    archivedAt: null,
  },
  {
    id: 2,
    name: "Mount Newton Townhomes",
    address: "2250 Mount Newton X Rd, Saanichton",
    archivedAt: null,
  },
  {
    id: 3,
    name: "Bear Mountain Villas",
    address: "1999 Country Club Way, Langford",
    archivedAt: "2026-09-01T00:00:00Z",
  },
]

function renderList({
  sites = SITES,
  query = "",
  status = "active",
  page,
  pageSize,
}: {
  sites?: JobSite[]
  query?: string
  status?: SiteStatus
  page?: number
  pageSize?: number
} = {}) {
  render(
    <JobSiteList
      sites={sites}
      initialQuery={query}
      initialStatus={status}
      initialPage={page}
      pageSize={pageSize}
    />,
  )
  return userEvent.setup()
}

// The name is the first cell's bold text; the header row has no cells.
function shownNames() {
  const table = screen.queryByRole("table")
  if (!table) return []
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0]?.querySelector("span")?.textContent)
}

const MANY: JobSite[] = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  name: `Site ${i + 1}`,
  address: `${i + 1} Main St, ${i < 5 ? "Victoria" : "Sooke"}`,
  archivedAt: null,
}))

beforeEach(() => window.history.replaceState(null, "", "/sites"))

describe("JobSiteList", () => {
  it("shows only active sites by default", () => {
    renderList()
    expect(shownNames()).toEqual(["Happy Valley Residence", "Mount Newton Townhomes"])
  })

  it("narrows the list by name or address as you type, and keeps the search in the URL", async () => {
    const user = renderList()
    await user.type(screen.getByRole("textbox", { name: "Search job sites" }), "newton")
    expect(shownNames()).toEqual(["Mount Newton Townhomes"])
    expect(window.location.search).toBe("?q=newton")

    await user.clear(screen.getByRole("textbox", { name: "Search job sites" }))
    await user.type(screen.getByRole("textbox", { name: "Search job sites" }), "LANGFORD")
    expect(shownNames()).toEqual(["Happy Valley Residence"])
  })

  it("switches between active, archived and all sites, with counts that follow the search", async () => {
    const user = renderList({ query: "langford" })
    const status = screen.getByRole("combobox", { name: "Status" })
    expect(
      within(status)
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["Active (1)", "Archived (1)", "All sites (2)"])

    await user.selectOptions(status, "archived")
    expect(shownNames()).toEqual(["Bear Mountain Villas"])
    expect(window.location.search).toBe("?q=langford&status=archived")

    await user.selectOptions(status, "all")
    expect(shownNames()).toEqual(["Happy Valley Residence", "Bear Mountain Villas"])
  })

  it("offers to show all sites when the only matches have another status", async () => {
    const user = renderList({ query: "bear" })
    expect(screen.getByText("No matching sites")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Show all sites" }))
    expect(shownNames()).toEqual(["Bear Mountain Villas"])
  })

  it("clears the search from the empty state, the clear button or Escape", async () => {
    const user = renderList({ query: "nowhere" })
    await user.click(screen.getByRole("button", { name: "Clear search" }))
    expect(shownNames()).toHaveLength(2)
    expect(window.location.search).toBe("")

    const search = screen.getByRole("textbox", { name: "Search job sites" })
    await user.type(search, "nowhere")
    await user.click(screen.getByRole("button", { name: "Clear" }))
    expect(search).toHaveValue("")

    await user.type(search, "nowhere{Escape}")
    expect(search).toHaveValue("")
  })

  it("pages through the results, keeping the page in the URL", async () => {
    const user = renderList({ sites: MANY, pageSize: 3 })
    expect(shownNames()).toEqual(["Site 1", "Site 2", "Site 3"])
    expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveTextContent(
      "Showing 1–3 of 7",
    )

    await user.click(screen.getByRole("link", { name: "Next page" }))
    expect(shownNames()).toEqual(["Site 4", "Site 5", "Site 6"])
    expect(window.location.search).toBe("?page=2")

    await user.click(screen.getByRole("link", { name: "Page 3" }))
    expect(shownNames()).toEqual(["Site 7"])
    expect(screen.getByRole("link", { name: "Page 3" })).toHaveAttribute("aria-current", "page")
  })

  it("goes back to the first page when the search changes", async () => {
    const user = renderList({ sites: MANY, pageSize: 3, page: 2 })
    expect(shownNames()).toEqual(["Site 4", "Site 5", "Site 6"])

    await user.type(screen.getByRole("textbox", { name: "Search job sites" }), "sooke")
    expect(shownNames()).toEqual(["Site 6", "Site 7"])
    expect(window.location.search).toBe("?q=sooke")
    // One page of results needs no pagination.
    expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument()
  })

  it("shows the last page for a page number past the end", () => {
    renderList({ sites: MANY, pageSize: 3, page: 9 })
    expect(shownNames()).toEqual(["Site 7"])
  })

  it("keeps the filters in the page links", () => {
    renderList({ sites: MANY, query: "victoria", status: "all", pageSize: 3 })
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute(
      "href",
      "/sites?q=victoria&status=all&page=2",
    )
  })
})
