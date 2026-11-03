import type {
  AppraisePropertyRequest,
  Currency,
  MarketSource,
  MarketSourceStatus,
  Money,
  ValuationConfidence,
} from "@adminprop/shared-types"
import { apiErrorMessage } from "@adminprop/session/client"

import type { BadgeMeta } from "./contracts"
import { normalizeAmount } from "./contracts"

export const CONFIDENCE_LABELS: Record<ValuationConfidence, string> = {
  HIGH: "Confianza alta",
  MEDIUM: "Confianza media",
  LOW: "Confianza baja",
}

export function confidenceMeta(confidence: ValuationConfidence): BadgeMeta {
  switch (confidence) {
    case "HIGH":
      return { label: CONFIDENCE_LABELS.HIGH, badge: "disponible" }
    case "MEDIUM":
      return { label: CONFIDENCE_LABELS.MEDIUM, badge: "mantenimiento" }
    case "LOW":
      return { label: CONFIDENCE_LABELS.LOW, badge: "mora" }
  }
}

export const SOURCE_LABELS: Record<MarketSource, string> = {
  ZONAPROP: "Zonaprop",
  ARGENPROP: "Argenprop",
  MERCADOLIBRE: "Mercado Libre",
  FAKE: "Datos de prueba",
}

export function sourceStatusMeta(status: MarketSourceStatus): BadgeMeta {
  switch (status) {
    case "OK":
      return { label: "Al día", badge: "disponible" }
    case "STALE":
      return { label: "Desactualizada", badge: "mantenimiento" }
    case "BLOCKED":
      return { label: "Bloqueada", badge: "mora" }
    case "PARSE_ERROR":
      return { label: "Con error de lectura", badge: "mora" }
    case "DISABLED":
      return { label: "Desactivada", badge: "borrador" }
  }
}

/** 422 y 429 traen su mensaje en español (rediseño, sección 6): se muestra tal cual. */
export function valuationApiError(error: unknown, fallback: string): string {
  return apiErrorMessage(error, fallback)
}

export interface AppraisalForm {
  areaM2: string
  bedrooms: string
  currency: Currency | ""
}

/**
 * Arma el cuerpo del pedido desde el formulario. Devuelve los errores por
 * campo en vez de mandar datos que la API rechazaría.
 */
export function buildAppraisalRequest(
  form: AppraisalForm
):
  | { ok: true; request: AppraisePropertyRequest }
  | { ok: false; errors: Partial<Record<"areaM2" | "bedrooms", string>> } {
  const errors: Partial<Record<"areaM2" | "bedrooms", string>> = {}
  const request: AppraisePropertyRequest = {}

  if (form.areaM2.trim() !== "") {
    const area = normalizeAmount(form.areaM2)
    if (area === null || Number(area) <= 0) {
      errors.areaM2 = "Ingresá la superficie en m², por ejemplo 52,5."
    } else {
      request.areaM2 = area
    }
  }
  if (form.bedrooms.trim() !== "") {
    if (!/^\d{1,2}$/.test(form.bedrooms.trim()) || Number(form.bedrooms) < 1) {
      errors.bedrooms = "Ingresá la cantidad de ambientes (1 o más)."
    } else {
      request.bedrooms = Number(form.bedrooms)
    }
  }
  if (form.currency !== "") request.currency = form.currency

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, request }
}

/**
 * Posición (0 a 100) del precio sugerido dentro de la barra del rango. Es solo
 * presentación: los montos los calcula la API (DT-11).
 */
export function markerPosition(
  min: Money,
  max: Money,
  suggested: Money
): number {
  const low = Number(min)
  const high = Number(max)
  const value = Number(suggested)
  if (![low, high, value].every(Number.isFinite) || high <= low) return 50
  return Math.min(100, Math.max(0, ((value - low) / (high - low)) * 100))
}

/** "hace 12 días" para la antigüedad del aviso más viejo, o null si no hay dato. */
export function dataAgeLabel(
  oldest: string | null,
  now: Date = new Date()
): string | null {
  if (!oldest) return null
  const days = Math.floor(
    (now.getTime() - new Date(oldest).getTime()) / 86_400_000
  )
  if (!Number.isFinite(days)) return null
  if (days <= 0) return "de hoy"
  return days === 1 ? "de hace 1 día" : `de hace ${days} días`
}
