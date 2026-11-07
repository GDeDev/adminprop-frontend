import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AxiosError, type AxiosResponse } from "axios"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ContactForm } from "./contact-form"

const post = vi.fn()

vi.mock("@/lib/api-client", () => ({
  apiClient: { post: (...args: unknown[]) => post(...args) },
}))

function apiError(status: number, data: { code?: string; message: string }) {
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, null, {
    status,
    data,
  } as AxiosResponse)
}

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nombre"), "Ana Pérez")
  await user.type(screen.getByLabelText("Email"), "ana@mail.com")
  const message = screen.getByLabelText("Mensaje")
  await user.clear(message)
  await user.type(message, "Quisiera visitarla")
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("ContactForm", () => {
  it("precarga el mensaje inicial", () => {
    render(
      <ContactForm
        slug="demo"
        propertyId="p-1"
        defaultMessage="Me interesa Calle 1 100"
      />
    )
    expect(screen.getByLabelText("Mensaje")).toHaveValue(
      "Me interesa Calle 1 100"
    )
  })

  it("valida los obligatorios y no envía", async () => {
    const user = userEvent.setup()
    render(<ContactForm slug="demo" propertyId="p-1" defaultMessage="" />)

    await user.click(screen.getByRole("button", { name: "Enviar consulta" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Completá tu nombre, tu email y el mensaje."
    )
    expect(post).not.toHaveBeenCalled()
  })

  it("envía la consulta con la propiedad y el honeypot vacío, y muestra el éxito", async () => {
    post.mockResolvedValue({ data: { success: true } })
    const user = userEvent.setup()
    render(<ContactForm slug="demo" propertyId="p-1" defaultMessage="" />)

    await fill(user)
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }))

    expect(await screen.findByRole("status")).toHaveTextContent(
      /Recibimos tu consulta/
    )
    expect(post).toHaveBeenCalledWith("/public/demo/contact", {
      name: "Ana Pérez",
      email: "ana@mail.com",
      phone: "",
      message: "Quisiera visitarla",
      propertyId: "p-1",
      website: "",
    })
  })

  it("avisa con amabilidad si la propiedad ya no está disponible", async () => {
    post.mockRejectedValue(
      apiError(409, {
        code: "PROPERTY_NOT_AVAILABLE",
        message: "La propiedad no está disponible.",
      })
    )
    const user = userEvent.setup()
    render(<ContactForm slug="demo" propertyId="p-1" defaultMessage="" />)

    await fill(user)
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }))

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Esta propiedad ya no está disponible. Mirá el resto del listado para encontrar otra."
    )
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("muestra el mensaje de la API ante demasiados intentos (429) y permite reintentar", async () => {
    post.mockRejectedValue(
      apiError(429, {
        message: "Enviaste demasiadas consultas. Esperá un rato.",
      })
    )
    const user = userEvent.setup()
    render(<ContactForm slug="demo" propertyId={null} defaultMessage="" />)

    await fill(user)
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enviaste demasiadas consultas. Esperá un rato."
    )
    expect(
      screen.getByRole("button", { name: "Enviar consulta" })
    ).toBeEnabled()
  })

  it("ante un error de red muestra un mensaje y permite reintentar", async () => {
    post.mockRejectedValueOnce(new AxiosError("Network Error"))
    post.mockResolvedValueOnce({ data: { success: true } })
    const user = userEvent.setup()
    render(<ContactForm slug="demo" propertyId="p-1" defaultMessage="" />)

    await fill(user)
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Revisá tu conexión/
    )
    expect(screen.getByLabelText("Nombre")).toHaveValue("Ana Pérez")

    await user.click(screen.getByRole("button", { name: "Enviar consulta" }))
    expect(await screen.findByRole("status")).toBeInTheDocument()
    expect(post).toHaveBeenCalledTimes(2)
  })
})
