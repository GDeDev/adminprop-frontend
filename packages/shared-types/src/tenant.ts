import type { Currency, IsoDateTime, Percentage, Uuid } from "./common"

/** Inmobiliaria (PRD 5.0). Raíz del modelo multi-tenant. */
export interface Tenant {
  id: Uuid
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string | null
  isActive: boolean
  // Parámetros de negocio propios de cada inmobiliaria
  standardFeePercentage: Percentage
  reducedFeePercentage: Percentage
  reducedFeeThreshold: number
  paymentGraceDays: number
  dailyLateFeePercentage: Percentage
  installmentGenerationDay: number
  paymentReminderDay: number
  contractExpiryNoticeDays: number
  monthlyReportDay: number
  defaultCurrency: Currency
  createdAt: IsoDateTime
}
