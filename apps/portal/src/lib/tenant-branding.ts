import "server-only"

import type { ApiSuccess, TenantBranding } from "@adminprop/shared-types"

export type { TenantBranding }

/**
 * Slug de la inmobiliaria dueña de este portal. Hoy sale de
 * `PORTAL_TENANT_SLUG` (Doppler, `dev_portal`); en la Fase 22 se resuelve por
 * dominio. Es de servidor a propósito: cuando venga del dominio, las páginas
 * no cambian.
 */
export function getPortalTenantSlug(): string | null {
  const slug = process.env.PORTAL_TENANT_SLUG?.trim()
  return slug ? slug : null
}

/** Cada cuánto se vuelve a pedir la marca a la API (segundos). */
const BRANDING_REVALIDATE_SECONDS = 300

/**
 * Marca de la inmobiliaria del portal (nombre, logo, color) por
 * `GET /tenants/by-slug/:slug`, que es público. Null si no hay slug, la
 * inmobiliaria no existe o la API no responde: se usa el tema por defecto.
 */
export async function getTenantBranding(): Promise<TenantBranding | null> {
  const slug = getPortalTenantSlug()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!slug || !apiUrl) return null

  try {
    const response = await fetch(
      `${apiUrl}/tenants/by-slug/${encodeURIComponent(slug)}`,
      { next: { revalidate: BRANDING_REVALIDATE_SECONDS } }
    )
    if (!response.ok) return null
    const body = (await response.json()) as ApiSuccess<TenantBranding>
    return body.data
  } catch {
    return null
  }
}
