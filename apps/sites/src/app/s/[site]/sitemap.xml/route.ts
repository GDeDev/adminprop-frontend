import { type NextRequest } from "next/server"

import { absoluteBase } from "@/lib/absolute-url"
import { getProperties, getSite } from "@/lib/api"
import { buildSitemap, type SitemapEntry } from "@/lib/sitemap"
import { decodeSiteRoute } from "@/lib/site-route"

const MAX_PAGES = 10

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ site: string }> }
) {
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

  // Primera página para saber cuántas hay; el resto se pide en paralelo.
  const first = await getProperties(route, { page: 1, limit: 100 }).catch(
    () => null
  )
  if (first) {
    const rest = Array.from(
      { length: Math.min(first.pagination.totalPages, MAX_PAGES) - 1 },
      (_, i) =>
        getProperties(route, { page: i + 2, limit: 100 }).catch(() => null)
    )
    for (const result of [first, ...(await Promise.all(rest))]) {
      for (const property of result?.data ?? []) {
        urls.push({ path: `/propiedades/${property.id}` })
      }
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
