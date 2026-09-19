import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AxiosError, AxiosHeaders } from "axios"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LoginForm } from "./login-form"

const replace = vi.fn()
const refresh = vi.fn()
const signIn = vi.fn()
const post = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}))

vi.mock("@adminprop/session/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@adminprop/session/client")>()),
  useSession: () => ({ signIn }),
}))

vi.mock("@/lib/api-client", () => ({
  apiClient: { post: (...args: unknown[]) => post(...args) },
}))

const RESULT = {
  user: { id: "u1", email: "ana@demo.local", role: "EMPLOYEE" },
  tokens: {
    accessToken: "a",
    refreshToken: "r",
    tokenType: "Bearer",
    expiresIn: 900,
  },
}

async function fillAndSubmit(email = "ana@demo.local", password = "Clave123") {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText("Email"), email)
  await user.type(screen.getByLabelText("Contraseña"), password)
  await user.click(screen.getByRole("button", { name: "Ingresar" }))
}

beforeEach(() => {
  window.history.replaceState(null, "", "/login")
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("LoginForm", () => {
  it("con credenciales válidas inicia sesión y va al inicio", async () => {
    post.mockResolvedValue({ data: { success: true, data: RESULT } })
    render(<LoginForm />)

    await fillAndSubmit()

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"))
    expect(post).toHaveBeenCalledWith(
      "/auth/login",
      { email: "ana@demo.local", password: "Clave123" },
      // Un 401 acá es "credenciales inválidas", no una sesión vencida.
      { skipAuthRefresh: true }
    )
    expect(signIn).toHaveBeenCalledWith(RESULT)
  })

  it("vuelve a la pantalla que se estaba viendo (?next=)", async () => {
    window.history.replaceState(null, "", "/login?next=%2Fpropiedades")
    post.mockResolvedValue({ data: { success: true, data: RESULT } })
    render(<LoginForm />)

    await fillAndSubmit()

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/propiedades"))
  })

  it("muestra el error de la API y no inicia sesión", async () => {
    const config = { headers: new AxiosHeaders() }
    post.mockRejectedValue(
      new AxiosError("401", "401", config, null, {
        status: 401,
        statusText: "",
        headers: {},
        config,
        data: {
          code: "INVALID_CREDENTIALS",
          message: "Email o contraseña incorrectos",
        },
      })
    )
    render(<LoginForm />)

    await fillAndSubmit()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email o contraseña incorrectos"
    )
    expect(signIn).not.toHaveBeenCalled()
    expect(screen.getByLabelText("Contraseña")).toHaveValue("")
  })

  it("no manda nada si falta la contraseña", async () => {
    render(<LoginForm />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText("Email"), "ana@demo.local")
    await user.click(screen.getByRole("button", { name: "Ingresar" }))

    expect(
      await screen.findByText("Ingresá tu contraseña.")
    ).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })
})
