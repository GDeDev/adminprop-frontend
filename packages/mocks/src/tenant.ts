import type { Tenant } from "@adminprop/shared-types"

import { TENANT_ID } from "./ids"

/** Tenant genérico de demo (nunca datos reales de un cliente en código). */
export const tenant: Tenant = {
  id: TENANT_ID,
  name: "Inmobiliaria Demo",
  slug: "demo",
  logoUrl: null,
  primaryColor: null,
  isActive: true,
  standardFeePercentage: "5.00",
  reducedFeePercentage: "3.00",
  reducedFeeThreshold: 3,
  paymentGraceDays: 10,
  dailyLateFeePercentage: "5.00",
  installmentGenerationDay: 28,
  paymentReminderDay: 1,
  contractExpiryNoticeDays: 60,
  monthlyReportDay: 10,
  defaultCurrency: "ARS",
  createdAt: "2026-06-01T12:00:00.000Z",
}
