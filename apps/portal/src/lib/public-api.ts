import "server-only"

import type {
  ApiSuccess,
  Paginated,
  PublicFilters,
  PublicListingQuery,
  PublicPropertyDetail,
  PublicPropertySummary,
} from "@adminprop/shared-types"

import { getPortalTenantSlug } from "./tenant-branding"

/** Cada cuánto se vuelve a pedir el listado a la API (segundos). */
const REVALIDATE_SECONDS = 60

export const PUBLIC_PAGE_SIZE = 12

function base(): { apiUrl: string; slug: string } | null {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  const slug = getPortalTenantSlug()
  return apiUrl && slug ? { apiUrl, slug: encodeURIComponent(slug) } : null
}

async function get<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T | null> {
  const config = base()
  if (!config) return null
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") query.set(key, String(value))
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : ""
  try {
    const response = await fetch(
      `${config.apiUrl}/public/${config.slug}${path}${suffix}`,
      { next: { revalidate: REVALIDATE_SECONDS } }
    )
    if (!response.ok) return null
    return ((await response.json()) as ApiSuccess<T>).data
  } catch {
    return null
  }
}

/** Propiedades disponibles (`GET /public/:slug/properties`); null si la API no responde. */
export function getPublicListing(
  query: PublicListingQuery
): Promise<Paginated<PublicPropertySummary> | null> {
  return get("/properties", { ...query, limit: PUBLIC_PAGE_SIZE })
}

/** Ficha pública; null si no existe o ya no está disponible. */
export function getPublicProperty(
  id: string
): Promise<PublicPropertyDetail | null> {
  return get(`/properties/${encodeURIComponent(id)}`)
}

export function getPublicFilters(): Promise<PublicFilters | null> {
  return get("/filters")
}

/** Slug para el formulario de contacto (que se envía desde el navegador). */
export function publicTenantSlug(): string | null {
  return getPortalTenantSlug()
}
