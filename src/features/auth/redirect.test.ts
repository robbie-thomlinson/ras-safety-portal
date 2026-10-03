import { describe, expect, it } from "vitest"

import { safeRedirectPath } from "./redirect"

describe("safeRedirectPath", () => {
  it("keeps same-origin paths", () => {
    expect(safeRedirectPath("/forms/12?tab=photos")).toBe("/forms/12?tab=photos")
  })

  it.each([
    ["missing", null],
    ["absolute URL", "https://evil.example/login"],
    ["protocol-relative URL", "//evil.example"],
    ["backslash trick", "/\\evil.example"],
    ["relative path", "forms"],
    ["control characters", "/\t/evil.example"],
  ])("falls back for a %s", (_, next) => {
    expect(safeRedirectPath(next)).toBe("/")
  })
})
