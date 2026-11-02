"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  ApiSuccess,
  TenantSettings,
  UpdateTenantSettingsRequest,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"

const settingsKey = ["tenant-settings"] as const

async function unwrap<T>(
  request: Promise<{ data: ApiSuccess<T> }>
): Promise<T> {
  return (await request).data.data
}

/** Datos de la inmobiliaria para los PDF y la marca (`GET /tenants/current/settings`, admin). */
export function useTenantSettings() {
  return useQuery({
    queryKey: settingsKey,
    queryFn: () =>
      unwrap<TenantSettings>(apiClient.get("/tenants/current/settings")),
  })
}

function useSettingsMutation<V>(
  run: (variables: V) => Promise<TenantSettings>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSuccess: (data) => queryClient.setQueryData(settingsKey, data),
  })
}

export function useUpdateTenantSettings() {
  return useSettingsMutation((body: UpdateTenantSettingsRequest) =>
    unwrap<TenantSettings>(apiClient.patch("/tenants/current/settings", body))
  )
}

export function useUploadTenantLogo() {
  return useSettingsMutation((file: File) => {
    const form = new FormData()
    form.append("file", file)
    return unwrap<TenantSettings>(apiClient.post("/tenants/current/logo", form))
  })
}

export function useRemoveTenantLogo() {
  return useSettingsMutation(() =>
    unwrap<TenantSettings>(apiClient.delete("/tenants/current/logo"))
  )
}
