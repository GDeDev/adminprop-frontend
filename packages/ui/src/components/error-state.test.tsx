import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ErrorState } from "./error-state"

describe("ErrorState", () => {
  it("avisa como alerta y ofrece reintentar", async () => {
    const onRetry = vi.fn()
    render(
      <ErrorState
        title="No se pudieron cargar las propiedades"
        description="Probá de nuevo en un rato."
        onRetry={onRetry}
      />
    )

    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", {
        name: "No se pudieron cargar las propiedades",
      })
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("sin onRetry no muestra el botón y admite una acción propia", () => {
    render(<ErrorState action={<a href="/propiedades">Volver al listado</a>} />)

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Volver al listado" })
    ).toBeInTheDocument()
  })
})
