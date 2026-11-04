import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AdminGate } from "./admin-gate"

let session: { user: { role: string } | null; status: string }

vi.mock("@adminprop/session/client", () => ({
  useSession: () => session,
}))

describe("AdminGate", () => {
  it("un administrador ve la pantalla", () => {
    session = { user: { role: "ADMIN" }, status: "authenticated" }
    render(
      <AdminGate>
        <p>contenido</p>
      </AdminGate>
    )
    expect(screen.getByText("contenido")).toBeInTheDocument()
  })

  it("un empleado ve el aviso y no el contenido", () => {
    session = { user: { role: "EMPLOYEE" }, status: "authenticated" }
    render(
      <AdminGate>
        <p>contenido</p>
      </AdminGate>
    )
    expect(screen.queryByText("contenido")).toBeNull()
    expect(screen.getByText("Sólo para administradores")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /volver al inicio/i })
    ).toHaveAttribute("href", "/dashboard")
  })

  it("mientras se recupera la sesión no muestra nada (ni el aviso)", () => {
    session = { user: null, status: "loading" }
    const { container } = render(
      <AdminGate>
        <p>contenido</p>
      </AdminGate>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("sin sesión (ya resuelta) tampoco entra", () => {
    session = { user: null, status: "unauthenticated" }
    render(
      <AdminGate>
        <p>contenido</p>
      </AdminGate>
    )
    expect(screen.queryByText("contenido")).toBeNull()
  })
})
