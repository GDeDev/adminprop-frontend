import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ContactForm } from "./contact-form"

afterEach(() => vi.restoreAllMocks())

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nombre"), "Ana Pérez")
  await user.type(screen.getByLabelText("Email"), "ana@mail.com")
  await user.type(screen.getByLabelText("Consulta"), "Me interesa")
}

describe("ContactForm", () => {
  it("valida los obligatorios y no envía", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const user = userEvent.setup()
    render(<ContactForm base="" />)

    await user.click(screen.getByRole("button", { name: /enviar consulta/i }))

    expect(screen.getByText("Contanos tu nombre.")).toBeInTheDocument()
    expect(screen.getByText("Escribí un email válido.")).toBeInTheDocument()
    expect(screen.getByText("Escribí tu consulta.")).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("envía al propio sitio con el prefijo y la propiedad, y muestra el éxito", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 201 })
      )
    const user = userEvent.setup()
    render(<ContactForm base="/_s/demo" propertyId="p-1" />)

    await fill(user)
    await user.click(screen.getByRole("button", { name: /enviar consulta/i }))

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/gracias/i)
    )
    const [url, init] = fetchSpy.mock.calls[0] ?? []
    expect(url).toBe("/_s/demo/api/contacto")
    expect(JSON.parse(String((init as RequestInit).body))).toMatchObject({
      name: "Ana Pérez",
      email: "ana@mail.com",
      message: "Me interesa",
      propertyId: "p-1",
      website: "",
    })
  })

  it("muestra el mensaje de error de la API y permite reintentar", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Enviaste varias consultas." }), {
        status: 429,
      })
    )
    const user = userEvent.setup()
    render(<ContactForm base="" />)

    await fill(user)
    await user.click(screen.getByRole("button", { name: /enviar consulta/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enviaste varias consultas."
    )
    expect(
      screen.getByRole("button", { name: /enviar consulta/i })
    ).toBeEnabled()
  })

  it("avisa si no hay conexión", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"))
    const user = userEvent.setup()
    render(<ContactForm base="" />)

    await fill(user)
    await user.click(screen.getByRole("button", { name: /enviar consulta/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /revisá tu conexión/i
    )
  })

  it("en la vista previa no envía nada", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    render(<ContactForm base="" disabled />)
    expect(
      screen.getByRole("button", { name: /enviar consulta/i })
    ).toBeDisabled()
    expect(screen.getByText(/vista previa/i)).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
