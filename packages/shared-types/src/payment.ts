import type { BillingPeriod, IsoDate, Money, Uuid } from "./common"

/** pending, paid, overdue ("vencido"), in_arrears ("con mora"). */
export type PaymentStatus = "pending" | "paid" | "overdue" | "in_arrears"

export type PaymentMethod = "bank_transfer" | "cash" | "other"

/** Cuota/pago mensual (PRD 5.6, Fase 11). */
export interface Payment {
  id: Uuid
  tenantId: Uuid
  contractId: Uuid
  renterId: Uuid
  period: BillingPeriod
  baseAmount: Money
  lateFeeAmount: Money
  totalAmount: Money
  paymentDate: IsoDate | null
  status: PaymentStatus
  receiptUrl: string | null
  paymentMethod: PaymentMethod | null
  recordedBy: Uuid | null
}
