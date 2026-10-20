// @vitest-environment node
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { decodeBranding } from "./cookies"
import { createSessionRoutes, secondsUntilExpiry } from "./session-routes"

const ORIGIN = "http://localhost:3001"
const API = "http://api.test/api/v1"

/** JWT sin firma válida: sólo importa el `exp`, que es lo que lee la ruta. */
function fakeJwt(exp: number): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url")
  return `${encode({ alg: "HS256" })}.${encode({ exp })}.firma`
}

const inOneWeek = () => Math.floor(Date.now() / 1000) + 7 * 24 * 3600

function request(
  path: string,
  init: { method: string; body?: unknown; cookie?: string; origin?: string }
) {
  return new NextRequest(`${ORIGIN}${path}`, {
    method: init.method,
    headers: {
      origin: init.origin ?? ORIGIN,
      ...(init.cookie ? { cookie: init.cookie } : {}),
      "content-type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
}

function apiResponds(status: number, data: unknown) {
  return new Response(JSON.stringify({ success: status < 400, data }), {
    status,
    headers: { "content-type": "application/json" },
  })
}

const routes = createSessionRoutes({
  cookiePrefix: "bo",
  apiUrl: API,
  storeBranding: true,
})

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe("POST /api/session (guardar la sesión del login)", () => {
  it("guarda el refresh token en una cookie httpOnly y la marca de la inmobiliaria", async () => {
    const refreshToken = fakeJwt(inOneWeek())
    fetchMock.mockResolvedValue(
      apiResponds(200, {
        id: "t1",
        name: "Inmobiliaria Demo",
        slug: "demo",
        logoUrl: null,
        primaryColor: "#1f4e79",
      })
    )

    const response = await routes.start(
      request("/api/session", {
        method: "POST",
        body: { accessToken: "access", refreshToken },
      })
    )

    expect(response.status).toBe(200)
    const cookie = response.cookies.get("bo_rt")
    expect(cookie?.value).toBe(refreshToken)
    expect(cookie?.httpOnly).toBe(true)
    expect(cookie?.sameSite).toBe("lax")
    expect(cookie?.maxAge).toBeGreaterThan(6 * 24 * 3600)
    expect(decodeBranding(response.cookies.get("bo_brand")?.value)).toEqual({
      name: "Inmobiliaria Demo",
      logoUrl: null,
      primaryColor: "#1f4e79",
    })
    // La marca se pide con el access token recién emitido.
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe(`${API}/tenants/current`)
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      "Bearer access"
    )
  })

  it("rechaza un pedido desde otro sitio (login CSRF)", async () => {
    const response = await routes.start(
      request("/api/session", {
        method: "POST",
        origin: "https://evil.example",
        body: { accessToken: "a", refreshToken: "r" },
      })
    )

    expect(response.status).toBe(403)
    expect(response.cookies.get("bo_rt")).toBeUndefined()
  })

  it("rechaza un cuerpo sin tokens", async () => {
    const response = await routes.start(
      request("/api/session", { method: "POST", body: { accessToken: "a" } })
    )

    expect(response.status).toBe(400)
  })
})

describe("POST /api/session/refresh", () => {
  it("rota: guarda el refresh token nuevo y devuelve sólo el access token", async () => {
    const rotated = fakeJwt(inOneWeek())
    fetchMock.mockResolvedValue(
      apiResponds(200, {
        accessToken: "access-nuevo",
        refreshToken: rotated,
        tokenType: "Bearer",
        expiresIn: 900,
      })
    )

    const response = await routes.refresh(
      request("/api/session/refresh", {
        method: "POST",
        cookie: "bo_rt=viejo; bo_brand=marca",
      })
    )

    expect(await response.json()).toEqual({
      accessToken: "access-nuevo",
      expiresIn: 900,
    })
    expect(response.cookies.get("bo_rt")?.value).toBe(rotated)
    expect(response.cookies.get("bo_brand")?.value).toBe("marca")
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe(`${API}/auth/refresh`)
    expect(JSON.parse(init?.body as string)).toEqual({ refreshToken: "viejo" })
  })

  it("sin cookie responde 401 sin llamar a la API", async () => {
    const response = await routes.refresh(
      request("/api/session/refresh", { method: "POST" })
    )

    expect(response.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("si la API rechaza el refresh token, borra las cookies", async () => {
    fetchMock.mockResolvedValue(
      apiResponds(401, { code: "REFRESH_TOKEN_REUSED" })
    )

    const response = await routes.refresh(
      request("/api/session/refresh", {
        method: "POST",
        cookie: "bo_rt=robado; bo_brand=marca",
      })
    )

    expect(response.status).toBe(401)
    expect(response.cookies.get("bo_rt")?.value).toBe("")
    expect(response.cookies.get("bo_brand")?.value).toBe("")
  })

  it("si la API no responde, no borra la sesión", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"))

    const response = await routes.refresh(
      request("/api/session/refresh", {
        method: "POST",
        cookie: "bo_rt=vigente",
      })
    )

    expect(response.status).toBe(502)
    expect(response.cookies.get("bo_rt")).toBeUndefined()
  })
})

describe("DELETE /api/session (logout)", () => {
  it("revoca el refresh token en la API y borra las cookies", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    const response = await routes.end(
      request("/api/session", { method: "DELETE", cookie: "bo_rt=actual" })
    )

    expect(response.status).toBe(204)
    expect(response.cookies.get("bo_rt")?.value).toBe("")
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe(`${API}/auth/logout`)
    expect(JSON.parse(init?.body as string)).toEqual({ refreshToken: "actual" })
  })

  it("cierra la sesión aunque la API esté caída", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"))

    const response = await routes.end(
      request("/api/session", { method: "DELETE", cookie: "bo_rt=actual" })
    )

    expect(response.status).toBe(204)
    expect(response.cookies.get("bo_rt")?.value).toBe("")
  })
})

describe("secondsUntilExpiry", () => {
  it("lee el exp del JWT", () => {
    const now = Date.UTC(2026, 8, 19)
    expect(secondsUntilExpiry(fakeJwt(now / 1000 + 3600), now)).toBe(3600)
  })

  it("con un token ilegible usa 7 días", () => {
    expect(secondsUntilExpiry("no-es-un-jwt")).toBe(7 * 24 * 3600)
  })
})
