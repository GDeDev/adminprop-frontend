import "server-only"

import { createSessionRoutes } from "@adminprop/session/server"

import { SESSION_COOKIE_PREFIX } from "./session"

/** Route handlers de la sesión (ver `app/api/session`). */
export const sessionRoutes = createSessionRoutes({
  cookiePrefix: SESSION_COOKIE_PREFIX,
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  // El layout pinta el color de la inmobiliaria desde el server.
  storeBranding: true,
})
