// Only same-origin paths, so a crafted ?next= link can't bounce users to another site.
export function safeRedirectPath(next: unknown, fallback = "/") {
  if (typeof next !== "string" || !next.startsWith("/")) return fallback
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback
  if (/[\u0000-\u001f]/.test(next)) return fallback
  return next
}
