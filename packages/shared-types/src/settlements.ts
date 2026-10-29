import type { Currency } from "./common"
import type { OwnerRef } from "./owner"
import type { RenterRef } from "./renter"
import type {
  AdvanceExpenseRegisteredBy as UserRef,
  ServicePropertyRef as PropertyRef,
} from "./service"
import type { FeeMode, PaymentMethod } from "./billing"

/**
 * Liquidaciones (Fase 12): liquidación por contrato, consolidado mensual por
 * propietario, cuenta de honorarios y devolución del depósito. Nombres
 * acordados con el backend en `adminprop-repo-files/docs/REDISENO_FASE_12.md`.
 *
 * TODO(fase-12): reemplazar por alias a `ApiSchemas["…Dto"]` cuando el
 * `openapi.json` de `feature/fase-12-liquidaciones` esté exportado.
 */

export type SettlementStatus =
  "PENDING" | "CONFIRMED" | "TRANSFERRED" | "CANCELLED"
export type SettlementAdjustmentConcept =
  "WITHHOLDING" | "OWNER_ADVANCE" | "OTHER_DEDUCTION" | "OTHER_CREDIT"
export type StatementStatus = "OPEN" | "CLOSED"
export type StatementSendMode = "SUMMARY" | "RECEIPTS" | "BOTH"
export type FeeReceivableSource =
  "OWNER_DIRECT_PAYMENT" | "SETTLEMENT_NOT_DEDUCTED"
export type FeePayer = "OWNER" | "RENTER"
export type FeeReceivableStatus = "PENDING" | "PARTIAL" | "PAID" | "VOIDED"
export type DepositDeductionConcept = "DEBT" | "DAMAGE" | "OTHER"
export type FeeAccountMovementType =
  "ACCRUED" | "PAYMENT" | "PAYMENT_VOIDED" | "RECEIVABLE_VOIDED"
export interface SettlementSummary {
  id: string
  period: string
  sequence: number
  status: SettlementStatus
  contract: { id: string }
  property: PropertyRef | null
  owner: OwnerRef | null
  renter: RenterRef | null
  currency: Currency
  rentTotal: string
  lateFeeTotal: string
  ownerChargesTotal: string
  serviceChargesTotal: string
  feeTotal: string
  feeDeducted: boolean
  expensesTotal: string
  adjustmentsTotal: string
  netAmount: string
  transferredTotal: string
  statementId: string | null
  hasVoidedPayments: boolean
  confirmedAt: string | null
  createdAt: string
}

export interface SettlementPayment {
  paymentId: string
  installmentPeriod: string
  paidAt: string
  rentApplied: string
  lateFeeApplied: string
  ownerChargesApplied: string
  serviceChargesApplied: string
}

export interface SettlementExpense {
  expenseId: string
  description: string
  expenseDate: string
  amount: string
  currency?: Currency
}

export interface SettlementAdjustment {
  id: string
  concept: SettlementAdjustmentConcept
  description: string
  amount: string
  createdBy: UserRef | null
  createdAt: string
  voidedAt: string | null
  voidReason: string | null
}

export interface SettlementTransfer {
  id: string
  transferredAt: string
  amount: string
  method: PaymentMethod
  receiptUrl: string | null
  notes: string | null
  registeredBy: UserRef | null
  voidedAt: string | null
}

export interface SettlementDetail extends SettlementSummary {
  feeMode: FeeMode
  feePercentage: string
  feeAmountFixed: string | null
  feeBase: string
  mixedFeeTerms: boolean
  ownerBankAccountMissing: boolean
  payments: SettlementPayment[]
  expenses: SettlementExpense[]
  skippedExpenses: SettlementExpense[]
  adjustments: SettlementAdjustment[]
  transfers: SettlementTransfer[]
  confirmedBy: UserRef | null
  cancelledAt: string | null
  cancelReason: string | null
  notes: string | null
  updatedAt: string
}

