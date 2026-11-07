"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"

import type {
  ApiSuccess,
  AuditAction,
  AuditActorKind,
  AuditCatalog,
  AuditEntry,
  AuditEntryDetail,
  Paginated,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"

const PAGE_SIZE = 25
export const auditKey = ["audit"] as const

export interface AuditFilters {
  entity?: string
  action?: AuditAction
  actorKind?: AuditActorKind
  from?: string
  to?: string
  search?: string
  entityId?: string
}

/** Quita los filtros vacíos antes de armar la query. */
export function auditParams(filters: AuditFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== ""
    )
  )
}

export function useInfiniteAudit(filters: AuditFilters) {
  return useInfiniteQuery({
    queryKey: [...auditKey, "list", filters],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<ApiSuccess<Paginated<AuditEntry>>>(
        "/audit",
        {
          params: {
            ...auditParams(filters),
            page: pageParam,
            limit: PAGE_SIZE,
          },
        }
      )
      return data.data
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNextPage ? last.pagination.page + 1 : undefined,
  })
}

export function useAuditEntry(id: string | null) {
  return useQuery({
    queryKey: [...auditKey, "entry", id],
    enabled: id !== null,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccess<AuditEntryDetail>>(
        `/audit/${id}`
      )
      return data.data
    },
  })
}

export function useAuditCatalog() {
  return useQuery({
    queryKey: [...auditKey, "catalog"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data } =
        await apiClient.get<ApiSuccess<AuditCatalog>>("/audit/entities")
      return data.data
    },
  })
}

/** Últimos cambios de una ficha (pestaña "Historial"). */
export function useEntityHistory(entity: string, entityId: string, limit = 20) {
  return useQuery({
    queryKey: [...auditKey, "entity", entity, entityId, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccess<AuditEntry[]>>(
        `/audit/entity/${entity}/${entityId}`,
        { params: { limit } }
      )
      return data.data
    },
  })
}
