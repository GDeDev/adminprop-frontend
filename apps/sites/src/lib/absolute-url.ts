import type { NextRequest } from "next/server"

import { basePath, canonicalUrl, type SiteRoute } from "./site-route"

/** Origen público del pedido (detrás de un proxy, el que mandó la plataforma) + prefijo del modo. */
export function absoluteBase(request: NextRequest, route: SiteRoute): string {
  // En el sitio público por host la base es la misma del canonical (https salvo
  // SITES_PROTOCOL=http): el sitemap y las páginas no pueden discrepar solo
  // porque el proxy no mandó `X-Forwarded-Proto`.
  const canonical = canonicalUrl(route, "/")
  if (canonical) return canonical
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
