import {
  AxiosError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from "axios"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { apiClient } from "./api-client"
import { getAccessToken, setAccessToken } from "./auth-token"

/** Adapter falso: responde con `status` sin tocar la red. */
function respondWith(status: number): AxiosAdapter {
  return async (config: InternalAxiosRequestConfig) => {
    const response = {
      data: {},
      status,
      statusText: String(status),
      headers: {},
      config,
    }
    if (status >= 400) {
      throw new AxiosError("error", String(status), config, null, response)
    }
    return response
  }
}

const assign = vi.fn()

beforeEach(() => {
  vi.stubGlobal("location", { pathname: "/propiedades", assign })
})

afterEach(() => {
  vi.unstubAllGlobals()
  assign.mockReset()
  setAccessToken(null)
})

describe("apiClient", () => {
  it("manda el access token como Bearer", async () => {
    setAccessToken("token-123")
    const adapter = vi.fn(respondWith(200))

    await apiClient.get("/health", { adapter })

    const config = adapter.mock.calls[0]![0]
    expect(config.headers.Authorization).toBe("Bearer token-123")
  })

  it("sin token no manda Authorization", async () => {
    const adapter = vi.fn(respondWith(200))

    await apiClient.get("/health", { adapter })

    expect(adapter.mock.calls[0]![0].headers.Authorization).toBeUndefined()
  })

  it("ante un 401 borra el token y manda al login", async () => {
    setAccessToken("vencido")

    await expect(
      apiClient.get("/properties", { adapter: respondWith(401) })
    ).rejects.toBeInstanceOf(AxiosError)

    expect(getAccessToken()).toBeNull()
    expect(assign).toHaveBeenCalledWith("/login")
  })

  it("en la pantalla de login un 401 no redirige (credenciales inválidas)", async () => {
    vi.stubGlobal("location", { pathname: "/login", assign })

    await expect(
      apiClient.post("/auth/login", {}, { adapter: respondWith(401) })
    ).rejects.toBeInstanceOf(AxiosError)

    expect(assign).not.toHaveBeenCalled()
  })

  it("otros errores no redirigen", async () => {
    await expect(
      apiClient.get("/properties", { adapter: respondWith(500) })
    ).rejects.toBeInstanceOf(AxiosError)

    expect(assign).not.toHaveBeenCalled()
  })
})
