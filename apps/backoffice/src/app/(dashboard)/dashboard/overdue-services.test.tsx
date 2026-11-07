import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { OverdueService } from "@adminprop/shared-types"

import { OverdueServices } from "./overdue-services"

let state: {
  isPending: boolean
  isError: boolean
  isSuccess: boolean
  data?: unknown
  error?: unknown
  hasNextPage: boolean
  isFetchingNextPage: boolean
}
const fetchNextPage = vi.fn()

vi.mock("@/lib/services-api", () => ({
  useInfiniteOverdueServices: () => ({ ...state, fetchNextPage }),
}))

function makeService(index: number): OverdueService {
  return {
    id: `s${index}`,
    propertyId: `p${index}`,
    contractId: null,
    serviceType: { id: "t-exp", name: "Expensas", isActive: true },
    paidBy: "RENTER",
    currency: "ARS",
    hasDueDate: true,
    dueDate: "2026-10-01",
    hasIncrease: false,
    increaseFrequency: null,
    managedByAgency: true,
    notes: null,
    status: "OVERDUE",
    daysOverdue: 20 - index,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    property: { id: `p${index}`, address: `Calle ${index} 100` },
  }
}

function page(items: OverdueService[], total: number, hasNextPage: boolean) {
  return {
    data: items,
    pagination: {
      page: 1,
      limit: 20,
      total,
      totalPages: hasNextPage ? 2 : 1,
      hasNextPage,
      hasPreviousPage: false,
    },
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("OverdueServices", () => {
  it("muestra los primeros vencidos con la propiedad, los días y el total", () => {
    state = {
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { pages: [page([makeService(1), makeService(2)], 2, false)] },
      hasNextPage: false,
      isFetchingNextPage: false,
    }
    render(<OverdueServices />)

    const section = screen.getByRole("region", { name: /Servicios vencidos/ })
    expect(within(section).getByText("2")).toBeInTheDocument()
    expect(
      within(section).getByRole("link", { name: "Calle 1 100" })
    ).toHaveAttribute("href", "/propiedades/p1")
    expect(
      within(section).getByText("Vencido hace 19 días")
    ).toBeInTheDocument()
    expect(
      within(section).getAllByText(/Expensas · paga el inquilino/)
    ).toHaveLength(2)
    expect(
      within(section).queryByRole("button", { name: "Ver todos" })
    ).toBeNull()
  })

  it("resume a cinco y 'Ver todos' muestra el resto y sigue cargando", async () => {
    const items = Array.from({ length: 7 }, (_, i) => makeService(i + 1))
    state = {
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { pages: [page(items, 30, true)] },
      hasNextPage: true,
      isFetchingNextPage: false,
    }
    render(<OverdueServices />)
    const user = userEvent.setup()

    expect(screen.getAllByRole("listitem")).toHaveLength(5)
    await user.click(screen.getByRole("button", { name: "Ver todos" }))
    expect(screen.getAllByRole("listitem")).toHaveLength(7)

    await user.click(screen.getByRole("button", { name: "Cargar más" }))
    expect(fetchNextPage).toHaveBeenCalled()
  })

  it("sin vencidos lo dice", () => {
    state = {
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { pages: [page([], 0, false)] },
      hasNextPage: false,
      isFetchingNextPage: false,
    }
    render(<OverdueServices />)
    expect(screen.getByText(/Ningún servicio vencido/)).toBeInTheDocument()
  })
})
