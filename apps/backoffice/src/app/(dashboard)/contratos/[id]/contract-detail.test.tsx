import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { ContractDetail } from "@adminprop/shared-types"

import { ContractDetailScreen } from "./contract-detail"

let contract: ContractDetail
let previewState: {
  isPending: boolean
  isError: boolean
  isSuccess: boolean
  data?: unknown
  error?: unknown
}
const terminate = vi.fn()
const applyRentUpdate = vi.fn()
const previewHook = vi.fn()

function makeContract(overrides: Partial<ContractDetail> = {}): ContractDetail {
  return {
    id: "c1",
    property: { id: "p1", address: "Calle 7 1234" },
    owner: { id: "o1", fullName: "María Fernández" },
    renter: { id: "r1", fullName: "Lucía Gómez" },
    guarantor: { id: "g1", fullName: "Ricardo Sosa" },
    startDate: "2025-03-01",
    endDate: "2028-02-29",
    currency: "ARS",
    initialRent: "480000.00",
    currentRent: "552000.00",
    deposit: "480000.00",
    rentUpdateType: "ICL",
    rentUpdateFrequency: "QUARTERLY",
    status: "ACTIVE",
    hasSurety: true,
    policyExpiresAt: "2020-01-01",
    suretyExpired: true,
    expiringSoon: false,
    expired: false,
    feePercentage: "5.00",
    collectionMode: "AGENCY",
    feeMode: "DEDUCTED",
    depositCurrency: "ARS",
    depositReturnMode: "FIXED",
    fixedIncreasePercentage: null,
    billingTerms: {
      id: "t1",
      effectiveFrom: "2025-03-01",
      collectionMode: "AGENCY",
      feeMode: "DEDUCTED",
      feePercentage: "5.00",
      feeAmount: null,
      lateFeePercentage: null,
      lateFeeGraceDays: null,
      inheritedLateFeePercentage: true,
      inheritedLateFeeGraceDays: true,
      notes: null,
      changedBy: null,
      createdAt: "2025-02-20T15:00:00.000Z",
    },
    billingTermsHistory: [],
    notes: null,
    contractPdfUrl: null,
    surety: {
      insurerName: "Finaer",
      insurerAlertEmail: "alertas@finaer.example",
      policyNumber: "FIN-1",
      policyExpiresAt: "2020-01-01",
      policyPdfUrl: "https://files.example/poliza.pdf",
      suretyExpired: true,
    },
    termination: null,
    renewedFromId: null,
    rentUpdates: [
      {
        id: "u2",
        effectiveFrom: "2025-06-01",
        previousRent: "480000.00",
        newRent: "552000.00",
        source: "INDEX",
        indexType: "ICL",
        indexFromPeriod: "2025-02",
        indexToPeriod: "2025-05",
        indexFromValue: "1000.000000",
        indexToValue: "1150.000000",
        appliedById: "u1",
        fixedPercentage: null,
        createdAt: "2025-06-01T00:00:00.000Z",
      },
      {
        id: "u1",
        effectiveFrom: "2025-03-01",
        previousRent: null,
        newRent: "480000.00",
        source: "INITIAL",
        indexType: null,
        indexFromPeriod: null,
        indexToPeriod: null,
        indexFromValue: null,
        indexToValue: null,
        appliedById: null,
        fixedPercentage: null,
        createdAt: "2025-03-01T00:00:00.000Z",
      },
    ],
    nextRentUpdateOn: "2025-09-01",
    timeline: { totalMonths: 36, elapsedMonths: 14, progressPercent: 39 },
    monthlyStatus: [],
    createdAt: "2025-02-20T15:00:00.000Z",
    updatedAt: "2025-02-20T15:00:00.000Z",
    ...overrides,
  }
}

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))
vi.mock("@/lib/contracts-api", () => ({
  useContract: () => ({ isPending: false, isError: false, data: contract }),
  useTerminationPreview: (id: string, notifiedAt: string) =>
    previewHook(id, notifiedAt) ?? previewState,
  useTerminateContract: () => ({ mutateAsync: terminate, isPending: false }),
  useApplyRentUpdate: () => ({
    mutateAsync: applyRentUpdate,
    isPending: false,
  }),
  useUpdateContract: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUploadContractDocument: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))
// Servicios y gastos tienen sus propios tests: acá, vacíos.
vi.mock("@/lib/billing-api", () => ({
  useContractInstallments: () => ({
    isPending: false,
    isError: false,
    data: { data: [], pagination: { total: 0 } },
  }),
  useContractAccount: () => ({ isPending: true, isError: false }),
}))
vi.mock("@/lib/services-api", () => ({
  useContractServices: () => ({ isPending: false, isError: false, data: [] }),
  useCreateService: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateService: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteService: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAdvanceExpenses: () => ({
    isPending: false,
    isError: false,
    data: { items: [], pendingTotal: "0.00", settledTotal: "0.00" },
  }),
  useCreateAdvanceExpense: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateAdvanceExpense: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteAdvanceExpense: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))
vi.mock("@adminprop/session/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@adminprop/session/client")>()),
  useSession: () => ({ user: { id: "u1", role: "EMPLOYEE" } }),
}))
vi.mock("@/components/guarantor-select", () => ({
  GuarantorSelect: (props: { id?: string; value: string | null }) => (
    <input
      id={props.id}
      aria-label={props.id}
      value={props.value ?? ""}
      readOnly
    />
  ),
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe("ContractDetailScreen", () => {
  it("muestra la línea de tiempo, las partes con link y el historial de aumentos", () => {
    contract = makeContract()
    previewState = { isPending: true, isError: false, isSuccess: false }
    render(<ContractDetailScreen id="c1" />)

    const timeline = screen.getByLabelText("Línea de tiempo del contrato")
    expect(within(timeline).getByText("14 de 36 meses")).toBeInTheDocument()
    expect(within(timeline).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "39"
    )

    expect(screen.getByRole("link", { name: "Lucía Gómez" })).toHaveAttribute(
      "href",
      "/inquilinos/r1"
    )
    expect(screen.getByRole("link", { name: "Ricardo Sosa" })).toHaveAttribute(
      "href",
      "/garantes/g1"
    )

    const history = screen.getByRole("table")
    expect(within(history).getByText("Por índice")).toBeInTheDocument()
    expect(within(history).getByText("Alquiler inicial")).toBeInTheDocument()
    expect(within(history).getAllByText("$ 552.000,00")).toHaveLength(1)
    expect(
      within(history).getByText(/ICL 02\/2025 \(1000\.000000\) → 05\/2025/)
    ).toBeInTheDocument()
  })

  it("marca la póliza vencida y ofrece ver la póliza", () => {
    contract = makeContract()
    previewState = { isPending: true, isError: false, isSuccess: false }
    render(<ContractDetailScreen id="c1" />)

    expect(screen.getByText("Póliza vencida")).toBeInTheDocument()
    expect(screen.getByText("Caución vencida")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Ver póliza" })).toHaveAttribute(
      "href",
      "https://files.example/poliza.pdf"
    )
  })

  it("un contrato rescindido muestra el bloque de rescisión y no las acciones", () => {
    contract = makeContract({
      status: "TERMINATED",
      termination: {
        notifiedAt: "2026-07-15",
        terminatedAt: "2026-07-15",
        penalty: "130000.00",
        futureRent: "1300000.00",
      },
      nextRentUpdateOn: null,
    })
    previewState = { isPending: true, isError: false, isSuccess: false }
    render(<ContractDetailScreen id="c1" />)

    expect(screen.getByText("Rescindido")).toBeInTheDocument()
    expect(screen.getByText("$ 130.000,00")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Rescindir" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: "Renovar" })
    ).not.toBeInTheDocument()
  })

  it("rescinde: fecha → vista previa de la multa → confirmación explícita", async () => {
    contract = makeContract()
    previewState = {
      isPending: false,
      isError: false,
      isSuccess: true,
      data: {
        currentRent: "552000.00",
        remainingMonths: 12,
        remainingDays: 30,
        totalDays: 395,
        futureRent: "7176000.00",
        penalty: "717600.00",
      },
    }
    terminate.mockResolvedValue({
      penalty: "717600.00",
      contract: makeContract({ status: "TERMINATED" }),
    })
    render(<ContractDetailScreen id="c1" />)
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Rescindir" }))

    const preview = await screen.findByLabelText("Vista previa de la rescisión")
    expect(within(preview).getByText("12 meses y 30 días")).toBeInTheDocument()
    expect(within(preview).getByText("$ 717.600,00")).toBeInTheDocument()

    const input = screen.getByLabelText("Fecha de notificación")
    await user.clear(input)
    await user.type(input, "2026-12-01")
    expect(previewHook).toHaveBeenLastCalledWith("c1", "2026-12-01")

    await user.click(
      screen.getByRole("button", { name: "Confirmar rescisión" })
    )
    expect(terminate).toHaveBeenCalledWith({
      id: "c1",
      notifiedAt: "2026-12-01",
    })
  })

  it("con actualización fija pide el nuevo alquiler y muestra el error de la API", async () => {
    contract = makeContract({ rentUpdateType: "FIXED" })
    previewState = { isPending: true, isError: false, isSuccess: false }
    applyRentUpdate.mockRejectedValue(new Error("boom"))
    render(<ContractDetailScreen id="c1" />)
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Aplicar aumento" }))
    const dialogButton = await screen.findByRole("button", {
      name: "Aplicar aumento",
      hidden: false,
    })
    await user.click(dialogButton)
    expect(
      await screen.findByText("Ingresá el nuevo alquiler.")
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText("Nuevo alquiler"), "600.000,00")
    await user.click(dialogButton)
    expect(applyRentUpdate).toHaveBeenCalledWith({
      id: "c1",
      newRent: "600000.00",
    })
    expect(
      await screen.findByText("No se pudo aplicar el aumento.")
    ).toBeInTheDocument()
  })
})
