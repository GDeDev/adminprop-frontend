import { NextResponse, type NextRequest } from "next/server"

import { refreshCookieName } from "@adminprop/session/server"

import { areaForPath, PORTAL_AREAS, SESSION_COOKIE_PREFIX } from "@/lib/session"

/**
 * Las áreas de propietarios e inquilinos requieren sesión: sin la cookie, al
 * login de esa área antes de renderizar. El resto del portal es público.
 *
 * Sólo mira que la cookie exista. Que sea válida y del rol correcto lo
 * resuelve `ProtectedRoute` en el cliente.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const area = areaForPath(pathname)
  if (!area) return NextResponse.next()

  const { loginPath } = PORTAL_AREAS[area]
  if (pathname === loginPath) return NextResponse.next()

  if (request.cookies.has(refreshCookieName(SESSION_COOKIE_PREFIX))) {
    return NextResponse.next()
  }

  const login = new URL(loginPath, request.url)
  login.searchParams.set("next", `${pathname}${search}`)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ["/propietario/:path*", "/inquilino/:path*"],
}
