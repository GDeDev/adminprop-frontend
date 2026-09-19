import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { renderWithQuery } from "../../test/render"
import { MasterDataSelect } from "./master-data-select"

const get = vi.fn()

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: (...args: unknown[]) => get(...args) },
}))

const stamp = { createdAt: "2026-01-01", updatedAt: "2026-01-01", icon: null }
const item = (id: string, name: string, isActive = true) => ({
  id,
  name,
  isActive,
  ...stamp,
})

function apiReturns(items: unknown[]) {
  get.mockResolvedValue({ data: { success: true, data: items } })
}

beforeAll(() => {
  // Radix Select usa estas APIs, que jsdom no trae.
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.scrollIntoView ??= () => {}
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("MasterDataSelect", () => {
  it("selección única: muestra las opciones de la API y avisa la elegida", async () => {
    apiReturns([item("t1", "Casa"), item("t2", "Departamento")])
    const onChange = vi.fn()
    renderWithQuery(
      <MasterDataSelect
        source="property-types"
        value={null}
        onChange={onChange}
        aria-label="Tipo de propiedad"
      />
    )
    const user = userEvent.setup()

    const trigger = screen.getByRole("combobox", { name: "Tipo de propiedad" })
    await waitFor(() => expect(trigger).toBeEnabled())
    await user.click(trigger)
    await user.click(
      await screen.findByRole("option", { name: "Departamento" })
    )

    expect(onChange).toHaveBeenCalledWith("t2")
    expect(get).toHaveBeenCalledWith("/property-types", {
      params: { isActive: "all" },
    })
  })

  it("selección múltiple: tilda y destilda (amenities)", async () => {
    apiReturns([item("a1", "Pileta"), item("a2", "Cochera")])
    const onChange = vi.fn()
    renderWithQuery(
      <MasterDataSelect
        source="amenities"
        multiple
        value={["a1"]}
        onChange={onChange}
        aria-label="Amenities"
      />
    )
    const user = userEvent.setup()

    const trigger = screen.getByRole("button", { name: "Amenities" })
    await waitFor(() => expect(trigger).toHaveTextContent("Pileta"))
    await user.click(trigger)
    await user.click(await screen.findByRole("checkbox", { name: "Cochera" }))

    expect(onChange).toHaveBeenCalledWith(["a1", "a2"])
  })

  it("un desactivado sólo aparece si ya estaba elegido, y no se puede volver a elegir", async () => {
    apiReturns([
      item("a1", "Pileta"),
      item("a2", "Solárium", false),
      item("a3", "Sauna", false),
    ])
    renderWithQuery(
      <MasterDataSelect
        source="amenities"
        multiple
        value={["a2"]}
        onChange={vi.fn()}
        aria-label="Amenities"
      />
    )
    const user = userEvent.setup()

    await user.click(await screen.findByRole("button", { name: "Amenities" }))

    const solarium = await screen.findByRole("checkbox", {
      name: "Solárium (desactivado)",
    })
    expect(solarium).toBeChecked()
    expect(screen.queryByText(/Sauna/)).not.toBeInTheDocument()
  })

  it("ubicaciones: filtra por nivel y padre para las cascadas", async () => {
    apiReturns([item("b1", "Tolosa")])
    renderWithQuery(
      <MasterDataSelect
        source="locations"
        level="NEIGHBORHOOD"
        parentId="city-1"
        value={null}
        onChange={vi.fn()}
        aria-label="Barrio"
      />
    )

    await waitFor(() =>
      expect(get).toHaveBeenCalledWith("/locations", {
        params: { level: "NEIGHBORHOOD", parentId: "city-1", isActive: "all" },
      })
    )
    // No pide un maestro plano de paso.
    expect(get).toHaveBeenCalledTimes(1)
  })
})
