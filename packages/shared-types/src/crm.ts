import type { IsoDate, IsoDateTime, Uuid } from "./common"

/**
 * Contrato de la Fase 23 (REDISENO_FASE_23.md, secciones 5, 5.1 y 7). Escrito a
 * mano hasta regenerar desde el OpenAPI del backend.
 */
export type InquiryStage =
  | "NEW"
  | "CONTACTED"
  | "VISIT_SCHEDULED"
  | "PROPOSAL_SENT"
  | "CLOSED_WON"
  | "CLOSED_LOST"

export type InquirySource =
  | "PORTAL"
  | "MERCADOLIBRE"
  | "ZONAPROP"
  | "ARGENPROP"
  | "WHATSAPP"
  | "PHONE"
  | "MANUAL"

export type InquiryActivityType =
  | "CREATED"
  | "STAGE_CHANGED"
  | "ASSIGNED"
  | "NOTE"
  | "CONTACT_ATTEMPT"
  | "FOLLOW_UP_SET"
  | "EDITED"

export type ContactChannel = "WHATSAPP" | "PHONE" | "EMAIL"

export interface InquiryPropertyRef {
  id: Uuid
  address: string
}

export interface InquiryUserRef {
  id: Uuid
  fullName: string
}

export interface InquiryCard {
  id: Uuid
  name: string
  email: string | null
  phone: string | null
  /** Primeros 140 caracteres. */
  message: string
  stage: InquiryStage
  /** Decimal para ordenar dentro de la columna (A-82). */
  boardPosition: number
  source: InquirySource
  property: InquiryPropertyRef | null
  assignedTo: InquiryUserRef | null
  nextActionAt: IsoDate | null
  lastContactAt: IsoDateTime | null
  createdAt: IsoDateTime
  ageHours: number
  hasWhatsApp: boolean
}

export interface InquiryActivity {
  id: Uuid
  type: InquiryActivityType
  /** Null = el sistema. */
  author: InquiryUserRef | null
  /** `{ from, to }`, `{ body }`, `{ channel }`... según el tipo. */
  payload: Record<string, unknown>
  createdAt: IsoDateTime
}

export interface InquiryDetail extends InquiryCard {
  /** Mensaje completo. */
  message: string
  lostReason: string | null
  closedAt: IsoDateTime | null
  contractId: Uuid | null
  activities: InquiryActivity[]
}

export interface PipelineColumn {
  stage: InquiryStage
  total: number
  /** Hasta 50, ordenadas por `boardPosition`. */
  cards: InquiryCard[]
}

export interface PipelineDto {
  columns: PipelineColumn[]
}

export interface CreateInquiryRequest {
  name: string
  email?: string
  phone?: string
  message?: string
  propertyId?: Uuid
  source: "WHATSAPP" | "PHONE" | "MANUAL" | "ZONAPROP" | "ARGENPROP"
  assignedToId?: Uuid
}

export interface UpdateInquiryRequest {
  name?: string
  email?: string
  phone?: string
  propertyId?: Uuid
  nextActionAt?: IsoDate | null
}

export interface MoveInquiryRequest {
  stage: InquiryStage
  beforeId?: Uuid
  afterId?: Uuid
  /** Obligatorio para `CLOSED_LOST`. */
  lostReason?: string
  contractId?: Uuid
}

export interface AssignInquiryRequest {
  userId: Uuid | null
}

export interface AddInquiryNoteRequest {
  /** Máx. 2000. */
  body: string
}

export interface ContactAttemptRequest {
  channel: ContactChannel
}

export interface WhatsAppLinkDto {
  url: string | null
  message: string
}

export interface CrmAssignee {
  id: Uuid
  fullName: string
  role: string
}

export interface CrmTopProperty {
  propertyId: Uuid
  address: string
  inquiries: number
  views: number
}

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

export interface PropertyInquiryDailyPoint {
  date: IsoDate
  views: number
  inquiries: number
}

export interface PropertyInquiryAnalytics {
  views: number
  inquiries: number
  byStage: Record<InquiryStage, number>
  bySource: Record<InquirySource, number>
  conversionRate: string | null
  daily: PropertyInquiryDailyPoint[]
}
