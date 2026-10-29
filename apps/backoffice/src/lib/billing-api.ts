"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type {
  ApiSuccess,
  ApplyCreditRequest,
  BillingSummary,
  CollectionMode,
  ContractAccount,
  CreateChargeRequest,
  CreateLateFeeAdjustmentRequest,
  InstallmentBreakdown,
  InstallmentCharge,
  InstallmentDetail,
  InstallmentGenerationResult,
  InstallmentStatus,
  InstallmentSummary,
  Paginated,
  Payment,
  PaymentListItem,
  PaymentReceiver,
  PaymentStatus,
  RefundCreditRequest,
  RegisterPaymentRequest,
  RegisterPaymentResult,
  RenterArrears,
  RenterCredit,
  RenterCredits,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"

const PAGE_SIZE = 20
export const billingKey = ["billing"] as const

async function unwrap<T>(
  request: Promise<{ data: ApiSuccess<T> }>
): Promise<T> {
  return (await request).data.data
}

// ---------------------------------------------------------------------------
// Cuotas
// ---------------------------------------------------------------------------

export interface InstallmentFilters {
  period?: string
  status?: InstallmentStatus
  contractId?: string
  renterId?: string
  propertyId?: string
  ownerId?: string
  collectionMode?: CollectionMode
}

export function useInfiniteInstallments(
  filters: InstallmentFilters,
  options: { enabled?: boolean } = {}
) {
  return useInfiniteQuery({
    queryKey: [...billingKey, "installments", filters],
    enabled: options.enabled ?? true,
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<
        ApiSuccess<Paginated<InstallmentSummary>>
      >("/billing/installments", {
        params: { ...filters, page: pageParam, limit: PAGE_SIZE },
      })
      return data.data
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNextPage ? last.pagination.page + 1 : undefined,
  })
}

/** Las cuotas de un contrato, todas (para la ficha: "estado mes a mes"). */
export function useContractInstallments(contractId: string) {
  return useQuery({
    queryKey: [...billingKey, "installments", "contract", contractId],
    queryFn: () =>
      unwrap<Paginated<InstallmentSummary>>(
        apiClient.get("/billing/installments", {
          params: { contractId, page: 1, limit: 100 },
        })
      ),
  })
}

export function useBillingSummary(period: string) {
  return useQuery({
    queryKey: [...billingKey, "summary", period],
    queryFn: () =>
      unwrap<BillingSummary>(
        apiClient.get("/billing/installments/summary", { params: { period } })
      ),
  })
}

export function useInstallment(id: string) {
  return useQuery({
    queryKey: [...billingKey, "installment", id],
    queryFn: () =>
      unwrap<InstallmentDetail>(apiClient.get(`/billing/installments/${id}`)),
  })
}

/** Desglose a una fecha (spec 3.4); sin `asOf`, a hoy. */
export function useInstallmentBreakdown(id: string, asOf?: string) {
  return useQuery({
    queryKey: [...billingKey, "breakdown", id, asOf ?? "today"],
    queryFn: () =>
      unwrap<InstallmentBreakdown>(
        apiClient.get(`/billing/installments/${id}/breakdown`, {
          params: asOf ? { asOf } : {},
        })
      ),
  })
}

export function useContractAccount(contractId: string) {
  return useQuery({
    queryKey: [...billingKey, "account", contractId],
    queryFn: () =>
      unwrap<ContractAccount>(
        apiClient.get(`/contracts/${contractId}/account`)
      ),
  })
}

/**
 * Cualquier movimiento de cobros cambia cuotas, resúmenes, cuentas, créditos
 * y mora: se invalida toda la clave `billing`. Los inquilinos también (su
 * estado de pago sale de acá).
 */
function useBillingMutation<TVariables, TResult>(
  request: (variables: TVariables) => Promise<TResult>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingKey })
    },
  })
}

export function useGenerateInstallments() {
  return useBillingMutation((period?: string) =>
    unwrap<InstallmentGenerationResult>(
      apiClient.post("/billing/installments/generate", period ? { period } : {})
    )
  )
}

// ---------------------------------------------------------------------------
// Pagos
// ---------------------------------------------------------------------------

export interface RegisterPaymentVariables extends RegisterPaymentRequest {
  installmentId: string
  file?: File | null
}

