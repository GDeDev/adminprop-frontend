import type { Currency } from "./common"
import type { OwnerRef } from "./owner"
import type { RenterRef } from "./renter"
import type {
  AdvanceExpenseRegisteredBy as UserRef,
  ServicePropertyRef as PropertyRef,
} from "./service"

/**
 * Cobros y punitorios (Fase 11): cuotas, pagos, cargos, ajustes de punitorio,
 * saldos a favor y cuenta corriente. Nombres acordados con el backend en
 * `adminprop-repo-files/docs/REDISENO_FASE_11.md`.
 *
 * TODO(fase-11): reemplazar estas interfaces por alias a
 * `ApiSchemas["…Dto"]` cuando el `openapi.json` de la rama
 * `feature/fase-11-cobros` del backend esté exportado (`npm run api:types`).
 */

/** `OVERDUE` lo calcula la API al leer; en la base sólo hay los otros tres. */
export type InstallmentStatus = "PENDING" | "PARTIAL" | "OVERDUE" | "PAID"
export type PaymentStatus = "PENDING_CONFIRMATION" | "CONFIRMED" | "VOIDED"
export type PaymentKind = "CASH_IN" | "CREDIT_APPLICATION"
export type PaymentMethod = "TRANSFER" | "CASH" | "CREDIT" | "OTHER"
export type PaymentReceiver = "AGENCY" | "OWNER"
export type ExchangeRateSource = "OFFICIAL" | "MEP" | "OTHER"
export type ChargeConcept = "SERVICE" | "TERMINATION_PENALTY" | "OTHER"
export type LateFeeAdjustmentKind = "REDUCE" | "WAIVE"
export type CreditStatus = "AVAILABLE" | "APPLIED" | "REFUNDED" | "VOIDED"
export type CollectionMode = "AGENCY" | "OWNER_DIRECT"
export type FeeMode = "DEDUCTED" | "OWNER_PAYS" | "RENTER_PAYS_ON_BEHALF"
export type DepositReturnMode = "FIXED" | "FOLLOWS_RENT" | "MANUAL"
export type ArrearsStatus = "UP_TO_DATE" | "PENDING" | "OVERDUE"
export type AccountMovementType =
  | "INSTALLMENT"
  | "CHARGE"
  | "PAYMENT"
  | "CREDIT_APPLIED"
  | "CREDIT_GENERATED"
  | "CREDIT_REFUNDED"
  | "LATE_FEE_ADJUSTMENT"
  | "PAYMENT_VOIDED"
  | "DEPOSIT_RECEIVED"

export interface InstallmentSummary {
  id: string
  period: string
  contract: { id: string }
  property: PropertyRef | null
  renter: RenterRef | null
  owner: OwnerRef | null
  currency: Currency
  baseAmount: string
  chargesTotal: string
  lateFeeAccrued: string
  lateFeeAdjusted: string
  lateFeeWaived: boolean
  lateFeeBalance: string
  paidTotal: string
  rentBalance: string
  chargesBalance: string
  totalDue: string
  pendingConfirmationTotal: string
  status: InstallmentStatus
  graceEndDate: string
  feeDays: number
  paidAt: string | null
  collectionMode: CollectionMode
  feeMode: FeeMode
  createdAt: string
}

export interface InstallmentCharge {
  id: string
  concept: ChargeConcept
  description: string
  amount: string
  createdBy: UserRef | null
  createdAt: string
  voidedAt: string | null
  voidReason: string | null
}

export interface Payment {
  id: string
  installmentId: string
  contractId: string
  renterId: string
  period: string
  paidAt: string
  paidCurrency: Currency
  amount: string
  exchangeRate: string | null
  exchangeRateSource: ExchangeRateSource | null
  exchangeRateDate: string | null
  amountInContractCurrency: string
  kind: PaymentKind
  method: PaymentMethod
  receivedBy: PaymentReceiver
  status: PaymentStatus
  lateFeeApplied: string
  rentApplied: string
  chargesApplied: string
  creditGenerated: string
  creditId: string | null
  receiptUrl: string | null
  notes: string | null
  registeredBy: UserRef | null
  confirmedAt: string | null
  confirmedBy: UserRef | null
  voidedAt: string | null
  voidedBy: UserRef | null
  voidReason: string | null
  createdAt: string
}

/** `GET /billing/payments`: el pago con su inquilino y propiedad. */
export interface PaymentListItem extends Payment {
  renter: RenterRef | null
  property: PropertyRef | null
  /** La moneda del contrato (la de `amountInContractCurrency`). */
  currency: Currency
}

export interface LateFeeAdjustment {
  id: string
  kind: LateFeeAdjustmentKind
  amount: string
  reason: string
  createdBy: UserRef | null
  createdAt: string
}

/** Un día de punitorio: sobre cuánto alquiler impago se calculó (A-3). */
export interface LateFeeDay {
  day: string
  dayNumber: number
  outstandingBase: string
  dailyPercentage: string
  amount: string
}

export interface InstallmentDetail extends InstallmentSummary {
  lateFeePercentage: string
  lateFeeGraceDays: number
  feePercentage: string
  feeAmount: string | null
  feeOnBase: string
  feeOnCollected: string
  charges: InstallmentCharge[]
  payments: Payment[]
  lateFeeAdjustments: LateFeeAdjustment[]
  lateFeeDays: LateFeeDay[]
  /** Saldo a favor disponible del inquilino en la moneda del contrato. */
  creditsAvailable: string
  notes: string | null
  updatedAt: string
}

export interface RegisterPaymentResult {
  payment: Payment
  creditApplications: Payment[]
  installment: InstallmentDetail
}

