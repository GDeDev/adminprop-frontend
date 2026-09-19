import "server-only"

import { createSessionRoutes } from "@adminprop/session/server"

import { SESSION_COOKIE_PREFIX } from "./session"

/**
 * Route handlers de la sesión (ver `app/api/session`). Sin cookie de marca:
 * el portal la toma de su inmobiliaria (slug), no de la sesión.
 */
export const sessionRoutes = createSessionRoutes({
  cookiePrefix: SESSION_COOKIE_PREFIX,
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
})
