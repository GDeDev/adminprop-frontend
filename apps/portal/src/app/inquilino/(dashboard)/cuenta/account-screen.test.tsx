import { render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type {
  PortalRenterAccount,
  PortalRenterMe,
} from "@adminprop/shared-types"

import { RenterAccountScreen } from "./account-screen"

let account: PortalRenterAccount

const me: PortalRenterMe = {
  id: "r1",
  fullName: "Iván López",
  email: null,
  phone: null,
  agency: {
    name: "Oppido Propiedades",
    slug: "oppido",
    logoUrl: null,
    primaryColor: null,
    phone: null,
    email: null,
    whatsapp: "5492211234567",
    address: null,
    bankAccount: {
      holder: "Oppido SRL",
      bank: "Banco Nación",
      cbu: "0110000000000000000001",
      alias: "oppido.alquileres",
    },
  },
}

vi.mock("@/lib/portal-api", () => ({
  useRenterMe: () => ({ isPending: false, isError: false, data: me }),
  useRenterAccount: () => ({ isPending: false, isError: false, data: account }),
}))

afterEach(() => {
  vi.clearAllMocks()
})

/** La cuota del mes, pagada entera el 5. */
const paidInstallment: NonNullable<PortalRenterAccount["currentInstallment"]> =
  {
    id: "i2",
    period: "2026-11",
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
    paidTotal: "200000.00",
    rentBalance: "0.00",
    chargesBalance: "0.00",
    totalDue: "0.00",
    pendingConfirmationTotal: "0.00",
    status: "PAID",
    graceEndDate: "2026-11-10",
    feeDays: 0,
    paidAt: "2026-11-05",
    collectionMode: "AGENCY",
    feeMode: "DEDUCTED",
    createdAt: "2026-10-28T00:00:00.000Z",
    lateFeePercentage: "5.00",
    lateFeeGraceDays: 10,
    feePercentage: "5.00",
    feeAmount: null,
    feeOnBase: "10000.00",
    feeOnCollected: "10000.00",
    charges: [],
    payments: [],
    lateFeeAdjustments: [],
    lateFeeDays: [],
    creditsAvailable: "0.00",
    notes: null,
    updatedAt: "2026-11-05T00:00:00.000Z",
  }

describe("RenterAccountScreen", () => {
  it("muestra la cuota vencida con punitorio, el día por día y cómo pagar", () => {
    account = {
      contract: { id: "c1", status: "ACTIVE" },
      currentInstallment: {
        id: "i1",
        period: "2026-10",
        contract: { id: "c1" },
        property: { id: "p1", address: "Calle 1 100" },
        renter: { id: "r1", fullName: "Iván López" },
        owner: null,
        currency: "ARS",
        baseAmount: "200000.00",
        chargesTotal: "0.00",
        lateFeeAccrued: "50000.00",
        lateFeeAdjusted: "0.00",
        lateFeeWaived: false,
        lateFeeBalance: "50000.00",
        paidTotal: "0.00",
        rentBalance: "200000.00",
        chargesBalance: "0.00",
        totalDue: "250000.00",
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
        feeOnCollected: "0.00",
        charges: [],
        payments: [],
        lateFeeAdjustments: [],
        lateFeeDays: [
          {
            day: "2026-10-11",
            dayNumber: 1,
            outstandingBase: "200000.00",
            dailyPercentage: "5.00",
            amount: "10000.00",
          },
        ],
        creditsAvailable: "0.00",
        notes: null,
        updatedAt: "2026-10-15T00:00:00.000Z",
      },
      creditsAvailable: [],
      arrears: {
        renterId: "r1",
        status: "OVERDUE",
        overdueInstallments: 1,
        maxDaysOverdue: 5,
        lateFeeAccrued: [],
        balance: [],
      },
      paymentInstructions: {
        kind: "AGENCY",
        bankAccount: me.agency.bankAccount,
      },
    }
    render(<RenterAccountScreen />)

    expect(
      screen.getByRole("heading", { name: "$\u00a0250.000,00" })
    ).toBeInTheDocument()
    expect(screen.getByText("En mora · 5 días")).toBeInTheDocument()
    expect(screen.getByText(/Venció el 10\/10\/2026/)).toBeInTheDocument()
    expect(screen.getByText("Ver el punitorio día por día")).toBeInTheDocument()
    expect(screen.getByText("0110000000000000000001")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Avisar por WhatsApp/ })
    ).toHaveAttribute("href", expect.stringContaining("wa.me/5492211234567"))
  })

  it("con el mes al día pero una cuota anterior vencida, avisa la deuda y cómo pagar (spec 18, deuda de varios períodos)", () => {
    account = {
      contract: { id: "c1", status: "ACTIVE" },
      currentInstallment: {
        ...paidInstallment,
      },
      creditsAvailable: [],
      arrears: {
        renterId: "r1",
        status: "OVERDUE",
        overdueInstallments: 1,
        maxDaysOverdue: 20,
        lateFeeAccrued: [{ currency: "ARS", amount: "100000.00" }],
        balance: [{ currency: "ARS", amount: "300000.00" }],
      },
      paymentInstructions: {
        kind: "AGENCY",
        bankAccount: me.agency.bankAccount,
      },
    }
    render(<RenterAccountScreen />)

    // La cuota del mes sigue mostrándose como pagada…
    expect(
      screen.getByText("Pagada el 05/11/2026. ¡Gracias!")
    ).toBeInTheDocument()
    // …pero la deuda anterior no se esconde.
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("Tenés una cuota anterior vencida")
    expect(alert).toHaveTextContent("Saldo total vencido: $ 300.000,00")
    expect(alert).toHaveTextContent("Llevás 20 días de atraso")
    expect(
      within(alert).getByRole("link", { name: "Ver las cuotas pendientes" })
    ).toHaveAttribute("href", "/inquilino/pagos")
    // Y las instrucciones de pago aparecen aunque la del mes esté pagada.
    expect(screen.getByText("0110000000000000000001")).toBeInTheDocument()
  })

  it("con dos cuotas anteriores vencidas y sin cuota este mes, igual muestra la deuda", () => {
    account = {
      contract: { id: "c1", status: "ACTIVE" },
      currentInstallment: null,
      creditsAvailable: [],
      arrears: {
        renterId: "r1",
        status: "OVERDUE",
        overdueInstallments: 2,
        maxDaysOverdue: 45,
        lateFeeAccrued: [{ currency: "ARS", amount: "0.00" }],
        balance: [{ currency: "ARS", amount: "400000.00" }],
      },
      paymentInstructions: { kind: "AGENCY", bankAccount: null },
    }
    render(<RenterAccountScreen />)
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Tenés 2 cuotas anteriores vencidas"
    )
    expect(
      screen.getByText("Todavía no hay cuota para este mes")
    ).toBeInTheDocument()
  })

  it("la cuota del mes vencida no se cuenta dos veces", () => {
    account = {
      contract: { id: "c1", status: "ACTIVE" },
      currentInstallment: {
        ...paidInstallment,
        status: "OVERDUE",
        paidAt: null,
      },
      creditsAvailable: [],
      arrears: {
        renterId: "r1",
        status: "OVERDUE",
        overdueInstallments: 1,
        maxDaysOverdue: 3,
        lateFeeAccrued: [],
        balance: [{ currency: "ARS", amount: "200000.00" }],
      },
      paymentInstructions: { kind: "AGENCY", bankAccount: null },
    }
    render(<RenterAccountScreen />)
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("sin contrato vigente lo dice", () => {
    account = {
      contract: null,
      currentInstallment: null,
      creditsAvailable: [],
      arrears: {
        renterId: "r1",
        status: "UP_TO_DATE",
        overdueInstallments: 0,
        maxDaysOverdue: 0,
        lateFeeAccrued: [],
        balance: [],
      },
      paymentInstructions: { kind: "AGENCY", bankAccount: null },
    }
    render(<RenterAccountScreen />)
    expect(screen.getByText("No tenés un contrato vigente")).toBeInTheDocument()
  })
})
