import type {
  AdvanceExpense,
  IncreaseFrequency,
  PropertyService,
  ServicePayer,
  ServiceScope,
  ServiceStatus,
} from "@adminprop/shared-types"

import { RENT_UPDATE_FREQUENCY_LABELS, type BadgeMeta } from "./contracts"

export const SERVICE_PAYER_LABELS: Record<ServicePayer, string> = {
  RENTER: "Inquilino",
  OWNER: "Propietario",
}

export const SERVICE_SCOPE_LABELS: Record<ServiceScope, string> = {
  CONTRACT: "Del contrato",
  PROPERTY: "De la propiedad",
}

/** Mismos valores y textos que la frecuencia de aumento del contrato. */
export const INCREASE_FREQUENCY_LABELS: Record<IncreaseFrequency, string> =
  RENT_UPDATE_FREQUENCY_LABELS

/**
 * Badge del estado de un servicio (spec 5.1): verde al día, rojo vencido.
 * El estado y los días lo calcula la API al leer (RN: `dueDate < hoy`);
 * acá sólo se traduce. Sin vencimiento no hay badge: no hay nada que vencer.
 */
export function serviceStatusMeta(
  service: Pick<PropertyService, "hasDueDate" | "status" | "daysOverdue">
): BadgeMeta | null {
  if (!service.hasDueDate) return null
  if (service.status === "OVERDUE") {
    return { label: daysOverdueLabel(service.daysOverdue), badge: "mora" }
  }
  return { label: SERVICE_STATUS_LABELS[service.status], badge: "disponible" }
}

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  UP_TO_DATE: "Al día",
  OVERDUE: "Vencido",
}

/** "Vencido hace 3 días"; con 0 días, "Al día". */
export function daysOverdueLabel(days: number): string {
  if (days <= 0) return SERVICE_STATUS_LABELS.UP_TO_DATE
  return `Vencido hace ${days} ${days === 1 ? "día" : "días"}`
}

/**
 * Badge de un gasto adelantado (spec 5.2): amarillo mientras espera la
 * liquidación, verde una vez descontado.
 */
export function expenseStatusMeta(
  expense: Pick<AdvanceExpense, "settled">
): BadgeMeta {
  return expense.settled
    ? { label: "Descontado en liquidación", badge: "disponible" }
    : { label: "Pendiente de descuento", badge: "mantenimiento" }
}

/** Tamaño máximo del comprobante, como en la API (D-67). */
export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024

/** Para el `accept` del input: foto o PDF del comprobante. */
export const RECEIPT_ACCEPT =
  "image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"

const RECEIPT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
])

/** Un comprobante válido (JPG, PNG, WebP o PDF hasta 10 MB), o el motivo por el que no. */
export function receiptProblem(file: File): string | null {
  const byType = RECEIPT_TYPES.has(file.type)
  const byName = /\.(jpe?g|png|webp|pdf)$/i.test(file.name ?? "")
  if (!byType && !byName) {
    return "El comprobante tiene que ser una foto (JPG, PNG o WebP) o un PDF."
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    return "El comprobante no puede superar 10 MB."
  }
  return null
}
