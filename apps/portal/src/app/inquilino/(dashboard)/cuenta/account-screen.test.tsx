import { render, screen } from "@testing-library/react"
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
      screen.getByRole("heading", { name: "$ 250.000,00" })
    ).toBeInTheDocument()
    expect(screen.getByText("En mora · 5 días")).toBeInTheDocument()
    expect(screen.getByText(/Venció el 10\/10\/2026/)).toBeInTheDocument()
    expect(screen.getByText("Ver el punitorio día por día")).toBeInTheDocument()
    expect(screen.getByText("0110000000000000000001")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Avisar por WhatsApp/ })
    ).toHaveAttribute("href", expect.stringContaining("wa.me/5492211234567"))
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
