import { act, render } from "@testing-library/react"
import type { AxiosInstance } from "axios"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { AuthResult, User } from "@adminprop/shared-types"

import { SessionProvider, useSession } from "./session-provider"
import { tokenStore } from "./token-store"

const USER = { id: "u1", email: "ana@demo.local" } as User
const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
  tokenStore.clear()
})

describe("SessionProvider.signIn", () => {
  it("revoca la sesión anterior y limpia cachés antes de guardar la nueva", async () => {
    tokenStore.set("access-de-otro-usuario")
    const onSignOut = vi.fn()
    let signIn: ((r: AuthResult) => Promise<void>) | undefined
    function Probe() {
      signIn = useSession().signIn
      return null
    }
    render(
      <SessionProvider
        apiClient={{} as AxiosInstance}
        loginPath="/login"
        onSignOut={onSignOut}
      >
        <Probe />
      </SessionProvider>
    )

    await act(() =>
      signIn!({
        user: USER,
        tokens: { accessToken: "nuevo", refreshToken: "rt" },
      } as AuthResult)
    )

    const methods = fetchMock.mock.calls.map(([, init]) => init?.method)
    expect(methods).toEqual(["DELETE", "POST"])
    expect(onSignOut).toHaveBeenCalledTimes(1)
    expect(tokenStore.get()).toBe("nuevo")
  })
})