export interface OwnerStatementTotals {
  currency: Currency
  rentTotal: string
  lateFeeTotal: string
  chargesTotal: string
  feeTotal: string
  expensesTotal: string
  adjustmentsTotal: string
  netTotal: string
  transferredTotal: string
}

export interface OwnerStatementSummary {
  id: string
  owner: OwnerRef | null
  period: string
  status: StatementStatus
  sendMode: StatementSendMode
  settlementsCount: number
  totals: OwnerStatementTotals[]
  closedAt: string | null
  createdAt: string
}

export interface OwnerStatementDetail extends OwnerStatementSummary {
  settlements: SettlementSummary[]
  closedBy: UserRef | null
  notes: string | null
}

export interface FeeReceivable {
  id: string
  owner: OwnerRef | null
  contract: { id: string }
  property: PropertyRef | null
  installmentPeriod: string
  currency: Currency
  source: FeeReceivableSource
  payer: FeePayer
  amount: string
  paidAmount: string
  status: FeeReceivableStatus
  feePercentage: string
  feeAmountFixed: string | null
  baseAmount: string
  needsReview: boolean
  createdAt: string
}

export interface FeePayment {
  id: string
  ownerId: string
  contractId: string | null
  paidAt: string
  amount: string
  currency: Currency
  method: PaymentMethod
  paidBy: FeePayer
  unallocatedAmount: string
  receiptUrl: string | null
  notes: string | null
  registeredBy: UserRef | null
  voidedAt: string | null
  voidReason: string | null
  allocations: { feeReceivableId: string; amount: string }[]
  createdAt: string
}

export interface OwnerFeeAccountTotals {
  currency: Currency
  accrued: string
  collected: string
  pending: string
  unallocated: string
}

export interface OwnerFeeAccountMovement {
  date: string
  type: FeeAccountMovementType
  description: string
  debit: string | null
  credit: string | null
  balance: string
  currency: Currency
}

export interface OwnerFeeAccount {
  ownerId: string
  totals: OwnerFeeAccountTotals[]
  receivables: FeeReceivable[]
  payments: FeePayment[]
  movements: OwnerFeeAccountMovement[]
}

export interface OwnerFeeSettings {
  feePercentage: string | null
  feeIncludesLateFees: boolean
  feeIncludesCharges: boolean
  statementSendMode: StatementSendMode
}

export interface DepositReturnDeduction {
  id: string
  concept: DepositDeductionConcept
  description: string
  amount: string
  installmentId: string | null
  paymentId: string | null
}

export interface DepositReturn {
  id: string
  contractId: string
  returnedAt: string
  depositAmount: string
  depositCurrency: Currency
  returnedAmount: string
  method: PaymentMethod
  notes: string | null
  registeredBy: UserRef | null
  deductions: DepositReturnDeduction[]
  createdAt: string
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export interface CreateSettlementRequest {
  contractId: string
  period?: string
}

export interface CreateSettlementAdjustmentRequest {
  concept: SettlementAdjustmentConcept
  description: string
  amount: string
}

/** Multipart de `POST /settlements/:id/transfers`. */
export interface RegisterSettlementTransferRequest {
  transferredAt: string
  amount: string
  method: PaymentMethod
  notes?: string
}

export interface CreateOwnerStatementRequest {
  ownerId: string
  period: string
}

export interface CloseOwnerStatementRequest {
  sendMode?: StatementSendMode
}

/** Multipart de `POST /fee-payments`. */
export interface RegisterFeePaymentRequest {
  ownerId: string
  contractId?: string
  paidAt: string
  amount: string
  currency: Currency
  method: PaymentMethod
  paidBy: FeePayer
  notes?: string
}

export interface UpdateOwnerFeeSettingsRequest {
  feePercentage?: string | null
  feeIncludesLateFees?: boolean
  feeIncludesCharges?: boolean
  statementSendMode?: StatementSendMode
}

export interface RegisterDepositReturnRequest {
  returnedAt: string
  returnedAmount: string
  method: PaymentMethod
  notes?: string
  deductions: {
    concept: DepositDeductionConcept
    description: string
    amount: string
    installmentId?: string
  }[]
}
