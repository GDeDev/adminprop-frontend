import { describe, expect, it } from "vitest"

import {
  buildAppraisalRequest,
  confidenceMeta,
  dataAgeLabel,
  markerPosition,
  sourceStatusMeta,
} from "./valuation"

describe("buildAppraisalRequest", () => {
  it("no manda lo que está vacío", () => {
    expect(
      buildAppraisalRequest({ areaM2: "", bedrooms: "", currency: "" })
    ).toEqual({ ok: true, request: {} })
  })

  it("normaliza la superficie argentina y manda ambientes y moneda", () => {
    expect(
      buildAppraisalRequest({ areaM2: "52,5", bedrooms: "3", currency: "USD" })
    ).toEqual({
      ok: true,
      request: { areaM2: "52.5", bedrooms: 3, currency: "USD" },
    })
  })

  it("rechaza superficie y ambientes inválidos", () => {
    const result = buildAppraisalRequest({
      areaM2: "abc",
      bedrooms: "0",
      currency: "",
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.areaM2).toBeDefined()
      expect(result.errors.bedrooms).toBeDefined()
    }
    expect(
      buildAppraisalRequest({ areaM2: "0", bedrooms: "", currency: "" }).ok
    ).toBe(false)
  })
})

describe("markerPosition", () => {
  it("ubica el sugerido dentro del rango", () => {
    expect(markerPosition("100000", "200000", "150000")).toBe(50)
    expect(markerPosition("100000", "200000", "125000")).toBe(25)
  })
  it("queda acotado y tolera rangos degenerados", () => {
    expect(markerPosition("100", "200", "500")).toBe(100)
    expect(markerPosition("100", "200", "1")).toBe(0)
    expect(markerPosition("100", "100", "100")).toBe(50)
    expect(markerPosition("x", "200", "100")).toBe(50)
  })
})

describe("dataAgeLabel", () => {
  const now = new Date("2026-11-03T12:00:00Z")
  it("expresa la antigüedad en días", () => {
    expect(dataAgeLabel("2026-10-20T12:00:00Z", now)).toBe("de hace 14 días")
    expect(dataAgeLabel("2026-11-02T00:00:00Z", now)).toBe("de hace 1 día")
    expect(dataAgeLabel("2026-11-03T08:00:00Z", now)).toBe("de hoy")
    expect(dataAgeLabel(null, now)).toBeNull()
  })
})

describe("etiquetas", () => {
  it("confianza y estado de fuente", () => {
    expect(confidenceMeta("HIGH").label).toBe("Confianza alta")
    expect(confidenceMeta("LOW").badge).toBe("mora")
    expect(sourceStatusMeta("BLOCKED").label).toBe("Bloqueada")
  })
})
