"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type {
  ApiSuccess,
  CreatePropertyRequest,
  Paginated,
  PropertyDetail,
  PropertyStatus,
  PropertySummary,
  UpdatePropertyRequest,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"

export interface PropertyFilters {
  status?: PropertyStatus
  propertyTypeId?: string
  search?: string
}

const PAGE_SIZE = 20
const propertiesKey = ["properties"] as const

/**
 * Listado con scroll infinito (spec 5.1: "mobile-first → infinite scroll").
 * Cada página son 20; la siguiente se pide al llegar al final.
 */
export function useInfiniteProperties(filters: PropertyFilters) {
  return useInfiniteQuery({
    queryKey: [...propertiesKey, "list", filters],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<
        ApiSuccess<Paginated<PropertySummary>>
      >("/properties", {
        params: {
          page: pageParam,
          limit: PAGE_SIZE,
          status: filters.status,
          propertyTypeId: filters.propertyTypeId,
          search: filters.search || undefined,
        },
      })
      return data.data
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNextPage ? last.pagination.page + 1 : undefined,
  })
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: [...propertiesKey, "detail", id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccess<PropertyDetail>>(
        `/properties/${id}`
      )
      return data.data
    },
  })
}

/**
 * Toda mutación devuelve la ficha actualizada: se guarda directo en la cache
 * de la ficha (sin otro request) y se invalida el listado.
 */
function usePropertyMutation<TVariables>(
  request: (variables: TVariables) => Promise<PropertyDetail>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: (property) => {
      queryClient.setQueryData(
        [...propertiesKey, "detail", property.id],
        property
      )
      void queryClient.invalidateQueries({
        queryKey: [...propertiesKey, "list"],
      })
    },
  })
}

async function unwrap(
  request: Promise<{ data: ApiSuccess<PropertyDetail> }>
): Promise<PropertyDetail> {
  return (await request).data.data
}

export function useCreateProperty() {
  return usePropertyMutation((body: CreatePropertyRequest) =>
    unwrap(apiClient.post("/properties", body))
  )
}

export function useUpdateProperty() {
  return usePropertyMutation(
    ({ id, ...body }: UpdatePropertyRequest & { id: string }) =>
      unwrap(apiClient.patch(`/properties/${id}`, body))
  )
}

export function useChangePropertyStatus() {
  return usePropertyMutation(
    ({ id, status }: { id: string; status: PropertyStatus }) =>
      unwrap(apiClient.patch(`/properties/${id}/status`, { status }))
  )
}

export function useUploadPropertyPhotos() {
  return usePropertyMutation(({ id, files }: { id: string; files: File[] }) => {
    const form = new FormData()
    for (const file of files) form.append("files", file)
    return unwrap(apiClient.post(`/properties/${id}/photos`, form))
  })
}

export function useDeletePropertyPhoto() {
  return usePropertyMutation(
    ({ id, photoId }: { id: string; photoId: string }) =>
      unwrap(apiClient.delete(`/properties/${id}/photos/${photoId}`))
  )
}

export function useDeleteProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/properties/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: propertiesKey }),
  })
}
