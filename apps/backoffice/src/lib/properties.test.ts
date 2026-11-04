import { describe, expect, it } from "vitest"

import {
  listingFacts,
  parseArea,
  parseListingPrice,
  parseWholeNumber,
} from "./properties"

describe("campos de publicación de la propiedad", () => {
  it("enteros: vacío es null y respeta el máximo", () => {
    expect(parseWholeNumber("", 99)).toEqual({ ok: true, value: null })
    expect(parseWholeNumber(" 3 ", 99)).toEqual({ ok: true, value: 3 })
    expect(parseWholeNumber("0", 99)).toEqual({ ok: true, value: 0 })
    expect(parseWholeNumber("100", 99)).toEqual({ ok: false })
    expect(parseWholeNumber("501", 500)).toEqual({ ok: false })
    expect(parseWholeNumber("-1", 99)).toEqual({ ok: false })
    expect(parseWholeNumber("2,5", 99)).toEqual({ ok: false })
  })

  it("superficie: hasta 2 decimales, coma o punto", () => {
    expect(parseArea("85,5")).toEqual({ ok: true, value: 85.5 })
    expect(parseArea("70.25")).toEqual({ ok: true, value: 70.25 })
    expect(parseArea("")).toEqual({ ok: true, value: null })
    expect(parseArea("10,555")).toEqual({ ok: false })
    expect(parseArea("100000000")).toEqual({ ok: false })
    expect(parseArea("abc")).toEqual({ ok: false })
  })

  it("precio: string decimal para la API", () => {
    expect(parseListingPrice("150.000,50")).toEqual({
      ok: true,
      value: "150000.50",
    })
    expect(parseListingPrice("")).toEqual({ ok: true, value: null })
    expect(parseListingPrice("1234567890123")).toEqual({ ok: false })
    expect(parseListingPrice("x")).toEqual({ ok: false })
  })

  it("listingFacts omite lo no cargado", () => {
    expect(
      listingFacts({
        rooms: null,
        bedrooms: 0,
        bathrooms: null,
        totalAreaM2: null,
        coveredAreaM2: 40,
        ageYears: 5,
      })
    ).toEqual([
      ["Dormitorios", "0"],
      ["Superficie cubierta", "40 m²"],
      ["Antigüedad", "5 años"],
    ])
  })
})
