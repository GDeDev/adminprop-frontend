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

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await getProperties(route, { page, limit: 100 })
    if (!result) break
    for (const property of result.data) urls.push(`/propiedades/${property.id}`)
    if (!result.pagination.hasNextPage) break
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
