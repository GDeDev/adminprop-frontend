import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { SettlementDetail } from "@adminprop/shared-types"

import { OwnerSettlementDetailScreen } from "./settlement-detail"

const acknowledge = vi.fn()
let settlement: SettlementDetail & { acknowledgedAt: string | null }

vi.mock("@/lib/portal-api", () => ({
  useOwnerSettlement: () => ({
    isPending: false,
    isError: false,
    data: settlement,
  }),
  useAcknowledgeSettlement: () => ({
    mutateAsync: acknowledge,
    isPending: false,
  }),
  ownerSettlementPdfUrl: (id: string) =>
    `/api/portal/owner/settlements/${id}/pdf`,
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe("OwnerSettlementDetailScreen", () => {
  it("muestra el desglose, el PDF y el acuse de recibo de una transferida", async () => {
    settlement = {
      id: "s1",
      period: "2026-10",
      sequence: 1,
      status: "TRANSFERRED",
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
      expensesTotal: "15000.00",
      adjustmentsTotal: "0.00",
      netAmount: "175000.00",
      transferredTotal: "175000.00",
      statementId: null,
      hasVoidedPayments: false,
      confirmedAt: "2026-10-06T00:00:00.000Z",
      createdAt: "2026-10-05T00:00:00.000Z",
      feeMode: "DEDUCTED",
      feePercentage: "5.00",
      feeAmountFixed: null,
      feeBase: "200000.00",
      mixedFeeTerms: false,
      ownerBankAccountMissing: false,
      payments: [],
      expenses: [
        {
          expenseId: "e1",
          description: "Plomero",
          expenseDate: "2026-10-03",
          amount: "15000.00",
        },
      ],
      skippedExpenses: [],
      adjustments: [],
      transfers: [
        {
          id: "t1",
          transferredAt: "2026-10-07",
          amount: "175000.00",
          method: "TRANSFER",
          receiptUrl: null,
          notes: null,
          registeredBy: null,
          voidedAt: null,
        },
      ],
      confirmedBy: null,
      cancelledAt: null,
      cancelReason: null,
      notes: null,
      updatedAt: "2026-10-07T00:00:00.000Z",
      acknowledgedAt: null,
    }
    acknowledge.mockResolvedValue({})
    const user = userEvent.setup()
    render(<OwnerSettlementDetailScreen id="s1" />)

    expect(
      screen.getByText("$ 175.000,00", { selector: "dd" })
    ).toBeInTheDocument()
    expect(screen.getByText("−$ 10.000,00")).toBeInTheDocument()
    expect(screen.getByText(/Plomero/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Descargar PDF/ })).toHaveAttribute(
      "href",
      "/api/portal/owner/settlements/s1/pdf"
    )
    await user.click(
      screen.getByRole("button", { name: /Recibí la transferencia/ })
    )
    expect(acknowledge).toHaveBeenCalledWith("s1")
  })
})
