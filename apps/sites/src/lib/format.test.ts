import { describe, expect, it } from "vitest"

import type { PublicPropertySummary } from "@adminprop/shared-types"

import {
  cardFacts,
  CONSULT_PRICE_LABEL,
  formatArea,
  formatPrice,
  hasPrice,
  operationLabel,
} from "./format"

const property = (over: Partial<PublicPropertySummary>) =>
  ({
    bedrooms: null,
    bathrooms: null,
    areaM2: null,
    ...over,
  }) as PublicPropertySummary

describe("format", () => {
  it("formatea precios por moneda y usa Consultar sin precio", () => {
    expect(formatPrice("150000.00", "USD")).toBe("US$ 150.000")
    expect(formatPrice("1500.50", "ARS")).toBe("$ 1.500,5")
    expect(formatPrice(null, null)).toBe("Consultar")
    expect(formatPrice("abc", "ARS")).toBe("Consultar")
  })

  it("formatea superficies", () => {
    expect(formatArea(85.5)).toBe("85,5 m²")
    expect(formatArea(null)).toBeNull()
  })

  it("rotula la operación", () => {
    expect(operationLabel("SALE")).toBe("Venta")
    expect(operationLabel("RENT")).toBe("Alquiler")
  })

  it("las tarjetas muestran solo los datos cargados, en singular o plural", () => {
    expect(cardFacts(property({}))).toEqual([])
    expect(
      cardFacts(property({ bedrooms: 1, bathrooms: 2, areaM2: 70 })).map(
        (f) => f.label
      )
    ).toEqual(["1 dormitorio", "2 baños", "70 m²"])
  })

  it("distingue una propiedad con precio de una a consultar", () => {
    expect(hasPrice("150000.00")).toBe(true)
    expect(hasPrice("0")).toBe(true)
    expect(hasPrice(null)).toBe(false)
    expect(hasPrice("abc")).toBe(false)
    expect(CONSULT_PRICE_LABEL).toBe("Precio a consultar")
  })
})
