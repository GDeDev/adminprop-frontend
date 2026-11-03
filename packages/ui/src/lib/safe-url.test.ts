import { describe, expect, it } from "vitest"

import { safeHttpsUrl, safeHttpUrl, safeInternalPath } from "./safe-url"

describe("safeHttpUrl", () => {
  it("acepta http y https", () => {
    expect(safeHttpUrl("https://res.cloudinary.com/x/a.pdf")).toBe(
      "https://res.cloudinary.com/x/a.pdf"
    )
    expect(safeHttpUrl("http://localhost:3000/a")).toBe(
      "http://localhost:3000/a"
    )
  })

  it("rechaza esquemas peligrosos, relativos y valores que no son texto", () => {
    for (const value of [
      "javascript:alert(1)",
      " JaVaScRiPt:alert(1)",
      "data:text/html,<script>1</script>",
      "blob:https://a.com/x",
      "file:///etc/passwd",
      "//evil.com",
      "/relativa",
      "",
      "  ",
      null,
      undefined,
      42,
    ]) {
      expect(safeHttpUrl(value)).toBeNull()
    }
  })
})

describe("safeHttpsUrl", () => {
  it("exige https y, si se pide, un host permitido", () => {
    expect(safeHttpsUrl("http://auth.mercadolibre.com.ar/x")).toBeNull()
    expect(
      safeHttpsUrl("https://auth.mercadolibre.com.ar/x", [
        "auth.mercadolibre.com.ar",
      ])
    ).toBe("https://auth.mercadolibre.com.ar/x")
    expect(
      safeHttpsUrl("https://evil.com/x", ["auth.mercadolibre.com.ar"])
    ).toBeNull()
  })
})

describe("safeInternalPath", () => {
  it("sólo rutas internas", () => {
    expect(safeInternalPath("/cobros/1?x=2")).toBe("/cobros/1?x=2")
    for (const value of [
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "/\t/evil.com",
      "evil",
      null,
    ]) {
      expect(safeInternalPath(value)).toBeNull()
    }
  })
})
