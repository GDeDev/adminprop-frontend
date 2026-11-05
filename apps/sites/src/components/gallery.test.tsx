import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Gallery } from "./gallery"

const PHOTOS = [
  { id: "1", url: "https://cdn.test/1.jpg" },
  { id: "2", url: "https://cdn.test/2.jpg" },
]

describe("Gallery", () => {
  it("sin fotos muestra una franja baja con el aviso, no un bloque 16:9", () => {
    render(<Gallery photos={[]} title="Calle 7" />)
    const placeholder = screen.getByRole("img", { name: /calle 7: sin fotos/i })

    expect(placeholder).toHaveTextContent(
      "Esta propiedad todavía no tiene fotos"
    )
    expect(placeholder.className).toMatch(/\bh-36\b/)
    expect(placeholder.className).not.toMatch(/aspect-/)
  })

  it("con fotos muestra la primera y navega con los botones y el teclado", async () => {
    const user = userEvent.setup()
    render(<Gallery photos={PHOTOS} title="Calle 7" />)

    expect(screen.getByAltText("Calle 7, foto 1 de 2")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Foto siguiente" }))
    expect(screen.getByAltText("Calle 7, foto 2 de 2")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Foto siguiente" }))
    expect(screen.getByAltText("Calle 7, foto 1 de 2")).toBeInTheDocument()
  })
})
