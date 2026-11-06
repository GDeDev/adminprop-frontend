import type {
  InquirySource,
  InquiryStage,
  PropertyInquiryDailyPoint,
} from "@adminprop/shared-types"

import { SOURCE_LABELS, STAGES, STAGE_LABELS } from "./crm"
import { addDays, daysBetween } from "./dates"

/** Rangos que se pueden elegir en las analíticas (días hacia atrás desde hoy). */
export const ANALYTICS_RANGES = [7, 30, 90] as const
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number]
export const DEFAULT_RANGE: AnalyticsRange = 30

export function rangeLabel(days: number): string {
  return `Últimos ${days} días`
}

/** Rango `from`/`to` (inclusive) para la API a partir de los días elegidos. */
export function rangeFor(days: number, today: string) {
  return { from: addDays(today, -days), to: today }
}

/**
 * Serie diaria completa de `from` a `to` (inclusive): la API puede omitir los
 * días sin movimiento y el gráfico asume un punto por día, así que los que
 * faltan se rellenan con 0. Sin ningún punto queda vacía (el gráfico muestra
 * su estado vacío). Rescatado de la rama `feature/fase-23-crm-front-ui`.
 */
export function fillDaily(
  points: PropertyInquiryDailyPoint[],
  from: string,
  to: string
): PropertyInquiryDailyPoint[] {
  if (points.length === 0) return []
  const byDate = new Map(
    points.map((point) => [point.date.slice(0, 10), point])
  )
  const days = Math.max(0, daysBetween(from, to))
  return Array.from({ length: days + 1 }, (_, offset) => {
    const date = addDays(from, offset)
    return byDate.get(date) ?? { date, views: 0, inquiries: 0 }
  })
}

/**
 * Las vistas empezaron a contarse con la Fase 23 (A-83): antes de eso no hay
 * dato y el rango muestra 0. Se avisa siempre que se muestren vistas.
 */
export const VIEWS_NOTICE =
  "Las vistas se cuentan desde la fecha de activación de esta función; antes no hay datos y figuran en cero."

export interface BarRow {
  key: string
  label: string
  value: number
}

/** Una fila por etapa, en el orden del embudo (incluye las vacías). */
export function stageRows(
  byStage: Partial<Record<InquiryStage, number>>
): BarRow[] {
  return STAGES.map((stage) => ({
    key: stage,
    label: STAGE_LABELS[stage],
    value: byStage[stage] ?? 0,
  }))
}

/** Sólo los canales con consultas, de mayor a menor (desempata por nombre). */
export function sourceRows(
  bySource: Partial<Record<InquirySource, number>>
): BarRow[] {
  return (Object.keys(SOURCE_LABELS) as InquirySource[])
    .map((source) => ({
      key: source,
      label: SOURCE_LABELS[source],
      value: bySource[source] ?? 0,
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "es"))
}

/** Ancho de la barra en % respecto del mayor valor (mínimo visible si > 0). */
export function barPercent(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0
  return Math.max(2, Math.round((value / max) * 100))
}

/** Tope "redondo" del eje: 1, 2, 5 o 10 por una potencia de diez. */
export function niceMax(max: number): number {
  if (max <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(max))
  const fraction = max / power
  const step = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return step * power
}

export type SeriesKey = "views" | "inquiries"

export interface ChartGeometry {
  width: number
  height: number
  top: number
  right: number
  bottom: number
  left: number
}

export const CHART_GEOMETRY: ChartGeometry = {
  width: 640,
  height: 180,
  top: 12,
  right: 12,
  bottom: 28,
  left: 36,
}

export interface ChartPoint {
  date: string
  value: number
  x: number
  y: number
}

export interface SeriesLayout {
  max: number
  ticks: number[]
  points: ChartPoint[]
  /** Ancho disponible por día (para las barras). */
  step: number
  baseline: number
  total: number
  peak: { date: string; value: number } | null
}

/** Coordenadas SVG de una serie diaria; pura para poder probarla. */
export function layoutSeries(
  daily: PropertyInquiryDailyPoint[],
  key: SeriesKey,
  geometry: ChartGeometry = CHART_GEOMETRY
): SeriesLayout {
  const plotWidth = geometry.width - geometry.left - geometry.right
  const plotHeight = geometry.height - geometry.top - geometry.bottom
  const baseline = geometry.top + plotHeight
  const values = daily.map((point) => point[key])
  const max = niceMax(Math.max(0, ...values))
  const step = daily.length > 0 ? plotWidth / daily.length : plotWidth
  const points = daily.map((point, index) => ({
    date: point.date,
    value: point[key],
    x: geometry.left + step * index + step / 2,
    y: baseline - (point[key] / max) * plotHeight,
  }))
  const tickCount = max <= 4 ? max : 4
  const ticks = Array.from(
    { length: tickCount + 1 },
    (_, i) => Math.round((max / tickCount) * i * 100) / 100
  )
  let peak: SeriesLayout["peak"] = null
  for (const point of daily) {
    if (point[key] > 0 && (!peak || point[key] > peak.value)) {
      peak = { date: point.date, value: point[key] }
    }
  }
  return {
    max,
    ticks,
    points,
    step,
    baseline,
    total: values.reduce((sum, value) => sum + value, 0),
    peak,
  }
}

/** Línea de puntos para `<polyline>`. */
export function polylinePoints(points: ChartPoint[]): string {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
}

/** Índices de las fechas que llevan etiqueta en el eje X (primero, medio, último). */
export function labelIndexes(length: number): number[] {
  if (length <= 0) return []
  if (length <= 3) return Array.from({ length }, (_, i) => i)
  return [0, Math.floor((length - 1) / 2), length - 1]
}
