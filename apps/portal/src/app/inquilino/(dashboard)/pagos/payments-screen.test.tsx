import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import type {
  InstallmentDetail,
  InstallmentSummary,
  Payment,
} from "@adminprop/shared-types"

import { RenterPaymentsScreen } from "./payments-screen"

const refetch = vi.fn()
const openPortalPdf = vi.fn()
let list: {
  isPending: boolean
  isError: boolean
  error?: unknown
  data?: { pages: { data: InstallmentSummary[] }[] }
}
let detail: InstallmentDetail | undefined
let detailError = false
const detailRefetch = vi.fn()

vi.mock("@/lib/portal-api", () => ({
  useRenterInstallments: () => ({
    ...list,
    refetch,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  }),
  useRenterInstallment: () => ({
    isError: detailError,
    error: detailError ? new Error("boom") : undefined,
    data: detail,
    refetch: detailRefetch,
  }),
  renterReceiptPath: (id: string) => `/portal/renter/payments/${id}/receipt`,
  openPortalPdf: (...args: unknown[]) => openPortalPdf(...args),
}))

function summary(overrides: Partial<InstallmentSummary>): InstallmentSummary {
  return {
    id: "i1",
    period: "2026-10",
    contract: { id: "c1" },
    property: { id: "p1", address: "Calle 1 100" },
    renter: { id: "r1", fullName: "Iván López" },
    owner: null,
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

function payment(overrides: Partial<Payment>): Payment {
  return {
    id: "pay1",
    installmentId: "i2",
    contractId: "c1",
    renterId: "r1",
    period: "2026-09",
    paidAt: "2026-09-05",
    paidCurrency: "ARS",
    amount: "200000.00",
    exchangeRate: null,
    exchangeRateSource: null,
    exchangeRateDate: null,
    amountInContractCurrency: "200000.00",
    kind: "CASH_IN",
    method: "TRANSFER",
    receivedBy: "AGENCY",
    status: "CONFIRMED",
    lateFeeApplied: "0.00",
    rentApplied: "200000.00",
    chargesApplied: "0.00",
    creditGenerated: "0.00",
    creditId: null,
    receiptUrl: null,
    receiptNumber: "0001",
    receiptPdfUrl: null,
    notes: null,
    registeredBy: null,
    confirmedAt: "2026-09-05T00:00:00.000Z",
    confirmedBy: null,
    voidedAt: null,
    voidedBy: null,
    voidReason: null,
    settlementId: null,
    createdAt: "2026-09-05T00:00:00.000Z",
    ...overrides,
  }
}

function detailOf(
  base: InstallmentSummary,
  payments: Payment[]
): InstallmentDetail {
  return {
    ...base,
    lateFeePercentage: "5.00",
    lateFeeGraceDays: 10,
    feePercentage: "5.00",
    feeAmount: null,
    feeOnBase: "10000.00",
    feeOnCollected: "0.00",
    charges: [],
    payments,
    lateFeeAdjustments: [],
    lateFeeDays: [],
    creditsAvailable: "0.00",
    notes: null,
    updatedAt: "2026-10-15T00:00:00.000Z",
  }
}

const overdue = summary({
  id: "i1",
  period: "2026-10",
  status: "OVERDUE",
  lateFeeAccrued: "50000.00",
  lateFeeBalance: "50000.00",
  totalDue: "250000.00",
})
const paid = summary({
  id: "i2",
  period: "2026-09",
  status: "PAID",
  paidTotal: "200000.00",
  rentBalance: "0.00",
  totalDue: "0.00",
  paidAt: "2026-09-05",
})

// jsdom no implementa pointer capture y el Drawer (mobile) lo usa al clickear.
beforeAll(() => {
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn(() => false)
})

afterEach(() => {
  vi.clearAllMocks()
  detail = undefined
  detailError = false
})

describe("RenterPaymentsScreen", () => {
  it("lista las cuotas con período, estado y saldo; la vencida muestra el punitorio", () => {
    list = {
      isPending: false,
      isError: false,
      data: { pages: [{ data: [overdue, paid] }] },
    }
    render(<RenterPaymentsScreen />)

    const rows = screen.getAllByRole("button")
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent("Octubre de 2026")
    expect(rows[0]).toHaveTextContent("Vencida")
    expect(rows[0]).toHaveTextContent("+ punitorio $ 50.000,00")
    expect(rows[0]).toHaveTextContent("falta $ 250.000,00")
    expect(rows[1]).toHaveTextContent("Septiembre de 2026")
    expect(rows[1]).toHaveTextContent("Pagada")
    expect(rows[1]).not.toHaveTextContent("falta")
    expect(rows[1]).not.toHaveTextContent("punitorio")
  })

  it("sin cuotas muestra el estado vacío", () => {
    list = { isPending: false, isError: false, data: { pages: [{ data: [] }] } }
    render(<RenterPaymentsScreen />)
    expect(screen.getByText("Todavía no hay cuotas")).toBeInTheDocument()
  })

  it("si falla la carga muestra el error y permite reintentar", async () => {
    list = { isPending: false, isError: true }
    const user = userEvent.setup()
    render(<RenterPaymentsScreen />)

    expect(screen.getByText("No pudimos cargar tus pagos")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(refetch).toHaveBeenCalled()
  })

  it("al abrir una cuota pagada muestra sus pagos y abre el recibo del cobro confirmado", async () => {
    list = {
      isPending: false,
      isError: false,
      data: { pages: [{ data: [paid] }] },
    }
    detail = detailOf(paid, [
      payment({ id: "pay1" }),
      payment({ id: "pay2", status: "VOIDED" }),
    ])
    const user = userEvent.setup()
    render(<RenterPaymentsScreen />)

    await user.click(screen.getByRole("button", { name: /Septiembre de 2026/ }))

    expect(
      await screen.findByText("Cuota de septiembre de 2026")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Pagada. Estos son los pagos registrados.")
    ).toBeInTheDocument()
    expect(screen.getByText(/05\/09\/2026 · Transferencia/)).toBeInTheDocument()
    // El pago anulado no se lista: sólo un recibo.
    const receipts = screen.getAllByRole("button", { name: "Recibo" })
    expect(receipts).toHaveLength(1)

    await user.click(receipts[0]!)
    expect(openPortalPdf).toHaveBeenCalledWith(
      "/portal/renter/payments/pay1/receipt"
    )
  })

  it("si falla el detalle de la cuota muestra el error con reintento y no dice Cargando", async () => {
    list = {
      isPending: false,
      isError: false,
      data: { pages: [{ data: [paid] }] },
    }
    detailError = true
    const user = userEvent.setup()
    render(<RenterPaymentsScreen />)

    await user.click(screen.getByRole("button", { name: /Septiembre de 2026/ }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("No pudimos cargar la cuota.")
    expect(screen.queryByText("Cargando…")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(detailRefetch).toHaveBeenCalled()
  })

  it("en una cuota con un pago informado sin confirmar no ofrece recibo", async () => {
    list = {
      isPending: false,
      isError: false,
      data: { pages: [{ data: [overdue] }] },
    }
    detail = detailOf(overdue, [
      payment({ id: "pay3", status: "PENDING_CONFIRMATION" }),
    ])
    const user = userEvent.setup()
    render(<RenterPaymentsScreen />)

    await user.click(screen.getByRole("button", { name: /Octubre de 2026/ }))

    expect(
      await screen.findByText("Informado, pendiente de confirmar.")
    ).toBeInTheDocument()
    expect(screen.getByText("Saldo: $ 250.000,00.")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Recibo" })
    ).not.toBeInTheDocument()
  })
})
