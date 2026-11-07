import { NextResponse, type NextRequest } from "next/server"

import { refreshCookieName } from "@adminprop/session/server"

import { LOGIN_PATH, SESSION_COOKIE_PREFIX } from "@/lib/session"

/**
 * Corta antes de renderizar a quien no tiene cookie de sesión: va directo al
 * login, sin mostrar un instante la pantalla protegida.
 *
 * Solo mira que la cookie exista, no si es válida: eso lo resuelve
 * `ProtectedRoute` en el cliente, que la usa para pedir un access token.
 *
 * NO es una barrera de autorización: una cookie falsa pasa este chequeo. Los
 * datos salen de la API con Bearer; si alguna vez se hace SSR con datos usando
 * esta cookie, hay que validarla contra la API primero.
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
  // Todo menos el login, los route handlers y los assets. `login`/`api`
  // van anclados a un segmento entero: una ruta futura `/apiarios` o
  // `/login-historial` no debe quedar sin proteger.
  matcher: [
    "/((?!login(?:/|$)|api(?:/|$)|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
}
