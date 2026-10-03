import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

afterEach(cleanup)

// jsdom doesn't implement these; the photo picker uses them for thumbnails.
URL.createObjectURL = () => "blob:preview"
URL.revokeObjectURL = () => {}

// Radix measures some controls with ResizeObserver, which jsdom doesn't have.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
