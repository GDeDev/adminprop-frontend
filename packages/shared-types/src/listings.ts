import type { IsoDateTime, Uuid } from "./common"

/**
 * Contrato de multipublicación de la Fase 23 (REDISENO_FASE_23.md, secciones 6
 * y 7). Escrito a mano hasta regenerar desde el OpenAPI del backend.
 */
export type ListingChannel = "MERCADOLIBRE" | "ZONAPROP" | "ARGENPROP"

export type ChannelStatus =
  "DISCONNECTED" | "CONNECTED" | "ERROR" | "UNAVAILABLE"

export type ListingStatus =
  "NOT_PUBLISHED" | "PUBLISHING" | "PUBLISHED" | "PAUSED" | "ERROR" | "CLOSED"

export interface ListingChannelDto {
  channel: ListingChannel
  status: ChannelStatus
  accountLabel: string | null
  connectedAt: IsoDateTime | null
  lastError: string | null
  unavailableReason: string | null
}

export interface PropertyListingDto {
  channel: ListingChannel
  status: ListingStatus
  externalUrl: string | null
  publishedAt: IsoDateTime | null
  lastSyncedAt: IsoDateTime | null
  lastError: string | null
  hasUnpublishedChanges: boolean
  canPublish: boolean
  missingForPublish: string[]
}

export interface StartListingResult {
  jobId: Uuid
}

export interface ConnectChannelResult {
  authorizeUrl: string
}
