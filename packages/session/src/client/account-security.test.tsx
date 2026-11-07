import { renderHook } from "@testing-library/react"
import { AxiosError, type AxiosInstance } from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"

const signOut = vi.fn().mockResolvedValue(undefined)
vi.mock("./session-provider", () => ({ useSession: () => ({ signOut }) }))

import { useAccountSecurity } from "./account-security"

const post = vi.fn()
const client = { post } as unknown as AxiosInstance

beforeEach(() => {
  post.mockReset()
  signOut.mockClear()
})

describe("useAccountSecurity", () => {
  it("cambia la contraseña y cierra la sesión local", async () => {
    post.mockResolvedValue({ data: {} })
    const { result } = renderHook(() => useAccountSecurity(client, "/login"))

    const message = await result.current.changePassword({
      currentPassword: "a",
      newPassword: "b",
    })

    expect(message).toBeNull()
    expect(post).toHaveBeenCalledWith(
      "/auth/change-password",
      { currentPassword: "a", newPassword: "b" },
      { skipAuthRefresh: true }
    )
    expect(signOut).toHaveBeenCalledWith("/login")
  })

  it("devuelve el mensaje de la API y no cierra la sesión si falla", async () => {
    post.mockRejectedValue(
      new AxiosError("x", "400", undefined, null, {
        status: 400,
        statusText: "",
        headers: {},
        config: {} as never,
        data: { message: "La contraseña actual es incorrecta." },
      })
    )
    const { result } = renderHook(() => useAccountSecurity(client, "/login"))

    const message = await result.current.changePassword({
      currentPassword: "a",
      newPassword: "b",
    })

    expect(message).toBe("La contraseña actual es incorrecta.")
    expect(signOut).not.toHaveBeenCalled()
  })

  it("cierra todas las sesiones y sale", async () => {
    post.mockResolvedValue({ data: {} })
    const { result } = renderHook(() => useAccountSecurity(client, "/login"))

    expect(await result.current.logoutAll()).toBeNull()
    expect(post).toHaveBeenCalledWith("/auth/logout-all")
    expect(signOut).toHaveBeenCalledWith("/login")
  })
})
