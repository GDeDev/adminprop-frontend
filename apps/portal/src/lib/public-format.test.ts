import { describe, expect, it } from "vitest"

import { listingHref, parseListingQuery, priceLabel } from "./public-format"

describe("priceLabel", () => {
  it("sin precio dice Consultar", () => {
    expect(priceLabel(null, null)).toBe("Consultar")
    expect(priceLabel("450000.00", null)).toBe("Consultar")
  })

  it("formatea pesos y dólares sin decimales", () => {
    expect(priceLabel("450000.00", "ARS")).toContain("450.000")
    expect(priceLabel("900.00", "USD")).toContain("900")
  })
})

describe("parseListingQuery", () => {
  it("toma los filtros válidos y descarta el resto", () => {
    expect(
      parseListingQuery({
        locationId: "abc",
        priceFrom: "100000",
        priceTo: "mucho",
        currency: "EUR",
        page: "3",
      })
    ).toEqual({
      locationId: "abc",
      propertyTypeId: undefined,
      priceFrom: "100000",
      priceTo: undefined,
      currency: undefined,
      page: 3,
    })
  })

  it("la página 1 y las inválidas no se ponen", () => {
    expect(parseListingQuery({ page: "1" }).page).toBeUndefined()
    expect(parseListingQuery({ page: "x" }).page).toBeUndefined()
  })
})

describe("listingHref", () => {
  it("arma la URL sin valores vacíos", () => {
    expect(listingHref({})).toBe("/")
    expect(listingHref({ locationId: "l1", page: 2 })).toBe(
      "/?locationId=l1&page=2"
    )
  })
})
