import { describe, expect, it } from "vitest"

import {
  daysOverdueLabel,
  expenseStatusMeta,
  INCREASE_FREQUENCY_LABELS,
  receiptProblem,
  serviceStatusMeta,
} from "./services"

describe("serviceStatusMeta", () => {
  it("verde al día, rojo vencido con los días (spec 5.1)", () => {
    expect(
      serviceStatusMeta({
        hasDueDate: true,
        status: "UP_TO_DATE",
        daysOverdue: 0,
      })
    ).toEqual({ label: "Al día", badge: "disponible" })
    expect(
      serviceStatusMeta({ hasDueDate: true, status: "OVERDUE", daysOverdue: 5 })
    ).toEqual({ label: "Vencido hace 5 días", badge: "mora" })
  })

  it("sin vencimiento no hay badge", () => {
    expect(
      serviceStatusMeta({
        hasDueDate: false,
        status: "UP_TO_DATE",
        daysOverdue: 0,
      })
    ).toBeNull()
  })
})

describe("daysOverdueLabel", () => {
  it("singular, plural y al día", () => {
    expect(daysOverdueLabel(1)).toBe("Vencido hace 1 día")
    expect(daysOverdueLabel(12)).toBe("Vencido hace 12 días")
    expect(daysOverdueLabel(0)).toBe("Al día")
  })
})

describe("expenseStatusMeta", () => {
  it("amarillo pendiente, verde descontado (spec 5.2)", () => {
    expect(expenseStatusMeta({ settled: false })).toEqual({
      label: "Pendiente de descuento",
      badge: "mantenimiento",
    })
    expect(expenseStatusMeta({ settled: true })).toEqual({
      label: "Descontado en liquidación",
      badge: "disponible",
    })
  })
})

describe("INCREASE_FREQUENCY_LABELS", () => {
  it("usa los mismos textos que la frecuencia del contrato", () => {
    expect(INCREASE_FREQUENCY_LABELS.FOUR_MONTHLY).toBe("Cuatrimestral")
  })
})

describe("receiptProblem", () => {
  it("acepta fotos y PDF por tipo o por extensión", () => {
    expect(
      receiptProblem(new File(["x"], "t.jpg", { type: "image/jpeg" }))
    ).toBeNull()
    expect(
      receiptProblem(new File(["x"], "t.pdf", { type: "application/pdf" }))
    ).toBeNull()
    expect(receiptProblem(new File(["x"], "t.webp", { type: "" }))).toBeNull()
  })

  it("rechaza otros archivos y los de más de 10 MB", () => {
    expect(receiptProblem(new File(["x"], "t.docx", { type: "" }))).toMatch(
      /foto .* o un PDF/
    )
    const big = new File(["x"], "t.png", { type: "image/png" })
    Object.defineProperty(big, "size", { value: 11 * 1024 * 1024 })
    expect(receiptProblem(big)).toBe("El comprobante no puede superar 10 MB.")
  })
})
