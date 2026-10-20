import type { ApiSchemas } from "./api"

/** Propietarios (PRD 5.2, Fase 7), tal como los devuelve la API. */

/** Una fila del listado: cantidad de propiedades y honorario reducido ya calculados. */
export type OwnerSummary = ApiSchemas["OwnerSummaryDto"]
/** La ficha: además dirección, notas, cuenta bancaria y sus propiedades. */
export type OwnerDetail = ApiSchemas["OwnerDetailDto"]
export type OwnerProperty = ApiSchemas["OwnerPropertyDto"]
export type OwnerRef = ApiSchemas["OwnerRefDto"]
export type BankAccount = ApiSchemas["BankAccountViewDto"]

export type CreateOwnerRequest = ApiSchemas["CreateOwnerDto"]
export type UpdateOwnerRequest = ApiSchemas["UpdateOwnerDto"]
export type BankAccountRequest = ApiSchemas["BankAccountDto"]

/** `GET /owners/check`: quién tiene ese DNI y quién comparte ese CBU. */
export type OwnerDataCheck = ApiSchemas["OwnerDataCheckDto"]
/** `POST /owners/:id/portal-credentials`: la contraseña viene una sola vez. */
export type PortalCredentials = ApiSchemas["PortalCredentialsDto"]
