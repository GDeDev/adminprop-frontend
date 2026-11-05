import { describe, expect, it } from "vitest"

import {
  listingSearch,
  pageWindow,
  parseListingQuery,
  withSortCurrency,
} from "./listing-query"

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

  it("lee el orden: recent es el default y no viaja, lo inválido se ignora", () => {
    expect(parseListingQuery({ sort: "price_asc" })).toEqual({
      sort: "price_asc",
    })
    expect(parseListingQuery({ sort: "price_desc" })).toEqual({
      sort: "price_desc",
    })
    expect(parseListingQuery({ sort: "recent" })).toEqual({})
    expect(parseListingQuery({ sort: "id; drop table" })).toEqual({})
    expect(listingSearch({ operation: "SALE", sort: "price_desc" })).toBe(
      "?operation=SALE&sort=price_desc"
    )
  })

  it("al ordenar por precio manda siempre una moneda (la elegida o pesos)", () => {
    expect(withSortCurrency({ sort: "price_asc" })).toEqual({
      query: { sort: "price_asc", currency: "ARS" },
      defaulted: true,
    })
    expect(withSortCurrency({ sort: "price_desc", currency: "USD" })).toEqual({
      query: { sort: "price_desc", currency: "USD" },
      defaulted: false,
    })
    // Sin orden por precio no se inventa ninguna moneda.
    expect(withSortCurrency({ operation: "SALE" })).toEqual({
      query: { operation: "SALE" },
      defaulted: false,
    })
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

  it("invierte un rango de precio al revés", () => {
    expect(parseListingQuery({ priceFrom: "900", priceTo: "100" })).toEqual({
      priceFrom: "100",
      priceTo: "900",
    })
  })

  it("arma la ventana de páginas con saltos", () => {
    expect(pageWindow(1, 1)).toEqual([1])
    expect(pageWindow(2, 3)).toEqual([1, 2, 3])
    expect(pageWindow(1, 10)).toEqual([1, 2, null, 10])
    expect(pageWindow(5, 10)).toEqual([1, null, 4, 5, 6, null, 10])
    expect(pageWindow(10, 10)).toEqual([1, null, 9, 10])
  })
})
