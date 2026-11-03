import "server-only"

import type {
  ApiSuccess,
  Paginated,
  PublicFilters,
  PublicPropertyDetail,
  PublicPropertySummary,
  PublicSite,
} from "@adminprop/shared-types"

import type { SiteRoute } from "./site-route"

/** Cada cuánto se vuelve a pedir lo publicado a la API (segundos). */
export const REVALIDATE_SECONDS = 60

export const PAGE_SIZE = 12

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
 * GET a la API pública. Cualquier falla (sin API, 404, red) es `null`: el
 * llamador decide si es un 404 o un estado de error. La vista previa nunca se
 * cachea; lo publicado, un minuto (ISR).
 */
async function get<T>(
  path: string,
  options: { params?: Params; fresh?: boolean } = {}
): Promise<T | null> {
  const base = apiUrl()
  if (!base) return null
  try {
    const response = await fetch(
      `${base}/public${path}${queryString(options.params)}`,
      options.fresh
        ? { cache: "no-store" }
        : { next: { revalidate: REVALIDATE_SECONDS } }
    )
    if (!response.ok) return null
    return ((await response.json()) as ApiSuccess<T>).data
  } catch {
    return null
  }
}

const slugPath = (route: SiteRoute) => `/${encodeURIComponent(route.slug)}`

/** El sitio (publicado, o el borrador con token de vista previa). */
export function getSite(route: SiteRoute): Promise<PublicSite | null> {
  return get<PublicSite>(`${slugPath(route)}/site`, {
    params: route.previewToken ? { preview: route.previewToken } : undefined,
    fresh: route.previewToken !== null,
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
  return get(`${slugPath(route)}/properties/${encodeURIComponent(id)}`)
}

export function getFilters(route: SiteRoute): Promise<PublicFilters | null> {
  return get(`${slugPath(route)}/filters`)
}

/** Resuelve el slug de un host (subdominio o dominio propio). */
export async function resolveHost(host: string): Promise<string | null> {
  const data = await get<{ slug: string }>("/site-by-host", {
    params: { host },
    fresh: true,
  })
  return data?.slug ?? null
}
