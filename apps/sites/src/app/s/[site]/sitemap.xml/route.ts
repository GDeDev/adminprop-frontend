import { type NextRequest } from "next/server"

import { absoluteBase } from "@/lib/absolute-url"
import { getProperties, getSite, UpstreamError } from "@/lib/api"
import { buildSitemap, type SitemapEntry } from "@/lib/sitemap"
import { decodeSiteRoute } from "@/lib/site-route"

const MAX_PAGES = 10

type Context = { params: Promise<{ site: string }> }

/**
 * La API falló: 503 que ningún caché debe guardar. Un sitemap parcial con 200 y
 * `s-maxage=3600` le diría a los buscadores, durante una hora, que el sitio no
 * tiene fichas.
 */
function unavailable(): Response {
  return new Response("Servicio no disponible", {
    status: 503,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "Retry-After": "60",
    },
  })
}

export async function GET(request: NextRequest, context: Context) {
  try {
    return await buildResponse(request, context)
  } catch (error) {
    if (error instanceof UpstreamError) return unavailable()
    throw error
  }
}

async function buildResponse(
  request: NextRequest,
  { params }: Context
): Promise<Response> {
  const route = decodeSiteRoute((await params).site)
  if (!route || route.previewToken) {
    return new Response("Not found", { status: 404 })
  }
  const site = await getSite(route)
  if (!site) return new Response("Not found", { status: 404 })

  const base = absoluteBase(request, route)
  // `lastmod` solo donde hay una fecha real: las páginas del sitio cambian al
  // publicar. Las fichas no llevan: la API pública no expone cuándo cambió cada
  // propiedad, y una fecha inventada es peor que ninguna.
  const published = site.publishedAt
  const urls: SitemapEntry[] = [
    { path: "", lastmod: published },
    { path: "/propiedades" },
    { path: "/contacto", lastmod: published },
    { path: "/tasacion", lastmod: published },
  ]
  if (site.content.sections.some((s) => s.key === "about" && s.visible)) {
    urls.push({ path: "/nosotros", lastmod: published })
  }

  // Primera página para saber cuántas hay; el resto se pide en paralelo. Una
  // falla en cualquiera sube como `UpstreamError` (ver `GET`); `null` es que la
  // API confirma que el sitio ya no existe.
  const first = await getProperties(route, { page: 1, limit: 100 })
  if (!first) return new Response("Not found", { status: 404 })
  const rest = Array.from(
    {
      length: Math.max(Math.min(first.pagination.totalPages, MAX_PAGES) - 1, 0),
    },
    (_, i) => getProperties(route, { page: i + 2, limit: 100 })
  )
  for (const result of [first, ...(await Promise.all(rest))]) {
    for (const property of result?.data ?? []) {
      urls.push({ path: `/propiedades/${property.id}` })
    }
  }

  const body = buildSitemap(base, urls)
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  })
}
