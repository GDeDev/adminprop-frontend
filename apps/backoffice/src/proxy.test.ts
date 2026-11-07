// @vitest-environment node
import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"

import { config, proxy } from "./proxy"

const request = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost:3001${path}`, {
    headers: cookie ? { cookie } : {},
  })

describe("proxy del backoffice", () => {
  it("sin cookie de sesión manda al login recordando la ruta", () => {
    const response = proxy(request("/propiedades?page=2"))

    expect(response.status).toBe(307)
    const location = new URL(response.headers.get("location")!)
    expect(location.pathname).toBe("/login")
    expect(location.searchParams.get("next")).toBe("/propiedades?page=2")
  })

  it("desde la raíz no agrega next", () => {
    const location = new URL(proxy(request("/")).headers.get("location")!)

    expect(location.search).toBe("")
  })

  it("con la cookie deja pasar (la valida el cliente)", () => {
    const response = proxy(request("/propiedades", "adminprop_bo_rt=token"))

    expect(response.headers.get("location")).toBeNull()
  })

  it("la cookie del portal no sirve para el backoffice", () => {
    const response = proxy(request("/propiedades", "adminprop_portal_rt=token"))

    expect(response.status).toBe(307)
  })
})

describe("matcher del proxy del backoffice", () => {
  const matcher = new RegExp(`^${config.matcher[0]}$`)

  it("no protege el login, la API ni los assets", () => {
    for (const path of [
      "/login",
      "/login/x",
      "/api/session",
      "/api",
      "/logo.png",
    ]) {
      expect(matcher.test(path), path).toBe(false)
    }
  })

  it("sí protege rutas que solo empiezan igual que login o api", () => {
    for (const path of [
      "/apiarios",
      "/login-historial",
      "/apis/x",
      "/propiedades",
    ]) {
      expect(matcher.test(path), path).toBe(true)
    }
  })
})
