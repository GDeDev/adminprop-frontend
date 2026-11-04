import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  EMPTY_FILTERS,
  InquiryFiltersBar,
  toApiFilters,
} from "./inquiry-filters"

vi.mock("@/lib/crm-api", () => ({
  useAssignees: () => ({
    data: [{ id: "u1", fullName: "Ana Pérez", role: "EMPLOYEE" }],
  }),
}))
vi.mock("@/components/property-select", () => ({
  PropertySelect: ({
    onChange,
  }: {
    onChange: (value: string | null) => void
  }) => (
    <button type="button" onClick={() => onChange("p1")}>
      elegir propiedad
    </button>
  ),
}))

describe("toApiFilters", () => {
  it("sin filtros no manda nada", () => {
    expect(toApiFilters(EMPTY_FILTERS, "")).toEqual({})
  })

  it("«Sin asignar» usa unassigned y no assignedToId", () => {
    expect(
      toApiFilters({ ...EMPTY_FILTERS, assignee: "unassigned" }, "")
    ).toEqual({ unassigned: true })
  })

  it("combina asignado, canal, propiedad y búsqueda", () => {
    expect(
      toApiFilters(
        {
          assignee: "u1",
          source: "MERCADOLIBRE",
          propertyId: "p1",
          search: "  ",
        },
        "luz"
      )
    ).toEqual({
      assignedToId: "u1",
      source: "MERCADOLIBRE",
      propertyId: "p1",
      q: "luz",
    })
  })
})

describe("InquiryFiltersBar", () => {
  it("la búsqueda avisa el texto", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<InquiryFiltersBar value={EMPTY_FILTERS} onChange={onChange} />)
    await user.type(screen.getByLabelText("Buscar consultas"), "L")
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, search: "L" })
  })

  it("ofrece «Sin asignar» y los usuarios del personal", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<InquiryFiltersBar value={EMPTY_FILTERS} onChange={onChange} />)
    await user.click(screen.getByRole("combobox", { name: "Asignado a" }))
    expect(
      await screen.findByRole("option", { name: "Ana Pérez" })
    ).toBeInTheDocument()
    await user.click(screen.getByRole("option", { name: "Sin asignar" }))
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_FILTERS,
      assignee: "unassigned",
    })
  })

  it("filtra por origen", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<InquiryFiltersBar value={EMPTY_FILTERS} onChange={onChange} />)
    await user.click(screen.getByRole("combobox", { name: "Canal" }))
    await user.click(
      await screen.findByRole("option", { name: "Mercado Libre" })
    )
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_FILTERS,
      source: "MERCADOLIBRE",
    })
  })

  it("filtra por propiedad", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<InquiryFiltersBar value={EMPTY_FILTERS} onChange={onChange} />)
    await user.click(screen.getByRole("button", { name: "elegir propiedad" }))
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_FILTERS,
      propertyId: "p1",
    })
  })
})
