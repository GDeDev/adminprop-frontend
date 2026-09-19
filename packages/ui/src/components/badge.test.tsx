import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Badge } from "./badge"

describe("Badge", () => {
  it.each([
    ["disponible", "bg-success-soft", "text-success"],
    ["alquilada", "bg-info-soft", "text-info"],
    ["mantenimiento", "bg-warning-soft", "text-warning"],
    ["mora", "bg-destructive-soft", "text-destructive"],
    ["borrador", "bg-muted", "text-muted-foreground"],
  ] as const)(
    "la variante %s usa los tokens de la tabla estado → token",
    (variant, background, text) => {
      render(<Badge variant={variant}>Estado</Badge>)
      const badge = screen.getByText("Estado")
      expect(badge).toHaveClass(background, text)
      expect(badge).toHaveAttribute("data-variant", variant)
    }
  )

  it("usa primary por defecto", () => {
    render(<Badge>Nuevo</Badge>)
    expect(screen.getByText("Nuevo")).toHaveClass("bg-primary")
  })
})
