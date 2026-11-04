import type { ApiSchemas } from "./api"
import type { SiteContent, SiteTemplateKey, SiteTheme } from "./site"

/**
 * Lo que el backend agrega al contrato de `site.ts` sin cambiarlo (ver
 * `docs/tecnica/web-inmobiliaria.md` del frontend, "Desvíos y ampliaciones").
 */

/**
 * Body de `PUT /site/settings`: parcial. `null` en un dominio lo quita.
 *
 * Sigue escrito a mano: el OpenAPI declara `theme` y `content` con todos sus
 * campos requeridos, pero el endpoint acepta parciales (ver
 * `docs/tecnica/shared-types-generados.md`).
 */
export interface UpdateSiteSettingsRequest {
  template?: SiteTemplateKey
  /** Parcial: solo cambian los campos que se mandan. */
  theme?: Partial<SiteTheme>
  /** Parcial por bloque: cada bloque que se manda reemplaza al anterior entero. */
  content?: Partial<SiteContent>
  subdomain?: string | null
  customDomain?: string | null
}

export type ResetSiteTemplateRequest = ApiSchemas["ResetSiteTemplateDto"]

/** `GET /site/preview-token`. */
export type SitePreviewToken = ApiSchemas["SitePreviewTokenDto"]

/** `GET /site/subdomain-availability?value=`. */
export type SubdomainAvailability = ApiSchemas["SubdomainAvailabilityDto"]

/** `GET /public/site-by-host?host=`. */
export type SiteHost = ApiSchemas["SiteHostDto"]

/** Registro DNS que prueba que un dominio propio es de la inmobiliaria. */
export type SiteDomainRecord = ApiSchemas["DomainRecordDto"]

/**
 * `GET /site/domain`. Solo un dominio verificado resuelve el sitio; hasta
 * entonces está reservado pero inactivo. Con `verificationRequired: false`
 * (desarrollo) se activa al cargarlo.
 */
export type SiteDomain = ApiSchemas["SiteDomainDto"]
