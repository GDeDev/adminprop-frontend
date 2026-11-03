import type { SiteContent, SiteTemplateKey, SiteTheme } from "./site"

/**
 * Lo que el backend agrega al contrato de `site.ts` sin cambiarlo (ver
 * `docs/tecnica/web-inmobiliaria.md` del frontend, "Desvíos y ampliaciones").
 */

/** Body de `PUT /site/settings`: parcial. `null` en un dominio lo quita. */
export interface UpdateSiteSettingsRequest {
  template?: SiteTemplateKey
  /** Parcial: solo cambian los campos que se mandan. */
  theme?: Partial<SiteTheme>
  /** Parcial por bloque: cada bloque que se manda reemplaza al anterior entero. */
  content?: Partial<SiteContent>
  subdomain?: string | null
  customDomain?: string | null
}

export interface ResetSiteTemplateRequest {
  keepContent: boolean
}

/** `GET /site/preview-token`. */
export interface SitePreviewToken {
  token: string
  expiresAt: string
}

/** `GET /site/subdomain-availability?value=`. */
export interface SubdomainAvailability {
  value: string
  available: boolean
  reason: string | null
}

/** `GET /public/site-by-host?host=`. */
export interface SiteHost {
  slug: string
}
