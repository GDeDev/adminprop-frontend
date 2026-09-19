import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { PortalLoginForm } from "./portal-login-form"

const replace = vi.fn()
const signIn = vi.fn()
const post = vi.fn()

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }))

vi.mock("@adminprop/session/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@adminprop/session/client")>()),
  useSession: () => ({ signIn }),
}))

vi.mock("@/lib/api-client", () => ({
  apiClient: { post: (...args: unknown[]) => post(...args) },
}))

const RESULT = { user: { role: "RENTER" }, tokens: {} }

async function submit() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText("Email"), "ivan@mail.com")
  await user.type(screen.getByLabelText("Contraseña"), "Clave123")
  await user.click(screen.getByRole("button", { name: "Ingresar" }))
}

beforeEach(() => {
  window.history.replaceState(null, "", "/inquilino/login")
  post.mockResolvedValue({ data: { success: true, data: RESULT } })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("PortalLoginForm", () => {
  it("manda la inmobiliaria del portal y el tipo de su área", async () => {
    render(<PortalLoginForm role="renter" tenantSlug="demo" />)

    await submit()

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/inquilino/cuenta")
    )
    expect(post).toHaveBeenCalledWith(
      "/auth/portal-login",
      {
        email: "ivan@mail.com",
        password: "Clave123",
        tenantSlug: "demo",
        type: "RENTER",
      },
      { skipAuthRefresh: true }
    )
    expect(signIn).toHaveBeenCalledWith(RESULT)
  })

  it("un next de la otra área no se respeta", async () => {
    window.history.replaceState(
      null,
      "",
      "/inquilino/login?next=%2Fpropietario%2Fcuenta"
    )
    render(<PortalLoginForm role="renter" tenantSlug="demo" />)

    await submit()

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/inquilino/cuenta")
    )
  })

  it("sin inmobiliaria configurada no ofrece el formulario", () => {
    render(<PortalLoginForm role="owner" tenantSlug={null} />)

    expect(screen.getByRole("alert")).toHaveTextContent(
      "no tiene una inmobiliaria configurada"
    )
    expect(screen.queryByRole("button", { name: "Ingresar" })).toBeNull()
  })
})
