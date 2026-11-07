import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { PortalRenterMe } from "@adminprop/shared-types"

import { RenterContactScreen } from "./contact-screen"

const refetch = vi.fn()
let state: {
  isPending: boolean
  isError: boolean
  error?: unknown
  data?: PortalRenterMe
}

const baseMe: PortalRenterMe = {
  id: "r1",
  fullName: "Iván López",
  email: null,
  phone: null,
  agency: {
    name: "Oppido Propiedades",
    slug: "oppido",
    logoUrl: null,
    primaryColor: null,
    phone: "221 555-0000",
    email: "hola@oppido.com",
    whatsapp: "5492211234567",
    address: "Calle 7 1234, La Plata",
    bankAccount: null,
  },
}

vi.mock("@/lib/portal-api", () => ({
  useRenterMe: () => ({ ...state, refetch }),
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe("RenterContactScreen", () => {
  it("muestra teléfono, email, dirección y el link de WhatsApp con el mensaje precargado", () => {
    state = { isPending: false, isError: false, data: baseMe }
    render(<RenterContactScreen />)

    expect(
      screen.getByRole("heading", { name: "Oppido Propiedades" })
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "221 555-0000" })).toHaveAttribute(
      "href",
      "tel:221 555-0000"
    )
    expect(
      screen.getByRole("link", { name: "hola@oppido.com" })
    ).toHaveAttribute("href", "mailto:hola@oppido.com")
    expect(screen.getByText("Calle 7 1234, La Plata")).toBeInTheDocument()
    const whatsapp = screen.getByRole("link", { name: /WhatsApp/ })
    expect(whatsapp).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/5492211234567?text=")
    )
    expect(decodeURIComponent(whatsapp.getAttribute("href") ?? "")).toContain(
      "Hola, soy Iván López, inquilino."
    )
  })

  it("sin datos de contacto lo dice y no muestra WhatsApp", () => {
    state = {
      isPending: false,
      isError: false,
      data: {
        ...baseMe,
        agency: {
          ...baseMe.agency,
          phone: null,
          email: null,
          whatsapp: null,
          address: null,
        },
      },
    }
    render(<RenterContactScreen />)

    expect(
      screen.getByText(
        "La inmobiliaria todavía no cargó sus datos de contacto."
      )
    ).toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("si falla la carga muestra el error y permite reintentar", async () => {
    state = { isPending: false, isError: true }
    const user = userEvent.setup()
    render(<RenterContactScreen />)

    expect(
      screen.getByText("No pudimos cargar el contacto")
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(refetch).toHaveBeenCalled()
  })
})
