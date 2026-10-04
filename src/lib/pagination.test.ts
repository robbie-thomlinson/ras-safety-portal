import { describe, expect, it } from "vitest"

import { pageHref, pageRange, pageWindow, paginated, parsePage } from "./pagination"

describe("parsePage", () => {
  it("reads a positive page number", () => {
    expect(parsePage("3")).toBe(3)
    expect(parsePage(["4", "5"])).toBe(4)
  })

  it("falls back to the first page for anything else", () => {
    for (const value of [undefined, "", "0", "-2", "1.5", "abc", "2abc"])
      expect(parsePage(value)).toBe(1)
  })
})

describe("pageRange", () => {
  it("gives inclusive row bounds", () => {
    expect(pageRange({ page: 1, pageSize: 25 })).toEqual([0, 24])
    expect(pageRange({ page: 3, pageSize: 25 })).toEqual([50, 74])
  })
})

describe("paginated", () => {
  it("rounds the page count up", () => {
    expect(paginated([], 51, { page: 1, pageSize: 25 }).pageCount).toBe(3)
    expect(paginated([], 50, { page: 1, pageSize: 25 }).pageCount).toBe(2)
    expect(paginated([], 0, { page: 1, pageSize: 25 }).pageCount).toBe(0)
  })
})

describe("pageWindow", () => {
  it("lists every page when there are only a few", () => {
    expect(pageWindow(1, 1)).toEqual([1])
    expect(pageWindow(2, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it("collapses skipped runs into gaps around the current page", () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, "gap", 20])
    expect(pageWindow(10, 20)).toEqual([1, "gap", 9, 10, 11, "gap", 20])
    expect(pageWindow(20, 20)).toEqual([1, "gap", 19, 20])
  })

  it("shows a lone skipped page rather than a gap", () => {
    expect(pageWindow(4, 20)).toEqual([1, 2, 3, 4, 5, "gap", 20])
  })
})

describe("pageHref", () => {
  it("keeps the filters and swaps the page", () => {
    expect(pageHref("/submissions", { status: "submitted", page: "2" }, 3)).toBe(
      "/submissions?status=submitted&page=3",
    )
  })

  it("leaves page 1 off the URL", () => {
    expect(pageHref("/submissions", { page: "4" }, 1)).toBe("/submissions")
    expect(pageHref("/submissions", { jobSiteId: "2", page: "4" }, 1)).toBe(
      "/submissions?jobSiteId=2",
    )
  })
})
