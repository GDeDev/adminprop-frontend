import type { ApiSchemas } from "./api"

/**
 * Liquidaciones (Fase 12): liquidación por contrato, consolidado mensual por
 * propietario, cuenta de honorarios y devolución del depósito, tal como los
 * devuelve la API (`adminprop-repo-files/docs/REDISENO_FASE_12.md`).
 */

export type SettlementSummary = ApiSchemas["SettlementSummaryDto"]
export type SettlementDetail = ApiSchemas["SettlementDetailDto"]
export type SettlementPayment = ApiSchemas["SettlementPaymentDto"]
export type SettlementExpense = ApiSchemas["SettlementExpenseDto"]
export type SettlementAdjustment = ApiSchemas["SettlementAdjustmentDto"]
export type SettlementTransfer = ApiSchemas["SettlementTransferDto"]
export type OwnerStatementSummary = ApiSchemas["OwnerStatementSummaryDto"]
export type OwnerStatementDetail = ApiSchemas["OwnerStatementDetailDto"]
export type OwnerStatementTotals = ApiSchemas["OwnerStatementTotalsDto"]
export type FeeReceivable = ApiSchemas["FeeReceivableDto"]
export type FeePayment = ApiSchemas["FeePaymentDto"]
export type OwnerFeeAccount = ApiSchemas["OwnerFeeAccountDto"]
export type OwnerFeeAccountTotals = OwnerFeeAccount["totals"][number]
export type OwnerFeeAccountMovement = OwnerFeeAccount["movements"][number]
export type OwnerFeeSettings = ApiSchemas["OwnerFeeSettingsDto"]
export type DepositReturn = ApiSchemas["DepositReturnDto"]
export type DepositReturnDeduction = DepositReturn["deductions"][number]

export type SettlementStatus = SettlementSummary["status"]
export type SettlementAdjustmentConcept = SettlementAdjustment["concept"]
export type StatementStatus = OwnerStatementSummary["status"]
export type StatementSendMode = OwnerStatementSummary["sendMode"]
export type FeeReceivableSource = FeeReceivable["source"]
export type FeePayer = FeeReceivable["payer"]
export type FeeReceivableStatus = FeeReceivable["status"]
export type DepositDeductionConcept = DepositReturnDeduction["concept"]
export type FeeAccountMovementType = OwnerFeeAccountMovement["type"]

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export type CreateSettlementRequest = ApiSchemas["CreateSettlementDto"]
export type CreateSettlementAdjustmentRequest =
  ApiSchemas["CreateSettlementAdjustmentDto"]
export type CreateOwnerStatementRequest = ApiSchemas["CreateOwnerStatementDto"]
export type CloseOwnerStatementRequest = ApiSchemas["CloseOwnerStatementDto"]
export type UpdateOwnerFeeSettingsRequest =
  ApiSchemas["UpdateOwnerFeeSettingsDto"]
export type RegisterDepositReturnRequest =
  ApiSchemas["RegisterDepositReturnDto"]

/** Multipart de `POST /settlements/:id/transfers` (inline en el OpenAPI). */
export interface RegisterSettlementTransferRequest {
  transferredAt: string
  amount: string
  method: ApiSchemas["SettlementTransferDto"]["method"]
  notes?: string
}

/** Multipart de `POST /fee-payments` (inline en el OpenAPI). */
export interface RegisterFeePaymentRequest {
  ownerId: string
  contractId?: string
  paidAt: string
  amount: string
  currency: FeePayment["currency"]
  method: FeePayment["method"]
  paidBy: FeePayer
  notes?: string
}
