import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { UpstreamError } from "@/lib/api"
import { makeSite, PROPERTY } from "@/test-fixtures"

const api = vi.hoisted(() => ({
  getSite: vi.fn(),
  getProperties: vi.fn(),
}))

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  ...api,
}))

import { GET } from "./route"

const params = Promise.resolve({ site: "d~demo" })
const request = () =>
  new NextRequest("http://localhost:3003/_s/demo/sitemap.xml")
const page = (totalPages: number, ids: string[]) => ({
  data: ids.map((id) => ({ ...PROPERTY, id })),
  pagination: { page: 1, total: ids.length, totalPages },
})

const FAILURES: [string, UpstreamError][] = [
  ["red caída o timeout", new UpstreamError("sin respuesta", null)],
  ["un 500", new UpstreamError("La API respondió 500", 500)],
  ["un 429", new UpstreamError("La API respondió 429", 429)],
]

beforeEach(() => {
  vi.resetAllMocks()
  api.getSite.mockResolvedValue(makeSite())
})

describe("sitemap.xml", () => {
  it("lista las fichas de todas las páginas", async () => {
    api.getProperties
      .mockResolvedValueOnce(page(2, ["a"]))
      .mockResolvedValueOnce(page(2, ["b"]))
    const response = await GET(request(), { params })
    expect(response.status).toBe(200)
    const xml = await response.text()
    expect(xml).toContain("/propiedades/a")
    expect(xml).toContain("/propiedades/b")
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=3600")
  })

  it("un sitio sin propiedades da un sitemap válido (no es una falla)", async () => {
    api.getProperties.mockResolvedValue(page(0, []))
    const response = await GET(request(), { params })
    expect(response.status).toBe(200)
    expect(await response.text()).toContain("/propiedades")
  })

  it.each(FAILURES)(
    "si falla el sitio por %s: 503 sin caché",
    async (_label, failure) => {
      api.getSite.mockRejectedValue(failure)
      const response = await GET(request(), { params })
      expect(response.status).toBe(503)
      expect(response.headers.get("Cache-Control")).toBe("no-store")
      expect(response.headers.get("Retry-After")).toBeTruthy()
    }
  )

  it.each(FAILURES)(
    "si falla la primera página de fichas por %s: 503, no un sitemap sin fichas",
    async (_label, failure) => {
      api.getProperties.mockRejectedValue(failure)
      const response = await GET(request(), { params })
      expect(response.status).toBe(503)
      expect(response.headers.get("Cache-Control")).toBe("no-store")
    }
  )

  it("si falla una página posterior: 503, no un sitemap incompleto", async () => {
    api.getProperties
      .mockResolvedValueOnce(page(3, ["a"]))
      .mockResolvedValueOnce(page(3, ["b"]))
      .mockRejectedValueOnce(new UpstreamError("La API respondió 500", 500))
    const response = await GET(request(), { params })
    expect(response.status).toBe(503)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
  })

  it("404 solo cuando la API confirma que el sitio no existe", async () => {
    api.getSite.mockResolvedValue(null)
    expect((await GET(request(), { params })).status).toBe(404)
    api.getSite.mockResolvedValue(makeSite())
    api.getProperties.mockResolvedValue(null)
    expect((await GET(request(), { params })).status).toBe(404)
  })

  it("un error que no es de la API no se disfraza de 503", async () => {
    api.getSite.mockRejectedValue(new TypeError("bug"))
    await expect(GET(request(), { params })).rejects.toThrow("bug")
  })
})
