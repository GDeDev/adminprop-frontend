import type { IsoDateTime, Uuid } from "./common"

/**
 * Contrato de la Fase 21 (REDISENO_FASE_21.md, secciones 5 y 6). Escrito a mano
 * hasta regenerar desde el OpenAPI del backend.
 */
export type ImportSource = "EXCEL" | "TOKKO"

export type ImportBatchStatus =
  | "ANALYZING"
  | "READY"
  | "IMPORTING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED"
  | "DISCARDED"

export type ImportEntity =
  "OWNER" | "RENTER" | "GUARANTOR" | "PROPERTY" | "CONTRACT"

export type ImportRowStatus =
  | "VALID"
  | "ERROR"
  | "CONFLICT"
  | "ALREADY_IMPORTED"
  | "IMPORTED"
  | "SKIPPED"
  | "FAILED"

export type ImportResolution = "SKIP" | "MERGE_EMPTY_FIELDS"

export interface AnalyzeTokkoRequest {
  /** Por defecto `["Rent"]` (A-75). */
  operationTypes?: string[]
  /** Para probar con pocas propiedades. */
  limit?: number
  includeAssets: boolean
}

export interface StartMigrationResult {
  batchId: Uuid
  jobId: Uuid
}

export interface ImportEntityCounts {
  total: number
  valid: number
  errors: number
  conflicts: number
  imported: number
}

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

export interface ImportMastersCount {
  locations: number
  propertyTypes: number
  amenities: number
}

export interface ImportBatchDetail extends ImportBatchSummary {
  missingSheets: string[]
  mastersToCreate: ImportMastersCount
  mastersCreated: ImportMastersCount
  assets: { migrated: number; failed: number; pending: number }
  canConfirm: boolean
}

export interface ImportRowError {
  field: string
  code: string
  message: string
}

export interface ImportRowConflict {
  entityId: Uuid
  reason: string
  differingFields: string[]
}

export interface ImportRowDto {
  id: Uuid
  entity: ImportEntity
  rowNumber: number | null
  externalId: string | null
  /** Texto para identificar la fila (ej. "Av. Santa Fe 1234"). */
  label: string
  status: ImportRowStatus
  errors: ImportRowError[]
  conflict: ImportRowConflict | null
  resolution: ImportResolution | null
  excluded: boolean
  needsReview: boolean
  targetId: Uuid | null
}

export interface UpdateImportRowRequest {
  excluded?: boolean
  resolution?: ImportResolution
}

export interface ConfirmImportRequest {
  excludeRowIds?: string[]
  defaultConflictResolution: ImportResolution
  migrateAssets?: boolean
}

export interface RetryAssetsResult {
  jobId: Uuid
}
