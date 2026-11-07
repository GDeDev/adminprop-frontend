import { NextResponse, type NextRequest } from "next/server"

import { resolveHost } from "@/lib/api"
import { clientIp } from "@/lib/client-ip"
import {
  cachedHostLookup,
  HostLookupError,
  HostLookupLimitedError,
} from "@/lib/host-cache"
import { isPlausibleSiteHost, normalizeHost } from "@/lib/host-policy"
import {
  isVisitorBuiltRead,
  takeBrowseToken,
  takeToken,
} from "@/lib/rate-limit"
import { requestHost } from "@/lib/request-host"
import {
  encodeSiteRoute,
  isPreviewablePath,
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
/** Ruta del sitio sin el prefijo `/_s/<slug>` del acceso de desarrollo. */
function previewPathOf(pathname: string): string {
  const dev = DEV_PATH.exec(pathname)
  return dev ? (dev[2] ?? "/") : pathname
}

function tooManyRequests(): NextResponse {
  return new NextResponse("Demasiados pedidos. Probá de nuevo en un minuto.", {
    status: 429,
    headers: {
      "Retry-After": "60",
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  if (/^\/[sp](\/|$)/.test(pathname)) {
    return NextResponse.rewrite(new URL(NOT_FOUND, request.url))
  }

  // `?preview=` solo cuenta en las páginas del sitio y con forma de JWT: así un
  // valor inventado no llega a la API ni abre una entrada de caché por pedido.
  const previewParam = searchParams.get("preview")
  const previewToken =
    previewParam &&
    isValidPreviewToken(previewParam) &&
    isPreviewablePath(previewPathOf(pathname))
      ? previewParam
      : null

  // Cada vista previa es una lectura sin caché contra la API: cuenta contra el
  // cupo por IP. Lo publicado, no (ver `rate-limit.ts`).
  const ip = clientIp(request.headers)
  if (previewToken && !takeToken(ip)) return tooManyRequests()

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
    const host = requestHost(request.headers)
    let slug: string | null = null
    // Lo que jamás podría ser un sitio (IPs, `localhost`, nombres mal formados,
    // subdominios de dos niveles) se descarta sin llamar a la API.
    if (host && isPlausibleSiteHost(host)) {
      try {
        // La vista previa ya descontó su cupo arriba.
        slug = await cachedHostLookup(
          host,
          (key) => resolveHost(key, ip),
          () => (previewToken ? true : takeToken(ip))
        )
      } catch (error) {
        if (error instanceof HostLookupLimitedError) return tooManyRequests()
        if (!(error instanceof HostLookupError)) throw error
        // La API no pudo decir si el sitio existe: no es un 404, es un 503.
        return new NextResponse(
          "Servicio no disponible. Probá de nuevo en un momento.",
          {
            status: 503,
            headers: {
              "Retry-After": "10",
              "Content-Type": "text/plain; charset=utf-8",
            },
          }
        )
      }
    }
    if (slug && isValidSlug(slug)) {
      // El host viaja en la ruta (solo en el sitio público) para el canonical.
      route = {
        mode: "host",
        slug,
        previewToken,
        host: previewToken ? null : normalizeHost(host),
      }
    }
  }

  if (!route) return NextResponse.rewrite(new URL(NOT_FOUND, request.url))

  // Fichas, listado con filtros y favoritos: la URL la arma el visitante y la
  // lectura va con el secreto, así que el tope lo pone este proxy.
  const hasQuery = [...searchParams.keys()].some((k) => k !== "preview")
  if (
    !route.previewToken &&
    isVisitorBuiltRead(rest, hasQuery) &&
    !takeBrowseToken(ip)
  ) {
    return tooManyRequests()
  }

  // El borrador tiene su propio árbol (`/p`), que no se cachea.
  const tree = route.previewToken ? "/p" : "/s"
  const target = new URL(
    `${tree}/${encodeSiteRoute(route)}${rest}`,
    request.url
  )
  searchParams.forEach((value, key) => {
    if (key !== "preview") target.searchParams.append(key, value)
  })
  const response = NextResponse.rewrite(target)
  // El borrador nunca se guarda en cachés compartidas (CDN, navegador).
  if (route.previewToken) response.headers.set("Cache-Control", "no-store")
  return response
}

export const config = {
  // Se saltean los estáticos de Next y los archivos con extensión (favicon,
  // imágenes…), salvo `sitemap.xml` y `robots.txt`, que son del sitio.
  // Los árboles internos `/s` y `/p` pasan SIEMPRE por el proxy (aunque la
  // ruta termine en `.png`): si no, `/s/d~slug/x.png` llegaba directo a la app
  // y salteaba el cierre del acceso por slug y el cupo por IP.
  matcher: [
    "/((?!_next/|api/revalidate$)(?!.*\\.(?!xml$|txt$)[a-zA-Z0-9]+$).*)",
    "/s/:path*",
    "/p/:path*",
  ],
}
