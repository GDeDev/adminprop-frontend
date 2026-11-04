import type { ApiSchemas } from "./api"

/**
 * Contrato del sitio web de la inmobiliaria (spec `web-inmobiliaria.md`,
 * sección 5.1), tal como lo publica el OpenAPI de la API. Antes estaba copiado
 * a mano de la spec; el OpenAPI es más estricto (`radius: 0 | 8 | 16 | 24`,
 * `icon` de la lista cerrada), así que los alias lo reemplazan sin aflojar nada.
 */
export type SiteTheme = ApiSchemas["SiteThemeDto"]
export type SiteContent = ApiSchemas["SiteContentDto"]
export type SiteSettingsDraft = ApiSchemas["SiteSettingsDraftDto"]
export type SiteSettings = ApiSchemas["SiteSettingsDto"]
export type SiteTemplateInfo = ApiSchemas["SiteTemplateInfoDto"]
/** Lo que lee el sitio público (lista blanca). */
export type PublicSite = ApiSchemas["PublicSiteDto"]
export type SiteAsset = ApiSchemas["SiteAssetDto"]

export type SiteTemplateKey = SiteTemplateInfo["key"]
export type SiteSectionKey = SiteContent["sections"][number]["key"]
