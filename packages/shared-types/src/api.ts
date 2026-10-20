/**
 * Tipos del contrato HTTP, tomados del OpenAPI de la API.
 *
 * `generated/api.ts` lo escribe `npm run api:types` (desde la raíz) a partir de
 * `../adminprop-backend/openapi.json`. No se edita a mano: si la API cambió,
 * se regenera. Acá sólo se les pone nombres cortos a los que usan las apps.
 */
import type { components, paths } from "./generated/api"

export type { components, paths }

export type ApiSchemas = components["schemas"]

/** Usuario tal como lo devuelve la API: nunca lleva el hash ni datos internos. */
export type User = ApiSchemas["PublicUserDto"]
export type AuthTokens = ApiSchemas["AuthTokensDto"]
export type AuthResult = ApiSchemas["AuthResultDto"]
export type TenantBranding = ApiSchemas["TenantBrandingDto"]
export type PaginationMeta = ApiSchemas["PaginationMetaDto"]

export type LoginRequest = ApiSchemas["LoginDto"]
export type PortalLoginRequest = ApiSchemas["PortalLoginDto"]
export type CreateUserRequest = ApiSchemas["CreateUserDto"]
export type UpdateUserRequest = ApiSchemas["UpdateUserDto"]
export type ResetUserPasswordRequest = ApiSchemas["ResetUserPasswordDto"]
export type ChangePasswordRequest = ApiSchemas["ChangePasswordDto"]

/** Página de un listado: `data.data` y `data.pagination` dentro del sobre. */
export interface Paginated<T> {
  data: T[]
  pagination: PaginationMeta
}
