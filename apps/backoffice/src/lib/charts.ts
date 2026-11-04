import type { PropertyInquiryDailyPoint } from "@adminprop/shared-types"

import { addDays, daysBetween } from "./dates"

export interface DailyValue {
  date: string
  value: number
}

/**
 * Serie diaria completa entre `from` y `to` (inclusive). La API puede omitir
 * los días sin movimiento: acá se rellenan con 0 para que el eje temporal sea
 * parejo (DT-107).
 */
export function fillDaily(
  points: PropertyInquiryDailyPoint[],
  field: "views" | "inquiries",
  from: string,
  to: string
): DailyValue[] {
  const byDate = new Map(points.map((point) => [point.date, point[field]]))
  const days = Math.max(0, daysBetween(from, to))
  return Array.from({ length: days + 1 }, (_, offset) => {
    const date = addDays(from, offset)
    return { date, value: byDate.get(date) ?? 0 }
  })
}

/** Tope "redondo" del eje vertical (1, 2, 5, 10, 20, 50…); mínimo 1. */
export function niceMax(max: number): number {
  if (max <= 1) return 1
  const magnitude = 10 ** Math.floor(Math.log10(max))
  const normalized = max / magnitude
  const step =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

export interface Bar {
  date: string
  value: number
  x: number
  y: number
  width: number
  height: number
}

/**
 * Geometría de las barras dentro de un área de `width` x `height` (sin
 * márgenes). Una barra con valor > 0 mide al menos 2 px para que se vea.
 */
export function layoutBars(
  data: DailyValue[],
  width: number,
  height: number
): { bars: Bar[]; max: number } {
  const max = niceMax(Math.max(0, ...data.map((item) => item.value)))
  if (data.length === 0) return { bars: [], max }
  const slot = width / data.length
  const barWidth = Math.max(1, slot * 0.7)
  const bars = data.map((item, index) => {
    const raw = (item.value / max) * height
    const barHeight = item.value > 0 ? Math.max(2, raw) : 0
    return {
      date: item.date,
      value: item.value,
      x: index * slot + (slot - barWidth) / 2,
      y: height - barHeight,
      width: barWidth,
      height: barHeight,
    }
  })
  return { bars, max }
}

/** Ancho porcentual de una barra horizontal respecto del mayor valor. */
export function shareOfMax(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0
  return Math.max(2, Math.round((value / max) * 100))
}
