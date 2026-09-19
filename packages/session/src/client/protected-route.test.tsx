import { render, screen, waitFor } from "@testing-library/react"
import type { AxiosInstance } from "axios"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { User } from "@adminprop/shared-types"

import { ProtectedRoute } from "./protected-route"
import { SessionProvider } from "./session-provider"
import { tokenStore } from "./token-store"

const USER: User = {
  id: "u1",
  tenantId: "t1",
  email: "ana@demo.local",
  firstName: "Ana",
  lastName: "Gómez",
  role: "EMPLOYEE",
  isActive: true,
  lastLoginAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
}

const fetchMock = vi.fn<typeof fetch>()
const navigate = vi.fn()

function apiClientReturning(user: User): AxiosInstance {
  return {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: user } }),
  } as unknown as AxiosInstance
}

function renderProtected(user: User, allow?: (user: User) => boolean) {
  return render(
    <SessionProvider apiClient={apiClientReturning(user)} loginPath="/login">
      <ProtectedRoute
        loginPath="/login"
        fallback={<p>Cargando…</p>}
        renderError={() => <p>Sin conexión</p>}
        allow={allow}
        navigate={navigate}
      >
        <p>Contenido privado</p>
      </ProtectedRoute>
    </SessionProvider>
  )
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
  window.history.replaceState(null, "", "/propiedades?page=2")
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
  navigate.mockReset()
  tokenStore.clear()
})

describe("ProtectedRoute", () => {
  it("al recargar recupera la sesión con la cookie y muestra el contenido", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ accessToken: "a", expiresIn: 900 }))
    )

    renderProtected(USER)

    expect(screen.getByText("Cargando…")).toBeInTheDocument()
    expect(await screen.findByText("Contenido privado")).toBeInTheDocument()
    expect(tokenStore.get()).toBe("a")
  })

  it("sin sesión manda al login recordando la ruta", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }))

    renderProtected(USER)

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        "/login?next=%2Fpropiedades%3Fpage%3D2"
      )
    )
    expect(screen.queryByText("Contenido privado")).not.toBeInTheDocument()
  })

  it("con sesión de otro tipo de usuario tampoco muestra el contenido", async () => {
    tokenStore.set("a")

    renderProtected({ ...USER, role: "RENTER" }, (u) => u.role === "OWNER")

    await waitFor(() => expect(navigate).toHaveBeenCalled())
    expect(screen.queryByText("Contenido privado")).not.toBeInTheDocument()
  })

  it("si no hay conexión muestra el error en vez de echar al usuario", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"))

    renderProtected(USER)

    expect(await screen.findByText("Sin conexión")).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })
})
