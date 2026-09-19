import { render, screen } from "@testing-library/react"
import { Building2 } from "lucide-react"
import { describe, expect, it } from "vitest"

import { Button } from "./button"
import { EmptyState } from "./empty-state"

describe("EmptyState", () => {
  it("muestra qué falta, por qué y la acción que lo resuelve", () => {
    render(
      <EmptyState
        icon={Building2}
        title="Todavía no hay propiedades"
        description="Cargá la primera para empezar a administrarla."
        action={<Button>Nueva propiedad</Button>}
      />
    )

    expect(
      screen.getByRole("heading", { name: "Todavía no hay propiedades" })
    ).toBeInTheDocument()
    expect(
      screen.getByText("Cargá la primera para empezar a administrarla.")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Nueva propiedad" })
    ).toBeInTheDocument()
  })

  it("funciona sin ícono, descripción ni acción", () => {
    render(<EmptyState title="Sin resultados" />)
    expect(
      screen.getByRole("heading", { name: "Sin resultados" })
    ).toBeVisible()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
