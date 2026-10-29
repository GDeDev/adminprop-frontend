import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { InstallmentDetail, Payment } from "@adminprop/shared-types"

import { InstallmentDetailScreen } from "./installment-detail"

let installment: InstallmentDetail
let role: "ADMIN" | "EMPLOYEE" = "ADMIN"
const registerPayment = vi.fn()
const confirmPayment = vi.fn()
const voidPayment = vi.fn()
const adjustLateFee = vi.fn()

vi.mock("@adminprop/session/client", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@adminprop/session/client")>()
  return {
    ...actual,
    useSession: () => ({ user: { id: "u1", role } }),
  }
})

vi.mock("@/lib/billing-api", () => ({
  useInstallment: () => ({
    isPending: false,
    isError: false,
    data: installment,
  }),
  useRegisterPayment: () => ({
    mutateAsync: registerPayment,
    isPending: false,
  }),
  useConfirmPayment: () => ({ mutateAsync: confirmPayment, isPending: false }),
  useVoidPayment: () => ({ mutateAsync: voidPayment, isPending: false }),
  useVoidCharge: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateCharge: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAdjustLateFee: () => ({ mutateAsync: adjustLateFee, isPending: false }),
  useApplyCredit: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "pay1",
    installmentId: "i1",
    contractId: "c1",
    renterId: "r1",
    period: "2026-10",
    paidAt: "2026-10-15",
    paidCurrency: "ARS",
    amount: "100000.00",
    exchangeRate: null,
    exchangeRateSource: null,
    exchangeRateDate: null,
    amountInContractCurrency: "100000.00",
    kind: "CASH_IN",
    method: "TRANSFER",
    receivedBy: "AGENCY",
    status: "CONFIRMED",
    lateFeeApplied: "50000.00",
    rentApplied: "50000.00",
    chargesApplied: "0.00",
    creditGenerated: "0.00",
    creditId: null,
    receiptUrl: "https://files.test/recibo.pdf",
    notes: null,
    registeredBy: { id: "u1", fullName: "Marta Admin" },
    confirmedAt: "2026-10-15T12:00:00.000Z",
    confirmedBy: null,
    voidedAt: null,
    voidedBy: null,
    voidReason: null,
    createdAt: "2026-10-15T12:00:00.000Z",
    ...overrides,
  }
}

function makeInstallment(
  overrides: Partial<InstallmentDetail> = {}
): InstallmentDetail {
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
    lateFeeAccrued: "50000.00",
    lateFeeAdjusted: "0.00",
    lateFeeWaived: false,
    lateFeeBalance: "0.00",
    paidTotal: "100000.00",
    rentBalance: "150000.00",
    chargesBalance: "0.00",
    totalDue: "150000.00",
    pendingConfirmationTotal: "0.00",
    status: "OVERDUE",
    graceEndDate: "2026-10-10",
    feeDays: 5,
    paidAt: null,
    collectionMode: "AGENCY",
    feeMode: "DEDUCTED",
    createdAt: "2026-09-28T00:00:00.000Z",
    lateFeePercentage: "5.00",
    lateFeeGraceDays: 10,
    feePercentage: "5.00",
    feeAmount: null,
    feeOnBase: "10000.00",
    feeOnCollected: "2500.00",
    charges: [],
    payments: [makePayment()],
    lateFeeAdjustments: [],
    lateFeeDays: Array.from({ length: 5 }, (_, i) => ({
      day: `2026-10-1${i + 1}`,
      dayNumber: i + 1,
      outstandingBase: "200000.00",
      dailyPercentage: "5.00",
      amount: "10000.00",
    })),
    creditsAvailable: "0.00",
    notes: null,
    updatedAt: "2026-10-15T12:00:00.000Z",
    ...overrides,
  }
}

afterEach(() => {
  vi.clearAllMocks()
  role = "ADMIN"
})

