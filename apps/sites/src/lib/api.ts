import "server-only"

import type {
  ApiSuccess,
  Paginated,
  PublicListingSort,
  PublicFilters,
  PublicPropertyDetail,
  PublicPropertySummary,
  PublicSite,
} from "@adminprop/shared-types"

import type { SiteRoute } from "./site-route"

/** Cada cuánto se vuelve a pedir lo publicado a la API (segundos). */
export const REVALIDATE_SECONDS = 60

export const PAGE_SIZE = 12

/**
 * Cuánto se espera a la API antes de darla por caída. Sin tope, un pedido
 * colgado deja el render esperando hasta que lo corte la plataforma, y mientras
 * tanto nadie ve ni la versión anterior. `API_TIMEOUT_MS` solo existe para
 * poder probar el corte sin esperar segundos.
 */
export const DEFAULT_API_TIMEOUT_MS = 8000

function apiTimeoutMs(): number {
  const configured = Number(process.env.API_TIMEOUT_MS)
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_API_TIMEOUT_MS
}

export function apiUrl(): string | null {
  return (
    process.env.API_URL?.replace(/\/+$/, "") ??
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ??
    null
  )
}

type Params = Record<string, string | number | undefined>

function queryString(params?: Params): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") query.set(key, String(value))
  }
  return query.size > 0 ? `?${query.toString()}` : ""
}

/**
 * La API no respondió bien (red, 5xx, 429). Distinto de "no existe": un 404 es
 * `null`, esto se lanza. Así una caída momentánea no se cachea como un 404 (con
 * ISR, si la regeneración falla Next sigue sirviendo la última versión buena).
 */
export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status: number | null
  ) {
    super(message)
    this.name = "UpstreamError"
  }
}

/** Etiqueta de caché de todo lo de un sitio: `revalidateTag` la usa al publicar. */
export const siteTag = (slug: string) => `site:${slug}`

/**
 * GET a la API pública. 404 → `null`; cualquier otra falla → `UpstreamError`.
 * La vista previa nunca se cachea; lo publicado, un minuto (ISR) y etiquetado
 * por sitio para poder invalidarlo al publicar.
 */
async function get<T>(
  path: string,
  options: { params?: Params; fresh?: boolean; tag?: string } = {}
): Promise<T | null> {
  const base = apiUrl()
  if (!base) throw new UpstreamError("API_URL sin configurar", null)
  const signal = AbortSignal.timeout(apiTimeoutMs())
  let response: Response
  try {
    response = await fetch(
      `${base}/public${path}${queryString(options.params)}`,
      options.fresh
        ? { cache: "no-store", signal }
        : {
            signal,
            next: {
              revalidate: REVALIDATE_SECONDS,
              ...(options.tag ? { tags: [options.tag] } : {}),
            },
          }
    )
  } catch (error) {
    throw new UpstreamError(
      `No se pudo llamar a la API: ${String(error)}`,
      null
    )
  }
  if (response.status === 404) return null
  if (!response.ok) {
    throw new UpstreamError(
      `La API respondió ${response.status}`,
      response.status
    )
  }
  // Un 200 con el cuerpo cortado o que no es JSON también es una falla de la
  // API; sin esto saldría como un error cualquiera y no como `UpstreamError`.
  // El `signal` sigue vivo mientras se lee el cuerpo: un cuerpo que se cuelga
  // también corta por tiempo.
  let body: unknown
  try {
    body = await response.json()
  } catch (error) {
    throw new UpstreamError(
      `La API devolvió un cuerpo ilegible: ${String(error)}`,
      response.status
    )
  }
  if (typeof body !== "object" || body === null || !("data" in body)) {
    throw new UpstreamError(
      "La API devolvió una respuesta sin `data`",
      response.status
    )
  }
  return (body as ApiSuccess<T>).data
}

const slugPath = (route: SiteRoute) => `/${encodeURIComponent(route.slug)}`

/** El sitio (publicado, o el borrador con token de vista previa). */
export function getSite(route: SiteRoute): Promise<PublicSite | null> {
  return get<PublicSite>(`${slugPath(route)}/site`, {
    params: route.previewToken ? { preview: route.previewToken } : undefined,
    fresh: route.previewToken !== null,
    tag: siteTag(route.slug),
  })
}

export interface ListingQuery {
  operation?: "SALE" | "RENT"
  propertyTypeId?: string
  locationId?: string
  priceFrom?: string
  priceTo?: string
  currency?: "ARS" | "USD"
  bedrooms?: number
  /** Solo viaja si no es el orden por defecto (`recent`). */
  sort?: Exclude<PublicListingSort, "recent">
  page?: number
  limit?: number
  ids?: string[]
}

export async function getProperties(
  route: SiteRoute,
  query: ListingQuery
): Promise<Paginated<PublicPropertySummary> | null> {
  const { ids, ...rest } = query
  return get(`${slugPath(route)}/properties`, {
    tag: siteTag(route.slug),
    params: {
      limit: PAGE_SIZE,
      ...rest,
      ids: ids && ids.length > 0 ? ids.join(",") : undefined,
    },
  })
}

export function getProperty(
  route: SiteRoute,
  id: string
): Promise<PublicPropertyDetail | null> {
  return get(`${slugPath(route)}/properties/${encodeURIComponent(id)}`, {
    tag: siteTag(route.slug),
  })
}

export function getFilters(route: SiteRoute): Promise<PublicFilters | null> {
  return get(`${slugPath(route)}/filters`, { tag: siteTag(route.slug) })
}

/** Resultado de resolver un host: encontrado, inexistente, o la API falló. */
export type HostResult =
  | { status: "found"; slug: string }
  | { status: "missing" }
  | { status: "error" }

/** Resuelve el slug de un host (subdominio o dominio propio). */
export async function resolveHost(host: string): Promise<HostResult> {
  try {
    const data = await get<{ slug: string }>("/site-by-host", {
      params: { host },
      fresh: true,
    })
    return data ? { status: "found", slug: data.slug } : { status: "missing" }
  } catch {
    return { status: "error" }
  }
}
