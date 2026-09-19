import { describe, expect, it } from "vitest"

import { isActivePath } from "./navigation"

describe("isActivePath", () => {
  it("marca la sección y sus subrutas", () => {
    expect(isActivePath("/propiedades", "/propiedades")).toBe(true)
    expect(isActivePath("/propiedades/123", "/propiedades")).toBe(true)
  })

  it("no confunde rutas con el mismo prefijo", () => {
    expect(isActivePath("/propietarios", "/propiedades")).toBe(false)
    expect(isActivePath("/propiedadesx", "/propiedades")).toBe(false)
  })
})
