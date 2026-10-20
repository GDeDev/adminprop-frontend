/** UUID v4 como string. */
export type Uuid = string

/** Fecha ISO-8601 sin hora (YYYY-MM-DD). */
export type IsoDate = string

/** Timestamp ISO-8601 completo. */
export type IsoDateTime = string

/**
 * Monto monetario como string decimal (ej. "150333.33").
 * Nunca `number`: la aritmética la hace solo la API (decimal.js); el
 * frontend recibe el string y lo formatea para mostrar.
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

/** Detalle de un error puntual (por campo, en los de validación). */
export interface ApiErrorDetail {
  message: string
  /** Regla que falló (ej. "isEmail"). */
  code?: string
  field?: string
}

/**
 * Cuerpo de error de la API (adminprop-backend, `buildErrorBody`).
 * Ramificar por `code` (estable), nunca por `message` (texto para mostrar).
 */
export interface ApiError {
  success: false
  statusCode: number
  /** Nombre del status HTTP ("Not Found"). */
  error: string
  code: string
  message: string
  errors: ApiErrorDetail[]
  /** Para rastrear el request en los logs de la API. */
  correlationId: string
  timestamp: IsoDateTime
  path: string
}

/** Sobre de las respuestas OK de la API. */
export interface ApiSuccess<T> {
  success: true
  message: string | null
  data: T
}
