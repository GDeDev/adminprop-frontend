"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  ApiSuccess,
  AppraisePropertyRequest,
  MarketCoverageDto,
  MarketStatusDto,
  Paginated,
  ValuationResult,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"

export const valuationKey = ["valuation"] as const

async function unwrap<T>(
  request: Promise<{ data: ApiSuccess<T> }>
): Promise<T> {
  return (await request).data.data
}

/** Tasación de alquiler: es síncrona y consulta solo la base (201). */
export function useAppraiseProperty(propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AppraisePropertyRequest) =>
      unwrap<ValuationResult>(
        apiClient.post(`/valuation/properties/${propertyId}/appraise`, body)
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [...valuationKey, "history", propertyId],
      }),
  })
}

export function useValuationHistory(propertyId: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: [...valuationKey, "history", propertyId, page, limit],
    queryFn: () =>
      unwrap<Paginated<ValuationResult>>(
        apiClient.get(`/valuation/properties/${propertyId}/history`, {
          params: { page, limit },
        })
      ),
  })
}

/** Comparables vigentes de la zona, para avisar antes de tasar (sección 8). */
export function useMarketCoverage(locationId: string, enabled = true) {
  return useQuery({
    queryKey: [...valuationKey, "coverage", locationId],
    enabled: enabled && locationId !== "",
    queryFn: () =>
      unwrap<MarketCoverageDto>(
        apiClient.get("/valuation/market-coverage", { params: { locationId } })
      ),
  })
}

export function useMarketStatus(enabled = true) {
  return useQuery({
    queryKey: [...valuationKey, "market-status"],
    enabled,
    queryFn: () =>
      unwrap<MarketStatusDto>(apiClient.get("/valuation/market-status")),
  })
}
