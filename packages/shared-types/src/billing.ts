import type { ApiSchemas } from "./api"

/**
 * Cobros y punitorios (Fase 11): cuotas, pagos, cargos, ajustes de punitorio,
 * saldos a favor y cuenta corriente, tal como los devuelve la API
 * (`adminprop-repo-files/docs/REDISENO_FASE_11.md`).
 */

/** Una cuota en el listado, con los saldos a hoy. `OVERDUE` lo calcula la API. */
export type InstallmentSummary = ApiSchemas["InstallmentSummaryDto"]
/** La ficha: términos copiados, cargos, pagos, ajustes y el día por día. */
export type InstallmentDetail = ApiSchemas["InstallmentDetailDto"]
export type InstallmentCharge = ApiSchemas["InstallmentChargeDto"]
export type Payment = ApiSchemas["PaymentDto"]
/** `GET /billing/payments`: el pago con su inquilino y propiedad. */
export type PaymentListItem = ApiSchemas["PaymentListItemDto"]
export type LateFeeAdjustment = ApiSchemas["LateFeeAdjustmentDto"]
/** Un día de punitorio: sobre cuánto alquiler impago se calculó (A-3). */
export type LateFeeDay = ApiSchemas["LateFeeDayDto"]
export type RegisterPaymentResult = ApiSchemas["RegisterPaymentResultDto"]
export type InstallmentBreakdown = ApiSchemas["InstallmentBreakdownDto"]
export type BillingSummary = ApiSchemas["BillingSummaryDto"]
export type BillingSummaryByCurrency = ApiSchemas["BillingSummaryByCurrencyDto"]
export type InstallmentGenerationResult =
  ApiSchemas["InstallmentGenerationResultDto"]
export type RenterCredit = ApiSchemas["RenterCreditDto"]
export type RenterCredits = ApiSchemas["RenterCreditsDto"]
export type MoneyByCurrency = ApiSchemas["MoneyByCurrencyDto"]
/** Mora de un inquilino, para badges en listados y fichas (spec 5.2). */
export type RenterArrears = ApiSchemas["RenterArrearsDto"]
/** Cuenta corriente del contrato (`GET /contracts/:id/account`). */
export type ContractAccount = ApiSchemas["ContractAccountDto"]
export type ContractAccountTotals = ApiSchemas["ContractAccountTotalsDto"]
export type ContractAccountInstallment =
  ApiSchemas["ContractAccountInstallmentDto"]
export type ContractAccountMovement = ApiSchemas["ContractAccountMovementDto"]
export type ContractAccountDeposit = ApiSchemas["ContractAccountDepositDto"]

export type InstallmentStatus = InstallmentSummary["status"]
export type PaymentStatus = Payment["status"]
export type PaymentKind = Payment["kind"]
export type PaymentMethod = Payment["method"]
export type PaymentReceiver = Payment["receivedBy"]
export type ExchangeRateSource = NonNullable<Payment["exchangeRateSource"]>
export type ChargeConcept = InstallmentCharge["concept"]
export type LateFeeAdjustmentKind = LateFeeAdjustment["kind"]
export type CreditStatus = RenterCredit["status"]
export type CollectionMode = InstallmentSummary["collectionMode"]
export type FeeMode = InstallmentSummary["feeMode"]
export type DepositReturnMode = ContractAccountDeposit["returnMode"]
export type ArrearsStatus = RenterArrears["status"]
export type AccountMovementType = ContractAccountMovement["type"]

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export type CreateChargeRequest = ApiSchemas["CreateChargeDto"]
export type CreateLateFeeAdjustmentRequest =
  ApiSchemas["CreateLateFeeAdjustmentDto"]
export type ApplyCreditRequest = ApiSchemas["ApplyCreditDto"]
export type RefundCreditRequest = ApiSchemas["RefundCreditDto"]

/** Imputación manual de un pago, en la moneda del contrato (A-8). */
export interface PaymentAllocation {
  lateFee: string
  rent: string
  charges: string
}

/**
 * Lo que va en el multipart de `POST /billing/installments/:id/payments`.
 * Escrito a mano porque el OpenAPI describe el multipart inline.
 */
export interface RegisterPaymentRequest {
  paidAt: string
  amount: string
  paidCurrency: InstallmentSummary["currency"]
  exchangeRate?: string
  exchangeRateSource?: ExchangeRateSource
  exchangeRateDate?: string
  method: PaymentMethod
  receivedBy?: PaymentReceiver
  allocation?: PaymentAllocation
  applyCredit?: boolean
  notes?: string
}

// ---------------------------------------------------------------------------
// Contratos: términos de cobro (Fase 11, sección 2 del rediseño)
// ---------------------------------------------------------------------------

/** Una fila del historial de términos, con los valores crudos (null = de la inmobiliaria). */
export type ContractBillingTerms = ApiSchemas["ContractBillingTermsDto"]
/** Los vigentes, con las marcas de qué viene de la inmobiliaria. */
export type ContractCurrentBillingTerms =
  ApiSchemas["ContractCurrentBillingTermsDto"]
export type ChangeBillingTermsRequest = ApiSchemas["ChangeBillingTermsDto"]
