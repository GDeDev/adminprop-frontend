import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type {
  FeeReceivable,
  OwnerStatementSummary,
  SettlementSummary,
} from "@adminprop/shared-types"

import { SettlementsScreen } from "./settlements-screen"

let settlements: SettlementSummary[] = []
let statements: OwnerStatementSummary[] = []
let receivables: FeeReceivable[] = []

function page<T>(items: T[]) {
  return {
    data: items,
    pagination: {
      page: 1,
      limit: 20,
      total: items.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  }
}

const infinite = <T,>(items: () => T[]) => ({
  isPending: false,
  isError: false,
  data: { pages: [page(items())] },
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: vi.fn(),
})

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/components/owner-select", () => ({
  OwnerSelect: () => <div data-testid="owner-select" />,
}))
vi.mock("@/components/property-select", () => ({
  PropertySelect: () => <div data-testid="property-select" />,
}))

vi.mock("@/lib/settlements-api", () => ({
  useInfiniteSettlements: () => infinite(() => settlements),
  useInfiniteStatements: () => infinite(() => statements),
  useInfiniteFeeReceivables: () => infinite(() => receivables),
  useCreateStatement: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateSettlement: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRegisterFeePayment: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))
vi.mock("@/lib/contracts-api", () => ({
  useInfiniteContracts: () => infinite(() => []),
}))

function makeSettlement(
  overrides: Partial<SettlementSummary> = {}
): SettlementSummary {
  return {
    id: "s1",
    period: "2026-10",
    sequence: 1,
    status: "PENDING",
    contract: { id: "c1" },
    property: { id: "p1", address: "Calle 1 100" },
    owner: { id: "o1", fullName: "Juan Pérez" },
    renter: { id: "r1", fullName: "Iván López" },
    currency: "ARS",
    rentTotal: "200000.00",
    lateFeeTotal: "0.00",
    ownerChargesTotal: "0.00",
    serviceChargesTotal: "0.00",
    feeTotal: "10000.00",
    feeDeducted: true,
    expensesTotal: "0.00",
    adjustmentsTotal: "0.00",
    netAmount: "190000.00",
    transferredTotal: "0.00",
    statementId: null,
    hasVoidedPayments: false,
    confirmedAt: null,
    createdAt: "2026-10-05T00:00:00.000Z",
    ...overrides,
  }
}

afterEach(() => {
  vi.clearAllMocks()
  settlements = []
  statements = []
  receivables = []
})

describe("SettlementsScreen", () => {
  it("lista las liquidaciones con neto, honorarios descontados y estado", () => {
    settlements = [
      makeSettlement(),
      makeSettlement({
        id: "s2",
        sequence: 2,
        status: "TRANSFERRED",
        transferredTotal: "190000.00",
        statementId: "st1",
        hasVoidedPayments: true,
      }),
    ]
    render(<SettlementsScreen />)

    expect(
      screen.getAllByRole("link", { name: "Juan Pérez" })[0]
    ).toHaveAttribute("href", "/liquidaciones/s1")
    expect(screen.getAllByText("−$ 10.000,00").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Pendiente").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Transferida").length).toBeGreaterThan(0)
    expect(screen.getAllByText("En consolidado").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Con pago anulado").length).toBeGreaterThan(0)
    expect(screen.getAllByText("2026-10 · 2").length).toBeGreaterThan(0)
  })

  it("la pestaña de consolidados muestra el estado y los netos por moneda", async () => {
    statements = [
      {
        id: "st1",
        owner: { id: "o1", fullName: "Juan Pérez" },
        period: "2026-10",
        status: "CLOSED",
        sendMode: "BOTH",
        settlementsCount: 2,
        totals: [
          {
            currency: "ARS",
            rentTotal: "400000.00",
            lateFeeTotal: "0.00",
            chargesTotal: "0.00",
            feeTotal: "20000.00",
            expensesTotal: "0.00",
            adjustmentsTotal: "0.00",
            netTotal: "380000.00",
            transferredTotal: "380000.00",
          },
        ],
        closedAt: "2026-11-02T00:00:00.000Z",
        createdAt: "2026-11-01T00:00:00.000Z",
      },
    ]
    const user = userEvent.setup()
    render(<SettlementsScreen />)
    await user.click(screen.getByRole("tab", { name: "Consolidados" }))

    expect(screen.getByText("Cerrado")).toBeInTheDocument()
    expect(screen.getByText(/Neto \$ 380\.000,00/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Juan Pérez/ })).toHaveAttribute(
      "href",
      "/liquidaciones/consolidados/st1"
    )
  })

  it("la pestaña de honorarios lista los pendientes con quién paga", async () => {
    receivables = [
      {
        id: "f1",
        owner: { id: "o1", fullName: "Juan Pérez" },
        contract: { id: "c1" },
        property: { id: "p1", address: "Calle 1 100" },
        installmentPeriod: "2026-10",
        currency: "ARS",
        source: "OWNER_DIRECT_PAYMENT",
        payer: "OWNER",
        amount: "10000.00",
        paidAmount: "0.00",
        status: "PENDING",
        feePercentage: "5.00",
        feeAmountFixed: null,
        baseAmount: "200000.00",
        needsReview: false,
        createdAt: "2026-10-15T00:00:00.000Z",
      },
    ]
    const user = userEvent.setup()
    render(<SettlementsScreen />)
    await user.click(screen.getByRole("tab", { name: "Honorarios" }))

    expect(screen.getByText(/1 pendientes de 1/)).toBeInTheDocument()
    expect(
      screen.getByText(/Cobró el propietario · paga propietario/)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Registrar pago" })
    ).toBeInTheDocument()
  })
})
