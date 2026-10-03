import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { LoginForm } from "./login-form"

vi.mock("../actions", () => ({
  signIn: vi.fn(async () => ({ ok: false, error: "Invalid email or password." })),
}))

describe("LoginForm", () => {
  it("shows the sign-in error and keeps the email", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText("Email"), "farmer@ras.test")
    await user.type(screen.getByLabelText("Password"), "wrong")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toHaveValue("farmer@ras.test")
  })
})
