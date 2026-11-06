import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const resolveHost = vi.fn()
vi.mock("@/lib/api", () => ({ resolveHost: (h: string) => resolveHost(h) }))

import { clearHostCache } from "@/lib/host-cache"
import {
  BROWSE_LIMIT_MAX,
  clearRateLimit,
  RATE_LIMIT_MAX,
} from "@/lib/rate-limit"

import { config, proxy } from "./proxy"

const TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ0eXAiOiJzaXRlIn0.firma-del-token_123"

const rewriteOf = (response: Response) =>
  response.headers
    .get("x-middleware-rewrite")
    ?.replace("http://localhost", "")
    // `/` queda como `/s/<sitio>/`: Next lo normaliza igual.
    .replace(/\/(\?|$)/, "$1")

function request(url: string, host?: string, ip?: string) {
  return new NextRequest(`http://localhost${url}`, {
    headers: {
      ...(host ? { host } : {}),
      ...(ip ? { "x-forwarded-for": ip } : {}),
    },
  })
}

describe("proxy", () => {
  beforeEach(() => {
    clearHostCache()
    clearRateLimit()
    resolveHost.mockReset()
    vi.unstubAllEnvs()
  })

  it("por host reescribe a /s/h~slug y conserva el resto de la ruta y la query", async () => {
    resolveHost.mockResolvedValue({ status: "found", slug: "mi-inmo" })
    const response = await proxy(
      request("/propiedades/abc?operation=SALE", "mi-inmo.sites.test")
    )
    expect(rewriteOf(response)).toBe(
      "/s/h~mi-inmo~mi-inmo.sites.test/propiedades/abc?operation=SALE"
    )
    expect(resolveHost).toHaveBeenCalledWith("mi-inmo.sites.test")
  })

  it("un host imposible se descarta sin llamar a la API", async () => {
    vi.stubEnv("SITES_BASE_DOMAIN", "sites.test")
    for (const host of [
      "192.168.0.1",
      "localhost:3003",
      "a.b.sites.test",
      "ab.sites.test",
      "sites.test",
      "sin-punto",
      "a_b.com",
    ]) {
      const response = await proxy(request("/", host))
      expect(rewriteOf(response)).toBe("/s/nf")
    }
    expect(resolveHost).not.toHaveBeenCalled()
  })

  it("un subdominio o un dominio propio con forma válida sí se consulta", async () => {
    vi.stubEnv("SITES_BASE_DOMAIN", "sites.test")
    resolveHost.mockResolvedValue({ status: "missing" })
    await proxy(request("/", "mi-inmo.sites.test"))
    await proxy(request("/", "www.otra-inmo.com.ar"))
    expect(resolveHost.mock.calls.map(([h]) => h)).toEqual([
      "mi-inmo.sites.test",
      "www.otra-inmo.com.ar",
    ])
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
    expect(rewriteOf(response)).toBe("/s/h~mi-inmo~mi-inmo.sites.test")
  })

  it("la vista previa responde con Cache-Control: no-store y el sitio público no", async () => {
    resolveHost.mockResolvedValue({ status: "found", slug: "mi-inmo" })
    const preview = await proxy(
      request(`/propiedades?preview=${TOKEN}`, "mi-inmo.sites.test")
    )
    expect(preview.headers.get("cache-control")).toBe("no-store")
    const pub = await proxy(request("/propiedades", "mi-inmo.sites.test"))
    expect(pub.headers.get("cache-control")).toBeNull()
  })

  it("?preview= solo vale en las rutas del sitio; en el resto se ignora", async () => {
    resolveHost.mockResolvedValue({ status: "found", slug: "mi-inmo" })
    for (const path of ["/propiedades/abc123", "/nosotros", "/contacto", "/"]) {
      const r = await proxy(
        request(`${path}?preview=${TOKEN}`, "mi-inmo.sites.test")
      )
      expect(rewriteOf(r)).toMatch(/^\/p\/hp~mi-inmo~/)
    }
    for (const path of [
      "/cualquier/cosa",
      "/propiedades/a/b",
      "/sitemap.xml",
    ]) {
      const r = await proxy(
        request(`${path}?preview=${TOKEN}`, "mi-inmo.sites.test")
      )
      expect(rewriteOf(r)).toMatch(/^\/s\/h~mi-inmo~/)
    }
  })

  it("en producción ?preview= en una ruta no permitida no abre el acceso por slug", async () => {
    vi.stubEnv("NODE_ENV", "production")
    const r = await proxy(request(`/_s/mi-inmo/otra?preview=${TOKEN}`))
    expect(rewriteOf(r)).toBe("/s/nf")
  })

  it("un token que no es un JWT de tres segmentos se ignora", async () => {
    resolveHost.mockResolvedValue({ status: "found", slug: "mi-inmo" })
    for (const bad of [
      "a".repeat(30),
      "aaaaaaaaaa.bbbbbbbbbbbb",
      "aaaaaaaa.bbbbbbbb.cccccccc.dddddddd",
      "aaaa.bbbb.cc cc",
    ]) {
      const r = await proxy(
        request(`/?preview=${encodeURIComponent(bad)}`, "mi-inmo.sites.test")
      )
      expect(rewriteOf(r)).toBe("/s/h~mi-inmo~mi-inmo.sites.test")
    }
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

  it("una IP que inventa hosts recibe 429 al pasar el cupo, sin llamar más a la API", async () => {
    resolveHost.mockResolvedValue({ status: "missing" })
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      await proxy(request("/", `bot-${i}.com`, "203.0.113.9"))
    }
    expect(resolveHost).toHaveBeenCalledTimes(RATE_LIMIT_MAX)
    const limited = await proxy(request("/", "bot-x.com", "203.0.113.9"))
    expect(limited.status).toBe(429)
    expect(limited.headers.get("retry-after")).toBe("60")
    expect(resolveHost).toHaveBeenCalledTimes(RATE_LIMIT_MAX)
    // Otro visitante sigue entrando.
    const other = await proxy(request("/", "bot-y.com", "198.51.100.7"))
    expect(other.status).not.toBe(429)
  })

  it("lo cacheado no gasta cupo: un sitio real se sigue sirviendo", async () => {
    resolveHost.mockResolvedValue({ status: "found", slug: "mi-inmo" })
    for (let i = 0; i < RATE_LIMIT_MAX + 10; i++) {
      const r = await proxy(request("/", "mi-inmo.sites.test", "203.0.113.9"))
      expect(r.status).not.toBe(429)
    }
  })

  it("la vista previa cuenta contra el cupo por IP", async () => {
    resolveHost.mockResolvedValue({ status: "found", slug: "mi-inmo" })
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      await proxy(
        request(`/?preview=${TOKEN}`, "mi-inmo.sites.test", "203.0.113.9")
      )
    }
    const limited = await proxy(
      request(`/?preview=${TOKEN}`, "mi-inmo.sites.test", "203.0.113.9")
    )
    expect(limited.status).toBe(429)
  })

  it("el matcher cubre /s y /p aunque la ruta tenga extensión", () => {
    expect(config.matcher).toEqual(
      expect.arrayContaining(["/s/:path*", "/p/:path*"])
    )
  })

  it("fichas y favoritos (URL que arma el visitante) tienen su propio tope por IP", async () => {
    resolveHost.mockResolvedValue({ status: "found", slug: "mi-inmo" })
    for (let i = 0; i < BROWSE_LIMIT_MAX; i++) {
      const r = await proxy(
        request(`/propiedades/id-${i}`, "mi-inmo.sites.test", "203.0.113.9")
      )
      expect(r.status).not.toBe(429)
    }
    const limited = await proxy(
      request("/api/favoritos?ids=x", "mi-inmo.sites.test", "203.0.113.9")
    )
    expect(limited.status).toBe(429)
    // La home (fija y cacheada) no cuenta.
    const home = await proxy(request("/", "mi-inmo.sites.test", "203.0.113.9"))
    expect(home.status).not.toBe(429)
  })
})
