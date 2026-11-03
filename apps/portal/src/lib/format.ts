import type {
  CollectionMode,
  DepositReturnMode,
  InstallmentStatus,
  PaymentMethod,
  RentUpdateFrequency,
  RentUpdateType,
  SettlementStatus,
} from "@adminprop/shared-types"

/**
/**
 * Etiquetas y formato del portal. `formatMoney` y `periodLabel` son los
 * compartidos (`@adminprop/ui/lib/format`); acá solo presentación, sin
 * aritmética (los montos los calcula la API).
 */

// `formatMoney` y `periodLabel` viven en @adminprop/ui/lib/format.
export { formatMoney, periodLabel, periodTitle } from "@adminprop/ui/lib/format"

/** `AAAA-MM-DD` → `dd/mm/aaaa`, sin desfase de zona horaria. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-")
  return `${day}/${month}/${year}`
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
  DEPOSIT: "Depósito en garantía",
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

/** Link de WhatsApp con texto precargado. `phone` solo dígitos con país. */
export function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}
