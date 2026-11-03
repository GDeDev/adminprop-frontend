import type {
  ImportBatchStatus,
  ImportCounts,
  ImportEntity,
  ImportMastersCount,
  ImportResolution,
  ImportRowDto,
  ImportRowStatus,
  ImportSource,
} from "@adminprop/shared-types"

import type { BadgeMeta } from "./contracts"

export const MAX_EXCEL_BYTES = 10 * 1024 * 1024

export const SOURCE_LABELS: Record<ImportSource, string> = {
  EXCEL: "Excel",
  TOKKO: "Tokko",
}

/** Orden de importación del rediseño (sección 5): propietarios → … → contratos. */
export const ENTITY_ORDER: ImportEntity[] = [
  "OWNER",
  "GUARANTOR",
  "RENTER",
  "PROPERTY",
  "CONTRACT",
]

export const ENTITY_LABELS: Record<ImportEntity, string> = {
  OWNER: "Propietarios",
  RENTER: "Inquilinos",
  GUARANTOR: "Garantes",
  PROPERTY: "Propiedades",
  CONTRACT: "Contratos",
}

/** Singular/plural para el resumen de confirmación ("1 propiedad", "3 propiedades"). */
const ENTITY_NOUNS: Record<ImportEntity, [string, string]> = {
  OWNER: ["propietario", "propietarios"],
  RENTER: ["inquilino", "inquilinos"],
  GUARANTOR: ["garante", "garantes"],
  PROPERTY: ["propiedad", "propiedades"],
  CONTRACT: ["contrato", "contratos"],
}

export const RESOLUTION_LABELS: Record<ImportResolution, string> = {
  SKIP: "Saltear",
  MERGE_EMPTY_FIELDS: "Completar vacíos",
}

export function batchStatusMeta(status: ImportBatchStatus): BadgeMeta {
  switch (status) {
    case "ANALYZING":
      return { label: "Analizando", badge: "alquilada" }
    case "READY":
      return { label: "Para revisar", badge: "mantenimiento" }
    case "IMPORTING":
      return { label: "Importando", badge: "alquilada" }
    case "COMPLETED":
      return { label: "Importado", badge: "disponible" }
    case "PARTIAL":
      return { label: "Importado con errores", badge: "mantenimiento" }
    case "FAILED":
      return { label: "Falló", badge: "mora" }
    case "DISCARDED":
      return { label: "Descartado", badge: "borrador" }
  }
}

export const BATCH_STATUS_FILTERS: {
  value: ImportBatchStatus
  label: string
}[] = (
  [
    "READY",
    "ANALYZING",
    "IMPORTING",
    "COMPLETED",
    "PARTIAL",
    "FAILED",
    "DISCARDED",
  ] as const
).map((value) => ({ value, label: batchStatusMeta(value).label }))

export function rowStatusMeta(status: ImportRowStatus): BadgeMeta {
  switch (status) {
    case "VALID":
      return { label: "Lista", badge: "disponible" }
    case "ERROR":
      return { label: "Con errores", badge: "mora" }
    case "CONFLICT":
      return { label: "Conflicto", badge: "mantenimiento" }
    case "ALREADY_IMPORTED":
      return { label: "Ya importada", badge: "borrador" }
    case "IMPORTED":
      return { label: "Importada", badge: "disponible" }
    case "SKIPPED":
      return { label: "Salteada", badge: "borrador" }
    case "FAILED":
      return { label: "Falló", badge: "mora" }
  }
}

export const ROW_STATUS_FILTERS: { value: ImportRowStatus; label: string }[] = (
  [
    "VALID",
    "ERROR",
    "CONFLICT",
    "ALREADY_IMPORTED",
    "IMPORTED",
    "SKIPPED",
    "FAILED",
  ] as const
).map((value) => ({ value, label: rowStatusMeta(value).label }))

/** Pantalla que corresponde al estado del lote. */
export type BatchPhase =
  "analyzing" | "review" | "importing" | "result" | "discarded"

export function batchPhase(status: ImportBatchStatus): BatchPhase {
  switch (status) {
    case "ANALYZING":
      return "analyzing"
    case "READY":
      return "review"
    case "IMPORTING":
      return "importing"
    case "DISCARDED":
      return "discarded"
    default:
      return "result"
  }
}

