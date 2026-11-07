"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type {
  ApiSuccess,
  CloseOwnerStatementRequest,
  CreateOwnerStatementRequest,
  CreateSettlementAdjustmentRequest,
  CreateSettlementRequest,
  DepositReturn,
  FeePayment,
  FeeReceivable,
  FeeReceivableStatus,
  OwnerDetail,
  OwnerFeeAccount,
  OwnerStatementDetail,
  OwnerStatementSummary,
  Paginated,
  RegisterDepositReturnRequest,
  RegisterFeePaymentRequest,
  RegisterSettlementTransferRequest,
  SettlementDetail,
  SettlementStatus,
  SettlementSummary,
  StatementStatus,
  UpdateOwnerFeeSettingsRequest,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"

const PAGE_SIZE = 20
export const settlementsKey = ["settlements"] as const

async function unwrap<T>(
  request: Promise<{ data: ApiSuccess<T> }>
): Promise<T> {
  return (await request).data.data
}

/**
 * Una liquidación marca pagos y gastos, mueve la cuenta de honorarios y la
 * del contrato: se invalidan liquidaciones, cobros, servicios y propietarios.
 */
function useSettlementMutation<TVariables, TResult>(
  request: (variables: TVariables) => Promise<TResult>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      for (const key of [
        settlementsKey,
        ["billing"],
        ["advance-expenses"],
        ["owners"],
      ]) {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })
}

function paged<T>(url: string, params: object) {
  return async ({ pageParam }: { pageParam: number }) => {
    const { data } = await apiClient.get<ApiSuccess<Paginated<T>>>(url, {
      params: { ...params, page: pageParam, limit: PAGE_SIZE },
    })
    return data.data
  }
}

const nextPage = (last: Paginated<unknown>) =>
  last.pagination.hasNextPage ? last.pagination.page + 1 : undefined

// ---------------------------------------------------------------------------
// Liquidaciones
// ---------------------------------------------------------------------------

export interface SettlementFilters {
  ownerId?: string
  propertyId?: string
  contractId?: string
  period?: string
  status?: SettlementStatus
}

export function useInfiniteSettlements(filters: SettlementFilters) {
  return useInfiniteQuery({
    queryKey: [...settlementsKey, "list", filters],
    queryFn: paged<SettlementSummary>("/settlements", filters),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  })
}

export function useSettlement(id: string) {
  return useQuery({
    queryKey: [...settlementsKey, "detail", id],
    queryFn: () =>
      unwrap<SettlementDetail>(apiClient.get(`/settlements/${id}`)),
  })
}

export function useCreateSettlement() {
  return useSettlementMutation((body: CreateSettlementRequest) =>
    unwrap<SettlementDetail>(apiClient.post("/settlements", body))
  )
}

export function useRecalculateSettlement() {
  return useSettlementMutation((id: string) =>
    unwrap<SettlementDetail>(apiClient.post(`/settlements/${id}/recalculate`))
  )
}

export function useAddSettlementAdjustment() {
  return useSettlementMutation(
    ({ id, ...body }: CreateSettlementAdjustmentRequest & { id: string }) =>
      unwrap<SettlementDetail>(
        apiClient.post(`/settlements/${id}/adjustments`, body)
      )
  )
}

export function useVoidSettlementAdjustment() {
  return useSettlementMutation(
    ({ id, reason }: { id: string; reason: string }) =>
      unwrap<SettlementDetail>(
        apiClient.post(`/settlements/adjustments/${id}/void`, { reason })
      )
  )
}

export function useConfirmSettlement() {
  return useSettlementMutation((id: string) =>
    unwrap<SettlementDetail>(apiClient.post(`/settlements/${id}/confirm`))
  )
}

export function useCancelSettlement() {
  return useSettlementMutation(
    ({ id, reason }: { id: string; reason: string }) =>
      unwrap<SettlementDetail>(
        apiClient.post(`/settlements/${id}/cancel`, { reason })
      )
  )
}

export interface RegisterTransferVariables extends RegisterSettlementTransferRequest {
  settlementId: string
  file?: File | null
}

export function useRegisterTransfer() {
  return useSettlementMutation(
    ({ settlementId, file, ...fields }: RegisterTransferVariables) => {
      const form = new FormData()
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== null && value !== "") {
          form.append(key, String(value))
        }
      }
      if (file) form.append("file", file)
      return unwrap<SettlementDetail>(
        apiClient.post(`/settlements/${settlementId}/transfers`, form)
      )
    }
  )
}

export function useVoidTransfer() {
  return useSettlementMutation(
    ({ id, reason }: { id: string; reason: string }) =>
      unwrap<SettlementDetail>(
        apiClient.post(`/settlements/transfers/${id}/void`, { reason })
      )
  )
}

