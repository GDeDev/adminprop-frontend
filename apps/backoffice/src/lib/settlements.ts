import type {
  DepositDeductionConcept,
  FeeAccountMovementType,
  FeePayer,
  FeeReceivableSource,
  FeeReceivableStatus,
  SettlementAdjustmentConcept,
  SettlementStatus,
  StatementSendMode,
  StatementStatus,
} from "@adminprop/shared-types"

import type { BadgeMeta } from "./contracts"

/** Estado de una liquidación: gris pendiente, azul confirmada, verde transferida, rojo cancelada. */
export const SETTLEMENT_STATUS_META: Record<SettlementStatus, BadgeMeta> = {
  PENDING: { label: "Pendiente", badge: "borrador" },
  CONFIRMED: { label: "Confirmada", badge: "alquilada" },
  TRANSFERRED: { label: "Transferida", badge: "disponible" },
  CANCELLED: { label: "Cancelada", badge: "mora" },
}

export const ADJUSTMENT_CONCEPT_LABELS: Record<
  SettlementAdjustmentConcept,
  string
> = {
  WITHHOLDING: "Retención",
  OWNER_ADVANCE: "Adelanto al propietario",
  OTHER_DEDUCTION: "Otra deducción",
  OTHER_CREDIT: "Otro a favor del propietario",
}

/** Los tres primeros restan del neto; el último suma. */
export function adjustmentSubtracts(
  concept: SettlementAdjustmentConcept
): boolean {
  return concept !== "OTHER_CREDIT"
}

export const STATEMENT_STATUS_META: Record<StatementStatus, BadgeMeta> = {
  OPEN: { label: "Abierto", badge: "mantenimiento" },
  CLOSED: { label: "Cerrado", badge: "disponible" },
}

export const SEND_MODE_LABELS: Record<StatementSendMode, string> = {
  SUMMARY: "Sólo el resumen",
  RECEIPTS: "Sólo los comprobantes",
  BOTH: "Resumen y comprobantes",
}

export const FEE_SOURCE_LABELS: Record<FeeReceivableSource, string> = {
  OWNER_DIRECT_PAYMENT: "Cobró el propietario",
  SETTLEMENT_NOT_DEDUCTED: "No descontado en la liquidación",
}

export const FEE_PAYER_LABELS: Record<FeePayer, string> = {
  OWNER: "Propietario",
  RENTER: "Inquilino (por cuenta del propietario)",
}

export const FEE_RECEIVABLE_STATUS_META: Record<
  FeeReceivableStatus,
  BadgeMeta
> = {
  PENDING: { label: "Pendiente", badge: "mantenimiento" },
  PARTIAL: { label: "Pago parcial", badge: "mantenimiento" },
  PAID: { label: "Cobrado", badge: "disponible" },
  VOIDED: { label: "Anulado", badge: "borrador" },
}

export const DEPOSIT_DEDUCTION_LABELS: Record<DepositDeductionConcept, string> =
  {
    DEBT: "Deuda del inquilino",
    DAMAGE: "Daños",
    OTHER: "Otro",
  }

export const FEE_MOVEMENT_LABELS: Record<FeeAccountMovementType, string> = {
  ACCRUED: "Honorario devengado",
  PAYMENT: "Pago de honorarios",
  PAYMENT_VOIDED: "Pago anulado",
  RECEIVABLE_VOIDED: "Honorario anulado",
}

/** "Liquidación 2026-10 · 2" cuando hay más de una en el mes. */
export function settlementLabel(settlement: {
  period: string
  sequence: number
}): string {
  return settlement.sequence > 1
    ? `${settlement.period} · ${settlement.sequence}`
    : settlement.period
}
