import { describe, expect, it } from "vitest"

import {
  barPercent,
  labelIndexes,
  layoutSeries,
  niceMax,
  polylinePoints,
  rangeFor,
  sourceRows,
  stageRows,
} from "./crm-analytics"

describe("filas de barras", () => {
  it("una fila por etapa, en el orden del embudo y con ceros", () => {
    const rows = stageRows({ NEW: 4, CLOSED_WON: 1 })
    expect(rows.map((row) => row.key)).toEqual([
      "NEW",
      "CONTACTED",
      "VISIT_SCHEDULED",
      "PROPOSAL_SENT",
      "CLOSED_WON",
      "CLOSED_LOST",
    ])
    expect(rows.map((row) => row.value)).toEqual([4, 0, 0, 0, 1, 0])
    expect(rows[0]!.label).toBe("Nueva")
  })

  it("los canales sin consultas se omiten y se ordenan de mayor a menor", () => {
    const rows = sourceRows({ PORTAL: 2, WHATSAPP: 5, PHONE: 0, MANUAL: 2 })
    expect(rows.map((row) => row.key)).toEqual(["WHATSAPP", "MANUAL", "PORTAL"])
  })

  it("el ancho de la barra es proporcional, con un mínimo visible", () => {
    expect(barPercent(5, 10)).toBe(50)
    expect(barPercent(1, 1000)).toBe(2)
    expect(barPercent(0, 10)).toBe(0)
    expect(barPercent(3, 0)).toBe(0)
  })
})

describe("rango", () => {
  it("va de hoy menos N días hasta hoy", () => {
    expect(rangeFor(30, "2026-11-04")).toEqual({
      from: "2026-10-05",
      to: "2026-11-04",
    })
  })
})

describe("geometría de la serie diaria", () => {
  it("redondea el tope del eje a 1, 2, 5 o 10 por una potencia de diez", () => {
    expect(niceMax(0)).toBe(1)
    expect(niceMax(1)).toBe(1)
    expect(niceMax(3)).toBe(5)
    expect(niceMax(7)).toBe(10)
    expect(niceMax(130)).toBe(200)
  })

  const daily = [
    { date: "2026-11-01", views: 0, inquiries: 0 },
    { date: "2026-11-02", views: 10, inquiries: 2 },
    { date: "2026-11-03", views: 4, inquiries: 0 },
  ]

  it("totaliza, encuentra el máximo y ubica los puntos dentro del gráfico", () => {
    const layout = layoutSeries(daily, "views")
    expect(layout.total).toBe(14)
    expect(layout.peak).toEqual({ date: "2026-11-02", value: 10 })
    expect(layout.max).toBe(10)
    // El valor máximo toca el tope del área; el cero, la línea base.
    expect(layout.points[1]!.y).toBeCloseTo(12)
    expect(layout.points[0]!.y).toBe(layout.baseline)
    expect(layout.points[0]!.x).toBeLessThan(layout.points[2]!.x)
  })

  it("una serie en cero no tiene máximo y no divide por cero", () => {
    const layout = layoutSeries(
      [{ date: "2026-11-01", views: 0, inquiries: 0 }],
      "inquiries"
    )
    expect(layout.peak).toBeNull()
    expect(layout.total).toBe(0)
    expect(Number.isFinite(layout.points[0]!.y)).toBe(true)
  })

  it("etiqueta primero, medio y último día", () => {
    expect(labelIndexes(0)).toEqual([])
    expect(labelIndexes(2)).toEqual([0, 1])
    expect(labelIndexes(31)).toEqual([0, 15, 30])
  })

  it("arma la línea como pares x,y", () => {
    const layout = layoutSeries(daily, "views")
    expect(polylinePoints(layout.points).split(" ")).toHaveLength(3)
  })
})
