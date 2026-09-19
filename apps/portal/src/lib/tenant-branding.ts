import "server-only"

/** Lo que cada inmobiliaria personaliza (slots de marca). */
export interface TenantBranding {
  name: string
  logoUrl: string | null
  /** Hex; pisa `--primary` en el `<html>` (ver `tenantThemeStyle`). */
  primaryColor: string | null
}

/**
 * Marca de la inmobiliaria dueña del sitio. El portal es público: el tenant
 * sale del dominio, no de una sesión. Devuelve null mientras tanto y se usa
 * el tema default.
 *
 * TODO(Fase 22): resolver el tenant por dominio contra la API.
 */
export async function getTenantBranding(): Promise<TenantBranding | null> {
  return null
}
