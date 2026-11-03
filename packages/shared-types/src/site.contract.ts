/**
 * Verificación en tiempo de compilación: lo que la API publica en su OpenAPI
 * (con las uniones cerradas, como `radius: 0 | 8 | 16 | 24`) tiene que poder
 * usarse donde el contrato de la spec (`site.ts`) lo pide. Si la API cambia o
 * quita un campo, `tsc` falla acá.
 *
 * Es de un solo sentido a propósito: la spec es más ancha (`radius: number`) y
 * la API, que valida, más estrecha.
 */
import type {
  PublicSiteSchema,
  SiteAssetSchema,
  SiteSettingsSchema,
  SiteTemplateInfoSchema,
} from "./api"
import type {
  PublicSite,
  SiteAsset,
  SiteSettings,
  SiteTemplateInfo,
} from "./site"

type Assignable<From, To> = [From] extends [To] ? true : false
type Assert<T extends true> = T

export type SiteContractChecks = [
  Assert<Assignable<SiteSettingsSchema, SiteSettings>>,
  Assert<Assignable<SiteTemplateInfoSchema, SiteTemplateInfo>>,
  Assert<Assignable<PublicSiteSchema, PublicSite>>,
  Assert<Assignable<SiteAssetSchema, SiteAsset>>,
]
