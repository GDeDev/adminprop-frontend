import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const resolveHost = vi.fn()
vi.mock("@/lib/api", () => ({ resolveHost: (h: string) => resolveHost(h) }))

import { clearHostCache } from "@/lib/host-cache"

import { proxy } from "./proxy"

const TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ0eXAiOiJzaXRlIn0.firma-del-token_123"

const rewriteOf = (response: Response) =>
  response.headers
    .get("x-middleware-rewrite")
    ?.replace("http://localhost", "")
    // `/` queda como `/s/<sitio>/`: Next lo normaliza igual.
    .replace(/\/(\?|$)/, "$1")

function request(url: string, host?: string) {
  return new NextRequest(`http://localhost${url}`, {
    headers: host ? { host } : {},
  })
}

describe("proxy", () => {
  beforeEach(() => {
    clearHostCache()
    resolveHost.mockReset()
    vi.unstubAllEnvs()
  })

  it("por host reescribe a /s/h~slug y conserva el resto de la ruta y la query", async () => {
    resolveHost.mockResolvedValue({ status: "found", slug: "mi-inmo" })
    const response = await proxy(
      request("/propiedades/abc?operation=SALE", "mi-inmo.sites.test")
    )
    expect(rewriteOf(response)).toBe(
      "/s/h~mi-inmo/propiedades/abc?operation=SALE"
    )
    expect(resolveHost).toHaveBeenCalledWith("mi-inmo.sites.test")
  })

  it("un host desconocido es 404 interno", async () => {
    resolveHost.mockResolvedValue({ status: "missing" })
    const response = await proxy(request("/", "nadie.com"))
    expect(rewriteOf(response)).toBe("/s/nf")
  })

  it("si la API no responde, es un 503 con Retry-After (no un 404 que se cachee)", async () => {
    resolveHost.mockResolvedValue({ status: "error" })
    const response = await proxy(request("/", "caida.sites.test"))
    expect(response.status).toBe(503)
    expect(response.headers.get("retry-after")).toBe("10")
    expect(response.headers.get("x-middleware-rewrite")).toBeNull()
  })

  it("el acceso por slug funciona en desarrollo", async () => {
    vi.stubEnv("NODE_ENV", "development")
    const response = await proxy(request("/_s/mi-inmo/contacto"))
    expect(rewriteOf(response)).toBe("/s/d~mi-inmo/contacto")
    expect(resolveHost).not.toHaveBeenCalled()
  })

  it("en producción el acceso por slug se cierra, salvo la vista previa o si se habilita", async () => {
    vi.stubEnv("NODE_ENV", "production")
    expect(rewriteOf(await proxy(request("/_s/mi-inmo")))).toBe("/s/nf")

    const preview = await proxy(
      request(`/_s/mi-inmo/propiedades?preview=${TOKEN}&x=1`)
    )
    expect(rewriteOf(preview)).toBe(`/p/dp~mi-inmo~${TOKEN}/propiedades?x=1`)

    vi.stubEnv("SITES_ALLOW_SLUG_PATH", "true")
    expect(rewriteOf(await proxy(request("/_s/mi-inmo")))).toBe("/s/d~mi-inmo")
  })

  it("la vista previa viaja en la ruta y no en la query", async () => {
    resolveHost.mockResolvedValue({ status: "found", slug: "mi-inmo" })
    const response = await proxy(
      request(`/?preview=${TOKEN}`, "mi-inmo.sites.test")
    )
    expect(rewriteOf(response)).toBe(`/p/hp~mi-inmo~${TOKEN}`)
  })

  it("un token con formato inválido se ignora", async () => {
    resolveHost.mockResolvedValue({ status: "found", slug: "mi-inmo" })
    const response = await proxy(
      request("/?preview=../../etc", "mi-inmo.sites.test")
    )
    expect(rewriteOf(response)).toBe("/s/h~mi-inmo")
  })

  it("nadie entra directo al árbol interno /s/…", async () => {
    for (const path of [
      "/s",
      "/s/h~mi-inmo",
      "/s/d~mi-inmo/propiedades",
      "/p/hp~x",
      "/p",
    ]) {
      expect(rewriteOf(await proxy(request(path, "mi-inmo.sites.test")))).toBe(
        "/s/nf"
      )
    }
  })

  it("un slug inválido en /_s no pasa", async () => {
    vi.stubEnv("NODE_ENV", "development")
    expect(rewriteOf(await proxy(request("/_s/Mi Inmo/x")))).toBe("/s/nf")
  })
})
