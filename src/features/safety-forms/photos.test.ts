import { describe, expect, it } from "vitest"

import { MAX_PHOTO_BYTES, PHOTO_PATH_PATTERN, photoPath, validatePhotoFile } from "./photos"

const USER_ID = "11111111-1111-1111-1111-111111111111"

describe("validatePhotoFile", () => {
  it("accepts supported images up to 10 MB", () => {
    expect(validatePhotoFile({ type: "image/jpeg", size: MAX_PHOTO_BYTES })).toBeNull()
    expect(validatePhotoFile({ type: "image/heic", size: 1 })).toBeNull()
  })

  it("rejects other file types", () => {
    expect(validatePhotoFile({ type: "application/pdf", size: 1 })).toMatch(
      /JPEG, PNG, WebP or HEIC/,
    )
  })

  it("rejects files over 10 MB", () => {
    expect(validatePhotoFile({ type: "image/png", size: MAX_PHOTO_BYTES + 1 })).toMatch(/10 MB/)
  })
})

describe("photoPath", () => {
  it("puts the photo in the user's folder with a random name", () => {
    const path = photoPath(USER_ID, "image/jpeg")
    expect(path).toMatch(PHOTO_PATH_PATTERN)
    expect(path.startsWith(`${USER_ID}/`)).toBe(true)
    expect(path.endsWith(".jpg")).toBe(true)
    expect(photoPath(USER_ID, "image/jpeg")).not.toBe(path)
  })
})

describe("PHOTO_PATH_PATTERN", () => {
  it.each([
    "../etc/passwd",
    `${USER_ID}/../other.jpg`,
    `${USER_ID}/sub/aaaaaaaa-0000-0000-0000-000000000001.jpg`,
    `${USER_ID}/aaaaaaaa-0000-0000-0000-000000000001.exe`,
  ])("rejects %s", (path) => {
    expect(PHOTO_PATH_PATTERN.test(path)).toBe(false)
  })
})
