import type {
  IndexFetchStatus,
  InternalAlertType,
  JobExecutionStatus,
  JobTrigger,
} from "@adminprop/shared-types"

import type { BadgeMeta } from "./contracts"

export const EXECUTION_STATUS_META: Record<JobExecutionStatus, BadgeMeta> = {
  RUNNING: { label: "En curso", badge: "alquilada" },
  SUCCEEDED: { label: "OK", badge: "disponible" },
  PARTIAL: { label: "Con avisos", badge: "mantenimiento" },
  FAILED: { label: "Falló", badge: "mora" },
  SKIPPED: { label: "Nada que hacer", badge: "borrador" },
}

export const INDEX_FETCH_STATUS_META: Record<IndexFetchStatus, BadgeMeta> = {
  SUCCEEDED: { label: "Actualizado", badge: "disponible" },
  PARTIAL: { label: "Parcial", badge: "mantenimiento" },
  FAILED: { label: "Falló", badge: "mora" },
  SKIPPED: { label: "Manual", badge: "borrador" },
}

export const TRIGGER_LABELS: Record<JobTrigger, string> = {
  SCHEDULE: "Programada",
  MANUAL: "Manual",
}

export const ALERT_TYPE_LABELS: Record<InternalAlertType, string> = {
  RENT_UPDATE_PENDING: "Aumento pendiente de aplicar",
  INDEX_FETCH_FAILED: "Índice no disponible",
  INSTALLMENT_BASE_OUTDATED: "Cuota con base desactualizada",
  STATEMENT_PENDING: "Consolidado pendiente de cerrar",
  DOCUMENT_FAILED: "Documento no generado",
  JOB_FAILED: "Automatización fallida",
}

const dateTime = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
})

/** "12/10/2026 09:10" desde un timestamp ISO. */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso))
}

/** "hace 5 minutos" / "hace 3 horas" / "hace 2 días", para la última ejecución. */
export function relativeTime(iso: string, now = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return "recién"
  if (minutes < 60)
    return `hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`
  const days = Math.round(hours / 24)
  return `hace ${days} ${days === 1 ? "día" : "días"}`
}