/** Historial de un propietario (ficha y, en la Fase 17, su portal). */
export function useInfiniteOwnerSettlements(
  ownerId: string,
  filters: { period?: string; status?: SettlementStatus } = {}
) {
  return useInfiniteQuery({
    queryKey: [...settlementsKey, "owner", ownerId, filters],
    queryFn: paged<SettlementSummary>(
      `/owners/${ownerId}/settlements`,
      filters
    ),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  })
}

// ---------------------------------------------------------------------------
// Consolidados
// ---------------------------------------------------------------------------

export interface StatementFilters {
  ownerId?: string
  period?: string
  status?: StatementStatus
}

export function useInfiniteStatements(filters: StatementFilters) {
  return useInfiniteQuery({
    queryKey: [...settlementsKey, "statements", filters],
    queryFn: paged<OwnerStatementSummary>("/statements", filters),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  })
}

export function useStatement(id: string) {
  return useQuery({
    queryKey: [...settlementsKey, "statement", id],
    queryFn: () =>
      unwrap<OwnerStatementDetail>(apiClient.get(`/statements/${id}`)),
  })
}

/** Liquidaciones confirmadas del propietario que todavía no están en un consolidado. */
export function useStatementCandidates(id: string) {
  return useQuery({
    queryKey: [...settlementsKey, "statement", id, "candidates"],
    queryFn: () =>
      unwrap<SettlementSummary[]>(
        apiClient.get(`/statements/${id}/candidates`)
      ),
  })
}

export function useCreateStatement() {
  return useSettlementMutation((body: CreateOwnerStatementRequest) =>
    unwrap<OwnerStatementDetail>(apiClient.post("/statements", body))
  )
}

export function useAddStatementSettlements() {
  return useSettlementMutation(
    ({ id, settlementIds }: { id: string; settlementIds: string[] }) =>
      unwrap<OwnerStatementDetail>(
        apiClient.post(`/statements/${id}/settlements`, { settlementIds })
      )
  )
}

export function useRemoveStatementSettlement() {
  return useSettlementMutation(
    async ({ id, settlementId }: { id: string; settlementId: string }) => {
      await apiClient.delete(`/statements/${id}/settlements/${settlementId}`)
    }
  )
}

export function useCloseStatement() {
  return useSettlementMutation(
    ({ id, ...body }: CloseOwnerStatementRequest & { id: string }) =>
      unwrap<OwnerStatementDetail>(
        apiClient.post(`/statements/${id}/close`, body)
      )
  )
}

export function useReopenStatement() {
  return useSettlementMutation((id: string) =>
    unwrap<OwnerStatementDetail>(apiClient.post(`/statements/${id}/reopen`))
  )
}

// ---------------------------------------------------------------------------
// Honorarios
// ---------------------------------------------------------------------------

export interface FeeReceivableFilters {
  ownerId?: string
  contractId?: string
  status?: FeeReceivableStatus
}

export function useInfiniteFeeReceivables(filters: FeeReceivableFilters) {
  return useInfiniteQuery({
    queryKey: [...settlementsKey, "fee-receivables", filters],
    queryFn: paged<FeeReceivable>("/fee-receivables", filters),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  })
}

export function useOwnerFeeAccount(ownerId: string) {
  return useQuery({
    queryKey: [...settlementsKey, "fee-account", ownerId],
    queryFn: () =>
      unwrap<OwnerFeeAccount>(apiClient.get(`/owners/${ownerId}/fee-account`)),
  })
}

export interface RegisterFeePaymentVariables extends RegisterFeePaymentRequest {
  file?: File | null
}

export function useRegisterFeePayment() {
  return useSettlementMutation(
    ({ file, ...fields }: RegisterFeePaymentVariables) => {
      const form = new FormData()
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== null && value !== "") {
          form.append(key, String(value))
        }
      }
      if (file) form.append("file", file)
      return unwrap<FeePayment>(apiClient.post("/fee-payments", form))
    }
  )
}

export function useVoidFeePayment() {
  return useSettlementMutation(
    ({ id, reason }: { id: string; reason: string }) =>
      unwrap<FeePayment>(apiClient.post(`/fee-payments/${id}/void`, { reason }))
  )
}

export function useUpdateOwnerFeeSettings() {
  return useSettlementMutation(
    ({ id, ...body }: UpdateOwnerFeeSettingsRequest & { id: string }) =>
      unwrap<OwnerDetail>(apiClient.patch(`/owners/${id}/fee-settings`, body))
  )
}

// ---------------------------------------------------------------------------
// Depósito
// ---------------------------------------------------------------------------

export function useRegisterDepositReturn() {
  return useSettlementMutation(
    ({
      contractId,
      ...body
    }: RegisterDepositReturnRequest & { contractId: string }) =>
      unwrap<DepositReturn>(
        apiClient.post(`/contracts/${contractId}/deposit-return`, body)
      )
  )
}
