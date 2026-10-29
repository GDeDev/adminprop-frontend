import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { RenterDetail, User } from "@adminprop/shared-types"

import { RenterDetailScreen } from "./renter-detail"

let renter: RenterDetail

function makeRenter(overrides: Partial<RenterDetail> = {}): RenterDetail {
  return {
    id: "renter-1",
    firstName: "Lucía",
    lastName: "Gómez",
    fullName: "Lucía Gómez",
    nationalId: "30123456",
    phone: "11 5555-1234",
    email: "lucia@demo.local",
    address: null,
    notes: null,
    moveInDate: "2026-03-01",
    hasPortalAccess: false,
    activeContractId: null,
    paymentStatus: null,
    guarantor: {
      id: "g1",
      fullName: "Ricardo Sosa",
      nationalId: "14567890",
      phone: null,
      email: null,
      guaranteeType: "PAYSLIPS",
      guaranteeDetail: "Empleado de Acme, $900.000",
    },
    activeContract: null,
    payments: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@/lib/billing-api", () => ({
  useRenterArrears: () => ({
    isPending: false,
    isError: false,
    data: undefined,
  }),
  useRenterCredits: () => ({
    isPending: false,
    isError: false,
    data: { renterId: "r1", totals: [], credits: [] },
  }),
  useRefundCredit: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))
vi.mock("@adminprop/session/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@adminprop/session/client")>()),
  useSession: () => ({ user: { id: "u1", role: "ADMIN" } as User }),
}))
vi.mock("@/lib/renters-api", () => ({
  useRenter: () => ({ isPending: false, isError: false, data: renter }),
  useIssueRenterPortalCredentials: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteRenter: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

describe("RenterDetailScreen", () => {
  it("muestra el garante expandido con link, la fecha de ingreso y el botón de WhatsApp", () => {
    renter = makeRenter()
    render(<RenterDetailScreen id="renter-1" />)

    expect(screen.getByRole("link", { name: "Ricardo Sosa" })).toHaveAttribute(
      "href",
      "/garantes/g1"
    )
    expect(screen.getByText("Recibos de sueldo")).toBeInTheDocument()
    expect(screen.getByText("Empleado de Acme, $900.000")).toBeInTheDocument()
    expect(screen.getByText(/Ingresó el 01\/03\/2026/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
      "href",
      "https://wa.me/5491155551234"
    )
  })

  it("sin garante ofrece asignarlo; sin cuotas el estado de pago dice sin datos", () => {
    renter = makeRenter({ guarantor: null, phone: null })
    render(<RenterDetailScreen id="renter-1" />)

    expect(screen.getByText(/Sin garante/)).toBeInTheDocument()
    expect(screen.getAllByText("Sin datos")).toHaveLength(2)
    expect(
      screen.queryByRole("link", { name: "WhatsApp" })
    ).not.toBeInTheDocument()
  })
})
