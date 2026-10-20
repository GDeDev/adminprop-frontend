"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type {
  ApiSuccess,
  CreateGuarantorRequest,
  CreateRenterRequest,
  GuarantorDataCheck,
  GuarantorDetail,
  GuarantorSummary,
  Paginated,
  PortalCredentials,
  RenterDataCheck,
  RenterDetail,
  RenterSummary,
  UpdateGuarantorRequest,
  UpdateRenterRequest,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"

const PAGE_SIZE = 20
const rentersKey = ["renters"] as const
const guarantorsKey = ["guarantors"] as const

export interface RenterFilters {
  search?: string
}

export interface GuarantorFilters {
  search?: string
}

async function unwrap<T>(
  request: Promise<{ data: ApiSuccess<T> }>
): Promise<T> {
  return (await request).data.data
}

// ---------------------------------------------------------------------------
// Inquilinos
// ---------------------------------------------------------------------------

/** Listado con scroll infinito, como propietarios. */
export function useInfiniteRenters(filters: RenterFilters) {
  return useInfiniteQuery({
    queryKey: [...rentersKey, "list", filters],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<
        ApiSuccess<Paginated<RenterSummary>>
      >("/renters", {
        params: {
          page: pageParam,
          limit: PAGE_SIZE,
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

export function useRenter(id: string) {
  return useQuery({
    queryKey: [...rentersKey, "detail", id],
    queryFn: () => unwrap<RenterDetail>(apiClient.get(`/renters/${id}`)),
  })
}

/** Chequeo en vivo del DNI (spec 5.3), con el valor ya "debounced". */
export function useRenterDataCheck(params: {
  nationalId?: string
  excludeId?: string
}) {
  return useQuery({
    queryKey: [...rentersKey, "check", params],
    queryFn: () =>
      unwrap<RenterDataCheck>(apiClient.get("/renters/check", { params })),
    enabled: Boolean(params.nationalId),
    staleTime: 10_000,
  })
}

function useRenterMutation<TVariables>(
  request: (variables: TVariables) => Promise<RenterDetail>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: (renter) => {
      queryClient.setQueryData([...rentersKey, "detail", renter.id], renter)
      void queryClient.invalidateQueries({ queryKey: [...rentersKey, "list"] })
      // La ficha del garante lista a sus inquilinos.
      void queryClient.invalidateQueries({ queryKey: guarantorsKey })
    },
  })
}

export function useCreateRenter() {
  return useRenterMutation((body: CreateRenterRequest) =>
    unwrap(apiClient.post("/renters", body))
  )
}

export function useUpdateRenter() {
  return useRenterMutation(
    ({ id, ...body }: UpdateRenterRequest & { id: string }) =>
      unwrap(apiClient.patch(`/renters/${id}`, body))
  )
}

/** Devuelve la contraseña una sola vez; la ficha pasa a `hasPortalAccess`. */
export function useIssueRenterPortalCredentials() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      unwrap<PortalCredentials>(
        apiClient.post(`/renters/${id}/portal-credentials`)
      ),
    onSuccess: (_credentials, id) => {
      void queryClient.invalidateQueries({
        queryKey: [...rentersKey, "detail", id],
      })
      void queryClient.invalidateQueries({ queryKey: [...rentersKey, "list"] })
    },
  })
}

export function useDeleteRenter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/renters/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rentersKey })
      void queryClient.invalidateQueries({ queryKey: guarantorsKey })
    },
  })
}

// ---------------------------------------------------------------------------
// Garantes
// ---------------------------------------------------------------------------

export function useInfiniteGuarantors(filters: GuarantorFilters) {
  return useInfiniteQuery({
    queryKey: [...guarantorsKey, "list", filters],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<
        ApiSuccess<Paginated<GuarantorSummary>>
      >("/guarantors", {
        params: {
          page: pageParam,
          limit: PAGE_SIZE,
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

export function useGuarantor(id: string) {
  return useQuery({
    queryKey: [...guarantorsKey, "detail", id],
    queryFn: () => unwrap<GuarantorDetail>(apiClient.get(`/guarantors/${id}`)),
  })
}

export function useGuarantorDataCheck(params: {
  nationalId?: string
  excludeId?: string
}) {
  return useQuery({
    queryKey: [...guarantorsKey, "check", params],
    queryFn: () =>
      unwrap<GuarantorDataCheck>(
        apiClient.get("/guarantors/check", { params })
      ),
    enabled: Boolean(params.nationalId),
    staleTime: 10_000,
  })
}

function useGuarantorMutation<TVariables>(
  request: (variables: TVariables) => Promise<GuarantorDetail>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: (guarantor) => {
      queryClient.setQueryData(
        [...guarantorsKey, "detail", guarantor.id],
        guarantor
      )
      void queryClient.invalidateQueries({
        queryKey: [...guarantorsKey, "list"],
      })
      // Los inquilinos muestran el nombre de su garante.
      void queryClient.invalidateQueries({ queryKey: rentersKey })
    },
  })
}

export function useCreateGuarantor() {
  return useGuarantorMutation((body: CreateGuarantorRequest) =>
    unwrap(apiClient.post("/guarantors", body))
  )
}

export function useUpdateGuarantor() {
  return useGuarantorMutation(
    ({ id, ...body }: UpdateGuarantorRequest & { id: string }) =>
      unwrap(apiClient.patch(`/guarantors/${id}`, body))
  )
}

export function useDeleteGuarantor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/guarantors/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: guarantorsKey }),
  })
}
