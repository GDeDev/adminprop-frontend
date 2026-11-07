import { describe, expect, it } from "vitest"

import {
  buildValuationMessage,
  validateValuation,
  type ValuationInput,
} from "./valuation-request"

const OK: ValuationInput = {
  propertyType: "Casa",
  operation: "SALE",
  address: "Calle 7 1234, Tolosa",
  areaM2: "120",
  bedrooms: "3",
  notes: "",
}

describe("solicitud de tasación", () => {
  it("una solicitud completa es válida y los opcionales pueden faltar", () => {
    expect(validateValuation(OK)).toEqual({})
    expect(validateValuation({ ...OK, areaM2: "", bedrooms: "" })).toEqual({})
  })

  it("marca los campos obligatorios y los opcionales mal escritos", () => {
    const errors = validateValuation({
      propertyType: "Castillo",
      operation: "",
      address: "ab",
      areaM2: "mucho",
      bedrooms: "-2",
      notes: "",
    })
    expect(Object.keys(errors).sort()).toEqual([
      "address",
      "areaM2",
      "bedrooms",
      "operation",
      "propertyType",
    ])
  })

  it("arma un mensaje en texto plano, una línea por dato", () => {
    expect(buildValuationMessage({ ...OK, notes: "Tiene jardín" })).toBe(
      [
        "Solicitud de tasación",
        "Tipo de propiedad: Casa",
        "Quiere: Vender",
        "Dirección y zona: Calle 7 1234, Tolosa",
        "Superficie: 120 m²",
        "Dormitorios: 3",
        "Comentarios: Tiene jardín",
      ].join("\n")
    )
  })

  it("omite lo que no se cargó, aplana espacios y no pasa de 2000 caracteres", () => {
    const message = buildValuationMessage({
      ...OK,
      areaM2: "",
      bedrooms: "",
      address: "  Calle   7\n\n1234  ",
      notes: "x".repeat(5000),
    })
    expect(message).not.toContain("Superficie")
    expect(message).toContain("Dirección y zona: Calle 7 1234")
    expect(message.length).toBeLessThanOrEqual(2000)
  })
})
