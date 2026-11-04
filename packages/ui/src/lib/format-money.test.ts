import { describe, expect, it } from "vitest"

import { formatMoney } from "./format-money"

describe("formatMoney", () => {
  it("formatea el string de la API en es-AR sin calcular nada", () => {
    expect(formatMoney("480000.00", "ARS")).toBe("$ 480.000,00")
    expect(formatMoney("700.50", "USD")).toBe("US$ 700,50")
  })

  it("siempre muestra dos decimales, también con montos enteros", () => {
    expect(formatMoney("1500", "ARS")).toBe("$ 1.500,00")
    expect(formatMoney("0", "USD")).toBe("US$ 0,00")
    expect(formatMoney("700.5", "USD")).toBe("US$ 700,50")
  })

  it("usa un espacio común entre el símbolo y el número", () => {
    expect(formatMoney("10.00", "ARS")).not.toMatch(/[\u00a0\u202f]/)
  })

  it("no pierde precisión visible en montos grandes ni en negativos", () => {
    expect(formatMoney("150333.33", "ARS")).toBe("$ 150.333,33")
    expect(formatMoney("-2500.00", "ARS")).toContain("2.500,00")
  })

  it("deja pasar lo que no es un número", () => {
    expect(formatMoney("", "ARS")).toBe("")
    expect(formatMoney("   ", "ARS")).toBe("   ")
    expect(formatMoney("n/d", "ARS")).toBe("n/d")
  })
})
