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

  it("cada campo vacío muestra su error y el primero recibe el foco", async () => {
    const user = userEvent.setup()
    render(<ContactForm slug="demo" propertyId="p-1" defaultMessage="" />)

    await user.click(screen.getByRole("button", { name: "Enviar consulta" }))

    const name = screen.getByLabelText("Nombre")
    expect(name).toHaveAttribute("aria-invalid", "true")
    expect(name).toHaveFocus()
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
    expect(screen.getByLabelText("Mensaje")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
    const alerts = screen.getAllByRole("alert")
    expect(alerts).toHaveLength(3)
    expect(alerts[0]).toHaveTextContent("Contanos tu nombre.")
    expect(post).not.toHaveBeenCalled()
  })

  it("rechaza un email inválido y enfoca ese campo", async () => {
    const user = userEvent.setup()
    render(<ContactForm slug="demo" propertyId="p-1" defaultMessage="Hola" />)

    await user.type(screen.getByLabelText("Nombre"), "Ana")
    await user.type(screen.getByLabelText("Email"), "ana")
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }))

    expect(screen.getByLabelText("Email")).toHaveFocus()
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Escribí un email válido."
    )
    expect(post).not.toHaveBeenCalled()
  })

  it("un error 500 que dice 'disponible' no se toma por propiedad no disponible", async () => {
    post.mockRejectedValue(
      apiError(500, { message: "Servicio no disponible por mantenimiento." })
    )
    const user = userEvent.setup()
    render(<ContactForm slug="demo" propertyId="p-1" defaultMessage="" />)

    await fill(user)
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No pudimos enviar tu consulta. Probá de nuevo en un rato."
    )
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
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

  it("avisa con amabilidad si la propiedad ya no está disponible (409 por código)", async () => {
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
