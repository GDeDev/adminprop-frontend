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
import type { BankAccount } from "./owner"
import type { ContractService } from "./service"
import type {
  OwnerStatementSummary,
  SettlementSummary,
  StatementSendMode,
} from "./settlements"

/**
 * Portales de inquilinos y propietarios (Fases 18 y 17), sólo lectura.
 * Nombres acordados en `REDISENO_FASE_17_18.md`, sección 4.
 *
 * TODO(fase-18): reemplazar por alias a `ApiSchemas["…Dto"]` cuando el
 * `openapi.json` de la rama del portal esté exportado.
 */

export interface PortalAgency {
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string | null
  phone: string | null
  email: string | null
  /** Sólo dígitos, con código de país. */
  whatsapp: string | null
  address: string | null
  bankAccount: {
    holder: string | null
    bank: string | null
    cbu: string | null
    alias: string | null
  } | null
}

export interface PortalRenterMe {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  agency: PortalAgency
}

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

export interface PortalPaymentInstructions {
  kind: CollectionMode
  bankAccount: PortalAgency["bankAccount"]
}

export interface PortalRenterAccount {
  contract: { id: string; status: ContractStatus } | null
  currentInstallment: InstallmentDetail | null
  creditsAvailable: MoneyByCurrency[]
  arrears: RenterArrears
  paymentInstructions: PortalPaymentInstructions
}

export interface PortalOwnerMe {
  id: string
  fullName: string
  email: string | null
  bankAccount: BankAccount | null
  statementSendMode: StatementSendMode
  agency: PortalAgency
}

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
