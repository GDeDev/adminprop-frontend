import { type NextRequest } from "next/server"

import { absoluteBase, escapeXml } from "@/lib/absolute-url"
import { getProperties, getSite } from "@/lib/api"
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
  const urls = ["", "/propiedades", "/contacto"]
  if (site.content.sections.some((s) => s.key === "about" && s.visible)) {
    urls.push("/nosotros")
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
        urls.push(`/propiedades/${property.id}`)
      }
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((path) => `  <url><loc>${escapeXml(base + path)}</loc></url>`)
    .join("\n")}\n</urlset>\n`
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  })
}