/** Multipart (spec 3.3): el comprobante es opcional (D-74). */
export function useRegisterPayment() {
  return useBillingMutation(
    ({
      installmentId,
      file,
      allocation,
      applyCredit,
      ...fields
    }: RegisterPaymentVariables) => {
      const form = new FormData()
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== null && value !== "") {
          form.append(key, String(value))
        }
      }
      if (allocation) form.append("allocation", JSON.stringify(allocation))
      if (applyCredit !== undefined)
        form.append("applyCredit", String(applyCredit))
      if (file) form.append("file", file)
      return unwrap<RegisterPaymentResult>(
        apiClient.post(`/billing/installments/${installmentId}/payments`, form)
      )
    }
  )
}

export function useConfirmPayment() {
  return useBillingMutation((id: string) =>
    unwrap<Payment>(apiClient.post(`/billing/payments/${id}/confirm`))
  )
}

export function useVoidPayment() {
  return useBillingMutation(({ id, reason }: { id: string; reason: string }) =>
    unwrap<Payment>(apiClient.post(`/billing/payments/${id}/void`, { reason }))
  )
}

export interface PaymentFilters {
  contractId?: string
  renterId?: string
  status?: PaymentStatus
  receivedBy?: PaymentReceiver
  from?: string
  to?: string
}

export function useInfinitePayments(filters: PaymentFilters) {
  return useInfiniteQuery({
    queryKey: [...billingKey, "payments", filters],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<
        ApiSuccess<Paginated<PaymentListItem>>
      >("/billing/payments", {
        params: { ...filters, page: pageParam, limit: PAGE_SIZE },
      })
      return data.data
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNextPage ? last.pagination.page + 1 : undefined,
  })
}

// ---------------------------------------------------------------------------
// Cargos, punitorios y créditos
// ---------------------------------------------------------------------------

export function useCreateCharge() {
  return useBillingMutation(
    ({
      installmentId,
      ...body
    }: CreateChargeRequest & { installmentId: string }) =>
      unwrap<InstallmentCharge>(
        apiClient.post(`/billing/installments/${installmentId}/charges`, body)
      )
  )
}

export function useVoidCharge() {
  return useBillingMutation(({ id, reason }: { id: string; reason: string }) =>
    unwrap<InstallmentCharge>(
      apiClient.post(`/billing/charges/${id}/void`, { reason })
    )
  )
}

/** Reducir o condonar el punitorio (sólo admin). */
export function useAdjustLateFee() {
  return useBillingMutation(
    ({
      installmentId,
      ...body
    }: CreateLateFeeAdjustmentRequest & { installmentId: string }) =>
      unwrap<InstallmentDetail>(
        apiClient.post(
          `/billing/installments/${installmentId}/late-fee-adjustments`,
          body
        )
      )
  )
}

export function useApplyCredit() {
  return useBillingMutation(
    ({
      installmentId,
      ...body
    }: ApplyCreditRequest & { installmentId: string }) =>
      unwrap<RegisterPaymentResult>(
        apiClient.post(
          `/billing/installments/${installmentId}/apply-credit`,
          body
        )
      )
  )
}

export function useRenterCredits(renterId: string) {
  return useQuery({
    queryKey: [...billingKey, "credits", renterId],
    queryFn: () =>
      unwrap<RenterCredits>(
        apiClient.get(`/billing/renters/${renterId}/credits`)
      ),
  })
}

export function useRefundCredit() {
  return useBillingMutation(
    ({ id, ...body }: RefundCreditRequest & { id: string }) =>
      unwrap<RenterCredit>(
        apiClient.post(`/billing/credits/${id}/refund`, body)
      )
  )
}

// ---------------------------------------------------------------------------
// Mora
// ---------------------------------------------------------------------------

/** Mora de varios inquilinos de una vez (listado). Vacío → no consulta. */
export function useArrears(renterIds: string[]) {
  const sorted = [...new Set(renterIds)].sort()
  return useQuery({
    queryKey: [...billingKey, "arrears", sorted],
    enabled: sorted.length > 0,
    queryFn: async () => {
      const list = await unwrap<RenterArrears[]>(
        apiClient.get("/billing/arrears", {
          params: { renterIds: sorted.join(",") },
        })
      )
      return new Map(list.map((item) => [item.renterId, item]))
    },
  })
}

export function useRenterArrears(renterId: string) {
  const query = useArrears([renterId])
  return { ...query, data: query.data?.get(renterId) }
}
