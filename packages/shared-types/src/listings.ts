import type { ApiSchemas } from "./api"

/**
 * Contrato de multipublicación de la Fase 23 (REDISENO_FASE_23.md, secciones 6
 * y 7), tal como lo publica el OpenAPI de la API.
 */
export type ListingChannelDto = ApiSchemas["ListingChannelDto"]
export type PropertyListingDto = ApiSchemas["PropertyListingDto"]
export type StartListingResult = ApiSchemas["StartListingResultDto"]
export type ConnectChannelResult = ApiSchemas["ConnectChannelResultDto"]

export type ListingChannel = ListingChannelDto["channel"]
export type ChannelStatus = ListingChannelDto["status"]
export type ListingStatus = PropertyListingDto["status"]
