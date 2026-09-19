"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  ApiSuccess,
  CatalogItem,
  CatalogKey,
  Location,
  LocationLevel,
  LocationNode,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"

/**
 * Maestros (Fase 5). Son listas cortas que cambian poco: se cachean 5 minutos
 * y cualquier cambio invalida todo lo de maestros, así los selectores de
 * otras pantallas se enteran.
 */
const MASTER_DATA_STALE_MS = 5 * 60 * 1000
const masterDataKey = ["master-data"] as const

/** `true` (por defecto en la API): sólo activos. `all`: todos. */
export type ActiveParam = "true" | "false" | "all"

export function useCatalog(
  catalog: CatalogKey,
  isActive: ActiveParam = "true",
  enabled = true
) {
  return useQuery({
    queryKey: [...masterDataKey, catalog, isActive],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccess<CatalogItem[]>>(
        `/${catalog}`,
        { params: { isActive } }
      )
      return data.data
    },
    staleTime: MASTER_DATA_STALE_MS,
    enabled,
  })
}

export interface LocationFilter {
  level?: LocationLevel
  parentId?: string
  isActive?: ActiveParam
}

export function useLocations(filter: LocationFilter, enabled = true) {
  return useQuery({
    queryKey: [...masterDataKey, "locations", filter],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccess<Location[]>>(
        "/locations",
        { params: filter }
      )
      return data.data
    },
    staleTime: MASTER_DATA_STALE_MS,
    enabled,
  })
}

export function useLocationTree(isActive: ActiveParam = "all") {
  return useQuery({
    queryKey: [...masterDataKey, "locations-tree", isActive],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccess<LocationNode[]>>(
        "/locations/tree",
        { params: { isActive } }
      )
      return data.data
    },
    staleTime: MASTER_DATA_STALE_MS,
  })
}

function useMasterDataMutation<TVariables>(
  request: (variables: TVariables) => Promise<unknown>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: masterDataKey }),
  })
}

export function useSaveCatalogItem(catalog: CatalogKey) {
  return useMasterDataMutation(
    ({ id, ...body }: { id?: string; name: string; icon?: string | null }) =>
      id
        ? apiClient.patch(`/${catalog}/${id}`, body)
        : apiClient.post(`/${catalog}`, body)
  )
}

export function useSetCatalogItemActive(catalog: CatalogKey) {
  return useMasterDataMutation(
    ({ id, active }: { id: string; active: boolean }) =>
      apiClient.patch(`/${catalog}/${id}/${active ? "activate" : "deactivate"}`)
  )
}

export function useCreateLocation() {
  return useMasterDataMutation(
    (body: { level: LocationLevel; name: string; parentId: string | null }) =>
      apiClient.post("/locations", body)
  )
}

export function useRenameLocation() {
  return useMasterDataMutation(({ id, name }: { id: string; name: string }) =>
    apiClient.patch(`/locations/${id}`, { name })
  )
}

export function useSetLocationActive() {
  return useMasterDataMutation(
    ({ id, active }: { id: string; active: boolean }) =>
      apiClient.patch(`/locations/${id}/${active ? "activate" : "deactivate"}`)
  )
}
