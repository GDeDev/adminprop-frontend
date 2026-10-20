import type { NextRequest } from "next/server"

import { sessionRoutes } from "@/lib/session-routes"

/** Refresh silencioso: devuelve un access token nuevo y rota la cookie. */
export function POST(request: NextRequest) {
  return sessionRoutes.refresh(request)
}
