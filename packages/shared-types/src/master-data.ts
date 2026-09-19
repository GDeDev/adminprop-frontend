import type { ApiSchemas } from "./api"

/**
 * Maestros (PRD 5.8, Fase 5), tal como los devuelve la API. Son de cada
 * inmobiliaria (D-26 del backend): la API filtra por la del usuario.
 */

/** Un ítem de los maestros planos: tipos de propiedad, de operación, de servicio y amenities. */
export type CatalogItem = ApiSchemas["CatalogItemDto"]

export type PropertyType = CatalogItem
export type OperationType = CatalogItem
export type ServiceType = CatalogItem
/** `icon`: nombre de ícono de lucide, o null. */
export type Amenity = CatalogItem

/** Segmento de la URL de cada maestro plano (`/api/v1/<catalog>`). */
export type CatalogKey =
  "property-types" | "amenities" | "operation-types" | "service-types"

export type Location = ApiSchemas["LocationDto"]
export type LocationLevel = Location["level"]
/** Un nodo de `GET /locations/tree`. */
export type LocationNode = ApiSchemas["LocationNodeDto"]
