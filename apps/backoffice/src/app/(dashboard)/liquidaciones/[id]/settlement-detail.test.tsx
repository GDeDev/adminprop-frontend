import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { SettlementDetail } from "@adminprop/shared-types"

import { SettlementDetailScreen } from "./settlement-detail"

let settlement: SettlementDetail
let role: "ADMIN" | "EMPLOYEE" = "ADMIN"
const confirm = vi.fn()
const addAdjustment = vi.fn()
const registerTransfer = vi.fn()

vi.mock("@adminprop/session/client", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@adminprop/session/client")>()
  return { ...actual, useSession: () => ({ user: { id: "u1", role } }) }
})

vi.mock("@/lib/settlements-api", () => ({
  useSettlement: () => ({ isPending: false, isError: false, data: settlement }),
  useRecalculateSettlement: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useConfirmSettlement: () => ({ mutateAsync: confirm, isPending: false }),
  useCancelSettlement: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useVoidSettlementAdjustment: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useVoidTransfer: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddSettlementAdjustment: () => ({
    mutateAsync: addAdjustment,
    isPending: false,
  }),
  useRegisterTransfer: () => ({
    mutateAsync: registerTransfer,
    isPending: false,
  }),
}))

function makeSettlement(
  overrides: Partial<SettlementDetail> = {}
): SettlementDetail {
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
    lateFeeTotal: "50000.00",
    ownerChargesTotal: "0.00",
    serviceChargesTotal: "30000.00",
    feeTotal: "10000.00",
    feeDeducted: true,
    expensesTotal: "15000.00",
    adjustmentsTotal: "-5000.00",
    netAmount: "220000.00",
    transferredTotal: "0.00",
    statementId: null,
    hasVoidedPayments: false,
    confirmedAt: null,
    createdAt: "2026-10-05T00:00:00.000Z",
    feeMode: "DEDUCTED",
    feePercentage: "5.00",
    feeAmountFixed: null,
    feeBase: "200000.00",
    mixedFeeTerms: false,
    ownerBankAccountMissing: true,
    payments: [
      {
        paymentId: "pay1",
        installmentPeriod: "2026-10",
        paidAt: "2026-10-15",
        rentApplied: "200000.00",
        lateFeeApplied: "50000.00",
        ownerChargesApplied: "0.00",
        serviceChargesApplied: "30000.00",
      },
    ],
    expenses: [
      {
        expenseId: "e1",
        description: "Plomero",
        expenseDate: "2026-10-03",
        amount: "15000.00",
      },
    ],
    skippedExpenses: [],
    adjustments: [
      {
        id: "a1",
        concept: "WITHHOLDING",
        description: "Retención IIBB",
        amount: "5000.00",
        createdBy: { id: "u1", fullName: "Marta Admin" },
        createdAt: "2026-10-05T00:00:00.000Z",
        voidedAt: null,
        voidReason: null,
      },
    ],
    transfers: [],
    confirmedBy: null,
    cancelledAt: null,
    cancelReason: null,
    notes: null,
    updatedAt: "2026-10-05T00:00:00.000Z",
    ...overrides,
  }
}

afterEach(() => {
  vi.clearAllMocks()
  role = "ADMIN"
})

describe("SettlementDetailScreen", () => {
  it("muestra el desglose, el aviso de cuenta bancaria y las acciones de una pendiente", async () => {
    settlement = makeSettlement()
    confirm.mockResolvedValue({})
    const user = userEvent.setup()
    render(<SettlementDetailScreen id="s1" />)

    const desglose = screen.getByRole("region", { name: "Desglose" })
    expect(within(desglose).getByText("$ 220.000,00")).toBeInTheDocument()
    expect(within(desglose).getByText("−$ 10.000,00")).toBeInTheDocument()
    expect(within(desglose).getByText("−$ 15.000,00")).toBeInTheDocument()
    expect(
      within(desglose).getByText(/30\.000,00 cobrados por servicios no entran/)
    ).toBeInTheDocument()
    expect(screen.getByText(/no tiene cuenta bancaria/)).toBeInTheDocument()
    expect(screen.getByText("Retención IIBB")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Confirmar" }))
    expect(confirm).toHaveBeenCalledWith("s1")
  })

  it("una confirmada permite registrar la transferencia y el empleado no cancela", async () => {
    role = "EMPLOYEE"
    settlement = makeSettlement({
      status: "CONFIRMED",
      confirmedAt: "2026-10-06T00:00:00.000Z",
      ownerBankAccountMissing: false,
    })
    registerTransfer.mockResolvedValue({})
    const user = userEvent.setup()
    render(<SettlementDetailScreen id="s1" />)

    expect(screen.queryByRole("button", { name: "Cancelar" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Confirmar" })).toBeNull()
    expect(
      screen.getByText(/Falta transferir \$ 220\.000,00/)
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Registrar transferencia" })
    )
    const dialog = screen.getByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Registrar" }))
    expect(registerTransfer).not.toHaveBeenCalled()
    await user.type(within(dialog).getByLabelText("Importe"), "120000")
    await user.click(within(dialog).getByRole("button", { name: "Registrar" }))
    expect(registerTransfer).toHaveBeenCalledTimes(1)
    expect(registerTransfer.mock.calls[0]![0]).toMatchObject({
      settlementId: "s1",
      amount: "120000",
      method: "TRANSFER",
    })
  })

  it("agrega un ajuste con concepto, descripción y monto", async () => {
    settlement = makeSettlement()
    addAdjustment.mockResolvedValue({})
    const user = userEvent.setup()
    render(<SettlementDetailScreen id="s1" />)

    await user.click(screen.getByRole("button", { name: "Agregar ajuste" }))
    const dialog = screen.getByRole("dialog")
    await user.click(within(dialog).getByRole("combobox", { name: "Concepto" }))
    await user.click(
      screen.getByRole("option", { name: "Adelanto al propietario" })
    )
    await user.type(
      within(dialog).getByLabelText("Descripción"),
      "Adelanto del 10/10"
    )
    await user.type(within(dialog).getByLabelText("Monto"), "20000")
    await user.click(within(dialog).getByRole("button", { name: "Agregar" }))
    expect(addAdjustment).toHaveBeenCalledWith({
      id: "s1",
      concept: "OWNER_ADVANCE",
      description: "Adelanto del 10/10",
      amount: "20000",
    })
  })
})
