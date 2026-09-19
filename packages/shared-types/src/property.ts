import type { ApiSchemas } from "./api"

/** Propiedades (PRD 5.1, Fase 6), tal como las devuelve la API. */

/** Una fila del listado: tipo y ubicación expandidos, foto principal. */
export type PropertySummary = ApiSchemas["PropertySummaryDto"]
/** La ficha: además amenities, notas internas y todas las fotos. */
export type PropertyDetail = ApiSchemas["PropertyDetailDto"]
export type PropertyPhoto = PropertyDetail["photos"][number]
export type PropertyStatus = PropertySummary["status"]

export type CreatePropertyRequest = ApiSchemas["CreatePropertyDto"]
export type UpdatePropertyRequest = ApiSchemas["UpdatePropertyDto"]
