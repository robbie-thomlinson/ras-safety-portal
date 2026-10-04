import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SearchSelect, type SearchSelectOption } from "./search-select"

const WORKERS: SearchSelectOption[] = [
  { id: "a1", name: "Ana Brown" },
  { id: "b2", name: "Ben Smith" },
  { id: "c3", name: "Cara Smithers", tag: "Archived" },
]

function renderSelect(value?: string) {
  const onChange = vi.fn()
  render(
    <SearchSelect
      value={value}
      options={WORKERS}
      label="Worker"
      placeholder="All workers"
      onChange={onChange}
    />,
  )
  return {
    onChange,
    user: userEvent.setup(),
    input: screen.getByRole("combobox", { name: "Worker" }),
  }
}

describe("SearchSelect", () => {
  it("shows the selected name, or is empty when nothing is selected", () => {
    const { unmount } = render(
      <SearchSelect
        value={undefined}
        options={WORKERS}
        label="Worker"
        placeholder="All workers"
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByRole("combobox")).toHaveValue("")
    expect(screen.getByRole("combobox")).toHaveAttribute("placeholder", "All workers")
    unmount()

    render(
      <SearchSelect
        value="b2"
        options={WORKERS}
        label="Worker"
        placeholder="All workers"
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByRole("combobox")).toHaveValue("Ben Smith")
  })

  it("narrows the list as you type and picks a match", async () => {
    const { onChange, user, input } = renderSelect()
    await user.type(input, "smith")

    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Ben Smith",
      "Cara SmithersArchived",
    ])
    await user.click(screen.getByRole("option", { name: /Cara Smithers/ }))
    expect(onChange).toHaveBeenCalledWith("c3")
    expect(screen.queryByRole("option")).not.toBeInTheDocument()
  })

  it("picks the highlighted match with the keyboard", async () => {
    const { onChange, user, input } = renderSelect()
    await user.type(input, "smi{ArrowDown}{Enter}")
    expect(onChange).toHaveBeenCalledWith("c3")
  })

  it("says so when nothing matches", async () => {
    const { user, input } = renderSelect()
    await user.type(input, "zz")
    expect(screen.queryByRole("option")).not.toBeInTheDocument()
    expect(screen.getByText("No matches")).toBeInTheDocument()
  })

  it("clears back to all when the text is deleted", async () => {
    const { onChange, user, input } = renderSelect("a1")
    await user.clear(input)
    expect(onChange).toHaveBeenCalledWith(undefined)
  })

  it("clears with the × button", async () => {
    const { onChange, user } = renderSelect("a1")
    await user.click(screen.getByRole("button", { name: "Clear" }))
    expect(onChange).toHaveBeenCalledWith(undefined)
  })

  it("puts the selection back if you leave without picking", async () => {
    const { onChange, user, input } = renderSelect("a1")
    await user.type(input, "Ben")
    await user.keyboard("{Escape}")
    expect(input).toHaveValue("Ana Brown")
    expect(onChange).not.toHaveBeenCalled()
  })
})
