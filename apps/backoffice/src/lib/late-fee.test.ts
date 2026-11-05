import { describe, expect, it } from "vitest"

import {
  lateFeeRequestFields,
  percentLabel,
  validateLateFee,
  type LateFeeValues,
} from "./late-fee"

const base: LateFeeValues = {
  customLateFee: true,
  lateFeePercentage: "0,50",
  lateFeeTiming: "GRACE",
  lateFeeGraceDays: "10",
  lateFeeStartDay: "",
}

describe("late-fee", () => {
  it("sin punitorio propio hereda el de la inmobiliaria", () => {
    expect(lateFeeRequestFields({ ...base, customLateFee: false })).toEqual({
      lateFeePercentage: null,
      lateFeeGraceDays: null,
    })
  })

  it("nunca manda juntos los días de gracia y el día de inicio", () => {
    const grace = lateFeeRequestFields(base)
    expect(grace).toEqual({ lateFeePercentage: "0.50", lateFeeGraceDays: 10 })
    const start = lateFeeRequestFields({
      ...base,
      lateFeeTiming: "START_DAY",
      lateFeeStartDay: "16",
    })
    expect(start).toEqual({ lateFeePercentage: "0.50", lateFeeStartDay: 16 })
    expect("lateFeeGraceDays" in start).toBe(false)
  })

  it("valida porcentaje, gracia y día de inicio", () => {
    expect(validateLateFee(base)).toEqual([])
    expect(
      validateLateFee({ ...base, lateFeePercentage: "150" }).map((i) => i.path)
    ).toEqual(["lateFeePercentage"])
    expect(
      validateLateFee({
        ...base,
        lateFeeTiming: "START_DAY",
        lateFeeStartDay: "0",
      }).map((i) => i.path)
    ).toEqual(["lateFeeStartDay"])
    expect(
      validateLateFee({
        ...base,
        lateFeeTiming: "START_DAY",
        lateFeeStartDay: "32",
      })
    ).toHaveLength(1)
  })

  it("formatea el porcentaje que manda la API", () => {
    expect(percentLabel("0.50")).toBe("0,50 %")
  })
})
