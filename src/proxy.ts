import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_PATHS = ["/login"]

// Keeps the Supabase session fresh and sends signed-out users to /login. This is only a
// convenience: authorization is enforced in the data access layer and by RLS.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
        },
      },
    }
  )

  // getClaims() verifies the JWT (and refreshes it if needed); getSession() would trust the cookie.
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims.sub)
  const { pathname, search } = request.nextUrl
  const isPublic = PUBLIC_PATHS.includes(pathname)

  if (!signedIn && !isPublic) {
    return redirectWithCookies(request, response, "/login", { next: pathname + search })
  }
  if (signedIn && isPublic) {
    return redirectWithCookies(request, response, "/")
  }

  return response
}

// Carries over any refreshed session cookies so the redirect doesn't sign the user out.
function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  params: Record<string, string> = {}
) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = new URLSearchParams(params).toString()
  const redirect = NextResponse.redirect(url)
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
  return redirect
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
