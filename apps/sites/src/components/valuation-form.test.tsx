import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ValuationForm } from "./valuation-form"

afterEach(() => vi.restoreAllMocks())

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText("Tipo de propiedad"), "Casa")
  await user.selectOptions(screen.getByLabelText("¿Qué querés hacer?"), "SALE")
  await user.type(screen.getByLabelText("Dirección y zona"), "Calle 7 1234")
  await user.type(screen.getByLabelText("Nombre"), "Ana")
  await user.type(screen.getByLabelText("Email"), "ana@mail.com")
}

describe("ValuationForm", () => {
  it("sin datos no envía y explica cada campo", async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    render(<ValuationForm base="" />)
    await user.click(screen.getByRole("button", { name: "Pedir tasación" }))

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.getByText("Elegí el tipo de propiedad.")).toBeVisible()
    expect(screen.getByText("Contanos tu nombre.")).toBeVisible()
    expect(screen.getByLabelText("Nombre")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
  })

  it("reutiliza el endpoint de contacto con un mensaje en texto plano", async () => {
    const user = userEvent.setup()
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 201 }))
    render(<ValuationForm base="/_s/demo" />)
    await fill(user)
    await user.click(screen.getByRole("button", { name: "Pedir tasación" }))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("/_s/demo/api/contacto")
    const body = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body))
    expect(body).toMatchObject({
      name: "Ana",
      email: "ana@mail.com",
      propertyId: null,
      website: "",
    })
    expect(body.message).toContain("Solicitud de tasación")
    expect(body.message).toContain("Dirección y zona: Calle 7 1234")
    expect(await screen.findByText("¡Recibimos tu solicitud!")).toBeVisible()
  })

  it("muestra el mensaje del servidor cuando falla", async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Demasiadas consultas." }), {
        status: 429,
      })
    )
    render(<ValuationForm base="" />)
    await fill(user)
    await user.click(screen.getByRole("button", { name: "Pedir tasación" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Demasiadas consultas."
    )
  })

  it("en la vista previa no envía", () => {
    render(<ValuationForm base="" disabled />)
    expect(
      screen.getByRole("button", { name: "Pedir tasación" })
    ).toBeDisabled()
  })
})
