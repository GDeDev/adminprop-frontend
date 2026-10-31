import type { ApiSchemas } from "./api"

/**
 * Automatizaciones (Fase 13): jobs, ejecuciones, avisos internos y estado de
 * los índices, tal como los devuelve la API
 * (`adminprop-repo-files/docs/REDISENO_FASE_13.md`, sección 8).
 */

export type JobExecution = ApiSchemas["JobExecutionDto"]
export type Job = ApiSchemas["JobDto"]
export type RunJobRequest = ApiSchemas["RunJobDto"]
export type RunJobResult = ApiSchemas["RunJobResultDto"]
export type InternalAlert = ApiSchemas["InternalAlertDto"]
export type IndexStatus = ApiSchemas["IndexStatusDto"]

export type JobExecutionStatus = JobExecution["status"]
export type JobTrigger = JobExecution["triggeredBy"]
export type JobScope = Job["scope"]
export type InternalAlertType = InternalAlert["type"]
export type IndexFetchStatus = NonNullable<IndexStatus["lastAttemptStatus"]>
