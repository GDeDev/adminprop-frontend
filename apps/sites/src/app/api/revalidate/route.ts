import { createHash, timingSafeEqual } from "node:crypto"
import { revalidateTag } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"

import { siteTag } from "@/lib/api"
import { clearHostCache } from "@/lib/host-cache"
import { isValidSlug } from "@/lib/site-route"

/** Compara sin filtrar por tiempo cuánto del secreto coincide. */
function sameSecret(received: string, expected: string): boolean {
  const hash = (value: string) => createHash("sha256").update(value).digest()
  return timingSafeEqual(hash(received), hash(expected))
}

/**
 * La API avisa acá cuando un sitio se publica, se despublica o verifica su
 * dominio (`POST /api/revalidate` con `Authorization: Bearer <secreto>` y
 * `{ slug }`). Invalida todo lo cacheado de ese sitio: la próxima visita lo
 * vuelve a armar ya, en vez de esperar a que venzan los cachés (hasta dos
 * minutos). Sin `SITES_REVALIDATE_SECRET` el endpoint está apagado.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SITES_REVALIDATE_SECRET
  if (!secret) return NextResponse.json({ ok: false }, { status: 404 })

  const received =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? ""
  if (!sameSecret(received, secret)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  let slug: unknown
  try {
    slug = ((await request.json()) as { slug?: unknown }).slug
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  if (typeof slug !== "string" || !isValidSlug(slug)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // `expire: 0`: el que publica ve el cambio en su próxima visita, no una versión vieja.
  revalidateTag(siteTag(slug), { expire: 0 })
  // Un dominio recién verificado tiene que resolver ya.
  clearHostCache()
  return NextResponse.json({ ok: true })
}
