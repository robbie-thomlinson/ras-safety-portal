// What every server action returns, so forms can show a message without seeing raw errors.
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

// Known, expected failures whose message is safe to show the user.
export class UserFacingError extends Error {
  name = "UserFacingError"
}

export const GENERIC_ERROR = "Something went wrong. Please try again."

export function toActionError(error: unknown): { ok: false; error: string } {
  if (error instanceof UserFacingError) return { ok: false, error: error.message }
  console.error(error)
  return { ok: false, error: GENERIC_ERROR }
}
