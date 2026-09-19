// @vitest-environment node
import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"

import { areaForPath } from "./lib/session"
import { proxy } from "./proxy"

const request = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost:3002${path}`, {
    headers: cookie ? { cookie } : {},
  })

const redirectOf = (path: string, cookie?: string) => {
  const location = proxy(request(path, cookie)).headers.get("location")
  return location ? new URL(location) : null
}

describe("proxy del portal", () => {
  it("sin sesión, cada área manda a su propio login", () => {
    const owner = redirectOf("/propietario/liquidaciones")
    const renter = redirectOf("/inquilino/pagos")

    expect(owner?.pathname).toBe("/propietario/login")
    expect(owner?.searchParams.get("next")).toBe("/propietario/liquidaciones")
    expect(renter?.pathname).toBe("/inquilino/login")
  })

  it("los logins y las páginas públicas no piden sesión", () => {
    expect(redirectOf("/propietario/login")).toBeNull()
    expect(redirectOf("/inquilino/login")).toBeNull()
    expect(redirectOf("/propiedades/123")).toBeNull()
  })

  it("con la cookie del portal deja pasar", () => {
    expect(redirectOf("/inquilino/cuenta", "adminprop_portal_rt=x")).toBeNull()
  })

  it("la cookie del backoffice no sirve en el portal", () => {
    expect(redirectOf("/inquilino/cuenta", "adminprop_bo_rt=x")).not.toBeNull()
  })
})

describe("areaForPath", () => {
  it("reconoce las áreas sin confundir prefijos", () => {
    expect(areaForPath("/propietario")).toBe("owner")
    expect(areaForPath("/inquilino/contrato")).toBe("renter")
    expect(areaForPath("/propietarios-destacados")).toBeNull()
    expect(areaForPath("/")).toBeNull()
  })
})
