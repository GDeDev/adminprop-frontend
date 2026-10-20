import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { OwnerSummary } from "@adminprop/shared-types"

import { OwnerList } from "./owner-list"

function makeOwner(overrides: Partial<OwnerSummary> = {}): OwnerSummary {
  return {
    id: "owner-1",
    firstName: "José",
    lastName: "Pérez",
    fullName: "José Pérez",
    nationalId: "20123456",
    phone: null,
    email: "jose@demo.local",
    propertyCount: 3,
    activePropertyCount: 3,
    reducedFee: true,
    hasPortalAccess: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

const owners: OwnerSummary[] = [
  makeOwner(),
  makeOwner({
    id: "owner-2",
    firstName: "Ana",
    lastName: "Gómez",
    fullName: "Ana Gómez",
    nationalId: "27987654321",
    email: null,
    phone: "11 5555-1234",
    propertyCount: 1,
    activePropertyCount: 0,
    reducedFee: false,
    hasPortalAccess: false,
  }),
]

vi.mock("@/lib/owners-api", () => ({
  useInfiniteOwners: () => ({
    isPending: false,
    isError: false,
    data: {
      pages: [
        {
          data: owners,
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
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

describe("OwnerList", () => {
  it("muestra nombre, DNI formateado, propiedades y honorario reducido", () => {
    render(<OwnerList />)

    const table = screen.getByRole("table")
    expect(within(table).getByText("José Pérez")).toBeInTheDocument()
    expect(within(table).getByText("20.123.456")).toBeInTheDocument()
    expect(within(table).getByText("27-98765432-1")).toBeInTheDocument()
    expect(
      within(table).getByText("3 propiedades, 3 alquiladas")
    ).toBeInTheDocument()
    expect(within(table).getByText("1 propiedad")).toBeInTheDocument()
    expect(within(table).getAllByText("Honorario reducido")).toHaveLength(1)
  })

  it("señala quién tiene acceso al portal", () => {
    render(<OwnerList />)

    const table = screen.getByRole("table")
    expect(
      within(table).getAllByLabelText("Con acceso al portal")
    ).toHaveLength(1)
  })

  it("lleva a la ficha y al alta", () => {
    render(<OwnerList />)

    expect(
      screen.getAllByRole("link", { name: /Nuevo propietario/ })[0]
    ).toHaveAttribute("href", "/propietarios/nuevo")
    expect(
      screen.getAllByRole("link", { name: "José Pérez" })[0]
    ).toHaveAttribute("href", "/propietarios/owner-1")
  })
})
