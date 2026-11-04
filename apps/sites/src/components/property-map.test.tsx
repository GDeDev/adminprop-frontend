import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { PropertyMap } from "./property-map"

const POINT = { latitude: -34.9205, longitude: -57.9536 }

describe("PropertyMap", () => {
  it("no carga el mapa hasta que se pide, pero deja el link a OpenStreetMap", () => {
    const { container } = render(
      <PropertyMap coordinates={POINT} title="Calle 7 1234" />
    )
    expect(container.querySelector("iframe")).toBeNull()
    const link = screen.getByRole("link", { name: /abrir en openstreetmap/i })
    expect(link).toHaveAttribute(
      "href",
      expect.stringMatching(/^https:\/\/www\.openstreetmap\.org\//)
    )
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("al pedirlo monta un iframe con título, sandbox y solo origen de OSM", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <PropertyMap coordinates={POINT} title="Calle 7 1234" />
    )
    await user.click(screen.getByRole("button", { name: "Ver mapa" }))
    const frame = container.querySelector("iframe")
    expect(frame).not.toBeNull()
    expect(frame?.getAttribute("src")).toMatch(
      /^https:\/\/www\.openstreetmap\.org\/export\/embed\.html\?/
    )
    expect(frame?.getAttribute("title")).toBe(
      "Mapa de la ubicación de Calle 7 1234"
    )
    expect(frame?.getAttribute("sandbox")).toBe(
      "allow-scripts allow-same-origin"
    )
    expect(frame?.getAttribute("referrerpolicy")).toBe("no-referrer")
  })
})
