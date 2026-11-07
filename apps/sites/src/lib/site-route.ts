/**
 * Cómo llegó el pedido a la app: el `proxy` reescribe todo a `/s/<site>/…`,
 * donde `<site>` codifica el modo, el slug y, en vista previa, el token.
 *
 * - `h~slug~host`    sitio por host (subdominio o dominio propio): links sin prefijo. El
 *                    host (sin puerto) va en la ruta para armar el canonical absoluto
 *                    sin leer headers (que haría dinámica la página y rompería el ISR).
 * - `d~slug`         acceso por slug (`/_s/slug/…`): los links llevan ese prefijo.
 * - `hp~slug~token`  vista previa por host.  `dp~slug~token`  vista previa por slug.
 *
 * Es un solo segmento (y no varios) para que cada combinación tenga su propia
 * entrada en la caché de ISR y el borrador nunca se mezcle con lo publicado.
 */
export interface SiteRoute {
  mode: "host" | "dev"
  slug: string
  /** Token de vista previa; null en el sitio público. */
  previewToken: string | null
  /**
   * Host con el que se pidió el sitio público (sin puerto), solo en modo host y
   * sin vista previa. Sirve para el canonical y `og:url`. El borrador no lo
   * lleva: no se indexa.
   */
  host?: string | null
}

import { isPlausibleSiteHost, normalizeHost } from "./host-policy"

const SLUG = /^[a-z0-9][a-z0-9-]{0,62}$/
// JWT compacto: tres segmentos base64url. Se exige la forma real y no solo
// "algo largo", para que un valor inventado no llegue a gastar una llamada a la API.
const TOKEN =
  /^[A-Za-z0-9_-]{4,1000}\.[A-Za-z0-9_-]{4,1000}\.[A-Za-z0-9_-]{4,1000}$/
const PREVIEW_PATHS =
  /^(?:\/|\/propiedades|\/propiedades\/[A-Za-z0-9_-]{1,64}|\/nosotros|\/contacto|\/robots\.txt)$/

export function isValidSlug(value: string): boolean {
  return SLUG.test(value)
}

export function isValidPreviewToken(value: string): boolean {
  return value.length <= 2000 && TOKEN.test(value)
}

/** Rutas del sitio donde tiene sentido una vista previa; en el resto `?preview=` se ignora. */
export function isPreviewablePath(path: string): boolean {
  return PREVIEW_PATHS.test(path === "" ? "/" : path)
}

export function encodeSiteRoute(route: SiteRoute): string {
  const mode = route.mode === "host" ? "h" : "d"
  if (route.previewToken) return `${mode}p~${route.slug}~${route.previewToken}`
  return route.mode === "host" && route.host
    ? `h~${route.slug}~${route.host}`
    : `${mode}~${route.slug}`
}

/** `null` si el segmento no es uno de los que arma el proxy. */
export function decodeSiteRoute(segment: string): SiteRoute | null {
  const [tag, slug, token, ...rest] = decodeURIComponent(segment).split("~")
  if (rest.length > 0 || !slug || !SLUG.test(slug)) return null
  if (tag === "d") {
    return token === undefined
      ? { mode: "dev", slug, previewToken: null }
      : null
  }
  if (tag === "h") {
    if (token === undefined) {
      return { mode: "host", slug, previewToken: null, host: null }
    }
    // El host tiene que tener forma de dominio: el segmento lo arma el proxy,
    // pero nada impide que alguien lo escriba a mano.
    return isPlausibleSiteHost(token)
      ? { mode: "host", slug, previewToken: null, host: normalizeHost(token) }
      : null
  }
  if (tag === "hp" || tag === "dp") {
    return token !== undefined && isValidPreviewToken(token)
      ? { mode: tag === "hp" ? "host" : "dev", slug, previewToken: token }
      : null
  }
  return null
}

/** Ruta del listado, sin query (acción del buscador). */
export function listingPath(route: SiteRoute): string {
  return `${basePath(route)}/propiedades`
}

/** Prefijo de los links internos: vacío por host, `/_s/slug` por slug. */
export function basePath(route: SiteRoute): string {
  return route.mode === "dev" ? `/_s/${route.slug}` : ""
}

/**
 * Link interno a `path` (`/`, `/propiedades?x=1`…). En vista previa conserva
 * `?preview=` para que navegar dentro del iframe siga mostrando el borrador.
 */
export function hrefFor(route: SiteRoute, path = "/"): string {
  const target =
    `${basePath(route)}${path === "/" && basePath(route) ? "" : path}` || "/"
  if (!route.previewToken) return target
  const separator = target.includes("?") ? "&" : "?"
  return `${target}${separator}preview=${encodeURIComponent(route.previewToken)}`
}

/**
 * URL absoluta de una ruta del sitio público, para el canonical y `og:url`.
 * `null` si no se sabe el host (acceso por slug de desarrollo, vista previa):
 * ahí no se emite canonical.
 */
export function canonicalUrl(route: SiteRoute, path = "/"): string | null {
  if (route.mode !== "host" || route.previewToken || !route.host) return null
  const protocol = process.env.SITES_PROTOCOL === "http" ? "http" : "https"
  return `${protocol}://${route.host}${path === "/" ? "" : path}`
}
