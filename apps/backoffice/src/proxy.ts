import { NextResponse, type NextRequest } from "next/server"

import { refreshCookieName } from "@adminprop/session/server"

import { LOGIN_PATH, SESSION_COOKIE_PREFIX } from "@/lib/session"

/**
 * Corta antes de renderizar a quien no tiene cookie de sesión: va directo al
 * login, sin mostrar un instante la pantalla protegida.
 *
 * Sólo mira que la cookie exista, no si es válida: eso lo resuelve
 * `ProtectedRoute` en el cliente, que la usa para pedir un access token.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(
    refreshCookieName(SESSION_COOKIE_PREFIX)
  )
  if (hasSession) return NextResponse.next()

  const login = new URL(LOGIN_PATH, request.url)
  const { pathname, search } = request.nextUrl
  if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`)
  return NextResponse.redirect(login)
}

export const config = {
  // Todo menos el login, los route handlers y los assets.
  matcher: [
    "/((?!login|api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
}
