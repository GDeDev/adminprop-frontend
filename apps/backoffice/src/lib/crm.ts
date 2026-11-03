import { apiErrorCode, apiErrorMessage } from "@adminprop/session/client"
import type {
  InquiryActivity,
  InquiryCard,
  InquirySource,
  InquiryStage,
  PipelineColumn,
  PipelineDto,
} from "@adminprop/shared-types"

import type { BadgeMeta } from "./contracts"

/** Orden de las columnas del tablero. */
export const STAGES: InquiryStage[] = [
  "NEW",
  "CONTACTED",
  "VISIT_SCHEDULED",
  "PROPOSAL_SENT",
  "CLOSED_WON",
  "CLOSED_LOST",
]

export const STAGE_LABELS: Record<InquiryStage, string> = {
  NEW: "Nueva",
  CONTACTED: "Contactada",
  VISIT_SCHEDULED: "Visita agendada",
  PROPOSAL_SENT: "Propuesta enviada",
  CLOSED_WON: "Ganada",
  CLOSED_LOST: "Perdida",
}

export function stageMeta(stage: InquiryStage): BadgeMeta {
  switch (stage) {
    case "NEW":
      return { label: STAGE_LABELS.NEW, badge: "mantenimiento" }
    case "CONTACTED":
    case "VISIT_SCHEDULED":
    case "PROPOSAL_SENT":
      return { label: STAGE_LABELS[stage], badge: "alquilada" }
    case "CLOSED_WON":
      return { label: STAGE_LABELS.CLOSED_WON, badge: "disponible" }
    case "CLOSED_LOST":
      return { label: STAGE_LABELS.CLOSED_LOST, badge: "borrador" }
  }
}

export const SOURCE_LABELS: Record<InquirySource, string> = {
  PORTAL: "Portal propio",
  MERCADOLIBRE: "Mercado Libre",
  ZONAPROP: "Zonaprop",
  ARGENPROP: "Argenprop",
  WHATSAPP: "WhatsApp",
  PHONE: "Teléfono",
  MANUAL: "Carga manual",
}

/** Orígenes que se pueden elegir al cargar una consulta a mano (rediseño, sección 5). */
export const MANUAL_SOURCES = [
  "WHATSAPP",
  "PHONE",
  "MANUAL",
  "ZONAPROP",
  "ARGENPROP",
] as const

/** Motivos de pérdida sugeridos (rediseño, sección 4); «Otro» pide texto. */
export const LOST_REASONS = [
  "No respondió",
  "Eligió otra propiedad",
  "Precio",
  "Ya no busca",
] as const

export const OTHER_REASON = "Otro"
export const MAX_NOTE_LENGTH = 2000
export const FOLLOW_UP_AFTER_HOURS = 24

export function isClosed(stage: InquiryStage): boolean {
  return stage === "CLOSED_WON" || stage === "CLOSED_LOST"
}

/** "Hace 3 h", "Hace 2 d" a partir de la antigüedad en horas. */
export function ageLabel(hours: number): string {
  if (hours < 1) return "Recién"
  if (hours < 24) return `Hace ${Math.floor(hours)} h`
  return `Hace ${Math.floor(hours / 24)} d`
}

/** Seguimiento vencido: la fecha es hoy o anterior (y la consulta sigue abierta). */
export function isFollowUpDue(
  card: Pick<InquiryCard, "nextActionAt" | "stage">,
  today: string
): boolean {
  return (
    card.nextActionAt !== null &&
    !isClosed(card.stage) &&
    card.nextActionAt <= today
  )
}

export function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}

/** Cantidad de consultas nuevas sin atender hace más de 24 h (tarjeta del dashboard). */
export function unattendedCount(column: PipelineColumn | undefined): {
  count: number
  isLowerBound: boolean
} {
  if (!column) return { count: 0, isLowerBound: false }
  const count = column.cards.filter(
    (card) => card.ageHours > FOLLOW_UP_AFTER_HOURS
  ).length
  return { count, isLowerBound: column.total > column.cards.length }
}

