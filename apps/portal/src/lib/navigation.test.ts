import { describe, expect, it } from "vitest"

import { portalNav } from "./navigation"

describe("navegación del portal", () => {
  it.each(Object.entries(portalNav))(
    "el portal %s entra en la barra mobile (máx. 5 destinos)",
    (_role, { items }) => {
      expect(items.length).toBeLessThanOrEqual(5)
    }
  )

  it("cada portal solo enlaza a su área", () => {
    expect(
      portalNav.owner.items.every((i) => i.href.startsWith("/propietario/"))
    ).toBe(true)
    expect(
      portalNav.renter.items.every((i) => i.href.startsWith("/inquilino/"))
    ).toBe(true)
  })
})