/** El lote todavía se está procesando: hay que seguir consultándolo. */
export function isBatchRunning(status: ImportBatchStatus | undefined): boolean {
  return status === "ANALYZING" || status === "IMPORTING"
}

export function rowLocation(
  row: Pick<ImportRowDto, "rowNumber" | "externalId">
): string {
  if (row.rowNumber !== null) return `Fila ${row.rowNumber}`
  if (row.externalId) return `Tokko #${row.externalId}`
  return "—"
}

/** Cuántas filas de cada entidad se van a crear (las `VALID` que no se excluyeron). */
export function importableByEntity(
  counts: ImportCounts,
  excludedValidByEntity: Partial<Record<ImportEntity, number>> = {}
): Partial<Record<ImportEntity, number>> {
  const result: Partial<Record<ImportEntity, number>> = {}
  for (const entity of ENTITY_ORDER) {
    const valid =
      (counts.byEntity[entity]?.valid ?? 0) -
      (excludedValidByEntity[entity] ?? 0)
    if (valid > 0) result[entity] = valid
  }
  return result
}

/** "Se crearán 3 propiedades y 2 propietarios." (en el orden de importación). */
export function confirmSummary(
  creatable: Partial<Record<ImportEntity, number>>
): string {
  const parts = ENTITY_ORDER.flatMap((entity) => {
    const n = creatable[entity]
    if (!n) return []
    const [one, many] = ENTITY_NOUNS[entity]
    return [`${n} ${n === 1 ? one : many}`]
  })
  if (parts.length === 0) return "No hay filas para importar."
  const total = ENTITY_ORDER.reduce((sum, e) => sum + (creatable[e] ?? 0), 0)
  const verb = total === 1 ? "Se creará" : "Se crearán"
  const last = parts.pop()!
  const list = parts.length > 0 ? `${parts.join(", ")} y ${last}` : last
  return `${verb} ${list}.`
}

/** Valida el archivo antes de subirlo (el servidor igual revalida). */
export function validateExcelFile(
  file: Pick<File, "name" | "size">
): string | null {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return "El archivo tiene que ser un Excel .xlsx. Descargá la plantilla y completala."
  }
  if (file.size === 0) return "El archivo está vacío."
  if (file.size > MAX_EXCEL_BYTES) return "El archivo pesa más de 10 MB."
  return null
}

/** Mensaje en español para los errores propios de la migración. */
export function migrationErrorMessage(code: string | undefined): string | null {
  switch (code) {
    case "INVALID_XLSX":
      return "No se pudo leer el archivo: tiene que ser un Excel .xlsx válido."
    case "TEMPLATE_VERSION_MISMATCH":
      return "El archivo es de una versión vieja de la plantilla. Descargá la plantilla actual y pasá tus datos."
    case "BATCH_NOT_READY":
      return "El lote todavía no está listo para importar."
    case "BATCH_ALREADY_CONFIRMED":
      return "Este lote ya se confirmó."
    default:
      return null
  }
}

/** "12 de 40 · 2 con error" para el avance de un trabajo. */
export function jobProgressLabel(
  processed: number | null,
  total: number | null,
  failed: number | null
): string {
  if (total === null) return "Calculando…"
  const base = `${processed ?? 0} de ${total}`
  return failed ? `${base} · ${failed} con error` : base
}

export function mastersTotal(masters: ImportMastersCount): number {
  return masters.locations + masters.propertyTypes + masters.amenities
}

export function mastersSummary(masters: ImportMastersCount): string {
  const parts: string[] = []
  if (masters.locations) {
    parts.push(
      `${masters.locations} ${masters.locations === 1 ? "ubicación" : "ubicaciones"}`
    )
  }
  if (masters.propertyTypes) {
    parts.push(
      `${masters.propertyTypes} ${masters.propertyTypes === 1 ? "tipo de propiedad" : "tipos de propiedad"}`
    )
  }
  if (masters.amenities) {
    parts.push(
      `${masters.amenities} ${masters.amenities === 1 ? "amenity" : "amenities"}`
    )
  }
  return parts.join(", ")
}
