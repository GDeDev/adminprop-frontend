"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type {
  ApiSuccess,
  BankAccountRequest,
  CreateOwnerRequest,
  OwnerDataCheck,
  OwnerDetail,
  OwnerSummary,
  Paginated,
  PortalCredentials,
  UpdateOwnerRequest,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"

export interface OwnerFilters {
  search?: string
}

const PAGE_SIZE = 20
const ownersKey = ["owners"] as const

/** Listado con scroll infinito, como el de propiedades (DT-34). */
export function useInfiniteOwners(filters: OwnerFilters) {
  return useInfiniteQuery({
    queryKey: [...ownersKey, "list", filters],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<ApiSuccess<Paginated<OwnerSummary>>>(
        "/owners",
        {
          params: {
            page: pageParam,
            limit: PAGE_SIZE,
            search: filters.search || undefined,
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

export function useOwner(id: string) {
  return useQuery({
    queryKey: [...ownersKey, "detail", id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccess<OwnerDetail>>(
        `/owners/${id}`
      )
      return data.data
    },
  })
}

/**
 * Chequeo en vivo del formulario (spec 5.3): quién tiene ese DNI y quién
 * comparte ese CBU. Se consulta con el valor ya "debounced".
 */
export function useOwnerDataCheck(params: {
  nationalId?: string
  cbu?: string
  excludeId?: string
}) {
  const enabled = Boolean(params.nationalId || params.cbu)
  return useQuery({
    queryKey: [...ownersKey, "check", params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccess<OwnerDataCheck>>(
        "/owners/check",
        { params }
      )
      return data.data
    },
    enabled,
    staleTime: 10_000,
  })
}

/**
 * Las mutaciones que devuelven la ficha la guardan directo en la cache e
 * invalidan el listado, igual que en propiedades.
 */
function useOwnerMutation<TVariables>(
  request: (variables: TVariables) => Promise<OwnerDetail>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: (owner) => {
      queryClient.setQueryData([...ownersKey, "detail", owner.id], owner)
      void queryClient.invalidateQueries({ queryKey: [...ownersKey, "list"] })
      // Las propiedades muestran el nombre del propietario.
      void queryClient.invalidateQueries({ queryKey: ["properties"] })
    },
  })
}

async function unwrap(
  request: Promise<{ data: ApiSuccess<OwnerDetail> }>
): Promise<OwnerDetail> {
  return (await request).data.data
}

export function useCreateOwner() {
  return useOwnerMutation((body: CreateOwnerRequest) =>
    unwrap(apiClient.post("/owners", body))
  )
}

export function useUpdateOwner() {
  return useOwnerMutation(
    ({ id, ...body }: UpdateOwnerRequest & { id: string }) =>
      unwrap(apiClient.patch(`/owners/${id}`, body))
  )
}

export function useUpdateOwnerBankAccount() {
  return useOwnerMutation(
    ({ id, ...body }: BankAccountRequest & { id: string }) =>
      unwrap(apiClient.patch(`/owners/${id}/bank-account`, body))
  )
}

/** Devuelve la contraseña una sola vez; la ficha pasa a `hasPortalAccess`. */
export function useIssueOwnerPortalCredentials() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post<ApiSuccess<PortalCredentials>>(
        `/owners/${id}/portal-credentials`
      )
      return data.data
    },
    onSuccess: (_credentials, id) => {
      void queryClient.invalidateQueries({
        queryKey: [...ownersKey, "detail", id],
      })
      void queryClient.invalidateQueries({ queryKey: [...ownersKey, "list"] })
    },
  })
}

export function useDeleteOwner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/owners/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ownersKey }),
  })
}
