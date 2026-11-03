import { describe, expect, it } from "vitest"

import { historyCurrencies } from "./monthly-bars"

const month = (
  period: string,
  accrued: { currency: "ARS" | "USD"; amount: string }[],
  collected: { currency: "ARS" | "USD"; amount: string }[] = []
) => ({ period, accrued, collected })

describe("historyCurrencies", () => {
  it("devuelve solo las monedas con movimiento, ARS primero", () => {
    const history = [
      month("2026-09", [{ currency: "USD", amount: "500.00" }]),
      month(
        "2026-10",
        [{ currency: "ARS", amount: "100000.00" }],
        [{ currency: "USD", amount: "0.00" }]
      ),
    ]
    expect(historyCurrencies(history)).toEqual(["ARS", "USD"])
  })

  it("es vacío si todo está en cero", () => {
    expect(
      historyCurrencies([
        month("2026-10", [{ currency: "ARS", amount: "0.00" }]),
      ])
    ).toEqual([])
  })
})
