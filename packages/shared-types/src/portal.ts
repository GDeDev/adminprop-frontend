import type { ApiSchemas } from "./api"
import type {
  CollectionMode,
  DepositReturnMode,
  InstallmentDetail,
  InstallmentSummary,
  MoneyByCurrency,
  RenterArrears,
} from "./billing"
import type { Currency } from "./common"
import type {
  ContractStatus,
  ContractTimeline,
  RentUpdateFrequency,
  RentUpdateType,
} from "./contract"
import type { ContractService } from "./service"
import type { OwnerStatementSummary, SettlementSummary } from "./settlements"

/**
 * Portales de inquilinos y propietarios (Fases 18 y 17), sólo lectura.
 * Nombres acordados en `REDISENO_FASE_17_18.md`, sección 4.
 *
 * Los DTOs que coinciden con el OpenAPI son alias. Los demás siguen a mano
 * porque el OpenAPI declara `string` donde la API manda una unión cerrada
 * (`status`, `currency`, `collectionMode`…); ver
 * `docs/tecnica/shared-types-generados.md`.
 */

export type PortalAgency = ApiSchemas["PortalAgencyDto"]
export type PortalRenterMe = ApiSchemas["PortalRenterMeDto"]

export interface PortalRenterContract {
  id: string
  status: ContractStatus
  property: { id: string; address: string; propertyType: string | null }
  startDate: string
  endDate: string
  currentRent: string
  currency: Currency
  rentUpdateType: RentUpdateType
  rentUpdateFrequency: RentUpdateFrequency
  nextRentUpdateOn: string | null
  deposit: string
  depositCurrency: Currency
  depositReturnMode: DepositReturnMode
  guarantor: { fullName: string } | null
  surety: { hasSurety: boolean; policyExpiresAt: string | null }
  services: ContractService[]
  collectionMode: CollectionMode
  /** Sólo cuando el inquilino paga los honorarios por cuenta del propietario (A-32). */
  feePaidByRenter: { feePercentage: string; feeAmount: string | null } | null
  timeline: ContractTimeline
}

export type PortalPaymentInstructions =
  ApiSchemas["PortalPaymentInstructionsDto"]

export interface PortalRenterAccount {
  contract: { id: string; status: ContractStatus } | null
  currentInstallment: InstallmentDetail | null
  creditsAvailable: MoneyByCurrency[]
  arrears: RenterArrears
  paymentInstructions: PortalPaymentInstructions
}

export type PortalOwnerMe = ApiSchemas["PortalOwnerMeDto"]

export interface PortalOwnerProperty {
  id: string
  address: string
  status: string
  contract: {
    id: string
    renter: { fullName: string }
    startDate: string
    endDate: string
    currentRent: string
    currency: Currency
    collectionMode: CollectionMode
  } | null
  currentInstallment: Pick<
    InstallmentSummary,
    "id" | "period" | "status" | "totalDue" | "paidTotal"
  > | null
}

export interface PortalOwnerAccountProperty {
  property: { id: string; address: string }
  currency: Currency
  accrued: string
  collected: string
  pending: string
  lateFee: string
  settlements: SettlementSummary[]
}

export interface PortalOwnerAccount {
  period: string
  properties: PortalOwnerAccountProperty[]
  fees: {
    currency: Currency
    accrued: string
    collected: string
    pending: string
  }[]
  totals: {
    currency: Currency
    accrued: string
    collected: string
    pending: string
    netSettled: string
    transferred: string
  }[]
}

export type PortalOwnerStatement = OwnerStatementSummary
