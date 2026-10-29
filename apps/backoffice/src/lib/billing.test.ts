import { describe, expect, it } from "vitest"

import {
  arrearsMeta,
  currentPeriod,
  exchangeRateLabel,
  formatMoneyList,
  installmentStatusMeta,
  isZero,
  otherCurrency,
  periodLabel,
  shiftPeriod,
} from "./billing"

describe("installmentStatusMeta", () => {
  it("gris pendiente, ámbar parcial, verde cobrada (spec 5.1)", () => {
    expect(installmentStatusMeta({ status: "PENDING", feeDays: 0 })).toEqual({
      label: "Pendiente",
      badge: "borrador",
    })
    expect(installmentStatusMeta({ status: "PARTIAL", feeDays: 0 }).badge).toBe(
      "mantenimiento"
    )
    expect(installmentStatusMeta({ status: "PAID", feeDays: 3 }).label).toBe(
      "Cobrada"
    )
  })

  it("rojo vencida con los días de punitorio", () => {
    expect(installmentStatusMeta({ status: "OVERDUE", feeDays: 1 })).toEqual({
      label: "Vencida · 1 día",
      badge: "mora",
    })
    expect(installmentStatusMeta({ status: "OVERDUE", feeDays: 5 }).label).toBe(
      "Vencida · 5 días"
    )
  })
})

describe("arrearsMeta", () => {
  it("sin datos, al día, pendiente y en mora con días", () => {
    expect(arrearsMeta(undefined).label).toBe("Sin datos")
    expect(arrearsMeta({ status: "UP_TO_DATE", maxDaysOverdue: 0 })).toEqual({
      label: "Al día",
      badge: "disponible",
    })
    expect(arrearsMeta({ status: "PENDING", maxDaysOverdue: 0 }).badge).toBe(
      "mantenimiento"
    )
    expect(arrearsMeta({ status: "OVERDUE", maxDaysOverdue: 12 })).toEqual({
      label: "En mora · 12 días",
      badge: "mora",
    })
  })
})

describe("formatMoneyList", () => {
  it("una entrada por moneda, sin los ceros", () => {
    expect(
      formatMoneyList([
        { currency: "ARS", amount: "1000.00" },
        { currency: "USD", amount: "0.00" },
      ])
    ).toBe("$ 1.000,00")
    expect(formatMoneyList([{ currency: "USD", amount: "0" }])).toBe("—")
    expect(isZero("-0.00")).toBe(true)
    expect(isZero("0.01")).toBe(false)
  })
})

describe("exchangeRateLabel", () => {
  it("arma la cotización con fuente y fecha, o nada", () => {
    const formatDate = (iso: string) => `[${iso}]`
    expect(
      exchangeRateLabel(
        {
          exchangeRate: "1250.5000",
          exchangeRateSource: "MEP",
          exchangeRateDate: "2026-10-12",
        },
        formatDate
      )
    ).toBe("1 USD = $ 1.250,50 (MEP, [2026-10-12])")
    expect(
      exchangeRateLabel(
        {
          exchangeRate: null,
          exchangeRateSource: null,
          exchangeRateDate: null,
        },
        formatDate
      )
    ).toBeNull()
  })
})

describe("períodos", () => {
  it("etiqueta, mes actual y corrimiento", () => {
    expect(periodLabel("2026-10")).toBe("octubre de 2026")
    expect(periodLabel("raro")).toBe("raro")
    expect(currentPeriod(new Date(2026, 0, 15))).toBe("2026-01")
    expect(shiftPeriod("2026-12", 1)).toBe("2027-01")
    expect(shiftPeriod("2026-01", -1)).toBe("2025-12")
  })

  it("la otra moneda", () => {
    expect(otherCurrency("ARS")).toBe("USD")
    expect(otherCurrency("USD")).toBe("ARS")
  })
})