/** Vecinos de un lugar de la columna destino, sin contar la tarjeta que se mueve. */
export function neighborsAt(
  cards: InquiryCard[],
  movingId: string,
  index: number
): { beforeId?: string; afterId?: string } {
  const rest = cards.filter((card) => card.id !== movingId)
  const at = Math.max(0, Math.min(index, rest.length))
  return {
    ...(rest[at - 1] ? { beforeId: rest[at - 1]!.id } : {}),
    ...(rest[at] ? { afterId: rest[at]!.id } : {}),
  }
}

/**
 * Mueve una tarjeta en el pipeline (actualización optimista). `index` es el
 * lugar dentro de la columna destino ya sin la tarjeta. Si no se la encuentra
 * devuelve el pipeline sin cambios.
 */
export function applyMove(
  pipeline: PipelineDto,
  id: string,
  stage: InquiryStage,
  index: number
): PipelineDto {
  const card = pipeline.columns
    .flatMap((column) => column.cards)
    .find((item) => item.id === id)
  if (!card) return pipeline
  const moved = { ...card, stage }
  return {
    columns: pipeline.columns.map((column) => {
      const without = column.cards.filter((item) => item.id !== id)
      const wasHere = without.length !== column.cards.length
      if (column.stage !== stage) {
        return wasHere
          ? { ...column, total: column.total - 1, cards: without }
          : column
      }
      const at = Math.max(0, Math.min(index, without.length))
      return {
        ...column,
        total: wasHere ? column.total : column.total + 1,
        cards: [...without.slice(0, at), moved, ...without.slice(at)],
      }
    }),
  }
}

/** Texto de una actividad de la línea de tiempo. */
export function activityText(activity: InquiryActivity): string {
  const payload = activity.payload
  const text = (key: string) =>
    typeof payload[key] === "string" ? (payload[key] as string) : null
  switch (activity.type) {
    case "CREATED":
      return "Consulta creada"
    case "STAGE_CHANGED": {
      const from = text("from") as InquiryStage | null
      const to = text("to") as InquiryStage | null
      return from && to
        ? `Pasó de «${STAGE_LABELS[from] ?? from}» a «${STAGE_LABELS[to] ?? to}»`
        : "Cambió de etapa"
    }
    case "ASSIGNED":
      return text("to") ? `Asignada a ${text("to")}` : "Asignación cambiada"
    case "NOTE":
      return text("body") ?? ""
    case "CONTACT_ATTEMPT": {
      const channel = text("channel")
      const label =
        channel === "WHATSAPP"
          ? "WhatsApp"
          : channel === "PHONE"
            ? "llamado"
            : channel === "EMAIL"
              ? "email"
              : "contacto"
      return `Intento de contacto por ${label}`
    }
    case "FOLLOW_UP_SET":
      return text("to")
        ? `Seguimiento para el ${text("to")!.split("-").reverse().join("/")}`
        : "Seguimiento quitado"
    case "EDITED":
      return "Datos editados"
  }
}

/** Mensaje en español para los códigos propios del CRM y la multipublicación. */
export function crmErrorMessage(code: string | undefined): string | null {
  switch (code) {
    case "ASSIGNEE_INVALID":
      return "Ese usuario no puede recibir consultas (está inactivo o no es de la inmobiliaria)."
    case "INQUIRY_NOT_FOUND":
      return "La consulta ya no existe."
    case "LOST_REASON_REQUIRED":
      return "Indicá por qué se perdió la consulta."
    case "LISTING_NOT_READY":
      return "La propiedad todavía no está lista para publicarse."
    case "CHANNEL_NOT_CONNECTED":
      return "El canal no está conectado. Conectalo desde Configuración, Canales de publicación."
    default:
      return null
  }
}

export function crmApiError(error: unknown, fallback: string): string {
  return (
    crmErrorMessage(apiErrorCode(error) ?? undefined) ??
    apiErrorMessage(error, fallback)
  )
}

/** Tasa de conversión para mostrar ("12,5 %"), o guion si no hay dato. */
export function conversionLabel(rate: string | null): string {
  return rate === null ? "—" : `${rate.replace(".", ",")} %`
}
