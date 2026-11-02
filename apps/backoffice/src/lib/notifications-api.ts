"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type {
  ApiSuccess,
  MyNotificationPreferences,
  NotificationChannel,
  NotificationDetail,
  NotificationLogItem,
  NotificationRecipientKind,
  NotificationStatus,
  NotificationTemplateDto,
  NotificationType,
  NotificationTypeSetting,
  Paginated,
  PreviewTemplateRequest,
  ResendFailedRequest,
  ResendFailedResult,
  TemplatePreviewDto,
  TestTemplateResult,
  UpdateMyNotificationPreferencesRequest,
  UpdateNotificationSettingsRequest,
  UpdateNotificationTemplateRequest,
  UpdateWhatsAppTemplateRequest,
  WhatsAppTemplateDto,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"

const PAGE_SIZE = 20
export const notificationsKey = ["notifications"] as const

async function unwrap<T>(
  request: Promise<{ data: ApiSuccess<T> }>
): Promise<T> {
  return (await request).data.data
}

/** Invalida un tramo (o todo) lo de notificaciones tras un cambio. */
function useInvalidate(scope?: string) {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({
      queryKey: scope ? [...notificationsKey, scope] : notificationsKey,
    })
}

// --- Eventos y canales -------------------------------------------------------

export function useNotificationSettings() {
  return useQuery({
    queryKey: [...notificationsKey, "settings"],
    queryFn: () =>
      unwrap<NotificationTypeSetting[]>(
        apiClient.get("/notifications/settings")
      ),
  })
}

export function useUpdateNotificationSettings() {
  const invalidate = useInvalidate("settings")
  return useMutation({
    mutationFn: (body: UpdateNotificationSettingsRequest) =>
      unwrap<NotificationTypeSetting[]>(
        apiClient.put("/notifications/settings", body)
      ),
    onSuccess: invalidate,
  })
}

// --- Plantillas de email -----------------------------------------------------

export function useNotificationTemplates() {
  return useQuery({
    queryKey: [...notificationsKey, "templates"],
    queryFn: () =>
      unwrap<NotificationTemplateDto[]>(
        apiClient.get("/notifications/templates")
      ),
  })
}

export function useUpdateNotificationTemplate() {
  const invalidate = useInvalidate("templates")
  return useMutation({
    mutationFn: ({
      key,
      ...body
    }: UpdateNotificationTemplateRequest & { key: string }) =>
      unwrap<NotificationTemplateDto>(
        apiClient.put(`/notifications/templates/${key}`, body)
      ),
    onSuccess: invalidate,
  })
}

export function useRestoreNotificationTemplate() {
  const invalidate = useInvalidate("templates")
  return useMutation({
    mutationFn: (key: string) =>
      unwrap<NotificationTemplateDto>(
        apiClient.delete(`/notifications/templates/${key}`)
      ),
    onSuccess: invalidate,
  })
}

/** Vista previa con datos de ejemplo; no envía nada. */
export function usePreviewTemplate() {
  return useMutation({
    mutationFn: ({ key, ...body }: PreviewTemplateRequest & { key: string }) =>
      unwrap<TemplatePreviewDto>(
        apiClient.post(`/notifications/templates/${key}/preview`, body)
      ),
  })
}

export function useSendTemplateTest() {
  return useMutation({
    mutationFn: (key: string) =>
      unwrap<TestTemplateResult>(
        apiClient.post(`/notifications/templates/${key}/test`)
      ),
  })
}

// --- Historial ---------------------------------------------------------------

export interface NotificationFilters {
  type?: NotificationType
  status?: NotificationStatus
  channel?: NotificationChannel
  recipientKind?: NotificationRecipientKind
  entityId?: string
  from?: string
  to?: string
}

/** Quita los filtros vacíos antes de armar la query. */
export function notificationParams(filters: NotificationFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== ""
    )
  )
}

export function useInfiniteNotifications(filters: NotificationFilters) {
  return useInfiniteQuery({
    queryKey: [...notificationsKey, "list", filters],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<
        ApiSuccess<Paginated<NotificationLogItem>>
      >("/notifications", {
        params: {
          ...notificationParams(filters),
          page: pageParam,
          limit: PAGE_SIZE,
        },
      })
      return data.data
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNextPage ? last.pagination.page + 1 : undefined,
  })
}

export function useNotification(id: string | null) {
  return useQuery({
    queryKey: [...notificationsKey, "detail", id],
    enabled: id !== null,
    queryFn: () =>
      unwrap<NotificationDetail>(apiClient.get(`/notifications/${id}`)),
  })
}

export function useResendNotification() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) =>
      unwrap<NotificationLogItem>(
        apiClient.post(`/notifications/${id}/resend`)
      ),
    onSuccess: invalidate,
  })
}

/** Encola el reintento masivo; la API responde 202 con el id del trabajo. */
export function useResendFailed() {
  return useMutation({
    mutationFn: (body: ResendFailedRequest) =>
      unwrap<ResendFailedResult>(
        apiClient.post("/notifications/resend-failed", body)
      ),
  })
}

/** Refresca el historial (por ejemplo cuando termina el reintento masivo). */
export function useRefreshNotifications() {
  return useInvalidate()
}

// --- Mis notificaciones (perfil) ---------------------------------------------

export function useMyNotificationPreferences() {
  return useQuery({
    queryKey: [...notificationsKey, "me"],
    queryFn: () =>
      unwrap<MyNotificationPreferences>(
        apiClient.get("/notifications/me/preferences")
      ),
  })
}

export function useUpdateMyNotificationPreferences() {
  const invalidate = useInvalidate("me")
  return useMutation({
    mutationFn: (body: UpdateMyNotificationPreferencesRequest) =>
      unwrap<MyNotificationPreferences>(
        apiClient.put("/notifications/me/preferences", body)
      ),
    onSuccess: invalidate,
  })
}

// --- WhatsApp ----------------------------------------------------------------

export function useWhatsAppTemplates() {
  return useQuery({
    queryKey: [...notificationsKey, "whatsapp"],
    staleTime: 5 * 60_000,
    queryFn: () =>
      unwrap<WhatsAppTemplateDto[]>(
        apiClient.get("/notifications/whatsapp-templates")
      ),
  })
}

export function useUpdateWhatsAppTemplate() {
  const invalidate = useInvalidate("whatsapp")
  return useMutation({
    mutationFn: ({
      key,
      ...body
    }: UpdateWhatsAppTemplateRequest & { key: string }) =>
      unwrap<WhatsAppTemplateDto>(
        apiClient.put(`/notifications/whatsapp-templates/${key}`, body)
      ),
    onSuccess: invalidate,
  })
}
