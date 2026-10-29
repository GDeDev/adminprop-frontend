import type { AdvanceExpenseRegisteredBy as UserRef } from "./service"

/**
 * Automatizaciones (Fase 13): jobs, ejecuciones, avisos internos y estado de
 * los índices. Nombres acordados en `REDISENO_FASE_13.md`, sección 8.
 *
 * TODO(fase-13): reemplazar por alias a `ApiSchemas["…Dto"]` cuando el
 * `openapi.json` de `feature/fase-13-cron` esté exportado.
 */

export type JobExecutionStatus =
  "RUNNING" | "SUCCEEDED" | "PARTIAL" | "FAILED" | "SKIPPED"
export type JobTrigger = "SCHEDULE" | "MANUAL"
export type JobScope = "TENANT" | "GLOBAL"
export type IndexFetchStatus = "SUCCEEDED" | "PARTIAL" | "FAILED" | "SKIPPED"
export type InternalAlertType =
  | "RENT_UPDATE_PENDING"
  | "INDEX_FETCH_FAILED"
  | "INSTALLMENT_BASE_OUTDATED"
  | "STATEMENT_PENDING"
  | "DOCUMENT_FAILED"
  | "JOB_FAILED"

export interface JobExecution {
  id: string
  job: string
  tenantId: string | null
  scheduledFor: string
  startedAt: string
  finishedAt: string | null
  status: JobExecutionStatus
  affected: number
  summary: string | null
  error: string | null
  triggeredBy: JobTrigger
  triggeredByUser: UserRef | null
}

export interface Job {
  name: string
  title: string
  description: string
  cron: string
  cronLabel: string
  scope: JobScope
  lastExecution: JobExecution | null
  nextRunAt: string | null
}

export interface RunJobRequest {
  period?: string
}

export interface RunJobResult {
  executionId: string
}

export interface InternalAlert {
  id: string
  type: InternalAlertType
  title: string
  body: string
  entityType: string | null
  entityId: string | null
  link: string | null
  createdAt: string
  readAt: string | null
}

export interface IndexStatus {
  indexType: "ICL" | "IPC"
  latestPeriod: string | null
  latestValue: string | null
  source: string | null
  lastAttemptAt: string | null
  lastAttemptStatus: IndexFetchStatus | null
  lastAttemptError: string | null
  provider: "bcra-indec" | "manual"
}
