import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { GuarantorSummary } from "@adminprop/shared-types"

import { GuarantorList } from "./guarantor-list"

const guarantors: GuarantorSummary[] = [
  {
    id: "g1",
    firstName: "Ricardo",
    lastName: "Sosa",
    fullName: "Ricardo Sosa",
    nationalId: "14567890",
    phone: "11 5555-1234",
    email: null,
    guaranteeType: "PROPERTY",
    guaranteeDetail: "Av. Rivadavia 5400, CABA",
    renterCount: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
]

vi.mock("@/lib/renters-api", () => ({
  useInfiniteGuarantors: () => ({
    isPending: false,
    isError: false,
    data: {
      pages: [
        {
          data: guarantors,
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
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
  useGuarantorDataCheck: () => ({ data: undefined }),
  useCreateGuarantor: () => ({ mutateAsync: vi.fn() }),
  useUpdateGuarantor: () => ({ mutateAsync: vi.fn() }),
}))

describe("GuarantorList", () => {
  it("muestra tipo de garantía y cantidad de inquilinos", () => {
    render(<GuarantorList />)

    const table = screen.getByRole("table")
    expect(within(table).getByText("Ricardo Sosa")).toBeInTheDocument()
    expect(within(table).getByText("Propiedad en garantía")).toBeInTheDocument()
    expect(within(table).getByText("2 inquilinos")).toBeInTheDocument()
  })

  it("el alta pide el detalle según el tipo de garantía", async () => {
    render(<GuarantorList />)
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Nuevo garante" }))

    expect(
      await screen.findByLabelText("Inmueble en garantía")
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Crear garante" }))
    expect(await screen.findByText("Describí la garantía.")).toBeInTheDocument()
  })
})
