import { describe, expect, it } from "vitest"

import { whatsappLink } from "./renters"

describe("whatsappLink", () => {
  it("arma el link sin espacios y con código de país (spec Fase 8, 6)", () => {
    expect(whatsappLink("+54 9 11 5555-1234")).toBe(
      "https://wa.me/5491155551234"
    )
    expect(whatsappLink("11 5555 1234")).toBe("https://wa.me/5491155551234")
    expect(whatsappLink("011 5555-1234")).toBe("https://wa.me/5491155551234")
    expect(whatsappLink("54 11 5555 1234")).toBe("https://wa.me/5491155551234")
    expect(whatsappLink("0054 9 221 555 1234")).toBe(
      "https://wa.me/5492215551234"
    )
  })

  it("devuelve null sin teléfono o con algo que no es un número", () => {
    expect(whatsappLink(null)).toBeNull()
    expect(whatsappLink("")).toBeNull()
    expect(whatsappLink("consultar")).toBeNull()
    expect(whatsappLink("123")).toBeNull()
  })
})
