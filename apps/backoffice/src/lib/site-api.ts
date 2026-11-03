"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  ApiSuccess,
  ResetSiteTemplateRequest,
  SiteAsset,
  SiteDomain,
  SitePreviewToken,
  SiteSettings,
  SiteTemplateInfo,
  SubdomainAvailability,
  UpdateSiteSettingsRequest,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"
import { previewRefreshDelay } from "./site"

const settingsKey = ["site", "settings"] as const
const domainKey = ["site", "domain"] as const

async function unwrap<T>(
  request: Promise<{ data: ApiSuccess<T> }>
): Promise<T> {
  return (await request).data.data
}

/** Los dos templates (nombre, descripción, tema por defecto, tipografías). */
export function useSiteTemplates() {
  return useQuery({
    queryKey: ["site", "templates"],
    queryFn: () => unwrap<SiteTemplateInfo[]>(apiClient.get("/site/templates")),
    staleTime: 5 * 60_000,
  })
}

/**
 * Configuración del sitio. No se refresca al volver a la pestaña: el
 * editor tiene su propia copia del borrador y no debe pisarse sola.
 */
export function useSiteSettings() {
  return useQuery({
    queryKey: settingsKey,
    queryFn: () => unwrap<SiteSettings>(apiClient.get("/site/settings")),
    refetchOnWindowFocus: false,
  })
}

function useSettingsMutation<V>(run: (variables: V) => Promise<SiteSettings>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKey, data)
      // Cambiar o quitar el dominio cambia su verificación y el registro DNS.
      void queryClient.invalidateQueries({ queryKey: domainKey })
    },
  })
}

/** `PUT /site/settings`: parcial (ver `buildDraftPatch`). */
export function useUpdateSiteSettings() {
  return useSettingsMutation((body: UpdateSiteSettingsRequest) =>
    unwrap<SiteSettings>(apiClient.put("/site/settings", body))
  )
}

export function useResetSiteTemplate() {
  return useSettingsMutation((body: ResetSiteTemplateRequest) =>
    unwrap<SiteSettings>(apiClient.post("/site/settings/reset-template", body))
  )
}

export function usePublishSite() {
  return useSettingsMutation(() =>
    unwrap<SiteSettings>(apiClient.post("/site/publish"))
  )
}

export function useUnpublishSite() {
  return useSettingsMutation(() =>
    unwrap<SiteSettings>(apiClient.post("/site/unpublish"))
  )
}

/** `POST /site/assets` (multipart `file`, hasta 5 MB). */
export function useUploadSiteAsset() {
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append("file", file)
      return unwrap<SiteAsset>(apiClient.post("/site/assets", form))
    },
  })
}

/**
 * Token de la vista previa (15 min). Se vuelve a pedir un minuto antes de que
 * venza para que el iframe nunca quede con un token caducado.
 */
export function useSitePreviewToken(enabled = true) {
  return useQuery({
    queryKey: ["site", "preview-token"],
    enabled,
    queryFn: () =>
      unwrap<SitePreviewToken>(apiClient.get("/site/preview-token")),
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchInterval: (query) =>
      query.state.data
        ? previewRefreshDelay(query.state.data.expiresAt)
        : false,
  })
}

/** Disponibilidad de un subdominio (la pantalla lo llama con debounce). */
export function useSubdomainAvailability(value: string, enabled: boolean) {
  return useQuery({
    queryKey: ["site", "subdomain-availability", value],
    enabled: enabled && value !== "",
    queryFn: () =>
      unwrap<SubdomainAvailability>(
        apiClient.get("/site/subdomain-availability", { params: { value } })
      ),
    staleTime: 10_000,
    retry: false,
  })
}

/** Estado del dominio propio y el registro TXT que hay que cargar en el DNS. */
export function useSiteDomain() {
  return useQuery({
    queryKey: domainKey,
    queryFn: () => unwrap<SiteDomain>(apiClient.get("/site/domain")),
    refetchOnWindowFocus: false,
  })
}

/** `POST /site/domain/verify`: busca el TXT; 422 `DOMAIN_NOT_VERIFIED` si todavía no está. */
export function useVerifySiteDomain() {
  return useSettingsMutation(() =>
    unwrap<SiteSettings>(apiClient.post("/site/domain/verify"))
  )
}