export interface InstallmentBreakdown {
  installmentId: string
  period: string
  currency: Currency
  asOf: string
  status: InstallmentStatus
  baseAmount: string
  chargesTotal: string
  graceEndDate: string
  feeDays: number
  lateFeePercentage: string
  lateFeeAccrued: string
  lateFeeAdjusted: string
  lateFeeWaived: boolean
  rentPaid: string
  chargesPaid: string
  lateFeePaid: string
  rentBalance: string
  chargesBalance: string
  lateFeeBalance: string
  totalDue: string
  creditAvailable: string
  totalDueAfterCredit: string
  days: LateFeeDay[]
}

export interface BillingSummaryByCurrency {
  currency: Currency
  total: number
  pending: number
  partial: number
  overdue: number
  paid: number
  baseTotal: string
  chargesTotal: string
  collectedTotal: string
  collectedByAgency: string
  collectedByOwner: string
  pendingConfirmationTotal: string
  lateFeeAccrued: string
  lateFeeCollected: string
  feeAccruedOnBase: string
  feeAccruedOnCollected: string
  balanceTotal: string
}

export interface BillingSummary {
  period: string
  byCurrency: BillingSummaryByCurrency[]
}

export interface InstallmentGenerationResult {
  period: string
  contracts: number
  created: number
  skipped: number
}

export interface RenterCredit {
  id: string
  renterId: string
  contractId: string
  currency: Currency
  amount: string
  remaining: string
  status: CreditStatus
  originPaymentId: string
  createdAt: string
  refundedAt: string | null
  refundMethod: PaymentMethod | null
  refundNotes: string | null
}

export interface RenterCredits {
  renterId: string
  totals: { currency: Currency; available: string }[]
  credits: RenterCredit[]
}

export interface MoneyByCurrency {
  currency: Currency
  amount: string
}

/** Mora de un inquilino, para badges en listados y fichas (spec 5.2). */
export interface RenterArrears {
  renterId: string
  status: ArrearsStatus
  overdueInstallments: number
  maxDaysOverdue: number
  lateFeeAccrued: MoneyByCurrency[]
  balance: MoneyByCurrency[]
}

export interface ContractAccountTotals {
  accrued: string
  chargesTotal: string
  lateFeeAccrued: string
  lateFeeAdjusted: string
  collected: string
  collectedByAgency: string
  collectedByOwner: string
  pendingConfirmation: string
  balance: string
  creditsAvailable: string
  feeAccruedOnBase: string
  feeAccruedOnCollected: string
}

export interface ContractAccountInstallment {
  id: string
  period: string
  baseAmount: string
  chargesTotal: string
  lateFeeAccrued: string
  lateFeeBalance: string
  paidTotal: string
  totalDue: string
  status: InstallmentStatus
  graceEndDate: string
  paidAt: string | null
}

export interface ContractAccountMovement {
  date: string
  type: AccountMovementType
  description: string
  debit: string | null
  credit: string | null
  balance: string
  installmentId: string | null
  paymentId: string | null
}

export interface ContractAccountDeposit {
  amount: string
  currency: Currency
  returnMode: DepositReturnMode
  suggestedReturn: string | null
}

/** Cuenta corriente del contrato (`GET /contracts/:id/account`). */
export interface ContractAccount {
  contract: {
    id: string
    currency: Currency
    collectionMode: CollectionMode
    feeMode: FeeMode
    depositReturnMode: DepositReturnMode
  }
  totals: ContractAccountTotals
  installments: ContractAccountInstallment[]
  movements: ContractAccountMovement[]
  deposit: ContractAccountDeposit
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export interface PaymentAllocation {
  lateFee: string
  rent: string
  charges: string
}

/** Lo que va en el multipart de `POST /billing/installments/:id/payments`. */
export interface RegisterPaymentRequest {
  paidAt: string
  amount: string
  paidCurrency: Currency
  exchangeRate?: string
  exchangeRateSource?: ExchangeRateSource
  exchangeRateDate?: string
  method: PaymentMethod
  receivedBy?: PaymentReceiver
  allocation?: PaymentAllocation
  applyCredit?: boolean
  notes?: string
}

export interface CreateChargeRequest {
  concept: ChargeConcept
  description: string
  amount: string
}

export interface CreateLateFeeAdjustmentRequest {
  kind: LateFeeAdjustmentKind
  amount?: string
  reason: string
}

export interface ApplyCreditRequest {
  creditId?: string
  amount?: string
}

export interface RefundCreditRequest {
  refundedAt: string
  method: PaymentMethod
  notes?: string
}

// ---------------------------------------------------------------------------
// Contratos: términos de cobro (Fase 11, sección 2 del rediseño)
// ---------------------------------------------------------------------------

export interface ContractBillingTerms {
  id: string
  effectiveFrom: string
  collectionMode: CollectionMode
  feeMode: FeeMode
  feePercentage: string
  feeAmount: string | null
  lateFeePercentage: string | null
  lateFeeGraceDays: number | null
  notes: string | null
  changedBy: UserRef | null
  createdAt: string
}

/** Los vigentes, con el punitorio ya resuelto contra la inmobiliaria. */
export interface ContractCurrentBillingTerms extends Omit<
  ContractBillingTerms,
  "lateFeePercentage" | "lateFeeGraceDays"
> {
  lateFeePercentage: string
  lateFeeGraceDays: number
  inheritedLateFeePercentage: boolean
  inheritedLateFeeGraceDays: boolean
}

export interface ChangeBillingTermsRequest {
  effectiveFrom?: string
  collectionMode?: CollectionMode
  feeMode?: FeeMode
  feePercentage?: string
  feeAmount?: string | null
  lateFeePercentage?: string | null
  lateFeeGraceDays?: number | null
  notes?: string
}
