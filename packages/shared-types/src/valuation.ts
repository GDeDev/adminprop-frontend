import type { Currency, IsoDateTime, Money, Uuid } from "./common"

/**
 * Contrato de la Fase 24 (REDISENO_FASE_24.md, secciones 6 y 7). Escrito a
 * mano hasta regenerar desde el OpenAPI del backend.
 */
export type ValuationConfidence = "LOW" | "MEDIUM" | "HIGH"

export type MarketSource = "ZONAPROP" | "ARGENPROP" | "MERCADOLIBRE" | "FAKE"

export type ValuationEngine = "STATISTICAL" | "STATISTICAL_LLM"

/** Cuerpo de `POST /valuation/properties/:propertyId/appraise`. */
export interface AppraisePropertyRequest {
  /** Decimal como string; si la ficha no tiene superficie, se manda desde el formulario. */
  areaM2?: string
  bedrooms?: number
  /** Textos libres; por defecto los de la propiedad. */
  amenities?: string[]
  /** Por defecto, la moneda de publicación de la propiedad. */
  currency?: Currency
}

export interface ValuationRequester {
  id: Uuid
  fullName: string
}

export interface ValuationResult {
  id: Uuid
  propertyId: Uuid
  currency: Currency
  minPrice: Money
  maxPrice: Money
  suggestedPrice: Money
  /** A la centena más cercana, para mostrar. */
  suggestedPriceRounded: Money
  confidence: ValuationConfidence
  comparablesUsed: number
  comparablesDiscarded: number
  /** Ej. "Palermo, CABA". */
  zoneLabel: string
  zoneWidened: boolean
  oldestComparableAt: IsoDateTime | null
  justification: string
  engine: ValuationEngine
  requestedBy: ValuationRequester
  createdAt: IsoDateTime
  /** `true` si es una tasación idéntica reciente que se devolvió en vez de crear otra (A-67). */
  reused: boolean
}

export type MarketSourceStatus =
  "OK" | "STALE" | "BLOCKED" | "PARSE_ERROR" | "DISABLED"

export interface MarketSourceStatusDto {
  source: MarketSource
  lastIngestAt: IsoDateTime | null
  status: MarketSourceStatus
  activeComparables: number
}

export interface MarketStatusDto {
  sources: MarketSourceStatusDto[]
  maxAgeDays: number
}

export interface MarketCoverageDto {
  zoneLabel: string
  activeComparables: number
  enoughData: boolean
  lastRefreshedAt: IsoDateTime | null
}
