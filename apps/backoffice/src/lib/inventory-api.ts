"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  ApiSuccess,
  ContractInventories,
  CreateInventoryRequest,
  InventoryComparison,
  InventoryDetail,
  UpdateInventoryRequest,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"

export const inventoryKey = ["inventory"] as const

async function unwrap<T>(
  request: Promise<{ data: ApiSuccess<T> }>
): Promise<T> {
  return (await request).data.data
}

export function useContractInventories(contractId: string) {
  return useQuery({
    queryKey: [...inventoryKey, "contract", contractId],
    queryFn: () =>
      unwrap<ContractInventories>(
        apiClient.get(`/contracts/${contractId}/inventories`)
      ),
  })
}

export function useInventory(id: string) {
  return useQuery({
    queryKey: [...inventoryKey, "detail", id],
    queryFn: () => unwrap<InventoryDetail>(apiClient.get(`/inventories/${id}`)),
  })
}

export function useInventoryComparison(contractId: string) {
  return useQuery({
    queryKey: [...inventoryKey, "compare", contractId],
    queryFn: () =>
      unwrap<InventoryComparison>(
        apiClient.get(`/contracts/${contractId}/inventories/compare`)
      ),
  })
}

function useInventoryMutation<V>(
  run: (variables: V) => Promise<InventoryDetail>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSuccess: (detail) => {
      queryClient.setQueryData([...inventoryKey, "detail", detail.id], detail)
      void queryClient.invalidateQueries({
        queryKey: [...inventoryKey, "contract", detail.contractId],
      })
      void queryClient.invalidateQueries({
        queryKey: [...inventoryKey, "compare", detail.contractId],
      })
    },
  })
}

export function useCreateInventory() {
  return useInventoryMutation(
    ({
      contractId,
      ...body
    }: CreateInventoryRequest & { contractId: string }) =>
      unwrap<InventoryDetail>(
        apiClient.post(`/contracts/${contractId}/inventories`, body)
      )
  )
}

export function useUpdateInventory() {
  return useInventoryMutation(
    ({ id, ...body }: UpdateInventoryRequest & { id: string }) =>
      unwrap<InventoryDetail>(apiClient.patch(`/inventories/${id}`, body))
  )
}

export function useUploadItemPhotos() {
  return useInventoryMutation(
    ({
      inventoryId,
      itemId,
      files,
    }: {
      inventoryId: string
      itemId: string
      files: File[]
    }) => {
      const form = new FormData()
      for (const file of files) form.append("files", file)
      return unwrap<InventoryDetail>(
        apiClient.post(
          `/inventories/${inventoryId}/items/${itemId}/photos`,
          form
        )
      )
    }
  )
}

export function useDeleteInventoryPhoto() {
  return useInventoryMutation(
    ({ inventoryId, photoId }: { inventoryId: string; photoId: string }) =>
      unwrap<InventoryDetail>(
        apiClient.delete(`/inventories/${inventoryId}/photos/${photoId}`)
      )
  )
}

export function useConfirmInventory() {
  return useInventoryMutation((id: string) =>
    unwrap<InventoryDetail>(apiClient.post(`/inventories/${id}/confirm`))
  )
}

export function useCorrectInventory() {
  return useInventoryMutation(
    ({ id, reason }: { id: string; reason: string }) =>
      unwrap<InventoryDetail>(
        apiClient.post(`/inventories/${id}/correct`, { reason })
      )
  )
}
