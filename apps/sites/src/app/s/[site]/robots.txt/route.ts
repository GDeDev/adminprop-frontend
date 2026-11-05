import { type NextRequest } from "next/server"

import { absoluteBase } from "@/lib/absolute-url"
import { decodeSiteRoute } from "@/lib/site-route"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ site: string }> }
) {
  const route = decodeSiteRoute((await params).site)
  if (!route) return new Response("Not found", { status: 404 })
  // El borrador no se indexa.
  const body = route.previewToken
    ? "User-agent: *\nDisallow: /\n"
    : `User-agent: *\nAllow: /\n\nSitemap: ${absoluteBase(request, route)}/sitemap.xml\n`
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  })
}