describe("InstallmentDetailScreen", () => {
  it("muestra el desglose con el saldo, el día por día y los pagos imputados", () => {
    installment = makeInstallment()
    render(<InstallmentDetailScreen id="i1" />)

    expect(
      screen.getByRole("heading", { name: "Cuota de octubre de 2026" })
    ).toBeInTheDocument()
    const desglose = screen.getByRole("region", { name: "Desglose" })
    expect(within(desglose).getByText("$ 150.000,00")).toBeInTheDocument()
    expect(
      within(desglose).getByText(/Punitorio devengado \(5 días\)/)
    ).toBeInTheDocument()
    expect(within(desglose).getAllByRole("row")).toHaveLength(6)

    const pagos = screen.getByRole("region", { name: "Pagos" })
    expect(
      within(pagos).getByText(
        /punitorio \$ 50\.000,00 · alquiler \$ 50\.000,00/
      )
    ).toBeInTheDocument()
    expect(
      within(pagos).getByRole("link", { name: /Comprobante/ })
    ).toHaveAttribute("href", "https://files.test/recibo.pdf")
    expect(
      screen.getByRole("button", { name: "Ajustar punitorio" })
    ).toBeInTheDocument()
  })

  it("el empleado no puede anular ni ajustar; confirma un pago informado", async () => {
    role = "EMPLOYEE"
    installment = makeInstallment({
      payments: [
        makePayment({
          id: "pay2",
          receivedBy: "OWNER",
          status: "PENDING_CONFIRMATION",
          receiptUrl: null,
        }),
      ],
    })
    confirmPayment.mockResolvedValue({})
    const user = userEvent.setup()
    render(<InstallmentDetailScreen id="i1" />)

    expect(
      screen.queryByRole("button", { name: "Ajustar punitorio" })
    ).toBeNull()
    expect(screen.queryByRole("button", { name: /Anular pago/ })).toBeNull()
    expect(
      screen.getByText("Lo cobró el propietario", { exact: false })
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Confirmar" }))
    expect(confirmPayment).toHaveBeenCalledWith("pay2")
  })

  it("registra un pago parcial en pesos sobre un contrato en dólares con cotización", async () => {
    installment = makeInstallment({
      currency: "USD",
      baseAmount: "1000.00",
      lateFeeAccrued: "0.00",
      feeDays: 0,
      status: "PENDING",
      paidTotal: "0.00",
      rentBalance: "1000.00",
      totalDue: "1000.00",
      payments: [],
      lateFeeDays: [],
    })
    registerPayment.mockResolvedValue({
      payment: makePayment({ creditGenerated: "0.00" }),
      creditApplications: [],
      installment,
    })
    const user = userEvent.setup()
    render(<InstallmentDetailScreen id="i1" />)

    await user.click(screen.getByRole("button", { name: "Registrar pago" }))
    const dialog = screen.getByRole("dialog")
    await user.type(within(dialog).getByLabelText("Monto pagado"), "625000")
    await user.click(within(dialog).getByRole("combobox", { name: "Moneda" }))
    await user.click(screen.getByRole("option", { name: "Pesos (ARS)" }))

    // Sin cotización no manda.
    await user.click(
      within(dialog).getByRole("button", { name: "Registrar pago" })
    )
    expect(registerPayment).not.toHaveBeenCalled()
    expect(
      within(dialog).getByText("Ingresá la cotización.")
    ).toBeInTheDocument()

    await user.type(within(dialog).getByLabelText("Cotización"), "1250")
    await user.click(within(dialog).getByRole("combobox", { name: "Fuente" }))
    await user.click(screen.getByRole("option", { name: "MEP" }))
    await user.click(
      within(dialog).getByRole("button", { name: "Registrar pago" })
    )

    expect(registerPayment).toHaveBeenCalledTimes(1)
    const sent = registerPayment.mock.calls[0]![0]
    expect(sent).toMatchObject({
      installmentId: "i1",
      amount: "625000",
      paidCurrency: "ARS",
      exchangeRate: "1250",
      exchangeRateSource: "MEP",
      method: "TRANSFER",
      receivedBy: "AGENCY",
    })
    expect(sent.allocation).toBeUndefined()
  })

  it("condona el punitorio con motivo (admin)", async () => {
    installment = makeInstallment()
    adjustLateFee.mockResolvedValue({})
    const user = userEvent.setup()
    render(<InstallmentDetailScreen id="i1" />)

    await user.click(screen.getByRole("button", { name: "Ajustar punitorio" }))
    const dialog = screen.getByRole("dialog")
    await user.click(within(dialog).getByLabelText(/Condonar todo/))
    await user.click(within(dialog).getByRole("button", { name: "Condonar" }))
    expect(adjustLateFee).not.toHaveBeenCalled()
    await user.type(
      within(dialog).getByLabelText("Motivo"),
      "Acuerdo con el inquilino"
    )
    await user.click(within(dialog).getByRole("button", { name: "Condonar" }))
    expect(adjustLateFee).toHaveBeenCalledWith({
      installmentId: "i1",
      kind: "WAIVE",
      amount: undefined,
      reason: "Acuerdo con el inquilino",
    })
  })
})
