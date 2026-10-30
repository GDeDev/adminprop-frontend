import type {
  ArrearsStatus,
  ChargeConcept,
  CollectionMode,
  CreditStatus,
  Currency,
  DepositReturnMode,
  ExchangeRateSource,
  FeeMode,
  InstallmentStatus,
  LateFeeAdjustmentKind,
  MoneyByCurrency,
  PaymentMethod,
  PaymentReceiver,
  PaymentStatus,
  RenterArrears,
} from "@adminprop/shared-types"

import { formatMoney, type BadgeMeta } from "./contracts"

/** Estado de la cuota (spec 5.1): gris pendiente, ámbar parcial, rojo vencida, verde cobrada. */
export const INSTALLMENT_STATUS_META: Record<InstallmentStatus, BadgeMeta> = {
  PENDING: { label: "Pendiente", badge: "borrador" },
  PARTIAL: { label: "Pago parcial", badge: "mantenimiento" },
  OVERDUE: { label: "Vencida", badge: "mora" },
  PAID: { label: "Cobrada", badge: "disponible" },
}

/** "Vencida · 5 días" para una cuota con punitorio corriendo. */
export function installmentStatusMeta(installment: {
  status: InstallmentStatus
  feeDays: number
}): BadgeMeta {
  const meta = INSTALLMENT_STATUS_META[installment.status]
  if (installment.status === "OVERDUE" && installment.feeDays > 0) {
    return {
      ...meta,
      label: `${meta.label} · ${daysLabel(installment.feeDays)}`,
    }
  }
  return meta
}

export function daysLabel(days: number): string {
  return `${days} ${days === 1 ? "día" : "días"}`
}

export const PAYMENT_STATUS_META: Record<PaymentStatus, BadgeMeta> = {
  PENDING_CONFIRMATION: {
    label: "Pendiente de confirmar",
    badge: "mantenimiento",
  },
  CONFIRMED: { label: "Confirmado", badge: "disponible" },
  VOIDED: { label: "Anulado", badge: "borrador" },
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  TRANSFER: "Transferencia",
  CASH: "Efectivo",
  CREDIT: "Saldo a favor",
  DEPOSIT: "Depósito en garantía",
  OTHER: "Otro",
}

/** Los medios que elige el usuario; `CREDIT` lo pone la API al aplicar un saldo. */
export const CASH_PAYMENT_METHODS: PaymentMethod[] = [
  "TRANSFER",
  "CASH",
  "OTHER",
]

export const PAYMENT_RECEIVER_LABELS: Record<PaymentReceiver, string> = {
  AGENCY: "Lo cobró la inmobiliaria",
  OWNER: "Lo cobró el propietario",
}

export const EXCHANGE_RATE_SOURCE_LABELS: Record<ExchangeRateSource, string> = {
  OFFICIAL: "Oficial",
  MEP: "MEP",
  OTHER: "Otra acordada",
}

export const CHARGE_CONCEPT_LABELS: Record<ChargeConcept, string> = {
  SERVICE: "Servicio o expensas",
  TERMINATION_PENALTY: "Multa por rescisión",
  OTHER: "Otro",
}

export const LATE_FEE_ADJUSTMENT_LABELS: Record<LateFeeAdjustmentKind, string> =
  {
    REDUCE: "Reducción",
    WAIVE: "Condonación",
  }

export const CREDIT_STATUS_META: Record<CreditStatus, BadgeMeta> = {
  AVAILABLE: { label: "Disponible", badge: "disponible" },
  APPLIED: { label: "Aplicado", badge: "borrador" },
  REFUNDED: { label: "Devuelto", badge: "alquilada" },
  VOIDED: { label: "Anulado", badge: "borrador" },
}

export const COLLECTION_MODE_LABELS: Record<CollectionMode, string> = {
  AGENCY: "Cobra la inmobiliaria",
  OWNER_DIRECT: "Cobra el propietario",
}

export const COLLECTION_MODE_SHORT: Record<CollectionMode, string> = {
  AGENCY: "Inmobiliaria",
  OWNER_DIRECT: "Propietario",
}

export const FEE_MODE_LABELS: Record<FeeMode, string> = {
  DEDUCTED: "Se descuentan de la liquidación",
  OWNER_PAYS: "Los paga el propietario después",
  RENTER_PAYS_ON_BEHALF: "Los paga el inquilino por cuenta del propietario",
}

export const DEPOSIT_RETURN_MODE_LABELS: Record<DepositReturnMode, string> = {
  FIXED: "Se devuelve lo recibido",
  FOLLOWS_RENT: "Se devuelve el alquiler vigente",
  MANUAL: "Monto a definir al devolver",
}

/** Badge de mora de un inquilino (spec 5.2). */
export function arrearsMeta(
  arrears: Pick<RenterArrears, "status" | "maxDaysOverdue"> | undefined
): BadgeMeta {
  if (!arrears) return { label: "Sin datos", badge: "borrador" }
  switch (arrears.status) {
    case "OVERDUE":
      return {
        label: `En mora · ${daysLabel(arrears.maxDaysOverdue)}`,
        badge: "mora",
      }
    case "PENDING":
      return { label: "Cuota pendiente", badge: "mantenimiento" }
    default:
      return { label: "Al día", badge: "disponible" }
  }
}

export const ARREARS_STATUS_LABELS: Record<ArrearsStatus, string> = {
  UP_TO_DATE: "Al día",
  PENDING: "Cuota pendiente",
  OVERDUE: "En mora",
}

/** "$ 1.000,00 · US$ 50,00" para totales por moneda; "—" si no hay nada. */
export function formatMoneyList(items: MoneyByCurrency[]): string {
  const nonZero = items.filter((item) => !isZero(item.amount))
  if (nonZero.length === 0) return "—"
  return nonZero
    .map((item) => formatMoney(item.amount, item.currency))
    .join(" · ")
}

export function isZero(amount: string): boolean {
  return /^-?0+(\.0+)?$/.test(amount.trim())
}

/** Cotización: "1 USD = $ 1.250,00 (MEP, 12/10/2026)". */
export function exchangeRateLabel(
  payment: {
    exchangeRate: string | null
    exchangeRateSource: ExchangeRateSource | null
    exchangeRateDate: string | null
  },
  formatDate: (iso: string) => string
): string | null {
  if (!payment.exchangeRate || !payment.exchangeRateSource) return null
  const parts = [EXCHANGE_RATE_SOURCE_LABELS[payment.exchangeRateSource]]
  if (payment.exchangeRateDate) parts.push(formatDate(payment.exchangeRateDate))
  return `1 USD = ${formatMoney(payment.exchangeRate, "ARS")} (${parts.join(", ")})`
}

/** Mes `AAAA-MM` → "octubre de 2026". */
export function periodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number)
  if (!year || !month) return period
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

/** El mes de hoy como `AAAA-MM`. */
export function currentPeriod(today = new Date()): string {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
}

/** `AAAA-MM` ± n meses. */
export function shiftPeriod(period: string, months: number): string {
  const [year, month] = period.split("-").map(Number)
  const date = new Date(Date.UTC(year!, month! - 1 + months, 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

/** La otra moneda: para ofrecer "pagó en pesos" en un contrato en dólares. */
export function otherCurrency(currency: Currency): Currency {
  return currency === "ARS" ? "USD" : "ARS"
}
