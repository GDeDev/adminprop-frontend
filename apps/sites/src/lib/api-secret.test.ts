vi.mock("next/headers", () => ({
  headers: async () => {
    throw new Error("fuera de un request")
  },
}))

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getSite, resolveHost, trustedServerHeaders } from "./api"
import type { SiteRoute } from "./site-route"

const route = { slug: "demo", previewToken: null } as unknown as SiteRoute

describe("X-Sites-Secret hacia la API", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubEnv("API_URL", "http://api.test/api/v1")
    vi.stubEnv("SITES_SERVER_SECRET", "")
    vi.stubEnv("SITES_REVALIDATE_SECRET", "s3cret")
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { slug: "demo" } }), { status: 200 })
    )
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("lo manda en las lecturas cacheadas (ISR)", async () => {
    await getSite(route)
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.headers).toEqual({ "X-Sites-Secret": "s3cret" })
  })

  it("al resolver el host manda secreto + X-Client-IP del visitante", async () => {
    await resolveHost("demo.example.com", "203.0.113.9")
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.headers).toEqual({
      "X-Sites-Secret": "s3cret",
      "X-Client-IP": "203.0.113.9",
    })
  })

  it("al resolver el host sin IP confiable no manda ninguno de los dos", async () => {
    await resolveHost("demo.example.com")
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.headers).toEqual({})
  })

  it("la vista previa (sin caché) sin request en curso no manda headers", async () => {
    await getSite({
      slug: "demo",
      previewToken: "a.b.c",
    } as unknown as SiteRoute)
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.cache).toBe("no-store")
    expect(init.headers).toEqual({})
  })

  it("SITES_SERVER_SECRET tiene prioridad sobre SITES_REVALIDATE_SECRET", () => {
    vi.stubEnv("SITES_SERVER_SECRET", "server")
    expect(trustedServerHeaders()).toEqual({ "X-Sites-Secret": "server" })
  })

  it("con SITES_SERVER_SECRET vacío cae a SITES_REVALIDATE_SECRET", () => {
    expect(trustedServerHeaders()).toEqual({ "X-Sites-Secret": "s3cret" })
  })

  it("sin secreto configurado no manda el header", () => {
    vi.stubEnv("SITES_REVALIDATE_SECRET", "")
    expect(trustedServerHeaders()).toEqual({})
  })
})
