import type { IsoDateTime, Uuid } from "./common"

/**
 * Contrato de la Fase 14 (REDISENO_FASE_14.md, secciones 3 y 6). Escrito a mano
 * hasta regenerar desde el OpenAPI del backend.
 */
export type NotificationType =
  | "PAYMENT_REMINDER"
  | "ARREARS_NOTICE"
  | "INSURER_ALERT"
  | "CONTRACT_EXPIRING"
  | "POLICY_EXPIRING"
  | "POLICY_EXPIRED"
  | "SERVICE_OVERDUE"
  | "STATEMENT_PENDING"
  | "SETTLEMENT_CONFIRMED"
  | "OWNER_STATEMENT_CLOSED"
  | "PAYMENT_RECEIVED"
  | "PUBLIC_INQUIRY"
  | "EMAIL_BOUNCED"
  | "NOTIFICATION_FAILED"
  | "RENT_UPDATE_PENDING"
  | "INDEX_FETCH_FAILED"
  | "INSTALLMENT_BASE_OUTDATED"
  | "JOB_FAILED"
  | "DOCUMENT_FAILED"

export type NotificationChannel = "EMAIL" | "WHATSAPP_LINK" | "IN_APP"

export type NotificationStatus = "QUEUED" | "SENT" | "FAILED" | "SKIPPED"

export type NotificationRecipientKind =
  "TENANT_STAFF" | "RENTER" | "OWNER" | "INSURER" | "EXTERNAL"

export type NotificationSkipReason =
  | "TYPE_DISABLED"
  | "CHANNEL_DISABLED"
  | "USER_OPTED_OUT"
  | "NO_RECIPIENT_EMAIL"
  | "NO_PHONE"

export type EmailEventType =
  | "SENT"
  | "DELIVERED"
  | "OPENED"
  | "CLICKED"
  | "BOUNCED"
  | "COMPLAINED"
  | "DELAYED"

/** Tipos de aviso interno que suma esta fase a la campana (A-55). */
export type NotificationAlertType = "NOTIFICATION_FAILED" | "EMAIL_BOUNCED"

export interface NotificationLogItem {
  id: Uuid
  type: NotificationType
  templateKey: string | null
  channel: NotificationChannel
  status: NotificationStatus
  skipReason: NotificationSkipReason | null
  recipientKind: NotificationRecipientKind
  /** Nombre o email del destinatario. */
  recipientLabel: string
  recipientEmail: string | null
  entityType: string | null
  entityId: Uuid | null
  attempts: number
  nextAttemptAt: IsoDateTime | null
  lastError: string | null
  sentAt: IsoDateTime | null
  deliveredAt: IsoDateTime | null
  openedAt: IsoDateTime | null
  bouncedAt: IsoDateTime | null
  createdAt: IsoDateTime
}

export interface EmailEventDto {
  id: Uuid
  type: EmailEventType
  occurredAt: IsoDateTime
}

export interface NotificationDetail extends NotificationLogItem {
  subject: string | null
  bodyText: string | null
  events: EmailEventDto[]
  canResend: boolean
}

export interface NotificationTypeSetting {
  type: NotificationType
  title: string
  description: string
  /** Para quién es, en texto (ej. "Inquilino"). */
  audience: string
  enabled: boolean
  channels: NotificationChannel[]
  availableChannels: NotificationChannel[]
  mandatory: boolean
}

export interface UpdateNotificationSettingsRequest {
  settings: {
    type: NotificationType
    enabled: boolean
    channels: NotificationChannel[]
  }[]
}

export interface NotificationTemplateVariable {
  name: string
  label: string
  example: string
}

export interface NotificationTemplateDto {
  key: string
  type: NotificationType
  channel: NotificationChannel
  title: string
  subject: string
  bodyText: string
  variables: NotificationTemplateVariable[]
  isCustomized: boolean
  updatedAt: IsoDateTime | null
}

export interface UpdateNotificationTemplateRequest {
  subject: string
  bodyText: string
}

export interface PreviewTemplateRequest {
  subject: string
  bodyText: string
}

export interface TemplatePreviewDto {
  subject: string
  text: string
  html: string
}

export interface TestTemplateResult {
  sentTo: string
}

export interface MyNotificationPreferenceItem {
  type: NotificationType
  title: string
  emailEnabled: boolean
  inAppEnabled: boolean
  mandatory: boolean
}

export interface MyNotificationPreferences {
  items: MyNotificationPreferenceItem[]
}

export interface UpdateMyNotificationPreferencesRequest {
  items: {
    type: NotificationType
    emailEnabled: boolean
    inAppEnabled: boolean
  }[]
}

export interface WhatsAppTemplateVariable {
  name: string
  label: string
}

export interface WhatsAppTemplateDto {
  key: string
  title: string
  body: string
  variables: WhatsAppTemplateVariable[]
  isCustomized: boolean
}

export interface UpdateWhatsAppTemplateRequest {
  body: string
}

export interface ResendFailedRequest {
  from?: string
  to?: string
  type?: NotificationType
}

export interface ResendFailedResult {
  jobId: Uuid
}
