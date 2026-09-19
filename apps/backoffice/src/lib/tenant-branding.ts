import "server-only"

/** Lo que cada inmobiliaria personaliza (slots de marca). */
export interface TenantBranding {
  name: string
  logoUrl: string | null
  /** Hex; pisa `--primary` en el `<html>` (ver `tenantThemeStyle`). */
  primaryColor: string | null
}

/**
 * Marca de la inmobiliaria del usuario logueado, para el `<html>` y el
 * sidebar. Devuelve null mientras no hay sesión: se usa el tema default.
 *
 * TODO(Fase 4): leer el tenant de la sesión (GET /auth/me o el que exponga la
 * API con name, logoUrl y primaryColor).
 */
export async function getTenantBranding(): Promise<TenantBranding | null> {
  return null
}
