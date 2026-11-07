"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  ApiSuccess,
  ConnectChannelResult,
  ListingChannel,
  ListingChannelDto,
  PropertyListingDto,
  StartListingResult,
} from "@adminprop/shared-types"

import { apiClient } from "./api-client"
import type { ListingAction } from "./listings"

export const listingsKey = ["listings"] as const

async function unwrap<T>(
  request: Promise<{ data: ApiSuccess<T> }>
): Promise<T> {
  return (await request).data.data
}

export function useChannels() {
  return useQuery({
    queryKey: [...listingsKey, "channels"],
    queryFn: () => unwrap<ListingChannelDto[]>(apiClient.get("/crm/channels")),
  })
}

/** Devuelve la URL del portal a la que hay que mandar al administrador. */
export function useConnectMercadoLibre() {
  return useMutation({
    mutationFn: () =>
      unwrap<ConnectChannelResult>(
        apiClient.post("/crm/channels/mercadolibre/connect")
      ),
  })
}

export function useDisconnectChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (channel: ListingChannel) =>
      unwrap<unknown>(apiClient.delete(`/crm/channels/${channel}`)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingsKey }),
  })
}

export function usePropertyListings(propertyId: string) {
  return useQuery({
    queryKey: [...listingsKey, "property", propertyId],
    queryFn: () =>
      unwrap<PropertyListingDto[]>(
        apiClient.get(`/crm/properties/${propertyId}/listings`)
      ),
  })
}

/**
 * Publicar, actualizar y reintentar encolan un trabajo (202 `{ jobId }`);
 * pausar, reanudar y cerrar devuelven la publicación ya cambiada.
 * «Actualizar» usa el endpoint de publicar (DT-100).
 */
export function useListingAction(propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      channel,
      action,
    }: {
      channel: ListingChannel
      action: ListingAction
    }): Promise<StartListingResult | PropertyListingDto> => {
      const path = action === "update" ? "publish" : action
      return unwrap(
        apiClient.post(
          `/crm/properties/${propertyId}/listings/${channel}/${path}`
        )
      )
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingsKey }),
  })
}

export function startsJob(
  result: StartListingResult | PropertyListingDto
): result is StartListingResult {
  return "jobId" in result
}

export function refreshListings(
  queryClient: ReturnType<typeof useQueryClient>
) {
  return queryClient.invalidateQueries({ queryKey: listingsKey })
}
