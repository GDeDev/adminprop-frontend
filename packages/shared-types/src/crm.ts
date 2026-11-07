import type { ApiSchemas } from "./api"

/**
 * Contrato de la Fase 23 (REDISENO_FASE_23.md, secciones 5, 5.1 y 7), tal como
 * lo publica el OpenAPI de la API. Los alias reemplazan a los tipos que antes
 * estaban escritos a mano. `CrmOverviewDto` y `PropertyInquiryAnalytics` siguen
 * a mano: ver el comentario de cada uno y `docs/tecnica/shared-types-generados.md`.
 */
export type InquiryPropertyRef = ApiSchemas["InquiryPropertyRefDto"]
export type InquiryUserRef = ApiSchemas["InquiryUserRefDto"]
export type InquiryCard = ApiSchemas["InquiryCardDto"]
export type InquiryActivity = ApiSchemas["InquiryActivityDto"]
export type InquiryDetail = ApiSchemas["InquiryDetailDto"]
export type PipelineColumn = ApiSchemas["PipelineColumnDto"]
export type PipelineDto = ApiSchemas["PipelineDto"]

export type InquiryStage = InquiryCard["stage"]
export type InquirySource = InquiryCard["source"]
export type InquiryActivityType = InquiryActivity["type"]
export type ContactChannel = ApiSchemas["ContactAttemptDto"]["channel"]

export type CreateInquiryRequest = ApiSchemas["CreateInquiryDto"]
export type UpdateInquiryRequest = ApiSchemas["UpdateInquiryDto"]
export type MoveInquiryRequest = ApiSchemas["MoveInquiryDto"]
export type AssignInquiryRequest = ApiSchemas["AssignInquiryDto"]
export type AddInquiryNoteRequest = ApiSchemas["AddInquiryNoteDto"]
export type ContactAttemptRequest = ApiSchemas["ContactAttemptDto"]
export type WhatsAppLinkDto = ApiSchemas["WhatsAppLinkDto"]
export type CrmAssignee = ApiSchemas["CrmAssigneeDto"]
export type CrmTopProperty = ApiSchemas["CrmTopPropertyDto"]
export type PropertyInquiryDailyPoint =
  ApiSchemas["PropertyInquiryAnalyticsDto"]["daily"][number]

/**
 * Sigue a mano: el OpenAPI declara `byStage` y `bySource` como
 * `{ [key: string]: number }`, sin las claves. Acá se cierran por etapa y por
 * origen, que es lo que la API manda siempre (un `Record` completo).
 */
export interface CrmOverviewDto {
  openCount: number
  byStage: Record<InquiryStage, number>
  bySource: Record<InquirySource, number>
  unassignedCount: number
  averageFirstContactHours: number | null
  /** String con 1 decimal o null si no hay datos. */
  conversionRate: string | null
  topProperties: CrmTopProperty[]
}

/** Sigue a mano por lo mismo que `CrmOverviewDto` (`byStage`, `bySource`). */
export interface PropertyInquiryAnalytics {
  views: number
  inquiries: number
  byStage: Record<InquiryStage, number>
  bySource: Record<InquirySource, number>
  conversionRate: string | null
  daily: PropertyInquiryDailyPoint[]
}
