import type {
  EmailEventType,
  NotificationChannel,
  NotificationDetail,
  NotificationLogItem,
  NotificationRecipientKind,
  NotificationSkipReason,
  NotificationStatus,
  NotificationType,
} from "@adminprop/shared-types"

import { formatDateTime } from "./automations"
import type { BadgeMeta } from "./contracts"

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  PAYMENT_REMINDER: "Recordatorio de pago",
  ARREARS_NOTICE: "Aviso de mora",
  INSURER_ALERT: "Aviso a la aseguradora",
  CONTRACT_EXPIRING: "Contrato por vencer",
  POLICY_EXPIRING: "Póliza por vencer",
  POLICY_EXPIRED: "Póliza vencida",
  SERVICE_OVERDUE: "Servicio vencido",
  STATEMENT_PENDING: "Consolidado pendiente",
  SETTLEMENT_CONFIRMED: "Liquidación confirmada",
  OWNER_STATEMENT_CLOSED: "Consolidado cerrado",
  PAYMENT_RECEIVED: "Pago recibido",
  PUBLIC_INQUIRY: "Consulta del portal público",
  EMAIL_BOUNCED: "Email rebotado",
  NOTIFICATION_FAILED: "Notificación fallida",
  RENT_UPDATE_PENDING: "Aumento pendiente",
  INDEX_FETCH_FAILED: "Índice no disponible",
  INSTALLMENT_BASE_OUTDATED: "Cuota con base desactualizada",
  JOB_FAILED: "Automatización fallida",
  DOCUMENT_FAILED: "Documento no generado",
  COMPARABLES_SOURCE_STALE: "Fuente de comparables desactualizada",
  INQUIRY_FOLLOW_UP: "Seguimiento de consulta",
  INQUIRY_ASSIGNED: "Consulta asignada",
  LISTING_CHANNEL_ERROR: "Error al publicar en un canal",
}

export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  EMAIL: "Email",
  WHATSAPP_LINK: "WhatsApp",
  IN_APP: "En la app",
}

export const RECIPIENT_KIND_LABELS: Record<NotificationRecipientKind, string> =
  {
    TENANT_STAFF: "Personal",
    RENTER: "Inquilino",
    OWNER: "Propietario",
    INSURER: "Aseguradora",
    EXTERNAL: "Externo",
  }

export const SKIP_REASON_LABELS: Record<NotificationSkipReason, string> = {
  TYPE_DISABLED: "El tipo de aviso está desactivado",
  CHANNEL_DISABLED: "El canal está desactivado",
  USER_OPTED_OUT: "La persona lo desactivó en su perfil",
  NO_RECIPIENT_EMAIL: "El destinatario no tiene email cargado",
  NO_PHONE: "El destinatario no tiene teléfono cargado",
}

export const EMAIL_EVENT_LABELS: Record<EmailEventType, string> = {
  SENT: "Enviado al proveedor",
  DELIVERED: "Entregado",
  OPENED: "Abierto",
  CLICKED: "Con clic en un link",
  BOUNCED: "Rebotó",
  COMPLAINED: "Marcado como spam",
  DELAYED: "Entrega demorada",
}

/** Estados con los tokens del sistema de diseño (ADMINPROP-UI.md). */
export function notificationStatusMeta(
  item: Pick<NotificationLogItem, "status" | "attempts">
): BadgeMeta {
  switch (item.status) {
    case "SENT":
      return { label: "Enviada", badge: "disponible" }
    case "FAILED":
      return { label: "Fallida", badge: "mora" }
    case "SKIPPED":
      return { label: "Omitida", badge: "borrador" }
    case "QUEUED":
      return item.attempts > 0
        ? { label: "Reintentando", badge: "mantenimiento" }
        : { label: "En cola", badge: "alquilada" }
  }
}

export const NOTIFICATION_STATUS_FILTERS: {
  value: NotificationStatus
  label: string
}[] = [
  { value: "QUEUED", label: "En cola o reintentando" },
  { value: "SENT", label: "Enviadas" },
  { value: "FAILED", label: "Fallidas" },
  { value: "SKIPPED", label: "Omitidas" },
]

export interface TimelineStep {
  label: string
  at: string
}

/** Cronología de entrega: creada, enviada, entregada, abierta, rebotada. */
export function notificationTimeline(
  item: NotificationDetail | NotificationLogItem
): TimelineStep[] {
  const steps: (TimelineStep | null)[] = [
    { label: "Creada", at: item.createdAt },
    item.sentAt ? { label: "Enviada", at: item.sentAt } : null,
    item.deliveredAt ? { label: "Entregada", at: item.deliveredAt } : null,
    item.openedAt ? { label: "Abierta", at: item.openedAt } : null,
    item.bouncedAt ? { label: "Rebotó", at: item.bouncedAt } : null,
  ]
  return steps
    .filter((step): step is TimelineStep => step !== null)
    .sort((a, b) => a.at.localeCompare(b.at))
}

export function timelineLabel(step: TimelineStep): string {
  return `${step.label} · ${formatDateTime(step.at)}`
}

/** Prende o apaga un canal, sin duplicados y en el orden de `available`. */
export function toggleChannel(
  channels: NotificationChannel[],
  available: NotificationChannel[],
  channel: NotificationChannel
): NotificationChannel[] {
  const next = channels.includes(channel)
    ? channels.filter((c) => c !== channel)
    : [...channels, channel]
  return available.filter((c) => next.includes(c))
}

/** Inserta `{{name}}` en la posición del cursor; devuelve texto y cursor nuevo. */
export function insertVariable(
  text: string,
  name: string,
  start: number,
  end: number
): { text: string; cursor: number } {
  const token = `{{${name}}}`
  return {
    text: text.slice(0, start) + token + text.slice(end),
    cursor: start + token.length,
  }
}

/** Variables `{{x}}` del texto que la plantilla no declara. */
export function unknownVariables(
  text: string,
  allowed: { name: string }[]
): string[] {
  const names = new Set(allowed.map((variable) => variable.name))
  const found = new Set<string>()
  for (const match of text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)) {
    if (!names.has(match[1]!)) found.add(match[1]!)
  }
  return [...found]
}

/** Texto de avance del reintento masivo ("12 de 30"). */
export function resendProgressLabel(
  processed: number,
  total: number | null,
  failed: number
): string {
  const base =
    total === null ? `${processed} procesadas` : `${processed} de ${total}`
  return failed > 0 ? `${base} · ${failed} con error` : base
}
