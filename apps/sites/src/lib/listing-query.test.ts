import { describe, expect, it } from "vitest"

import { listingSearch, parseListingQuery } from "./listing-query"

const ID = "11111111-1111-4111-8111-111111111111"

describe("listing query", () => {
  it("lee los filtros válidos", () => {
    expect(
      parseListingQuery({
        operation: "SALE",
        propertyTypeId: ID,
        locationId: ID,
        priceFrom: "1000",
        priceTo: "2500.50",
        currency: "USD",
        bedrooms: "2",
        page: "3",
      })
    ).toEqual({
      operation: "SALE",
      propertyTypeId: ID,
      locationId: ID,
      priceFrom: "1000",
      priceTo: "2500.50",
      currency: "USD",
      bedrooms: 2,
      page: 3,
    })
  })

  it("ignora lo inválido y toma el primer valor de los repetidos", () => {
    expect(
      parseListingQuery({
        operation: "NOPE",
        propertyTypeId: "no-uuid",
        priceFrom: "1e9",
        priceTo: "-5",
        currency: "EUR",
        bedrooms: "0",
        page: ["2", "9"],
      })
    ).toEqual({ page: 2 })
    expect(parseListingQuery({})).toEqual({})
  })

  it("arma la URL de nuevo, sin la página 1", () => {
    expect(listingSearch({})).toBe("")
    expect(listingSearch({ operation: "RENT", bedrooms: 2 })).toBe(
      "?operation=RENT&bedrooms=2"
    )
    expect(listingSearch({ operation: "RENT" }, { page: 1 })).toBe(
      "?operation=RENT"
    )
    expect(listingSearch({ operation: "RENT" }, { page: 4 })).toBe(
      "?operation=RENT&page=4"
    )
  })
})
