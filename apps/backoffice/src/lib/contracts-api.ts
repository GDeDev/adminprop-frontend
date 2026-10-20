"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type {
  ApiSuccess,
  ApplyRentUpdateRequest,
  ContractDetail,
  ContractStatus,
  ContractSummary,
  CreateContractRequest,
  IndexType,
  IndexValue,
  Paginated,
  RegisterIndexValueRequest,
  RenewContractRequest,
  TerminationPreview,
  TerminationResult,
  UpdateContractRequest,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"
import { isIsoDate } from "./dates"

const PAGE_SIZE = 20
const contractsKey = ["contracts"] as const
const indicesKey = ["indices"] as const

export interface ContractFilters {
  status?: ContractStatus
  propertyId?: string
  renterId?: string
  ownerId?: string
  /** Sólo los activos que vencen dentro de los días de aviso de la inmobiliaria. */
  expiringSoon?: boolean
}

async function unwrap<T>(
  request: Promise<{ data: ApiSuccess<T> }>
): Promise<T> {
  return (await request).data.data
}

// ---------------------------------------------------------------------------
// Contratos
// ---------------------------------------------------------------------------

/** Listado con scroll infinito, como propiedades e inquilinos. */
export function useInfiniteContracts(filters: ContractFilters) {
  return useInfiniteQuery({
    queryKey: [...contractsKey, "list", filters],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<
        ApiSuccess<Paginated<ContractSummary>>
      >("/contracts", {
        params: {
          page: pageParam,
          limit: PAGE_SIZE,
          status: filters.status,
          propertyId: filters.propertyId,
          renterId: filters.renterId,
          ownerId: filters.ownerId,
          expiringSoon: filters.expiringSoon ? true : undefined,
        },
      })
      return data.data
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNextPage ? last.pagination.page + 1 : undefined,
  })
}

export function useContract(id: string) {
  return useQuery({
    queryKey: [...contractsKey, "detail", id],
    queryFn: () => unwrap<ContractDetail>(apiClient.get(`/contracts/${id}`)),
  })
}

/**
 * Desglose de la multa (spec 5.4) antes de rescindir. Sólo consulta con una
 * fecha completa; mientras el usuario la escribe, no pide nada.
 */
export function useTerminationPreview(id: string, notifiedAt: string) {
  return useQuery({
    queryKey: [...contractsKey, "termination-preview", id, notifiedAt],
    queryFn: () =>
      unwrap<TerminationPreview>(
        apiClient.get(`/contracts/${id}/termination-preview`, {
          params: { notifiedAt },
        })
      ),
    enabled: isIsoDate(notifiedAt),
    retry: false,
  })
}

/**
 * Toda mutación devuelve la ficha: se guarda en la cache y se invalida el
 * listado. También propiedades e inquilinos: un contrato les cambia el
 * estado y el "contrato activo".
 */
function useContractMutation<TVariables>(
  request: (variables: TVariables) => Promise<ContractDetail>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: (contract) => {
      queryClient.setQueryData(
        [...contractsKey, "detail", contract.id],
        contract
      )
      void queryClient.invalidateQueries({
        queryKey: [...contractsKey, "list"],
      })
      void queryClient.invalidateQueries({ queryKey: ["properties"] })
      void queryClient.invalidateQueries({ queryKey: ["renters"] })
    },
  })
}

export function useCreateContract() {
  return useContractMutation((body: CreateContractRequest) =>
    unwrap(apiClient.post("/contracts", body))
  )
}

/** Sólo notas, garante y caución (D-55). */
export function useUpdateContract() {
  return useContractMutation(
    ({ id, ...body }: UpdateContractRequest & { id: string }) =>
      unwrap(apiClient.patch(`/contracts/${id}`, body))
  )
}

/** Devuelve el contrato nuevo; el original queda finalizado (D-61). */
export function useRenewContract() {
  const queryClient = useQueryClient()
  return useContractMutation(
    async ({ id, ...body }: RenewContractRequest & { id: string }) => {
      const renewed = await unwrap<ContractDetail>(
        apiClient.post(`/contracts/${id}/renew`, body)
      )
      void queryClient.invalidateQueries({
        queryKey: [...contractsKey, "detail", id],
      })
      return renewed
    }
  )
}

/** Aplica el próximo aumento programado; `newRent` sólo con FIXED/OTHER (D-60). */
export function useApplyRentUpdate() {
  return useContractMutation(
    ({ id, ...body }: ApplyRentUpdateRequest & { id: string }) =>
      unwrap(apiClient.post(`/contracts/${id}/rent-updates`, body))
  )
}

export type ContractDocumentKind = "contract" | "policy"

/** PDF del contrato o de la póliza; reemplaza al anterior (D-62). */
export function useUploadContractDocument() {
  return useContractMutation(
    ({
      id,
      kind,
      file,
    }: {
      id: string
      kind: ContractDocumentKind
      file: File
    }) => {
      const form = new FormData()
      form.append("file", file)
      return unwrap(apiClient.post(`/contracts/${id}/documents/${kind}`, form))
    }
  )
}

/** Rescinde y devuelve el desglose de la multa más la ficha rescindida. */
export function useTerminateContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notifiedAt }: { id: string; notifiedAt: string }) =>
      unwrap<TerminationResult>(
        apiClient.post(`/contracts/${id}/terminate`, { notifiedAt })
      ),
    onSuccess: (result) => {
      queryClient.setQueryData(
        [...contractsKey, "detail", result.contract.id],
        result.contract
      )
      void queryClient.invalidateQueries({
        queryKey: [...contractsKey, "list"],
      })
      void queryClient.invalidateQueries({ queryKey: ["properties"] })
      void queryClient.invalidateQueries({ queryKey: ["renters"] })
    },
  })
}

// ---------------------------------------------------------------------------
// Índices ICL / IPC
// ---------------------------------------------------------------------------

/** Valores cargados de un índice, del más reciente al más viejo. */
export function useIndexValues(type: IndexType) {
  return useQuery({
    queryKey: [...indicesKey, type],
    queryFn: () =>
      unwrap<IndexValue[]>(apiClient.get("/indices", { params: { type } })),
  })
}

/** Carga a mano el valor de un mes (sólo admin). */
export function useRegisterIndexValue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: RegisterIndexValueRequest) =>
      unwrap<IndexValue>(apiClient.post("/indices", body)),
    onSuccess: (value) =>
      queryClient.invalidateQueries({
        queryKey: [...indicesKey, value.indexType],
      }),
  })
}
