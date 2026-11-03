import type { StartMigrationResult } from "@adminprop/shared-types"

/** Ruta del lote; `job` permite mostrar el avance del trabajo recién lanzado. */
export function batchPath(batchId: string, jobId?: string): string {
  const base = `/configuracion/migracion/${batchId}`
  return jobId ? `${base}?job=${encodeURIComponent(jobId)}` : base
}

export function startedBatchPath(result: StartMigrationResult): string {
  return batchPath(result.batchId, result.jobId)
}
