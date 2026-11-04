import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { POST } from "./route"

const params = (site = "d~demo") => ({ params: Promise.resolve({ site }) })

function post(headers: Record<string, string>, body: unknown = valid) {
  return new NextRequest("http://localhost:3003/_s/demo/api/contacto", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost:3003",
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

const valid = {
  name: "Ana",
  email: "ana@mail.com",
  phone: "",
  message: "Hola",
  website: "",
  propertyId: null,
}

describe("POST /api/contacto", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://api.test/api/v1")
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it("Origin: null (documento sandboxeado) es un 403 y no un 500", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const response = await POST(post({ origin: "null" }), params())

    expect(response.status).toBe(403)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("un Origin ilegible tampoco rompe", async () => {
    const response = await POST(
      post({ origin: "esto no es una url" }),
      params()
    )
    expect(response.status).toBe(403)
  })

  it("otro origen es 403", async () => {
    const response = await POST(post({ origin: "https://evil.test" }), params())
    expect(response.status).toBe(403)
  })

  it("el propio origen reenvía a la API con la IP confiable", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 201 }))

    const response = await POST(
      post({
        origin: "http://localhost:3003",
        "x-forwarded-for": "6.6.6.6, 203.0.113.9",
      }),
      params()
    )

    expect(response.status).toBe(201)
    const [url, init] = fetchSpy.mock.calls[0] ?? []
    expect(url).toBe("http://api.test/api/v1/public/demo/contact")
    expect((init as RequestInit).headers).toMatchObject({
      "X-Forwarded-For": "203.0.113.9",
    })
  })

  it("sin Origin (no es un navegador) se acepta", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 201 })
    )
    expect((await POST(post({}), params())).status).toBe(201)
  })

  it("la vista previa no envía", async () => {
    const token = "t".repeat(30)
    const response = await POST(post({}), params(`dp~demo~${token}`))
    expect(response.status).toBe(403)
  })
})
