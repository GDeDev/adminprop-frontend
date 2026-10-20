"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type {
  AdvanceExpense,
  AdvanceExpenseList,
  ApiSuccess,
  ContractService,
  CreateServiceRequest,
  Currency,
  OverdueService,
  Paginated,
  PropertyService,
  UpdateAdvanceExpenseRequest,
  UpdateServiceRequest,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"

const PAGE_SIZE = 20
const servicesKey = ["services"] as const
const expensesKey = ["advance-expenses"] as const

async function unwrap<T>(
  request: Promise<{ data: ApiSuccess<T> }>
): Promise<T> {
  return (await request).data.data
}

// ---------------------------------------------------------------------------
// Servicios
// ---------------------------------------------------------------------------

/** Los de la propiedad y los de sus contratos, con el estado calculado. */
export function usePropertyServices(propertyId: string) {
  return useQuery({
    queryKey: [...servicesKey, "property", propertyId],
    queryFn: () =>
      unwrap<PropertyService[]>(
        apiClient.get(`/properties/${propertyId}/services`)
      ),
  })
}

/** Los del contrato más los heredados de la propiedad, cada uno con `scope`. */
export function useContractServices(contractId: string) {
  return useQuery({
    queryKey: [...servicesKey, "contract", contractId],
    queryFn: () =>
      unwrap<ContractService[]>(
        apiClient.get(`/contracts/${contractId}/services`)
      ),
  })
}

/** Vencidos de toda la inmobiliaria, los más atrasados primero (dashboard). */
export function useInfiniteOverdueServices(
  filters: { propertyId?: string } = {}
) {
  return useInfiniteQuery({
    queryKey: [...servicesKey, "overdue", filters],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<
        ApiSuccess<Paginated<OverdueService>>
      >("/services/overdue", {
        params: {
          page: pageParam,
          limit: PAGE_SIZE,
          propertyId: filters.propertyId,
        },
      })
      return data.data
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNextPage ? last.pagination.page + 1 : undefined,
  })
}

/**
 * Un servicio cambia lo que ven la propiedad, sus contratos y el dashboard:
 * se invalida todo `services` y listo. Las fichas de propiedad y contrato
 * no lo incluyen, así que no hace falta tocarlas.
 */
function useServiceMutation<TVariables, TResult>(
  request: (variables: TVariables) => Promise<TResult>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: servicesKey }),
  })
}

/** Alta; con `contractId` es del contrato, sin él es de la propiedad. */
export function useCreateService() {
  return useServiceMutation(
    ({ propertyId, ...body }: CreateServiceRequest & { propertyId: string }) =>
      unwrap<PropertyService>(
        apiClient.post(`/properties/${propertyId}/services`, body)
      )
  )
}

export function useUpdateService() {
  return useServiceMutation(
    ({ id, ...body }: UpdateServiceRequest & { id: string }) =>
      unwrap<PropertyService>(apiClient.patch(`/services/${id}`, body))
  )
}

export function useDeleteService() {
  return useServiceMutation(async (id: string) => {
    await apiClient.delete(`/services/${id}`)
  })
}

// ---------------------------------------------------------------------------
// Gastos adelantados
// ---------------------------------------------------------------------------

/** Los del contrato con sus totales; `settled` filtra pendientes o descontados. */
export function useAdvanceExpenses(contractId: string, settled?: boolean) {
  return useQuery({
    queryKey: [...expensesKey, contractId, settled ?? "all"],
    queryFn: () =>
      unwrap<AdvanceExpenseList>(
        apiClient.get(`/contracts/${contractId}/advance-expenses`, {
          params: { settled },
        })
      ),
  })
}

function useExpenseMutation<TVariables extends { contractId: string }, TResult>(
  request: (variables: TVariables) => Promise<TResult>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: (_result, variables) =>
      queryClient.invalidateQueries({
        queryKey: [...expensesKey, variables.contractId],
      }),
  })
}

export interface CreateAdvanceExpenseVariables {
  contractId: string
  amount: string
  description: string
  expenseDate: string
  currency?: Currency
  /** Comprobante obligatorio: JPG, PNG, WebP o PDF. */
  file: File
}

/** Multipart con el comprobante (spec 3.2). */
export function useCreateAdvanceExpense() {
  return useExpenseMutation(
    ({
      contractId,
      file,
      currency,
      ...fields
    }: CreateAdvanceExpenseVariables) => {
      const form = new FormData()
      form.append("amount", fields.amount)
      form.append("description", fields.description)
      form.append("expenseDate", fields.expenseDate)
      if (currency) form.append("currency", currency)
      form.append("file", file)
      return unwrap<AdvanceExpense>(
        apiClient.post(`/contracts/${contractId}/advance-expenses`, form)
      )
    }
  )
}

/** Sólo mientras está pendiente (409 si ya se descontó). */
export function useUpdateAdvanceExpense() {
  return useExpenseMutation(
    ({
      id,
      amount,
      description,
      expenseDate,
    }: UpdateAdvanceExpenseRequest & { id: string; contractId: string }) =>
      unwrap<AdvanceExpense>(
        apiClient.patch(`/advance-expenses/${id}`, {
          amount,
          description,
          expenseDate,
        })
      )
  )
}

/** Sólo admin y sólo pendiente (409 si ya se descontó). */
export function useDeleteAdvanceExpense() {
  return useExpenseMutation(
    async ({ id }: { id: string; contractId: string }) => {
      await apiClient.delete(`/advance-expenses/${id}`)
    }
  )
}
