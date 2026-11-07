import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { InventoryComparisonScreen } from "./inventory-comparison"

const data = {
  hasDelivery: true,
  hasReturn: true,
  deliveryDate: "2025-03-01",
  returnDate: "2026-03-01",
  worsenedCount: 1,
  rows: [
    {
      category: "Cocina",
      description: "Heladera",
      deliveryCondition: "GOOD",
      returnCondition: "POOR",
      deliveryNotes: null,
      returnNotes: "Puerta rota",
      deliveryPhotos: [],
      returnPhotos: [],
      change: "WORSE",
    },
  ],
}

vi.mock("@/lib/inventory-api", () => ({
  useInventoryComparison: () => ({
    isPending: false,
    isError: false,
    data,
    dataUpdatedAt: 0,
    refetch: vi.fn(),
  }),
}))
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }))

describe("InventoryComparisonScreen", () => {
  it("muestra una tarjeta por ítem con entrega, devolución y cambio", () => {
    render(<InventoryComparisonScreen contractId="c1" />)
    const card = within(screen.getByRole("list", { name: "Ítems" })).getByRole(
      "listitem"
    )
    expect(within(card).getByText("Heladera")).toBeVisible()
    expect(within(card).getByText("Entrega")).toBeVisible()
    expect(within(card).getByText("Devolución")).toBeVisible()
    expect(within(card).getByText("Bueno")).toBeVisible()
    expect(within(card).getByText("Malo")).toBeVisible()
    expect(within(card).getByText("Puerta rota")).toBeVisible()
  })

  it("mantiene la tabla para pantallas anchas", () => {
    render(<InventoryComparisonScreen contractId="c1" />)
    expect(screen.getByRole("table")).toBeInTheDocument()
  })
})
