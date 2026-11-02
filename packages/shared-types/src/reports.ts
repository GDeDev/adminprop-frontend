import type {
  Currency,
  IsoDate,
  IsoDateTime,
  Money,
  BillingPeriod,
  Uuid,
} from "./common"

/** Contrato de la Fase 19 (REDISENO_FASE_19_20.md, sección 8). Escrito a mano hasta regenerar. */
export interface CurrencyAmount {
  currency: Currency
  amount: Money
}

export interface ReportMeta {
  generatedAt: IsoDateTime
  /** Eco de los filtros pedidos, para el encabezado del export. */
  filters: Record<string, string | null>
}

export interface InstallmentBucket {
  count: number
  amounts: CurrencyAmount[]
}

export interface DashboardReport extends ReportMeta {
  period: BillingPeriod
  installments: {
    paid: InstallmentBucket
    partial: InstallmentBucket
    pending: InstallmentBucket
    overdue: InstallmentBucket
  }
  lateFeesAccrued: CurrencyAmount[]
  lateFeesCollected: CurrencyAmount[]
  feesAccrued: CurrencyAmount[]
  todo: {
    paymentsToConfirm: number
    settlementsToConfirm: number
    settlementsToTransfer: number
    openStatements: number
    pendingIncreases: number
    unreadAlerts: number
  }
  expiringContracts: ExpiringContractRow[]
  /** Últimos 6 meses, el más viejo primero. */
  history: {
    period: BillingPeriod
    accrued: CurrencyAmount[]
    collected: CurrencyAmount[]
  }[]
}

export interface IncomeReportRow {
  period: BillingPeriod
  currency: Currency
  rentCollected: Money
  lateFeesCollected: Money
  chargesCollected: Money
  feesAccrued: Money
  feesCollected: Money
  netSettled: Money
  netTransferred: Money
}

export interface IncomeReport extends ReportMeta {
  rows: IncomeReportRow[]
}

export interface PaymentReportRow {
  paymentId: Uuid
  paidAt: IsoDate
  period: BillingPeriod
  renterName: string
  propertyAddress: string
  ownerName: string
  amount: Money
  currency: Currency
  method: string
  receivedBy: "AGENCY" | "OWNER"
}

export interface ArrearsReportRow {
  renterId: Uuid
  renterName: string
  renterPhone: string | null
  propertyAddress: string
  ownerName: string
  overdueInstallments: number
  maxDaysOverdue: number
  balance: CurrencyAmount[]
  lateFee: CurrencyAmount[]
}

export interface ArrearsReport extends ReportMeta {
  rows: ArrearsReportRow[]
  totals: CurrencyAmount[]
}

export interface PropertyReportRow {
  propertyId: Uuid
  address: string
  status: "RENTED" | "AVAILABLE" | "OTHER"
  renterName: string | null
  rent: CurrencyAmount | null
  contractEndDate: IsoDate | null
  daysVacant: number | null
}

export interface PropertiesReport extends ReportMeta {
  rows: PropertyReportRow[]
}

export interface ExpiringContractRow {
  contractId: Uuid
  propertyAddress: string
  renterName: string
  endDate: IsoDate
  daysLeft: number
  renewalInProgress: boolean
}

export interface ExpiringContractsReport extends ReportMeta {
  rows: ExpiringContractRow[]
}

export interface ServiceReportRow {
  serviceId: Uuid
  propertyId: Uuid
  propertyAddress: string
  serviceName: string
  daysOverdue: number
}

export interface ServicesReport extends ReportMeta {
  rows: ServiceReportRow[]
}

export type ReportFormat = "xlsx" | "csv" | "pdf"
