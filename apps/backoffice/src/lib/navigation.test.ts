import { describe, expect, it } from "vitest"

import { mobileMoreItems, mobileNavItems, navItems } from "./navigation"

describe("navegación del backoffice", () => {
  it("la barra mobile tiene 4 destinos + 'Más' (máximo 5)", () => {
    expect(mobileNavItems).toHaveLength(4)
  })

  it("entre la barra y 'Más' están todas las secciones, sin repetir", () => {
    const mobile = [...mobileNavItems, ...mobileMoreItems].map((i) => i.href)
    expect(new Set(mobile).size).toBe(mobile.length)
    expect(mobile.sort()).toEqual(navItems.map((i) => i.href).sort())
  })
})
