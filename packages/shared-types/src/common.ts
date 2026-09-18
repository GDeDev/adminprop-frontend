/** UUID v4 como string. */
export type Uuid = string

/** Fecha ISO-8601 sin hora (YYYY-MM-DD). */
export type IsoDate = string

/** Timestamp ISO-8601 completo. */
export type IsoDateTime = string

/**
 * Monto monetario como string decimal (ej. "150333.33").
 * Nunca `number`: toda aritmética pasa por el helper de decimal.js
 * (packages/shared-utils/money.ts, Fase 3).
 */
export type Money = string

/** Porcentaje como string decimal (ej. "5.00" = 5%). */
export type Percentage = string

/** Período mensual YYYY-MM (ej. "2026-06"). */
export type BillingPeriod = string

export type Currency = "ARS" | "USD"

export interface Timestamps {
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

/** Shape de error estándar de la API (Fase 1, sección 8). */
export interface ApiError {
  statusCode: number
  error: string
  message: string
  timestamp: IsoDateTime
  path: string
}
