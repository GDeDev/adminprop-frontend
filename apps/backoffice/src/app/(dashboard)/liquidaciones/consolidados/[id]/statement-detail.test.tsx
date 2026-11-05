import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type {
  OwnerStatementDetail,
  SettlementSummary,
} from "@adminprop/shared-types"

import { StatementDetailScreen } from "./statement-detail"

let statement: OwnerStatementDetail
const close = vi.fn()

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))
vi.mock("@adminprop/session/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@adminprop/session/client")>()),
  useSession: () => ({ user: { id: "u1", role: "ADMIN" } }),
}))
vi.mock("@/components/download-pdf-button", () => ({
  DownloadPdfButton: () => null,
}))
vi.mock("@/lib/settlements-api", () => ({
  useStatement: () => ({ isPending: false, isError: false, data: statement }),
  useStatementCandidates: () => ({
    isPending: false,
    isError: false,
    data: [],
  }),
  useAddStatementSettlements: () => ({ mutateAsync: vi.fn() }),
  useCloseStatement: () => ({ mutateAsync: close, isPending: false }),
  useRemoveStatementSettlement: () => ({ mutateAsync: vi.fn() }),
  useReopenStatement: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

function makeSettlement(): SettlementSummary {
  return {
    id: "s1",
    pdfUrl: null,
    period: "2026-10",
    sequence: 1,
    status: "CONFIRMED",
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
    adjustmentsTotal: "-30000.00",
    withholdingsTotal: "-4000.00",
    advancesTotal: "-25000.00",
    otherAdjustmentsTotal: "-1000.00",
    netAmount: "160000.00",
    transferredTotal: "0.00",
    statementId: "st1",
    hasVoidedPayments: false,
    confirmedAt: "2026-10-06T00:00:00.000Z",
    createdAt: "2026-10-05T00:00:00.000Z",
  }
}

function makeStatement(): OwnerStatementDetail {
  return {
    id: "st1",
    owner: { id: "o1", fullName: "Juan Pérez" },
    period: "2026-10",
    status: "OPEN",
    sendMode: "BOTH",
    settlementsCount: 1,
    totals: [
      {
        currency: "ARS",
        rentTotal: "200000.00",
        lateFeeTotal: "0.00",
        chargesTotal: "0.00",
        feeTotal: "10000.00",
        expensesTotal: "0.00",
        adjustmentsTotal: "-30000.00",
        withholdingsTotal: "-4000.00",
        advancesTotal: "-25000.00",
        otherAdjustmentsTotal: "-1000.00",
        netTotal: "160000.00",
        transferredTotal: "0.00",
      },
    ],
    closedAt: null,
    pdfUrl: null,
    createdAt: "2026-11-01T00:00:00.000Z",
    settlements: [makeSettlement()],
    closedBy: null,
    notes: null,
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("StatementDetailScreen", () => {
  it("muestra retenciones, adelantos y otros ajustes por separado, con el total aparte", () => {
    statement = makeStatement()
    render(<StatementDetailScreen id="st1" />)

    const adjustments = screen.getByRole("group", {
      name: "Ajustes en ARS",
    })
    expect(within(adjustments).getByText("Retenciones")).toBeInTheDocument()
    expect(within(adjustments).getByText("−$ 4.000,00")).toBeInTheDocument()
    expect(within(adjustments).getByText("Adelantos")).toBeInTheDocument()
    expect(within(adjustments).getByText("−$ 25.000,00")).toBeInTheDocument()
    expect(within(adjustments).getByText("Otros ajustes")).toBeInTheDocument()
    expect(within(adjustments).getByText("−$ 1.000,00")).toBeInTheDocument()
    expect(within(adjustments).getByText("Ajustes (total)")).toBeInTheDocument()
    expect(within(adjustments).getByText("−$ 30.000,00")).toBeInTheDocument()

    // La tabla de liquidaciones tiene sus tres columnas.
    const table = screen.getByRole("table")
    expect(
      within(table).getByRole("columnheader", { name: "Retenciones" })
    ).toBeInTheDocument()
    expect(
      within(table).getByRole("columnheader", { name: "Adelantos" })
    ).toBeInTheDocument()
    expect(
      within(table).getByRole("columnheader", { name: "Otros ajustes" })
    ).toBeInTheDocument()
  })

  it("el diálogo de cierre repite el desglose que se va a congelar", async () => {
    statement = makeStatement()
    close.mockResolvedValue({})
    const user = userEvent.setup()
    render(<StatementDetailScreen id="st1" />)

    await user.click(screen.getByRole("button", { name: "Cerrar" }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(/Lo que se congela · ARS/)).toBeVisible()
    expect(within(dialog).getByText("Retenciones")).toBeVisible()
    expect(within(dialog).getByText("−$ 25.000,00")).toBeVisible()
    expect(within(dialog).getByText("$ 160.000,00")).toBeVisible()
  })
})
