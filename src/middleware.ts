import { auth } from "@/lib/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/login")
  
  // Exclude api routes and static files from middleware logic
  if (req.nextUrl.pathname.startsWith("/api") || req.nextUrl.pathname.startsWith("/_next")) {
    return
  }

  if (isAuthPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/projects", req.nextUrl))
    }
    return
  }

  if (!isLoggedIn) {
    let from = req.nextUrl.pathname
    if (req.nextUrl.search) {
      from += req.nextUrl.search
    }
    return Response.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, req.nextUrl)
    )
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
