import type { ApiSchemas } from "./api"

/**
 * Notificaciones (Fase 14), tal como las devuelve la API. Todo es alias del
 * OpenAPI: los nombres cortos son los que usan las apps.
 */
export type NotificationLogItem = ApiSchemas["NotificationLogItemDto"]
export type NotificationDetail = ApiSchemas["NotificationDetailDto"]
export type EmailEventDto = ApiSchemas["EmailEventDto"]

export type NotificationType = NotificationLogItem["type"]
export type NotificationChannel = NotificationLogItem["channel"]
export type NotificationStatus = NotificationLogItem["status"]
export type NotificationRecipientKind = NotificationLogItem["recipientKind"]
export type NotificationSkipReason = NonNullable<
  NotificationLogItem["skipReason"]
>
export type EmailEventType = EmailEventDto["type"]

/** Tipos de aviso interno que suma esta fase a la campana (A-55). */
export type NotificationAlertType = Extract<
  NotificationType,
  "NOTIFICATION_FAILED" | "EMAIL_BOUNCED"
>

export type NotificationTypeSetting = ApiSchemas["NotificationTypeSettingDto"]
export type UpdateNotificationSettingsRequest =
  ApiSchemas["UpdateNotificationSettingsDto"]

export type NotificationTemplateVariable = ApiSchemas["TemplateVariableDto"]
export type NotificationTemplateDto = ApiSchemas["NotificationTemplateDto"]
export type UpdateNotificationTemplateRequest = ApiSchemas["TemplateBodyDto"]
export type PreviewTemplateRequest = ApiSchemas["TemplateBodyDto"]
export type TemplatePreviewDto = ApiSchemas["TemplatePreviewDto"]
export type TestTemplateResult = ApiSchemas["TestTemplateResultDto"]

export type MyNotificationPreferenceItem = ApiSchemas["MyPreferenceItemViewDto"]
export type MyNotificationPreferences =
  ApiSchemas["MyNotificationPreferencesDto"]
export type UpdateMyNotificationPreferencesRequest =
  ApiSchemas["UpdateMyPreferencesDto"]

export type WhatsAppTemplateVariable = ApiSchemas["WhatsAppVariableDto"]
export type WhatsAppTemplateDto = ApiSchemas["WhatsAppTemplateDto"]
export type UpdateWhatsAppTemplateRequest =
  ApiSchemas["UpdateWhatsAppTemplateDto"]

export type ResendFailedRequest = ApiSchemas["ResendFailedDto"]
export type ResendFailedResult = ApiSchemas["ResendFailedResultDto"]
