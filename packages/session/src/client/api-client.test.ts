import {
  AxiosError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from "axios"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createApiClient, safeNextPath } from "./api-client"
import { tokenStore } from "./token-store"

/** Adapter falso: responde según el token que llegó, sin red. */
function adapterFor(
  respond: (config: InternalAxiosRequestConfig) => number
): AxiosAdapter {
  return async (config) => {
    const status = respond(config)
    const response = { data: {}, status, statusText: "", headers: {}, config }
    if (status >= 400) {
      throw new AxiosError("error", String(status), config, null, response)
    }
    return response
  }
}

const bearer = (config: InternalAxiosRequestConfig) =>
  String(config.headers.Authorization ?? "")

const fetchMock = vi.fn<typeof fetch>()
const onUnauthenticated = vi.fn()

function refreshResponds(status: number, accessToken = "nuevo") {
  fetchMock.mockImplementation(
    async () =>
      new Response(JSON.stringify({ accessToken, expiresIn: 900 }), {
        status,
      })
  )
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
  onUnauthenticated.mockReset()
  tokenStore.clear()
})

describe("createApiClient", () => {
  const client = createApiClient({
    baseURL: "http://api.test",
    onUnauthenticated,
  })

  it("manda el access token de memoria como Bearer", async () => {
    tokenStore.set("token-123")
    const adapter = vi.fn(adapterFor(() => 200))

    await client.get("/properties", { adapter })

    expect(bearer(adapter.mock.calls[0]![0])).toBe("Bearer token-123")
  })

  it("ante un 401 refresca en silencio y reintenta con el token nuevo", async () => {
    tokenStore.set("vencido")
    refreshResponds(200, "nuevo")
    const adapter = vi.fn(
      adapterFor((config) => (bearer(config) === "Bearer nuevo" ? 200 : 401))
    )

    const response = await client.get("/properties", { adapter })

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith("/api/session/refresh", {
      method: "POST",
      credentials: "same-origin",
    })
    expect(tokenStore.get()).toBe("nuevo")
    expect(onUnauthenticated).not.toHaveBeenCalled()
  })

  it("varios 401 a la vez comparten un solo refresh", async () => {
    // Dos refresh en paralelo mandarían el mismo refresh token dos veces, y
    // la API lo toma como robo: cierra todas las sesiones.
    tokenStore.set("vencido")
    refreshResponds(200, "nuevo")
    const adapter = adapterFor((config) =>
      bearer(config) === "Bearer nuevo" ? 200 : 401
    )

    await Promise.all([
      client.get("/a", { adapter }),
      client.get("/b", { adapter }),
      client.get("/c", { adapter }),
    ])

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("si el refresh falla, avisa que no hay sesión (redirect al login)", async () => {
    tokenStore.set("vencido")
    refreshResponds(401)

    await expect(
      client.get("/properties", { adapter: adapterFor(() => 401) })
    ).rejects.toBeInstanceOf(AxiosError)

    expect(onUnauthenticated).toHaveBeenCalledTimes(1)
    expect(tokenStore.get()).toBeNull()
  })

  it("si el reintento vuelve a dar 401, no entra en loop", async () => {
    refreshResponds(200, "nuevo")

    await expect(
      client.get("/properties", { adapter: adapterFor(() => 401) })
    ).rejects.toBeInstanceOf(AxiosError)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(onUnauthenticated).toHaveBeenCalledTimes(1)
  })

  it("sin red para refrescar no echa al usuario", async () => {
    tokenStore.set("vencido")
    fetchMock.mockRejectedValue(new TypeError("fetch failed"))

    await expect(
      client.get("/properties", { adapter: adapterFor(() => 401) })
    ).rejects.toBeInstanceOf(AxiosError)

    expect(onUnauthenticated).not.toHaveBeenCalled()
  })

  it("un 401 del login (credenciales inválidas) no refresca ni redirige", async () => {
    await expect(
      client.post(
        "/auth/login",
        {},
        { adapter: adapterFor(() => 401), skipAuthRefresh: true }
      )
    ).rejects.toBeInstanceOf(AxiosError)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(onUnauthenticated).not.toHaveBeenCalled()
  })

  it("otros errores pasan de largo", async () => {
    await expect(
      client.get("/properties", { adapter: adapterFor(() => 500) })
    ).rejects.toBeInstanceOf(AxiosError)

    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe("safeNextPath", () => {
  it("acepta rutas de la app", () => {
    expect(safeNextPath("/propiedades?page=2", "/dashboard")).toBe(
      "/propiedades?page=2"
    )
  })

  it("descarta URLs de otros sitios (open redirect)", () => {
    for (const next of ["https://evil.example", "//evil.example", "evil"]) {
      expect(safeNextPath(next, "/dashboard")).toBe("/dashboard")
    }
  })

  it("descarta las rutas de la API de la app y la ausencia de next", () => {
    expect(safeNextPath("/api/session", "/dashboard")).toBe("/dashboard")
    expect(safeNextPath(null, "/dashboard")).toBe("/dashboard")
  })
})
