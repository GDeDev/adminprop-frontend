import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type {
  BillingSummary,
  InstallmentSummary,
  PaymentListItem,
} from "@adminprop/shared-types"

import { BillingScreen } from "./billing-screen"

const generate = vi.fn()
const confirm = vi.fn()
let installments: InstallmentSummary[] = []
let summary: BillingSummary = { period: "2026-10", byCurrency: [] }
let payments: PaymentListItem[] = []
let lastInstallmentFilters: Record<string, unknown> = {}

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

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/lib/billing-api", () => ({
  useInfiniteInstallments: (filters: Record<string, unknown>) => {
    lastInstallmentFilters = filters
    return {
      isPending: false,
      isError: false,
      data: { pages: [page(installments)] },
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    }
  },
  useBillingSummary: () => ({
    isPending: false,
    isError: false,
    data: summary,
  }),
  useGenerateInstallments: () => ({ mutateAsync: generate, isPending: false }),
  useInfinitePayments: () => ({
    isPending: false,
    isError: false,
    data: { pages: [page(payments)] },
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  }),
  useConfirmPayment: () => ({ mutateAsync: confirm, isPending: false }),
}))

function makeInstallment(
  overrides: Partial<InstallmentSummary> = {}
): InstallmentSummary {
  return {
    id: "i1",
    period: "2026-10",
    contract: { id: "c1" },
    property: { id: "p1", address: "Calle 1 100" },
    renter: { id: "r1", fullName: "Iván López" },
    owner: { id: "o1", fullName: "Juan Pérez" },
    currency: "ARS",
    baseAmount: "200000.00",
    chargesTotal: "0.00",
    lateFeeAccrued: "0.00",
    lateFeeAdjusted: "0.00",
    lateFeeWaived: false,
    lateFeeBalance: "0.00",
    paidTotal: "0.00",
    rentBalance: "200000.00",
    chargesBalance: "0.00",
    totalDue: "200000.00",
    pendingConfirmationTotal: "0.00",
    status: "PENDING",
    graceEndDate: "2026-10-10",
    feeDays: 0,
    paidAt: null,
    collectionMode: "AGENCY",
    feeMode: "DEDUCTED",
    createdAt: "2026-09-28T00:00:00.000Z",
    ...overrides,
  }
}

afterEach(() => {
  vi.clearAllMocks()
  installments = []
  payments = []
  summary = { period: "2026-10", byCurrency: [] }
})

describe("BillingScreen", () => {
  it("muestra el resumen por moneda y las cuotas con su estado", () => {
    summary = {
      period: "2026-10",
      byCurrency: [
        {
          currency: "ARS",
          total: 3,
          pending: 1,
          partial: 0,
          overdue: 1,
          paid: 1,
          baseTotal: "600000.00",
          chargesTotal: "0.00",
          collectedTotal: "200000.00",
          collectedByAgency: "200000.00",
          collectedByOwner: "0.00",
          pendingConfirmationTotal: "0.00",
          lateFeeAccrued: "50000.00",
          lateFeeCollected: "0.00",
          feeAccruedOnBase: "30000.00",
          feeAccruedOnCollected: "10000.00",
          balanceTotal: "450000.00",
        },
      ],
    }
    installments = [
      makeInstallment(),
      makeInstallment({
        id: "i2",
        renter: { id: "r2", fullName: "Ana Gómez" },
        status: "OVERDUE",
        feeDays: 5,
        lateFeeAccrued: "50000.00",
        lateFeeBalance: "50000.00",
        totalDue: "250000.00",
        collectionMode: "OWNER_DIRECT",
        pendingConfirmationTotal: "100000.00",
      }),
      makeInstallment({
        id: "i3",
        renter: { id: "r3", fullName: "Luis Díaz" },
        status: "PAID",
        paidAt: "2026-10-05",
        paidTotal: "200000.00",
        rentBalance: "0.00",
        totalDue: "0.00",
      }),
    ]
    render(<BillingScreen />)

    const resumen = screen.getByRole("region", { name: "Resumen en ARS" })
    expect(within(resumen).getByText("$ 200.000,00")).toBeInTheDocument()
    expect(within(resumen).getByText("$ 450.000,00")).toBeInTheDocument()
    expect(
      within(resumen).getByText(/Punitorios devengados: \$ 50\.000,00/)
    ).toBeInTheDocument()

    expect(screen.getAllByText("Pendiente").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Vencida · 5 días").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Cobrada").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Pago sin confirmar").length).toBeGreaterThan(0)
    expect(
      screen.getAllByRole("link", { name: "Ana Gómez" })[0]
    ).toHaveAttribute("href", "/cobros/i2")
    expect(screen.getAllByText(/Pagó el 05\/10\/2026/).length).toBeGreaterThan(
      0
    )
  })

  it("cambia de mes con las flechas y manda el filtro de estado", async () => {
    const user = userEvent.setup()
    render(<BillingScreen />)
    const month = screen.getByLabelText("Mes") as HTMLInputElement
    const before = month.value

    await user.click(screen.getByRole("button", { name: "Mes siguiente" }))
    expect(month.value).not.toBe(before)
    expect(lastInstallmentFilters.period).toBe(month.value)
  })

  it("genera las cuotas del mes y avisa cuántas creó", async () => {
    generate.mockResolvedValue({
      period: "2026-11",
      contracts: 4,
      created: 3,
      skipped: 1,
    })
    const user = userEvent.setup()
    render(<BillingScreen />)

    await user.click(screen.getByRole("button", { name: "Generar cuotas" }))
    await user.click(screen.getByRole("button", { name: "Generar" }))
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it("la pestaña de pagos por confirmar lista los informados y confirma", async () => {
    payments = [
      {
        id: "pay1",
        installmentId: "i2",
        contractId: "c1",
        renterId: "r2",
        period: "2026-10",
        paidAt: "2026-10-12",
        paidCurrency: "ARS",
        amount: "100000.00",
        exchangeRate: null,
        exchangeRateSource: null,
        exchangeRateDate: null,
        amountInContractCurrency: "100000.00",
        kind: "CASH_IN",
        method: "TRANSFER",
        receivedBy: "OWNER",
        status: "PENDING_CONFIRMATION",
        lateFeeApplied: "0.00",
        rentApplied: "100000.00",
        chargesApplied: "0.00",
        creditGenerated: "0.00",
        creditId: null,
        receiptUrl: null,
        notes: null,
        registeredBy: null,
        confirmedAt: null,
        confirmedBy: null,
        voidedAt: null,
        voidedBy: null,
        voidReason: null,
        createdAt: "2026-10-12T00:00:00.000Z",
        renter: { id: "r2", fullName: "Ana Gómez" },
        property: { id: "p1", address: "Calle 1 100" },
        currency: "ARS",
      },
    ]
    confirm.mockResolvedValue({})
    const user = userEvent.setup()
    render(<BillingScreen />)

    await user.click(screen.getByRole("tab", { name: "Pagos por confirmar" }))
    expect(screen.getAllByText("Ana Gómez").length).toBeGreaterThan(0)
    await user.click(screen.getAllByRole("button", { name: "Confirmar" })[0]!)
    expect(confirm).toHaveBeenCalledWith("pay1")
  })
})
