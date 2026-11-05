import { describe, expect, it } from "vitest"

import { osmEmbedUrl, osmLink, parseCoordinates } from "./osm"

describe("osm", () => {
  it("acepta coordenadas válidas", () => {
    expect(parseCoordinates(-34.9205, -57.9536)).toEqual({
      latitude: -34.9205,
      longitude: -57.9536,
    })
  })

  it("descarta lo que no es un par de números razonable", () => {
    expect(parseCoordinates(null, null)).toBeNull()
    expect(parseCoordinates(undefined, -57)).toBeNull()
    expect(parseCoordinates("-34.9", "-57.9")).toBeNull()
    expect(parseCoordinates(Number.NaN, 10)).toBeNull()
    expect(parseCoordinates(Infinity, 10)).toBeNull()
    expect(parseCoordinates(91, 10)).toBeNull()
    expect(parseCoordinates(10, -181)).toBeNull()
    // Un dato faltante guardado como 0,0 no es un lugar.
    expect(parseCoordinates(0, 0)).toBeNull()
  })

  it("arma URLs https de openstreetmap.org con solo números", () => {
    const point = { latitude: -34.9205, longitude: -57.9536 }
    const embed = new URL(osmEmbedUrl(point))
    expect(embed.origin).toBe("https://www.openstreetmap.org")
    expect(embed.pathname).toBe("/export/embed.html")
    expect(embed.searchParams.get("marker")).toBe("-34.920500,-57.953600")
    expect(embed.searchParams.get("bbox")).toBe(
      "-57.958600,-34.925500,-57.948600,-34.915500"
    )
    const link = osmLink(point)
    expect(link.startsWith("https://www.openstreetmap.org/?mlat=")).toBe(true)
    expect(link).toContain("#map=16/-34.920500/-57.953600")
  })
})
