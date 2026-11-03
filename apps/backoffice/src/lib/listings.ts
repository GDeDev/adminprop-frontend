import type {
  ChannelStatus,
  ListingChannel,
  ListingStatus,
  PropertyListingDto,
} from "@adminprop/shared-types"

import type { BadgeMeta } from "./contracts"

export const CHANNEL_LABELS: Record<ListingChannel, string> = {
  MERCADOLIBRE: "Mercado Libre",
  ZONAPROP: "Zonaprop",
  ARGENPROP: "Argenprop",
}

export function channelStatusMeta(status: ChannelStatus): BadgeMeta {
  switch (status) {
    case "CONNECTED":
      return { label: "Conectado", badge: "disponible" }
    case "ERROR":
      return { label: "Con error", badge: "mora" }
    case "UNAVAILABLE":
      return { label: "No disponible", badge: "borrador" }
    case "DISCONNECTED":
      return { label: "Sin conectar", badge: "borrador" }
  }
}

export function listingStatusMeta(status: ListingStatus): BadgeMeta {
  switch (status) {
    case "PUBLISHED":
      return { label: "Publicada", badge: "disponible" }
    case "PUBLISHING":
      return { label: "Publicando…", badge: "mantenimiento" }
    case "PAUSED":
      return { label: "Pausada", badge: "mantenimiento" }
    case "ERROR":
      return { label: "Con error", badge: "mora" }
    case "CLOSED":
      return { label: "Cerrada", badge: "borrador" }
    case "NOT_PUBLISHED":
      return { label: "Sin publicar", badge: "borrador" }
  }
}

export type ListingAction =
  "publish" | "update" | "retry" | "pause" | "resume" | "close"

export const LISTING_ACTION_LABELS: Record<ListingAction, string> = {
  publish: "Publicar",
  update: "Actualizar publicación",
  retry: "Reintentar",
  pause: "Pausar",
  resume: "Reanudar",
  close: "Cerrar",
}

/**
 * Acciones disponibles según el estado. «Actualizar» usa el mismo endpoint de
 * publicar (DT-100) y solo aparece con cambios sin publicar.
 */
export function listingActions(listing: PropertyListingDto): ListingAction[] {
  switch (listing.status) {
    case "NOT_PUBLISHED":
    case "CLOSED":
      return listing.canPublish ? ["publish"] : []
    case "ERROR":
      return ["retry", "close"]
    case "PUBLISHED":
      return [
        ...(listing.hasUnpublishedChanges ? (["update"] as const) : []),
        "pause",
        "close",
      ]
    case "PAUSED":
      return [
        ...(listing.hasUnpublishedChanges ? (["update"] as const) : []),
        "resume",
        "close",
      ]
    case "PUBLISHING":
      return []
  }
}

/** Faltantes que devuelve el 422 `LISTING_NOT_READY` (`details`/`missing`), si vienen. */
export function missingFromError(error: unknown): string[] {
  const missing = (
    error as { response?: { data?: { error?: { missing?: unknown } } } }
  )?.response?.data?.error?.missing
  return Array.isArray(missing)
    ? missing.filter((item): item is string => typeof item === "string")
    : []
}
