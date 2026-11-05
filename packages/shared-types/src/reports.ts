import type { ApiSchemas } from "./api"

/**
 * Reportes y dashboard (Fase 19), tal como los devuelve la API. Todo es alias
 * del OpenAPI; los montos llegan como string y sólo se formatean.
 */
export type CurrencyAmount = ApiSchemas["CurrencyAmountDto"]
export type InstallmentBucket = ApiSchemas["InstallmentBucketDto"]

export type DashboardReport = ApiSchemas["DashboardReportDto"]
export type IncomeReportRow = ApiSchemas["IncomeReportRowDto"]
export type IncomeReport = ApiSchemas["IncomeReportDto"]
export type PaymentReportRow = ApiSchemas["PaymentReportRowDto"]
export type ArrearsReportRow = ApiSchemas["ArrearsReportRowDto"]
export type ArrearsReport = ApiSchemas["ArrearsReportDto"]
export type PropertyReportRow = ApiSchemas["PropertyReportRowDto"]
export type PropertiesReport = ApiSchemas["PropertiesReportDto"]
export type ExpiringContractRow = ApiSchemas["ExpiringContractRowDto"]
export type ExpiringContractsReport = ApiSchemas["ExpiringContractsReportDto"]
export type ServiceReportRow = ApiSchemas["ServiceReportRowDto"]
export type ServicesReport = ApiSchemas["ServicesReportDto"]

/** Lo común a todos los reportes: cuándo se generó y con qué filtros. */
export type ReportMeta = Pick<DashboardReport, "generatedAt" | "filters">

export type ReportFormat = "xlsx" | "csv" | "pdf"
