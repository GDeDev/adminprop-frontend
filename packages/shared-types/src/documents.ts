import type { ApiSchemas } from "./api"

/** Documentos PDF generados por la API (rediseño Fase 15, sección 7). */
export type GeneratedDocument = ApiSchemas["GeneratedDocumentDto"]
export type DocumentKind = GeneratedDocument["kind"]
export type DocumentStatus = GeneratedDocument["status"]

/** `GET /tenants/current/settings` (admin). */
export type TenantSettings = ApiSchemas["TenantSettingsDto"]

/**
 * Todos opcionales; `null` borra el valor (salvo los parámetros de cobro, que
 * una vez fijados no se pueden quitar: D-228 del backend).
 *
 * Sigue escrito a mano: el backoffice manda `name` y el `UpdateTenantSettingsDto`
 * del OpenAPI no lo declara (ver `docs/tecnica/shared-types-generados.md`).
 * `lateFeeStartDay` es solo de lectura: se edita con `paymentGraceDays`.
 */
export type UpdateTenantSettingsRequest = Partial<
  Omit<
    TenantSettings,
    | "id"
    | "slug"
    | "logoUrl"
    | "receiptSequence"
    | "dailyLateFeePercentage"
    | "paymentGraceDays"
    | "lateFeeStartDay"
  >
> &
  Pick<
    ApiSchemas["UpdateTenantSettingsDto"],
    "dailyLateFeePercentage" | "paymentGraceDays"
  >
