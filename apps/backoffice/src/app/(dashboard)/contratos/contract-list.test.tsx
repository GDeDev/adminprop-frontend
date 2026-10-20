import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { ContractSummary } from "@adminprop/shared-types"

import { ContractList } from "./contract-list"

function makeContract(
  overrides: Partial<ContractSummary> = {}
): ContractSummary {
  return {
    id: "c1",
    property: { id: "p1", address: "Calle 7 1234" },
    owner: { id: "o1", fullName: "María Fernández" },
    renter: { id: "r1", fullName: "Lucía Gómez" },
    startDate: "2025-03-01",
    endDate: "2028-02-29",
    currency: "ARS",
    currentRent: "480000.00",
    status: "ACTIVE",
    hasSurety: false,
    policyExpiresAt: null,
    suretyExpired: false,
    expiringSoon: false,
    expired: false,
    feePercentage: "5.00",
    createdAt: "2025-02-20T15:00:00.000Z",
    updatedAt: "2025-02-20T15:00:00.000Z",
    ...overrides,
  }
}

const contracts: ContractSummary[] = [
  makeContract(),
  makeContract({
    id: "c2",
    property: { id: "p2", address: "Av. 13 450" },
    renter: { id: "r2", fullName: "Pedro Ruiz" },
    expiringSoon: true,
    hasSurety: true,
    policyExpiresAt: "2026-08-31",
    suretyExpired: true,
  }),
  makeContract({
    id: "c3",
    property: { id: "p3", address: "Diagonal 74 800" },
    renter: { id: "r3", fullName: "Ana Paz" },
    expired: true,
    currency: "USD",
    currentRent: "700.00",
  }),
  makeContract({
    id: "c4",
    property: { id: "p4", address: "Calle 50 800" },
    status: "TERMINATED",
  }),
]

vi.mock("@/lib/contracts-api", () => ({
  useInfiniteContracts: () => ({
    isPending: false,
    isError: false,
    data: {
      pages: [
        {
          data: contracts,
          pagination: {
            page: 1,
            limit: 20,
            total: 4,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      ],
    },
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  }),
}))
// Los selectores buscan contra la API: acá, un botón inerte.
vi.mock("@/components/property-select", () => ({
  PropertySelect: (props: { "aria-label"?: string }) => (
    <button type="button" aria-label={props["aria-label"]} />
  ),
}))
vi.mock("@/components/renter-select", () => ({
  RenterSelect: (props: { "aria-label"?: string }) => (
    <button type="button" aria-label={props["aria-label"]} />
  ),
}))

describe("ContractList", () => {
  it("muestra un badge por estado: vigente, por vencer, vencido y rescindido", () => {
    render(<ContractList />)

    const table = screen.getByRole("table")
    expect(within(table).getByText("Vigente")).toBeInTheDocument()
    expect(within(table).getByText("Vence pronto")).toBeInTheDocument()
    expect(within(table).getByText("Vencido")).toBeInTheDocument()
    expect(within(table).getByText("Rescindido")).toBeInTheDocument()
    expect(within(table).getByText("Caución vencida")).toBeInTheDocument()
  })

  it("muestra partes, período y alquiler formateado", () => {
    render(<ContractList />)

    const table = screen.getByRole("table")
    expect(within(table).getAllByText("Lucía Gómez")).toHaveLength(2)
    expect(within(table).getAllByText("01/03/2025 → 29/02/2028")).toHaveLength(
      4
    )
    expect(within(table).getAllByText("$ 480.000,00")).toHaveLength(3)
    expect(within(table).getByText("US$ 700,00")).toBeInTheDocument()
  })

  it("lleva a la ficha y al alta, y tiene los filtros", () => {
    render(<ContractList />)

    expect(
      screen.getAllByRole("link", { name: /Nuevo contrato/ })[0]
    ).toHaveAttribute("href", "/contratos/nuevo")
    expect(
      screen.getAllByRole("link", { name: "Calle 7 1234" })[0]
    ).toHaveAttribute("href", "/contratos/c1")
    expect(screen.getByLabelText("Filtrar por estado")).toBeInTheDocument()
    expect(screen.getByLabelText("Filtrar por propiedad")).toBeInTheDocument()
    expect(screen.getByLabelText("Filtrar por inquilino")).toBeInTheDocument()
    expect(screen.getByLabelText("Sólo por vencer")).toBeInTheDocument()
  })
})
