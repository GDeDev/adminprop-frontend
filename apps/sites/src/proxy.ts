import { NextResponse, type NextRequest } from "next/server"

import { resolveHost } from "@/lib/api"
import { cachedHostLookup } from "@/lib/host-cache"
import {
  encodeSiteRoute,
  isValidPreviewToken,
  isValidSlug,
  type SiteRoute,
} from "@/lib/site-route"

/** Ruta interna que responde 404: ningún pedido externo entra a `/s/…` ni a `/p/…`. */
const NOT_FOUND = "/s/nf"

const DEV_PATH = /^\/_s\/([^/]+)(\/.*)?$/

/**
 * El acceso por slug (`/_s/<slug>/…`) es de desarrollo; en producción solo se
 * acepta para la vista previa del backoffice (el token lo valida la API) o si
 * se habilita a propósito con `SITES_ALLOW_SLUG_PATH=true`.
 */
function slugPathAllowed(hasPreview: boolean): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.SITES_ALLOW_SLUG_PATH === "true" ||
    hasPreview
  )
}

/**
 * Decide qué inmobiliaria sirve el pedido y reescribe a `/s/<sitio>/…`:
 * por `Host` (subdominio o dominio propio, vía la API) o por `/_s/<slug>`.
 * El token de vista previa viaja en la ruta, no en la query, para que la
 * caché de ISR nunca mezcle el borrador con lo publicado.
 */
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  if (/^\/[sp](\/|$)/.test(pathname)) {
    return NextResponse.rewrite(new URL(NOT_FOUND, request.url))
  }

  const previewParam = searchParams.get("preview")
  const previewToken =
    previewParam && isValidPreviewToken(previewParam) ? previewParam : null

  let route: SiteRoute | null = null
  let rest = pathname

  const dev = DEV_PATH.exec(pathname)
  if (dev) {
    const slug = dev[1] ?? ""
    if (slugPathAllowed(previewToken !== null) && isValidSlug(slug)) {
      route = { mode: "dev", slug, previewToken }
      rest = dev[2] ?? ""
    }
  } else {
    const host =
      (
        request.headers.get("x-forwarded-host") ??
        request.headers.get("host") ??
        ""
      )
        .split(",")[0]
        ?.trim() ?? ""
    const slug = host ? await cachedHostLookup(host, resolveHost) : null
    if (slug && isValidSlug(slug)) {
      route = { mode: "host", slug, previewToken }
    }
  }

  if (!route) return NextResponse.rewrite(new URL(NOT_FOUND, request.url))

  // El borrador tiene su propio árbol (`/p`), que no se cachea.
  const tree = route.previewToken ? "/p" : "/s"
  const target = new URL(
    `${tree}/${encodeSiteRoute(route)}${rest}`,
    request.url
  )
  searchParams.forEach((value, key) => {
    if (key !== "preview") target.searchParams.append(key, value)
  })
  return NextResponse.rewrite(target)
}

export const config = {
  // Se saltean los estáticos de Next y los archivos con extensión (favicon,
  // imágenes…), salvo `sitemap.xml` y `robots.txt`, que son del sitio.
  matcher: ["/((?!_next/)(?!.*\\.(?!xml$|txt$)[a-zA-Z0-9]+$).*)"],
}
