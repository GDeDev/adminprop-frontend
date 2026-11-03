import type { NextRequest } from "next/server"

import { basePath, type SiteRoute } from "./site-route"

/** Origen público del pedido (detrás de un proxy, el que mandó la plataforma) + prefijo del modo. */
export function absoluteBase(request: NextRequest, route: SiteRoute): string {
  const host = (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host
  )
    .split(",")[0]
    ?.trim()
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    request.nextUrl.protocol.replace(":", "")
  return `${proto === "http" ? "http" : "https"}://${host}${basePath(route)}`
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
