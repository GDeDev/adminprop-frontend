import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { PrivateImage } from "./private-image"

describe("PrivateImage", () => {
  it("si la URL firmada venció, pide una nueva una sola vez y reintenta", async () => {
    const refresh = vi.fn().mockResolvedValue("https://cdn.test/foto?firma=2")
    render(
      <PrivateImage
        src="https://cdn.test/foto?firma=1"
        alt="Foto"
        refresh={refresh}
      />
    )
    const img = screen.getByAltText("Foto")
    fireEvent.error(img)
    await waitFor(() =>
      expect(img).toHaveAttribute("src", "https://cdn.test/foto?firma=2")
    )
    fireEvent.error(img)
    fireEvent.error(img)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it("si el refresco falla, deja la imagen como estaba", async () => {
    const refresh = vi.fn().mockRejectedValue(new Error("sin red"))
    render(
      <PrivateImage src="https://cdn.test/a" alt="Foto" refresh={refresh} />
    )
    const img = screen.getByAltText("Foto")
    fireEvent.error(img)
    await waitFor(() => expect(refresh).toHaveBeenCalled())
    expect(img).toHaveAttribute("src", "https://cdn.test/a")
  })
})
