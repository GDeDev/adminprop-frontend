import type { ApiSchemas } from "./api"
import type { IsoDateTime, Uuid } from "./common"

/**
 * Contrato de la Fase 21 (REDISENO_FASE_21.md, secciones 5 y 6), tal como lo
 * publica el OpenAPI de la API. `ImportCounts`, `ImportBatchSummary` e
 * `ImportBatchDetail` siguen a mano: ver el comentario de cada uno y
 * `docs/tecnica/shared-types-generados.md`.
 */
export type ImportSource = ApiSchemas["ImportBatchSummaryDto"]["source"]

export type ImportBatchStatus = ApiSchemas["ImportBatchSummaryDto"]["status"]

export type ImportEntity = ApiSchemas["ImportRowDto"]["entity"]

export type ImportRowStatus = ApiSchemas["ImportRowDto"]["status"]

export type ImportResolution =
  ApiSchemas["ConfirmImportDto"]["defaultConflictResolution"]

export type AnalyzeTokkoRequest = ApiSchemas["AnalyzeTokkoDto"]
export type StartMigrationResult = ApiSchemas["StartMigrationResultDto"]
export type ImportEntityCounts = ApiSchemas["ImportEntityCountsDto"]
export type ImportMastersCount = ApiSchemas["ImportMastersCountDto"]
export type ImportRowError = ApiSchemas["ImportRowErrorDto"]
export type ImportRowConflict = ApiSchemas["ImportRowConflictDto"]
export type ImportRowDto = ApiSchemas["ImportRowDto"]
export type UpdateImportRowRequest = ApiSchemas["UpdateImportRowDto"]
export type ConfirmImportRequest = ApiSchemas["ConfirmImportDto"]
export type RetryAssetsResult = ApiSchemas["RetryAssetsResultDto"]

/**
 * Sigue a mano: el OpenAPI declara `byEntity` como
 * `{ [key: string]: ImportEntityCountsDto }`, sin las cinco entidades. Acá se
 * cierra por `ImportEntity`, que es lo que la API manda siempre.
 */
export interface ImportCounts {
  total: number
  valid: number
  errors: number
  conflicts: number
  alreadyImported: number
  imported: number
  skipped: number
  failed: number
  needsReview: number
  byEntity: Record<ImportEntity, ImportEntityCounts>
}

/** Sigue a mano por `counts` (ver `ImportCounts`). */
export interface ImportBatchSummary {
  id: Uuid
  source: ImportSource
  status: ImportBatchStatus
  fileName: string | null
  createdBy: { id: Uuid; fullName: string }
  createdAt: IsoDateTime
  confirmedAt: IsoDateTime | null
  counts: ImportCounts
}

/**
 * Sigue a mano por `counts`. Además, el OpenAPI trae `errorMessage: string |
 * null` (requerido) que este tipo no tiene y la UI no muestra todavía.
 */
export interface ImportBatchDetail extends ImportBatchSummary {
  missingSheets: string[]
  mastersToCreate: ImportMastersCount
  mastersCreated: ImportMastersCount
  assets: { migrated: number; failed: number; pending: number }
  canConfirm: boolean
}
