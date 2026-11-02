"use client"

import { useQuery } from "@tanstack/react-query"

import type {
  ApiSuccess,
  ArrearsReport,
  DashboardReport,
  ExpiringContractsReport,
  IncomeReport,
  Paginated,
  PaymentReportRow,
  PropertiesReport,
  ReportFormat,
  ServicesReport,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"

async function get<T>(
  url: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const { data } = await apiClient.get<ApiSuccess<T>>(url, { params })
  return data.data
}

export const reportsKey = ["reports"] as const

export function useDashboardReport(period: string) {
  return useQuery({
    queryKey: [...reportsKey, "dashboard", period],
    queryFn: () => get<DashboardReport>("/reports/dashboard", { period }),
  })
}

export interface RangeFilters {
  from: string
  to: string
}

export function useIncomeReport(filters: RangeFilters) {
  return useQuery({
    queryKey: [...reportsKey, "income", filters],
    queryFn: () =>
      get<IncomeReport>("/reports/financial/income", { ...filters }),
  })
}

export function usePaymentsReport(filters: RangeFilters) {
  return useQuery({
    queryKey: [...reportsKey, "payments", filters],
    queryFn: () =>
      get<Paginated<PaymentReportRow>>("/reports/financial/payments", {
        ...filters,
        limit: 100,
      }),
  })
}

export function useArrearsReport(minDays: number) {
  return useQuery({
    queryKey: [...reportsKey, "arrears", minDays],
    queryFn: () =>
      get<ArrearsReport>("/reports/financial/arrears", { minDays }),
  })
}

export function usePropertiesReport(status: "RENTED" | "AVAILABLE") {
  return useQuery({
    queryKey: [...reportsKey, "properties", status],
    queryFn: () =>
      get<PropertiesReport>("/reports/operations/properties", { status }),
  })
}

export function useExpiringContractsReport(withinDays: number) {
  return useQuery({
    queryKey: [...reportsKey, "expiring", withinDays],
    queryFn: () =>
      get<ExpiringContractsReport>("/reports/operations/expiring-contracts", {
        withinDays,
      }),
  })
}

export function useServicesReport(status: "overdue" | "all") {
  return useQuery({
    queryKey: [...reportsKey, "services", status],
    queryFn: () =>
      get<ServicesReport>("/reports/operations/services", { status }),
  })
}

/**
 * Descarga un reporte exportado (`format=xlsx|csv|pdf`) con los filtros
 * actuales. La API responde el archivo; se baja por blob para mandar el token.
 */
export async function downloadExport(
  url: string,
  params: Record<string, string | number | undefined>,
  format: ReportFormat,
  filename: string
): Promise<void> {
  const response = await apiClient.get<Blob>(url, {
    params: { ...params, format },
    responseType: "blob",
  })
  const objectUrl = URL.createObjectURL(response.data)
  const link = document.createElement("a")
  link.href = objectUrl
  link.download = `${filename}.${format}`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}
