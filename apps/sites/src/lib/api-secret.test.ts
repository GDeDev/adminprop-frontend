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

  it("lo manda al resolver el host (sin caché)", async () => {
    await resolveHost("demo.example.com")
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.headers).toEqual({ "X-Sites-Secret": "s3cret" })
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
