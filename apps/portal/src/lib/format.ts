import type {
  CollectionMode,
  Currency,
  DepositReturnMode,
  InstallmentStatus,
  PaymentMethod,
  RentUpdateFrequency,
  RentUpdateType,
  SettlementStatus,
} from "@adminprop/shared-types"

/**
 * Formato y etiquetas del portal. Copia mínima de los helpers del backoffice
 * (`lib/contracts.ts`, `lib/billing.ts`): sólo presentación, sin aritmética
 * (los montos los calcula la API). Consolidar en un paquete compartido cuando
 * la Fase 19 los necesite también para los reportes.
 */

export function formatMoney(amount: string, currency: Currency): string {
  return (
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    })
      .format(Number(amount))
      // Intl separa el símbolo con un espacio duro; se normaliza a uno común.
      .split(String.fromCharCode(160))
      .join(" ")
  )
}

/** `AAAA-MM-DD` → `dd/mm/aaaa`, sin desfase de zona horaria. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-")
  return `${day}/${month}/${year}`
}

/** `AAAA-MM` → "octubre de 2026". */
export function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number)
  if (!year || !month) return period
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

export function isZero(amount: string): boolean {
  return /^-?0+(\.0+)?$/.test(amount.trim())
}

export function daysLabel(days: number): string {
  return `${days} ${days === 1 ? "día" : "días"}`
}

export type BadgeVariant =
  "disponible" | "alquilada" | "mantenimiento" | "mora" | "borrador"

export const INSTALLMENT_STATUS_META: Record<
  InstallmentStatus,
  { label: string; badge: BadgeVariant }
> = {
  PENDING: { label: "A pagar", badge: "borrador" },
  PARTIAL: { label: "Pago parcial", badge: "mantenimiento" },
  OVERDUE: { label: "Vencida", badge: "mora" },
  PAID: { label: "Pagada", badge: "disponible" },
}

export const SETTLEMENT_STATUS_META: Record<
  SettlementStatus,
  { label: string; badge: BadgeVariant }
> = {
  PENDING: { label: "En preparación", badge: "borrador" },
  CONFIRMED: { label: "Confirmada", badge: "alquilada" },
  TRANSFERRED: { label: "Transferida", badge: "disponible" },
  CANCELLED: { label: "Cancelada", badge: "mora" },
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  TRANSFER: "Transferencia",
  CASH: "Efectivo",
  CREDIT: "Saldo a favor",
  OTHER: "Otro",
}

export const RENT_UPDATE_TYPE_LABELS: Record<RentUpdateType, string> = {
  ICL: "Por ICL",
  IPC: "Por IPC",
  FIXED: "Fijo",
  OTHER: "Otro",
}

export const RENT_UPDATE_FREQUENCY_LABELS: Record<RentUpdateFrequency, string> =
  {
    MONTHLY: "mensual",
    QUARTERLY: "trimestral",
    FOUR_MONTHLY: "cuatrimestral",
    SEMIANNUAL: "semestral",
    ANNUAL: "anual",
  }

export const DEPOSIT_RETURN_MODE_LABELS: Record<DepositReturnMode, string> = {
  FIXED: "se devuelve lo que entregaste",
  FOLLOWS_RENT: "se devuelve el equivalente a un alquiler vigente",
  MANUAL: "el monto se define al terminar el contrato",
}

export const COLLECTION_MODE_LABELS: Record<CollectionMode, string> = {
  AGENCY: "Le pagás a la inmobiliaria",
  OWNER_DIRECT: "Le pagás directamente al propietario",
}

/** Link de WhatsApp con texto precargado. `phone` sólo dígitos con país. */
export function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}
