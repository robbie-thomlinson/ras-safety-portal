import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { todayInRasTimeZone } from "@/lib/dates"

import { submitSafetyFormAction } from "../actions"
import { SafetyForm } from "./safety-form"

const USER_ID = "11111111-1111-1111-1111-111111111111"

vi.mock("../actions", () => ({ submitSafetyFormAction: vi.fn() }))

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

const upload = vi.fn(async () => ({ error: null }))
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ storage: { from: () => ({ upload, remove: vi.fn(async () => ({})) }) } }),
}))

const submit = vi.mocked(submitSafetyFormAction)

function renderForm() {
  render(
    <SafetyForm
      userId={USER_ID}
      today={todayInRasTimeZone()}
      jobSites={[
        { id: 1, name: "Saanichton Dairy Barn" },
        { id: 2, name: "Metchosin Hay Barn" },
      ]}
    />
  )
  return userEvent.setup()
}

async function fillIn(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText("Job site"), "Metchosin Hay Barn")
  for (const group of screen.getAllByRole("radiogroup")) {
    await user.click(within(group).getByRole("radio", { name: "Yes" }))
  }
  await user.click(within(screen.getByRole("radiogroup", { name: "Ladders inspected" })).getByRole("radio", { name: "No" }))
  await user.upload(screen.getByLabelText("Add photos"), new File(["png"], "barn.png", { type: "image/png" }))
  await waitFor(() => expect(screen.queryByLabelText("Uploading")).not.toBeInTheDocument())
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("SafetyForm", () => {
  it("explains what's missing and doesn't submit", async () => {
    const user = renderForm()
    await user.click(screen.getByRole("button", { name: "Submit safety form" }))

    const errors = (await screen.findAllByRole("alert")).map((alert) => alert.textContent)
    expect(errors).toEqual(["Choose a job site", ...Array(10).fill("Answer this checklist item"), "Add at least one photo"])
    expect(submit).not.toHaveBeenCalled()
  })

  it("uploads photos, then submits the form with their paths", async () => {
    submit.mockResolvedValue({ ok: true, data: { id: 7 } })
    const user = renderForm()
    await fillIn(user)
    await user.click(screen.getByRole("button", { name: "Submit safety form" }))

    await waitFor(() => expect(push).toHaveBeenCalledWith("/submissions/7"))
    expect(upload).toHaveBeenCalledOnce()
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        jobSiteId: 2,
        date: todayInRasTimeZone(),
        hardHatWorn: true,
        laddersInspected: false,
        photoPaths: [expect.stringMatching(new RegExp(`^${USER_ID}/.+\\.png$`))],
      })
    )
  })

  it("shows an error from the server and stays on the form", async () => {
    submit.mockResolvedValue({ ok: false, error: "That job site isn't available. Choose another." })
    const user = renderForm()
    await fillIn(user)
    await user.click(screen.getByRole("button", { name: "Submit safety form" }))

    expect(await screen.findByText("That job site isn't available. Choose another.")).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Submit safety form" })).toBeEnabled()
  })
})
