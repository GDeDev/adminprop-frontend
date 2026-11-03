/**
 * Cómo llegó el pedido a la app: el `proxy` reescribe todo a `/s/<site>/…`,
 * donde `<site>` codifica el modo, el slug y, en vista previa, el token.
 *
 * - `h~slug`         sitio por host (subdominio o dominio propio): links sin prefijo.
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
}

const SLUG = /^[a-z0-9][a-z0-9-]{0,62}$/
const TOKEN = /^[\w.-]{20,2000}$/

export function isValidSlug(value: string): boolean {
  return SLUG.test(value)
}

export function isValidPreviewToken(value: string): boolean {
  return TOKEN.test(value)
}

export function encodeSiteRoute(route: SiteRoute): string {
  const mode = route.mode === "host" ? "h" : "d"
  return route.previewToken
    ? `${mode}p~${route.slug}~${route.previewToken}`
    : `${mode}~${route.slug}`
}

/** `null` si el segmento no es uno de los que arma el proxy. */
export function decodeSiteRoute(segment: string): SiteRoute | null {
  const [tag, slug, token, ...rest] = decodeURIComponent(segment).split("~")
  if (rest.length > 0 || !slug || !SLUG.test(slug)) return null
  if (tag === "h" || tag === "d") {
    return token === undefined
      ? { mode: tag === "h" ? "host" : "dev", slug, previewToken: null }
      : null
  }
  if (tag === "hp" || tag === "dp") {
    return token !== undefined && TOKEN.test(token)
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
