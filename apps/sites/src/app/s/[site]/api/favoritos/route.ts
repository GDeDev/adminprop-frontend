import { NextResponse, type NextRequest } from "next/server"

import { getProperties } from "@/lib/api"
import { FAVORITES_LIMIT, parseIdsParam } from "@/lib/favorites"
import { decodeSiteRoute } from "@/lib/site-route"

/**
 * Las propiedades de la lista de favoritos de quien visita. El navegador no
 * llama a la API (la CSP del sitio solo permite `connect-src 'self'`): pide acá,
 * y el servidor las busca por id. Los ids vienen de `localStorage`, así que se
 * revalidan: solo UUID, sin repetir y acotados.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ site: string }> }
) {
  const route = decodeSiteRoute((await params).site)
  if (!route) {
    return NextResponse.json(
      { message: "No encontramos este sitio." },
      { status: 404 }
    )
  }
  const ids = parseIdsParam(
    request.nextUrl.searchParams.get("ids") ?? undefined
  )
  if (ids.length === 0) return NextResponse.json({ data: [] })
  try {
    const result = await getProperties(route, {
      ids,
      limit: Math.min(ids.length, FAVORITES_LIMIT),
    })
    return NextResponse.json(
      { data: result?.data ?? [] },
      { headers: { "Cache-Control": "private, no-store" } }
    )
  } catch {
    return NextResponse.json(
      {
        message:
          "No pudimos cargar tus favoritos. Probá de nuevo en un momento.",
      },
      { status: 502 }
    )
  }
}
