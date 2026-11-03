import { describe, expect, it } from "vitest"

import {
  capitalizeFirst,
  formatMoney,
  periodLabel,
  periodTitle,
} from "./format"

describe("formatMoney", () => {
  it("formatea con coma decimal y no parte el símbolo del número", () => {
    const text = formatMoney("150333.33", "ARS")
    expect(text).toBe("$\u00a0150.333,33")
    expect(text.includes(String.fromCharCode(32))).toBe(false)
  })

  it("distingue dólares y admite cero decimales", () => {
    expect(formatMoney("450000", "USD")).toMatch(/^US\$\u00a0450\.000,00$/)
    expect(formatMoney("450000", "ARS", { maximumFractionDigits: 0 })).toBe(
      "$\u00a0450.000"
    )
  })

  it("si no es un número lo devuelve tal cual", () => {
    expect(formatMoney("", "ARS")).toBe("")
    expect(formatMoney("abc", "ARS")).toBe("abc")
  })
})

describe("periodLabel", () => {
  it("devuelve el mes en minúscula y con 'de' en minúscula", () => {
    expect(periodLabel("2026-11")).toBe("noviembre de 2026")
  })

  it("devuelve el texto original si el período no es válido", () => {
    expect(periodLabel("x")).toBe("x")
  })

  it("periodTitle sólo capitaliza la primera letra", () => {
    expect(periodTitle("2026-11")).toBe("Noviembre de 2026")
    expect(capitalizeFirst("cuota de mayo")).toBe("Cuota de mayo")
  })
})
