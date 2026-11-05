import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { ContractAccount } from "@adminprop/shared-types"

import { AccountSection } from "./account-section"

const totals = Object.fromEntries(
  [
    "accrued",
    "chargesTotal",
    "lateFeeAccrued",
    "lateFeeAdjusted",
    "collected",
    "collectedByAgency",
    "collectedByOwner",
    "pendingConfirmation",
    "balance",
    "creditsAvailable",
    "feeAccruedOnBase",
    "feeAccruedOnCollected",
  ].map((key) => [key, "0.00"])
)

const account = {
  contract: { currency: "ARS", collectionMode: "AGENCY", feeMode: "DEDUCTED" },
  totals: { ...totals, pendingSettlement: "123456.00" },
  installments: [],
  movements: [
    {
      date: "2026-01-05",
      type: "DEPOSIT_RECEIVED",
      description: "Depósito recibido",
      debit: null,
      credit: null,
      amount: "200000.00",
      amountCurrency: "USD",
      balance: "0.00",
      installmentId: null,
      paymentId: null,
    },
  ],
  deposit: {
    amount: "200000.00",
    currency: "ARS",
    returnMode: "FOLLOWS_RENT",
    suggestedReturn: "260000.00",
    returned: null,
  },
} as unknown as ContractAccount

vi.mock("@/lib/billing-api", () => ({
  useContractAccount: () => ({
    isPending: false,
    isError: false,
    data: account,
  }),
}))
vi.mock("@/lib/settlements-api", () => ({
  useRegisterDepositReturn: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

describe("AccountSection", () => {
  it("muestra el importe y la moneda de los movimientos del depósito, aparte del saldo", () => {
    render(
      <AccountSection
        contract={{ id: "c1", currency: "ARS", status: "FINISHED" }}
      />
    )
    expect(screen.getByText(/Importe:/)).toHaveTextContent(
      /200\.000,00.*no modifica el saldo/
    )
    expect(screen.getByText(/Importe:/)).toHaveTextContent(/US\$|USD/)
    expect(screen.getByText(/monto de referencia: .*260\.000/)).toBeVisible()
  })

  it("muestra «Por liquidar» como monto bruto, con su explicación", () => {
    render(
      <AccountSection
        contract={{ id: "c1", currency: "ARS", status: "ACTIVE" }}
      />
    )
    const value = screen.getByText(/123\.456,00/)
    expect(value).toHaveAccessibleDescription(
      /monto bruto: no descuenta honorarios/
    )
    expect(
      screen.getByText("Bruto, antes de honorarios y gastos")
    ).toBeVisible()
  })
})
