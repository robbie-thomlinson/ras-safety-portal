"use client"

import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { signIn } from "../actions"

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, null)
  // Controlled so the email survives React resetting the form after a failed attempt.
  const [email, setEmail] = useState("")
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined

  return (
    <form action={action} noValidate>
      <FieldGroup>
        {next && <input type="hidden" name="next" value={next} />}
        <Field data-invalid={!!fieldErrors?.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fieldErrors?.email}
            required
          />
          <FieldError>{fieldErrors?.email?.[0]}</FieldError>
        </Field>
        <Field data-invalid={!!fieldErrors?.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!fieldErrors?.password}
            required
          />
          <FieldError>{fieldErrors?.password?.[0]}</FieldError>
        </Field>
        {state && !state.ok && !fieldErrors && <FieldError>{state.error}</FieldError>}
        <Button type="submit" size="lg" className="h-10" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </FieldGroup>
    </form>
  )
}
