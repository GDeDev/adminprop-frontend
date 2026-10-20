import type {
  ContractDetail,
  ContractSummary,
  ContractTimeline,
  Currency,
  IndexType,
  RentUpdateFrequency,
  RentUpdateSource,
  RentUpdateType,
} from "@adminprop/shared-types"

import { daysBetween, formatDate } from "./dates"

export type ContractBadgeVariant =
  "disponible" | "alquilada" | "mantenimiento" | "mora" | "borrador"

export interface BadgeMeta {
  label: string
  badge: ContractBadgeVariant
}

/**
 * Texto y variante de `Badge` del estado de un contrato (spec 5.1): verde
 * vigente, amarillo por vencer, rojo vencido sin renovar o rescindido, gris
 * finalizado. `expiringSoon` y `expired` ya vienen calculados por la API con
 * los días de aviso de la inmobiliaria.
 */
export function contractStatusMeta(
  contract: Pick<ContractSummary, "status" | "expiringSoon" | "expired">
): BadgeMeta {
  switch (contract.status) {
    case "FINISHED":
      return { label: "Finalizado", badge: "borrador" }
    case "TERMINATED":
      return { label: "Rescindido", badge: "mora" }
    default:
      if (contract.expired) return { label: "Vencido", badge: "mora" }
      if (contract.expiringSoon)
        return { label: "Vence pronto", badge: "mantenimiento" }
      return { label: "Vigente", badge: "disponible" }
  }
}

export const CONTRACT_STATUS_LABELS: Record<ContractSummary["status"], string> =
  {
    ACTIVE: "Activo",
    FINISHED: "Finalizado",
    TERMINATED: "Rescindido",
  }

export const RENT_UPDATE_TYPE_LABELS: Record<RentUpdateType, string> = {
  ICL: "ICL",
  IPC: "IPC",
  FIXED: "Fijo",
  OTHER: "Otro",
}

export const RENT_UPDATE_FREQUENCY_LABELS: Record<RentUpdateFrequency, string> =
  {
    MONTHLY: "Mensual",
    QUARTERLY: "Trimestral",
    FOUR_MONTHLY: "Cuatrimestral",
  }

export const RENT_UPDATE_SOURCE_LABELS: Record<RentUpdateSource, string> = {
  INITIAL: "Alquiler inicial",
  INDEX: "Por índice",
  MANUAL: "Manual",
}

export const CURRENCY_LABELS: Record<Currency, string> = {
  ARS: "Pesos (ARS)",
  USD: "Dólares (USD)",
}

export const INDEX_TYPE_LABELS: Record<IndexType, string> = {
  ICL: "ICL (Índice para Contratos de Locación)",
  IPC: "IPC (Índice de Precios al Consumidor)",
}

/** Con ICL/IPC el nuevo alquiler sale del índice; con Fijo/Otro se carga a mano. */
export function usesIndex(type: RentUpdateType): boolean {
  return type === "ICL" || type === "IPC"
}

/**
 * Monto de la API (string decimal) formateado para mostrar. Sólo formato:
 * la aritmética la hace la API (DT-11). Si no parece un número, se muestra
 * tal cual.
 */
export function formatMoney(amount: string, currency: Currency): string {
  const value = Number(amount)
  if (amount.trim() === "" || Number.isNaN(value)) return amount
  return (
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
    })
      .format(value)
      // Intl separa símbolo y número con un espacio duro; uno común se lee
      // igual y los textos se buscan sin sorpresas.
      .replace(/\s/g, " ")
  )
}

/** "150.333,33" o "150333.33" → "150333.33" para mandar a la API; null si no es un monto. */
export function normalizeAmount(input: string): string | null {
  const trimmed = input.trim().replace(/\s/g, "")
  if (trimmed === "") return null
  let digits = trimmed
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(trimmed)) {
    // Formato argentino: puntos de miles y coma decimal.
    digits = trimmed.replace(/\./g, "").replace(",", ".")
  } else if (/^\d+(,\d{1,2})$/.test(trimmed)) {
    digits = trimmed.replace(",", ".")
  }
  return /^\d+(\.\d{1,2})?$/.test(digits) ? digits : null
}

/** "14 de 36 meses" para la línea de tiempo. */
export function timelineLabel(timeline: ContractTimeline): string {
  const elapsed = Math.min(
    Math.max(timeline.elapsedMonths, 0),
    timeline.totalMonths
  )
  return `${elapsed} de ${timeline.totalMonths} ${timeline.totalMonths === 1 ? "mes" : "meses"}`
}

/** Qué sigue en el contrato, para la ficha. `today` es `AAAA-MM-DD`. */
export function nextStepLabel(
  contract: Pick<
    ContractDetail,
    "status" | "expired" | "endDate" | "nextRentUpdateOn" | "termination"
  >,
  today: string
): string {
  if (contract.status === "TERMINATED") {
    return contract.termination
      ? `Rescindido el ${formatDate(contract.termination.terminatedAt)}.`
      : "Rescindido."
  }
  if (contract.status === "FINISHED") {
    return `Finalizado. Terminaba el ${formatDate(contract.endDate)}.`
  }
  if (contract.expired) {
    return `Venció el ${formatDate(contract.endDate)} sin renovar: renovalo o rescindilo.`
  }
  if (!contract.nextRentUpdateOn) {
    return `Sin aumentos pendientes. Vence el ${formatDate(contract.endDate)}.`
  }
  const days = daysBetween(today, contract.nextRentUpdateOn)
  if (days <= 0) {
    return `Aumento pendiente desde el ${formatDate(contract.nextRentUpdateOn)}.`
  }
  return `Próximo aumento el ${formatDate(contract.nextRentUpdateOn)} (en ${days} ${days === 1 ? "día" : "días"}).`
}

/** Dentro de cuántos días una póliza "vence pronto" (RN-16: alerta previa). */
export const POLICY_NOTICE_DAYS = 30

/**
 * Badge de vencimiento de la póliza de caución (spec 5.2). Sin fecha, nada.
 */
export function policyExpiryMeta(
  policyExpiresAt: string | null,
  today: string
): BadgeMeta | null {
  if (!policyExpiresAt) return null
  const days = daysBetween(today, policyExpiresAt)
  if (days < 0) return { label: "Póliza vencida", badge: "mora" }
  if (days === 0) return { label: "Vence hoy", badge: "mantenimiento" }
  if (days <= POLICY_NOTICE_DAYS) {
    return {
      label: `Vence en ${days} ${days === 1 ? "día" : "días"}`,
      badge: "mantenimiento",
    }
  }
  return {
    label: `Vigente hasta el ${formatDate(policyExpiresAt)}`,
    badge: "disponible",
  }
}

/** Tamaño máximo del PDF del contrato o la póliza (D-62). */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024

/** Un PDF válido para subir, o el motivo por el que no. */
export function documentProblem(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" || /\.pdf$/i.test(file.name ?? "")
  if (!isPdf) return "Tiene que ser un PDF."
  if (file.size > MAX_DOCUMENT_BYTES) return "El PDF no puede superar 10 MB."
  return null
}
