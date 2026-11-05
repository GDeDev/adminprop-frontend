import { describe, expect, it } from "vitest"

import { adjustmentBreakdown, signedMoney } from "./settlements"

const format = (amount: string, currency: string) => `${currency} ${amount}`

describe("adjustmentBreakdown", () => {
  it("separa retenciones, adelantos y otros ajustes sin sumarlos", () => {
    expect(
      adjustmentBreakdown({
        withholdingsTotal: "-1000.00",
        advancesTotal: "-5000.00",
        otherAdjustmentsTotal: "300.00",
      })
    ).toEqual([
      { key: "withholdingsTotal", label: "Retenciones", amount: "-1000.00" },
      { key: "advancesTotal", label: "Adelantos", amount: "-5000.00" },
      {
        key: "otherAdjustmentsTotal",
        label: "Otros ajustes",
        amount: "300.00",
      },
    ])
  })
})

describe("signedMoney", () => {
  it("marca los negativos con el signo menos", () => {
    expect(signedMoney("-5000.00", "ARS", format)).toBe("−ARS 5000.00")
    expect(signedMoney("300.00", "ARS", format)).toBe("ARS 300.00")
  })
})
