import type { NextRequest } from "next/server"

import { sessionRoutes } from "@/lib/session-routes"

/** Después del login: guarda el refresh token en la cookie httpOnly. */
export function POST(request: NextRequest) {
  return sessionRoutes.start(request)
}

/** Logout: revoca el refresh token en la API y borra las cookies. */
export function DELETE(request: NextRequest) {
  return sessionRoutes.end(request)
}
