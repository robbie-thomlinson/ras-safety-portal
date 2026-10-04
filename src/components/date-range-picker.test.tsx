import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DateRangePicker, type DateRange } from "./date-range-picker"

const TODAY = "2026-10-03" // a Saturday

function renderPicker(value: DateRange = {}) {
  const onChange = vi.fn()
  render(<DateRangePicker id="date" value={value} onChange={onChange} today={TODAY} />)
  return { onChange, user: userEvent.setup() }
}

describe("DateRangePicker", () => {
  it("names the range when it matches a preset, and shows dates when it doesn't", () => {
    const { unmount } = render(<DateRangePicker value={{}} onChange={vi.fn()} today={TODAY} />)
    expect(screen.getByRole("button")).toHaveTextContent("Any time")
    unmount()

    render(
      <DateRangePicker
        value={{ from: "2026-09-28", to: "2026-10-03" }}
        onChange={vi.fn()}
        today={TODAY}
      />,
    )
    expect(screen.getByRole("button")).toHaveTextContent("This week")
  })

  it("shows custom and open-ended ranges as dates", () => {
    const { unmount } = render(
      <DateRangePicker
        value={{ from: "2026-09-10", to: "2026-09-20" }}
        onChange={vi.fn()}
        today={TODAY}
      />,
    )
    expect(screen.getByRole("button")).toHaveTextContent("Sep 10 – Sep 20")
    unmount()

    render(<DateRangePicker value={{ from: "2026-09-10" }} onChange={vi.fn()} today={TODAY} />)
    expect(screen.getByRole("button")).toHaveTextContent("Since Sep 10")
  })

  it("applies a preset in one tap", async () => {
    const { onChange, user } = renderPicker()
    await user.click(screen.getByRole("button", { name: "Any time" }))
    await user.click(screen.getByRole("button", { name: /^This week/ }))
    expect(onChange).toHaveBeenCalledWith({ from: "2026-09-28", to: "2026-10-03" })
  })

  it("clears back to any time", async () => {
    const { onChange, user } = renderPicker({ from: TODAY, to: TODAY })
    await user.click(screen.getByRole("button", { name: "Today" }))
    await user.click(screen.getByRole("button", { name: "Any time" }))
    expect(onChange).toHaveBeenCalledWith({})
  })

  it("picks a custom range from the calendar", async () => {
    const { onChange, user } = renderPicker()
    await user.click(screen.getByRole("button", { name: "Any time" }))
    await user.click(screen.getByRole("button", { name: /Custom range/ }))

    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled()
    expect(screen.getByRole("button", { name: /October 4th, 2026/ })).toBeDisabled() // the future
    await user.click(screen.getByRole("button", { name: /September 29th, 2026/ }))
    await user.click(screen.getByRole("button", { name: /October 2nd, 2026/ }))
    expect(screen.getByText("Sep 29 – Oct 2")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Apply" }))

    expect(onChange).toHaveBeenCalledWith({ from: "2026-09-29", to: "2026-10-02" })
  })

  it("treats a single picked day as a one-day range", async () => {
    const { onChange, user } = renderPicker()
    await user.click(screen.getByRole("button", { name: "Any time" }))
    await user.click(screen.getByRole("button", { name: /Custom range/ }))
    await user.click(screen.getByRole("button", { name: /October 1st, 2026/ }))
    await user.click(screen.getByRole("button", { name: "Apply" }))

    expect(onChange).toHaveBeenCalledWith({ from: "2026-10-01", to: "2026-10-01" })
  })
})
