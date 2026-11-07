import type { ApiSchemas } from "./api"

/**
 * Auditoría (Fase 20), tal como la devuelve la API. Es alias del OpenAPI salvo
 * `AuditChange`: la API documenta `before`/`after` como `object | null` pero en
 * runtime llevan cualquier valor JSON (strings, números, booleanos). Ver
 * `docs/tecnica/shared-types-generados.md`.
 */
export type AuditEntry = ApiSchemas["AuditEntryDto"]
export type AuditCatalog = ApiSchemas["AuditCatalogDto"]

export type AuditAction = AuditEntry["action"]
export type AuditActorKind = AuditEntry["actorKind"]

export interface AuditChange {
  field: string
  before: unknown
  after: unknown
  /** Nombre legible cuando el valor es un id (propiedad, inquilino…). */
  beforeLabel?: string | null
  afterLabel?: string | null
}

export interface AuditEntryDetail extends AuditEntry {
  changes: AuditChange[]
}
