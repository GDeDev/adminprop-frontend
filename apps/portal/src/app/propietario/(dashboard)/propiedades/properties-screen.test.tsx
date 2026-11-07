import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type {
  PortalOwnerMe,
  PortalOwnerProperty,
} from "@adminprop/shared-types"

import { OwnerPropertiesScreen } from "./properties-screen"

const refetch = vi.fn()
let properties: {
  isPending: boolean
  isError: boolean
  error?: unknown
  data?: PortalOwnerProperty[]
}

const me: PortalOwnerMe = {
  id: "o1",
  fullName: "Juan Pérez",
  email: null,
  bankAccount: null,
  statementSendMode: "SUMMARY",
  agency: {
    name: "Oppido Propiedades",
    slug: "oppido",
    logoUrl: null,
    primaryColor: null,
    phone: null,
    email: null,
    whatsapp: null,
    address: null,
    bankAccount: null,
  },
}

vi.mock("@/lib/portal-api", () => ({
  useOwnerMe: () => ({ isPending: false, isError: false, data: me }),
  useOwnerProperties: () => ({ ...properties, refetch }),
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe("OwnerPropertiesScreen", () => {
  it("lista las propiedades con el contrato y el estado de pago del mes", () => {
    properties = {
      isPending: false,
      isError: false,
      data: [
        {
          id: "p1",
          address: "Calle 1 100",
          status: "RENTED",
          contract: {
            id: "c1",
            renter: { fullName: "Iván López" },
            startDate: "2026-01-01",
            endDate: "2027-12-31",
            currentRent: "200000.00",
            currency: "ARS",
            collectionMode: "OWNER_DIRECT",
          },
          currentInstallment: {
            id: "i1",
            period: "2026-10",
            status: "OVERDUE",
            totalDue: "250000.00",
            paidTotal: "0.00",
          },
        },
        {
          id: "p2",
          address: "Calle 2 200",
          status: "AVAILABLE",
          contract: null,
          currentInstallment: null,
        },
      ],
    }
    render(<OwnerPropertiesScreen />)

    expect(
      screen.getByRole("heading", { name: "Hola, Juan Pérez" })
    ).toBeInTheDocument()
    const first = screen.getByRole("link", { name: /Calle 1 100/ })
    expect(first).toHaveAttribute("href", "/propietario/pagos?propertyId=p1")
    expect(first).toHaveTextContent("Iván López")
    expect(first).toHaveTextContent("hasta el 31/12/2027")
    expect(first).toHaveTextContent("cobrás directo")
    expect(first).toHaveTextContent("Vencida")
    expect(first).toHaveTextContent(/cuota de octubre de 2026/i)
    const second = screen.getByRole("link", { name: /Calle 2 200/ })
    expect(second).toHaveTextContent("Sin contrato vigente")
  })

  it("sin propiedades muestra el estado vacío", () => {
    properties = { isPending: false, isError: false, data: [] }
    render(<OwnerPropertiesScreen />)
    expect(
      screen.getByText("Todavía no tenés propiedades cargadas")
    ).toBeInTheDocument()
    expect(
      screen.getByText("La inmobiliaria las carga desde su sistema.")
    ).toBeInTheDocument()
  })

  it("si falla la carga muestra el error y permite reintentar", async () => {
    properties = { isPending: false, isError: true }
    const user = userEvent.setup()
    render(<OwnerPropertiesScreen />)

    expect(
      screen.getByText("No pudimos cargar tus propiedades")
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(refetch).toHaveBeenCalled()
  })
})
