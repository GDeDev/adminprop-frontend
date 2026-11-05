import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { IncomeReport } from "@adminprop/shared-types"

import { IncomeByReceiverTable, IncomeTotals } from "./income-by-receiver"

const arsCollected = {
  agency: {
    rent: "100000.00",
    lateFees: "2000.00",
    charges: "3000.00",
    total: "105000.00",
  },
  owner: {
    rent: "50000.00",
    lateFees: "0.00",
    charges: "0.00",
    total: "50000.00",
  },
}
const usdCollected = {
  agency: {
    rent: "400.00",
    lateFees: "0.00",
    charges: "0.00",
    total: "400.00",
  },
  owner: { rent: "0.00", lateFees: "0.00", charges: "0.00", total: "0.00" },
}

const totals: IncomeReport["totals"] = [
  {
    currency: "ARS",
    collected: {
      rent: "150000.00",
      lateFees: "2000.00",
      charges: "3000.00",
      total: "155000.00",
    },
    collectedByReceiver: arsCollected,
  },
  {
    currency: "USD",
    collected: {
      rent: "400.00",
      lateFees: "0.00",
      charges: "0.00",
      total: "400.00",
    },
    collectedByReceiver: usdCollected,
  },
]

describe("IncomeTotals", () => {
  it("muestra un bloque por moneda con la separación por quién cobró", () => {
    render(<IncomeTotals totals={totals} />)
    const ars = screen.getByRole("group", { name: "Totales en ARS" })
    const usd = screen.getByRole("group", { name: "Totales en USD" })

    const arsRows = within(ars).getAllByRole("row")
    // Encabezado + inmobiliaria + propietario + todo.
    expect(arsRows).toHaveLength(4)
    expect(within(arsRows[1]!).getByText("Inmobiliaria")).toBeInTheDocument()
    expect(within(arsRows[1]!).getByText(/100\.000,00/)).toBeInTheDocument()
    expect(within(arsRows[1]!).getByText(/2\.000,00/)).toBeInTheDocument()
    expect(within(arsRows[1]!).getByText(/3\.000,00/)).toBeInTheDocument()
    expect(within(arsRows[1]!).getByText(/105\.000,00/)).toBeInTheDocument()
    expect(within(arsRows[2]!).getAllByText(/50\.000,00/)).toHaveLength(2)

    // Las monedas no se mezclan: el bloque de USD no tiene importes de pesos.
    expect(within(usd).queryByText(/105\.000/)).not.toBeInTheDocument()
    expect(within(usd).getAllByText(/400,00/).length).toBeGreaterThan(0)
  })

  it("no dibuja nada si no hay totales", () => {
    const { container } = render(<IncomeTotals totals={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe("IncomeByReceiverTable", () => {
  it("separa cada mes en una fila de la inmobiliaria y otra del propietario", () => {
    const rows = [
      {
        period: "2026-10",
        currency: "ARS",
        rentCollected: "150000.00",
        lateFeesCollected: "2000.00",
        chargesCollected: "3000.00",
        collectedByReceiver: arsCollected,
        feesAccrued: "0.00",
        feesCollected: "0.00",
        netSettled: "0.00",
        netTransferred: "0.00",
      },
    ] satisfies IncomeReport["rows"]
    render(<IncomeByReceiverTable rows={rows} />)
    const body = screen.getAllByRole("row")
    expect(body).toHaveLength(3)
    expect(within(body[1]!).getByText("Inmobiliaria")).toBeInTheDocument()
    expect(within(body[2]!).getByText("Propietario")).toBeInTheDocument()
    expect(within(body[1]!).getByText(/105\.000,00/)).toBeInTheDocument()
    expect(within(body[2]!).getAllByText(/50\.000,00/)).toHaveLength(2)
  })
})
