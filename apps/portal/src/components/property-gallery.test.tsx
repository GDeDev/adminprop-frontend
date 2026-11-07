import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PropertyGallery } from "./property-gallery"

const photos = [
  { id: "1", url: "https://x/1.jpg" },
  { id: "2", url: "https://x/2.jpg" },
]

describe("PropertyGallery", () => {
  it("es una región enfocable y los botones desplazan la galería", async () => {
    const scrollBy = vi.fn()
    Element.prototype.scrollBy = scrollBy as never
    const user = userEvent.setup()
    render(<PropertyGallery photos={photos} address="Calle 1 100" />)

    const region = screen.getByRole("region", {
      name: "Fotos de la propiedad",
    })
    expect(region).toHaveAttribute("tabindex", "0")
    expect(screen.getAllByRole("img")).toHaveLength(2)

    await user.click(screen.getByRole("button", { name: "Siguiente" }))
    expect(scrollBy).toHaveBeenLastCalledWith(
      expect.objectContaining({ left: expect.any(Number) })
    )
    await user.click(screen.getByRole("button", { name: "Anterior" }))
    expect(scrollBy).toHaveBeenCalledTimes(2)
  })

  it("con una sola foto no muestra botones", () => {
    render(<PropertyGallery photos={photos.slice(0, 1)} address="Calle 1" />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
