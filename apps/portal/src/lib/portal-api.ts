"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type {
  ApiSuccess,
  InstallmentDetail,
  InstallmentSummary,
  OwnerStatementDetail,
  OwnerStatementSummary,
  Paginated,
  PortalOwnerAccount,
  PortalOwnerMe,
  PortalOwnerProperty,
  PortalRenterAccount,
  PortalRenterContract,
  PortalRenterMe,
  SettlementDetail,
  SettlementSummary,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"

const PAGE_SIZE = 12
export const portalKey = ["portal"] as const

async function unwrap<T>(
  request: Promise<{ data: ApiSuccess<T> }>
): Promise<T> {
  return (await request).data.data
}

function paged<T>(url: string, params: object = {}) {
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
// Inquilino
// ---------------------------------------------------------------------------

export function useRenterMe() {
  return useQuery({
    queryKey: [...portalKey, "renter", "me"],
    queryFn: () => unwrap<PortalRenterMe>(apiClient.get("/portal/renter/me")),
  })
}

export function useRenterContract() {
  return useQuery({
    queryKey: [...portalKey, "renter", "contract"],
    queryFn: () =>
      unwrap<PortalRenterContract | null>(
        apiClient.get("/portal/renter/contract")
      ),
  })
}

export function useRenterAccount() {
  return useQuery({
    queryKey: [...portalKey, "renter", "account"],
    queryFn: () =>
      unwrap<PortalRenterAccount>(apiClient.get("/portal/renter/account")),
  })
}

export function useRenterInstallments() {
  return useInfiniteQuery({
    queryKey: [...portalKey, "renter", "installments"],
    queryFn: paged<InstallmentSummary>("/portal/renter/installments"),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  })
}

export function useRenterInstallment(id: string | null) {
  return useQuery({
    queryKey: [...portalKey, "renter", "installment", id],
    enabled: id !== null,
    queryFn: () =>
      unwrap<InstallmentDetail>(
        apiClient.get(`/portal/renter/installments/${id}`)
      ),
  })
}

/** URL del recibo PDF de un pago (Fase 15); el navegador sigue el 302. */
export function renterReceiptUrl(paymentId: string): string {
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}/portal/renter/payments/${paymentId}/receipt`
}

// ---------------------------------------------------------------------------
// Propietario
// ---------------------------------------------------------------------------

export function useOwnerMe() {
  return useQuery({
    queryKey: [...portalKey, "owner", "me"],
    queryFn: () => unwrap<PortalOwnerMe>(apiClient.get("/portal/owner/me")),
  })
}

export function useOwnerProperties() {
  return useQuery({
    queryKey: [...portalKey, "owner", "properties"],
    queryFn: () =>
      unwrap<PortalOwnerProperty[]>(apiClient.get("/portal/owner/properties")),
  })
}

export function useOwnerAccount(period?: string) {
  return useQuery({
    queryKey: [...portalKey, "owner", "account", period ?? "current"],
    queryFn: () =>
      unwrap<PortalOwnerAccount>(
        apiClient.get("/portal/owner/account", {
          params: period ? { period } : {},
        })
      ),
  })
}

export function useOwnerSettlements(
  filters: { propertyId?: string; period?: string } = {}
) {
  return useInfiniteQuery({
    queryKey: [...portalKey, "owner", "settlements", filters],
    queryFn: paged<SettlementSummary>("/portal/owner/settlements", filters),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  })
}

export function useOwnerSettlement(id: string) {
  return useQuery({
    queryKey: [...portalKey, "owner", "settlement", id],
    queryFn: () =>
      unwrap<SettlementDetail & { acknowledgedAt: string | null }>(
        apiClient.get(`/portal/owner/settlements/${id}`)
      ),
  })
}

export function useAcknowledgeSettlement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      unwrap<SettlementDetail>(
        apiClient.post(`/portal/owner/settlements/${id}/acknowledge`)
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...portalKey, "owner"] })
    },
  })
}

export function useOwnerStatements() {
  return useInfiniteQuery({
    queryKey: [...portalKey, "owner", "statements"],
    queryFn: paged<OwnerStatementSummary>("/portal/owner/statements"),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  })
}

export function useOwnerStatement(id: string) {
  return useQuery({
    queryKey: [...portalKey, "owner", "statement", id],
    queryFn: () =>
      unwrap<OwnerStatementDetail>(
        apiClient.get(`/portal/owner/statements/${id}`)
      ),
  })
}

export function useOwnerPropertyInstallments(propertyId: string) {
  return useInfiniteQuery({
    queryKey: [...portalKey, "owner", "property-installments", propertyId],
    queryFn: paged<InstallmentSummary>(
      `/portal/owner/properties/${propertyId}/installments`
    ),
    initialPageParam: 1,
    getNextPageParam: nextPage,
  })
}

export function ownerSettlementPdfUrl(id: string): string {
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}/portal/owner/settlements/${id}/pdf`
}

export function ownerStatementPdfUrl(id: string): string {
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}/portal/owner/statements/${id}/pdf`
}
