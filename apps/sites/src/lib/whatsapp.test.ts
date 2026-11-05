import { describe, expect, it } from "vitest"

import { telLink, whatsappLink } from "./whatsapp"

describe("whatsapp y teléfono", () => {
  it("arma el link con el mensaje codificado", () => {
    expect(whatsappLink("5492215550000", "Hola, ¿cómo están?")).toBe(
      "https://wa.me/5492215550000?text=Hola%2C%20%C2%BFc%C3%B3mo%20est%C3%A1n%3F"
    )
    expect(whatsappLink("5492215550000")).toBe("https://wa.me/5492215550000")
  })

  it("rechaza números que no son solo dígitos", () => {
    expect(whatsappLink(null)).toBeNull()
    expect(whatsappLink("+54 9 221")).toBeNull()
    expect(whatsappLink("javascript:alert(1)")).toBeNull()
  })

  it("tel: conserva solo dígitos y +", () => {
    expect(telLink("+54 (221) 555-0000")).toBe("tel:+542215550000")
    expect(telLink("12")).toBeNull()
    expect(telLink(null)).toBeNull()
  })
})
