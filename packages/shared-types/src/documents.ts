import type { ApiSchemas } from "./api"

/** Documentos PDF generados por la API (rediseño Fase 15, sección 7). */
export type GeneratedDocument = ApiSchemas["GeneratedDocumentDto"]
export type DocumentKind = GeneratedDocument["kind"]
export type DocumentStatus = GeneratedDocument["status"]

/** `GET /tenants/current/settings` (admin). */
export type TenantSettings = ApiSchemas["TenantSettingsDto"]

/**
 * Todos opcionales; `null` borra el valor.
 *
 * Sigue escrito a mano: el backoffice manda `name` y el `UpdateTenantSettingsDto`
 * del OpenAPI no lo declara (ver `docs/tecnica/shared-types-generados.md`).
 */
export type UpdateTenantSettingsRequest = Partial<
  Omit<TenantSettings, "id" | "slug" | "logoUrl" | "receiptSequence">
>
