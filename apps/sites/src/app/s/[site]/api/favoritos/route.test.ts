import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { GET } from "./route"

const ID = "11111111-1111-4111-8111-111111111111"
const params = (site = "d~demo") => ({ params: Promise.resolve({ site }) })
const call = (query: string, site?: string) =>
  GET(
    new NextRequest(`http://localhost:3003/_s/demo/api/favoritos${query}`),
    params(site)
  )

describe("GET /api/favoritos", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://api.test/api/v1")
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it("sin ids válidos no llama a la API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const response = await call("?ids=x,<script>,1;2")
    expect(await response.json()).toEqual({ data: [] })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("solo reenvía los UUID y no se cachea", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({ success: true, data: { data: [{ id: ID }] } }),
          { status: 200 }
        )
      )
    const response = await call(`?ids=${ID},nope`)
    expect(await response.json()).toEqual({ data: [{ id: ID }] })
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    const url = String(fetchSpy.mock.calls[0]?.[0])
    expect(url).toContain("/public/demo/properties")
    expect(url).toContain(`ids=${ID}`)
    expect(url).not.toContain("nope")
  })

  it("un segmento de sitio inválido es 404 y una falla de la API es 502", async () => {
    expect((await call(`?ids=${ID}`, "basura")).status).toBe(404)
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("boom", { status: 500 })
    )
    expect((await call(`?ids=${ID}`)).status).toBe(502)
  })
})
