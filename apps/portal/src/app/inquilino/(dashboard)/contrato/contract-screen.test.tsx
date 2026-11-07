import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { PortalRenterContract } from "@adminprop/shared-types"

import { RenterContractScreen } from "./contract-screen"

const refetch = vi.fn()
let state: {
  isPending: boolean
  isError: boolean
  error?: unknown
  data?: PortalRenterContract | null
}

vi.mock("@/lib/portal-api", () => ({
  useRenterContract: () => ({ ...state, refetch }),
}))

const contract: PortalRenterContract = {
  id: "c1",
  status: "ACTIVE",
  property: { id: "p1", address: "Calle 1 100", propertyType: "Departamento" },
  startDate: "2026-01-01",
  endDate: "2027-12-31",
  currentRent: "200000.00",
  currency: "ARS",
  rentUpdateType: "ICL",
  rentUpdateFrequency: "QUARTERLY",
  nextRentUpdateOn: "2026-12-01",
  deposit: "200000.00",
  depositCurrency: "ARS",
  depositReturnMode: "FIXED",
  guarantor: { fullName: "Marta Gómez" },
  surety: { hasSurety: false, policyExpiresAt: null },
  services: [
    {
      id: "s1",
      propertyId: "p1",
      contractId: "c1",
      serviceType: { id: "t1", name: "Luz", isActive: true },
      paidBy: "RENTER",
      currency: "ARS",
      hasDueDate: true,
      dueDate: "2026-11-15",
      hasIncrease: false,
      increaseFrequency: null,
      managedByAgency: false,
      notes: "Nota interna del servicio",
      status: "UP_TO_DATE",
      daysOverdue: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      scope: "CONTRACT",
    },
  ],
  collectionMode: "AGENCY",
  feePaidByRenter: null,
  timeline: { totalMonths: 24, elapsedMonths: 10, progressPercent: 42 },
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("RenterContractScreen", () => {
  it("muestra fechas, alquiler, próximo aumento, depósito, garante y servicios", () => {
    state = { isPending: false, isError: false, data: contract }
    render(<RenterContractScreen />)

    expect(
      screen.getByRole("heading", { name: "Calle 1 100" })
    ).toBeInTheDocument()
    expect(screen.getByText(/01\/01\/2026 → 31\/12\/2027/)).toBeInTheDocument()
    expect(
      screen.getByText("Alquiler vigente").nextElementSibling
    ).toHaveTextContent("$ 200.000,00")
    expect(
      screen.getByText(/próximo aumento: 01\/12\/2026/)
    ).toBeInTheDocument()
    expect(
      screen.getByText("Por ICL, trimestral", { exact: false })
    ).toBeInTheDocument()
    expect(
      screen.getByText("se devuelve lo que entregaste", { exact: false })
    ).toBeInTheDocument()
    expect(screen.getByText("Marta Gómez")).toBeInTheDocument()
    expect(screen.getByText("10 de 24 meses")).toBeInTheDocument()
    expect(screen.getByText(/Luz/)).toBeInTheDocument()
    expect(screen.getByText("vence el 15/11/2026")).toBeInTheDocument()
    expect(screen.queryByText(/honorarios/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Nota interna/)).not.toBeInTheDocument()
  })

  it("muestra los honorarios sólo cuando el inquilino los paga por cuenta del propietario", () => {
    state = {
      isPending: false,
      isError: false,
      data: {
        ...contract,
        feePaidByRenter: { feePercentage: "5.00", feeAmount: null },
      },
    }
    render(<RenterContractScreen />)
    expect(screen.getByText(/honorarios/i)).toHaveTextContent(
      "5.00 % del alquiler"
    )
  })

  it("avisa si el contrato terminó", () => {
    state = {
      isPending: false,
      isError: false,
      data: { ...contract, status: "FINISHED" },
    }
    render(<RenterContractScreen />)
    expect(screen.getByText("Contrato finalizado")).toBeInTheDocument()
  })

  it("sin contrato lo dice claramente", () => {
    state = { isPending: false, isError: false, data: null }
    render(<RenterContractScreen />)
    expect(screen.getByText("No tenés un contrato cargado")).toBeInTheDocument()
  })

  it("si falla la carga muestra el error y permite reintentar", async () => {
    state = { isPending: false, isError: true }
    const user = userEvent.setup()
    render(<RenterContractScreen />)
    expect(
      screen.getByText("No pudimos cargar tu contrato")
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(refetch).toHaveBeenCalled()
  })
})
