import { describe, expect, it } from "vitest"

import {
  mobileMoreItems,
  mobileNavItems,
  navItems,
  visibleNavItems,
} from "./navigation"

describe("navegación del backoffice", () => {
  it("la barra mobile tiene 4 destinos + 'Más' (máximo 5)", () => {
    expect(mobileNavItems).toHaveLength(4)
  })

  it("entre la barra y 'Más' están todas las secciones, sin repetir", () => {
    const mobile = [...mobileNavItems, ...mobileMoreItems].map((i) => i.href)
    expect(new Set(mobile).size).toBe(mobile.length)
    expect(mobile.sort()).toEqual(navItems.map((i) => i.href).sort())
  })

  it("«Mi sitio web» está en 'Más' y sólo la ve un administrador", () => {
    expect(mobileMoreItems.map((i) => i.href)).toContain("/sitio-web")
    expect(visibleNavItems(navItems, "ADMIN").map((i) => i.href)).toContain(
      "/sitio-web"
    )
    for (const role of ["EMPLOYEE", undefined]) {
      expect(visibleNavItems(navItems, role).map((i) => i.href)).not.toContain(
        "/sitio-web"
      )
    }
  })
})
