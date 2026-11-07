import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SectionError } from "./section-error"

describe("SectionError", () => {
  it("avisa como alerta y reintenta", async () => {
    const onRetry = vi.fn()
    render(<SectionError description="Sin conexión." onRetry={onRetry} />)

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudo cargar esta sección"
    )
    expect(screen.getByText("Sin conexión.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("sin onRetry no muestra el botón", () => {
    render(<SectionError />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
