import type { ApiSchemas } from "./api"
import type { Currency, Uuid } from "./common"

/**
 * Catálogo público de propiedades (Fase 22 y sitio web), tal como lo devuelve
 * la API.
 */
export type PublicPropertySummary = ApiSchemas["PublicPropertySummaryDto"]
export type PublicPropertyDetail = ApiSchemas["PublicPropertyDetailDto"]
export type PublicFilters = ApiSchemas["PublicFiltersDto"]

/**
 * Sigue escrito a mano: el formulario exige `phone`, `propertyId` y `website`
 * (honeypot) aunque la API los declara opcionales. Es más estricto a propósito;
 * ver `docs/tecnica/shared-types-generados.md`.
 */
export interface PublicContactRequest {
  name: string
  email: string
  phone: string
  message: string
  propertyId: Uuid | null
  /** Honeypot: siempre vacío desde el formulario real. */
  website: string
}

/** Parámetros de query del listado público (no son un DTO del OpenAPI). */
export interface PublicListingQuery {
  locationId?: string
  propertyTypeId?: string
  priceFrom?: string
  priceTo?: string
  currency?: Currency
  /** Sitio web: venta o alquiler, mínimos de dormitorios y baños, y selección por ids. */
  operation?: "SALE" | "RENT"
  bedrooms?: number
  bathrooms?: number
  ids?: string[]
  page?: number
}
