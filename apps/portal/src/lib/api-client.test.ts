import {
  AxiosError,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from "axios"
import { afterEach, describe, expect, it, vi } from "vitest"

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

function at(pathname: string) {
  vi.stubGlobal("location", { pathname, assign })
}

afterEach(() => {
  vi.unstubAllGlobals()
  assign.mockReset()
  setAccessToken(null)
})

describe("apiClient del portal", () => {
  it("manda el access token como Bearer", async () => {
    at("/propietario/cuenta")
    setAccessToken("token-123")
    const adapter = vi.fn(respondWith(200))

    await apiClient.get("/owners/me", { adapter })

    expect(adapter.mock.calls[0]![0].headers.Authorization).toBe(
      "Bearer token-123"
    )
  })

  it.each([
    ["/propietario/liquidaciones", "/propietario/login"],
    ["/inquilino/pagos", "/inquilino/login"],
  ])("un 401 en %s manda a %s", async (pathname, loginPath) => {
    at(pathname)
    setAccessToken("vencido")

    await expect(
      apiClient.get("/me", { adapter: respondWith(401) })
    ).rejects.toBeInstanceOf(AxiosError)

    expect(getAccessToken()).toBeNull()
    expect(assign).toHaveBeenCalledWith(loginPath)
  })

  it.each(["/", "/propiedades/abc", "/propietario/login"])(
    "un 401 en %s no redirige (sitio público o ya en el login)",
    async (pathname) => {
      at(pathname)

      await expect(
        apiClient.get("/me", { adapter: respondWith(401) })
      ).rejects.toBeInstanceOf(AxiosError)

      expect(assign).not.toHaveBeenCalled()
    }
  )
})
