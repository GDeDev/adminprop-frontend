import { describe, expect, it } from "vitest"

import { fillDaily, layoutBars, niceMax, shareOfMax } from "./charts"

describe("fillDaily", () => {
  it("rellena con 0 los días que la API no mandó", () => {
    const series = fillDaily(
      [
        { date: "2026-11-01", views: 4, inquiries: 1 },
        { date: "2026-11-03", views: 2, inquiries: 0 },
      ],
      "views",
      "2026-11-01",
      "2026-11-04"
    )
    expect(series).toEqual([
      { date: "2026-11-01", value: 4 },
      { date: "2026-11-02", value: 0 },
      { date: "2026-11-03", value: 2 },
      { date: "2026-11-04", value: 0 },
    ])
  })

  it("un rango de un solo día da un punto", () => {
    expect(fillDaily([], "inquiries", "2026-11-01", "2026-11-01")).toEqual([
      { date: "2026-11-01", value: 0 },
    ])
  })
})

describe("niceMax", () => {
  it("redondea hacia un tope legible", () => {
    expect(niceMax(0)).toBe(1)
    expect(niceMax(3)).toBe(5)
    expect(niceMax(7)).toBe(10)
    expect(niceMax(12)).toBe(20)
    expect(niceMax(130)).toBe(200)
  })
})

describe("layoutBars", () => {
  it("escala al tope y deja una altura mínima visible", () => {
    const { bars, max } = layoutBars(
      [
        { date: "a", value: 10 },
        { date: "b", value: 0 },
        { date: "c", value: 1 },
      ],
      300,
      100
    )
    expect(max).toBe(10)
    expect(bars[0]).toMatchObject({ height: 100, y: 0 })
    expect(bars[1]).toMatchObject({ height: 0, y: 100 })
    expect(bars[2]!.height).toBe(10)
    const tiny = layoutBars(
      [
        { date: "a", value: 1000 },
        { date: "b", value: 1 },
      ],
      10,
      100
    )
    expect(tiny.bars[1]!.height).toBe(2)
  })

  it("sin datos no hay barras", () => {
    expect(layoutBars([], 100, 100).bars).toEqual([])
  })
})

describe("shareOfMax", () => {
  it("proporción con piso de 2 % si hay valor", () => {
    expect(shareOfMax(5, 10)).toBe(50)
    expect(shareOfMax(1, 1000)).toBe(2)
    expect(shareOfMax(0, 10)).toBe(0)
    expect(shareOfMax(3, 0)).toBe(0)
  })
})
