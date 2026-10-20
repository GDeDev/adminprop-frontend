import { describe, expect, it } from "vitest"

import {
  addDays,
  daysBetween,
  formatDate,
  formatPeriod,
  isIsoDate,
  todayIso,
} from "./dates"

describe("formatDate", () => {
  it("muestra la fecha sin pasar por la zona horaria", () => {
    expect(formatDate("2026-03-01")).toBe("01/03/2026")
    expect(formatDate(null)).toBe("—")
  })
})

describe("formatPeriod", () => {
  it("muestra el mes de un índice", () => {
    expect(formatPeriod("2026-03")).toBe("03/2026")
    expect(formatPeriod(null)).toBe("—")
  })
})

describe("isIsoDate", () => {
  it("acepta sólo AAAA-MM-DD", () => {
    expect(isIsoDate("2026-03-01")).toBe(true)
    expect(isIsoDate("01/03/2026")).toBe(false)
    expect(isIsoDate("")).toBe(false)
    expect(isIsoDate(null)).toBe(false)
  })
})

describe("daysBetween y addDays", () => {
  it("cuentan días enteros, negativos si la fecha ya pasó", () => {
    expect(daysBetween("2026-03-01", "2026-03-31")).toBe(30)
    expect(daysBetween("2026-03-31", "2026-03-01")).toBe(-30)
    expect(daysBetween("2026-02-28", "2026-03-01")).toBe(1)
  })

  it("suman días cruzando fin de mes y de año", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29")
  })
})

describe("todayIso", () => {
  it("usa la fecha local del navegador", () => {
    expect(todayIso(new Date(2026, 9, 5, 23, 30))).toBe("2026-10-05")
  })
})
