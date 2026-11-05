import type { ApiSchemas } from "./api"

/**
 * Contrato de la Fase 24 (REDISENO_FASE_24.md, secciones 6 y 7), tal como lo
 * publica el OpenAPI de la API.
 */
export type ValuationResult = ApiSchemas["ValuationResultDto"]
export type ValuationRequester = ApiSchemas["ValuationRequesterDto"]
export type ValuationConfidence = ValuationResult["confidence"]
export type ValuationEngine = ValuationResult["engine"]

/** Cuerpo de `POST /valuation/properties/:propertyId/appraise`. */
export type AppraisePropertyRequest = ApiSchemas["AppraisePropertyDto"]

export type MarketSourceStatusDto = ApiSchemas["MarketSourceStatusDto"]
export type MarketStatusDto = ApiSchemas["MarketStatusDto"]
export type MarketCoverageDto = ApiSchemas["MarketCoverageDto"]
export type MarketSource = MarketSourceStatusDto["source"]
export type MarketSourceStatus = MarketSourceStatusDto["status"]
