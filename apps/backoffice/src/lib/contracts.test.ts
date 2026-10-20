import { describe, expect, it } from "vitest"

import {
  contractStatusMeta,
  documentProblem,
  formatMoney,
  nextStepLabel,
  normalizeAmount,
  policyExpiryMeta,
  timelineLabel,
  usesIndex,
} from "./contracts"

describe("contractStatusMeta", () => {
  it("verde vigente, amarillo por vencer, rojo vencido (spec 5.1)", () => {
    expect(
      contractStatusMeta({
        status: "ACTIVE",
        expiringSoon: false,
        expired: false,
      })
    ).toEqual({ label: "Vigente", badge: "disponible" })
    expect(
      contractStatusMeta({
        status: "ACTIVE",
        expiringSoon: true,
        expired: false,
      })
    ).toEqual({ label: "Vence pronto", badge: "mantenimiento" })
    expect(
      contractStatusMeta({
        status: "ACTIVE",
        expiringSoon: false,
        expired: true,
      })
    ).toEqual({ label: "Vencido", badge: "mora" })
  })

  it("finalizado en gris y rescindido en rojo", () => {
    expect(
      contractStatusMeta({
        status: "FINISHED",
        expiringSoon: false,
        expired: false,
      })
    ).toEqual({ label: "Finalizado", badge: "borrador" })
    expect(
      contractStatusMeta({
        status: "TERMINATED",
        expiringSoon: false,
        expired: true,
      })
    ).toEqual({ label: "Rescindido", badge: "mora" })
  })
})

describe("formatMoney", () => {
  it("formatea el string de la API en es-AR sin calcular nada", () => {
    expect(formatMoney("480000.00", "ARS")).toBe("$ 480.000,00")
    expect(formatMoney("700.50", "USD")).toBe("US$ 700,50")
  })

  it("deja pasar lo que no es un número", () => {
    expect(formatMoney("", "ARS")).toBe("")
    expect(formatMoney("n/d", "ARS")).toBe("n/d")
  })
})

describe("normalizeAmount", () => {
  it("acepta coma o punto decimal y puntos de miles", () => {
    expect(normalizeAmount("480000")).toBe("480000")
    expect(normalizeAmount("480000.50")).toBe("480000.50")
    expect(normalizeAmount("480000,5")).toBe("480000.5")
    expect(normalizeAmount("480.000,50")).toBe("480000.50")
    expect(normalizeAmount(" 1.000 ")).toBe("1000")
  })

  it("rechaza lo que no es un monto", () => {
    expect(normalizeAmount("")).toBeNull()
    expect(normalizeAmount("abc")).toBeNull()
    expect(normalizeAmount("1.2.3")).toBeNull()
    expect(normalizeAmount("10.123")).toBe("10123")
    expect(normalizeAmount("-5")).toBeNull()
  })
})

describe("usesIndex", () => {
  it("ICL e IPC salen del índice; Fijo y Otro se cargan a mano", () => {
    expect(usesIndex("ICL")).toBe(true)
    expect(usesIndex("IPC")).toBe(true)
    expect(usesIndex("FIXED")).toBe(false)
    expect(usesIndex("OTHER")).toBe(false)
  })
})

describe("timelineLabel", () => {
  it("muestra los meses transcurridos sobre el total", () => {
    expect(
      timelineLabel({ totalMonths: 36, elapsedMonths: 14, progressPercent: 39 })
    ).toBe("14 de 36 meses")
    expect(
      timelineLabel({
        totalMonths: 36,
        elapsedMonths: 40,
        progressPercent: 100,
      })
    ).toBe("36 de 36 meses")
    expect(
      timelineLabel({ totalMonths: 1, elapsedMonths: 0, progressPercent: 0 })
    ).toBe("0 de 1 mes")
  })
})

describe("nextStepLabel", () => {
  const base = {
    status: "ACTIVE" as const,
    expired: false,
    endDate: "2028-02-29",
    nextRentUpdateOn: "2026-06-01",
    termination: null,
  }

  it("anuncia el próximo aumento y cuántos días faltan", () => {
    expect(nextStepLabel(base, "2026-05-22")).toBe(
      "Próximo aumento el 01/06/2026 (en 10 días)."
    )
    expect(nextStepLabel(base, "2026-06-10")).toBe(
      "Aumento pendiente desde el 01/06/2026."
    )
  })

  it("sin aumentos, vencido, finalizado y rescindido", () => {
    expect(
      nextStepLabel({ ...base, nextRentUpdateOn: null }, "2026-05-22")
    ).toBe("Sin aumentos pendientes. Vence el 29/02/2028.")
    expect(nextStepLabel({ ...base, expired: true }, "2028-03-05")).toBe(
      "Venció el 29/02/2028 sin renovar: renovalo o rescindilo."
    )
    expect(nextStepLabel({ ...base, status: "FINISHED" }, "2028-03-05")).toBe(
      "Finalizado. Terminaba el 29/02/2028."
    )
    expect(
      nextStepLabel(
        {
          ...base,
          status: "TERMINATED",
          termination: {
            terminatedAt: "2026-07-15",
            notifiedAt: "2026-07-15",
            penalty: "1.00",
            futureRent: "10.00",
          },
        },
        "2026-08-01"
      )
    ).toBe("Rescindido el 15/07/2026.")
  })
})

describe("policyExpiryMeta", () => {
  it("vencida en rojo, por vencer en amarillo, vigente en verde", () => {
    expect(policyExpiryMeta("2026-08-31", "2026-09-01")).toEqual({
      label: "Póliza vencida",
      badge: "mora",
    })
    expect(policyExpiryMeta("2026-09-01", "2026-09-01")).toEqual({
      label: "Vence hoy",
      badge: "mantenimiento",
    })
    expect(policyExpiryMeta("2026-09-11", "2026-09-01")).toEqual({
      label: "Vence en 10 días",
      badge: "mantenimiento",
    })
    expect(policyExpiryMeta("2027-09-01", "2026-09-01")).toEqual({
      label: "Vigente hasta el 01/09/2027",
      badge: "disponible",
    })
    expect(policyExpiryMeta(null, "2026-09-01")).toBeNull()
  })
})

describe("documentProblem", () => {
  it("sólo PDFs de hasta 10 MB", () => {
    expect(
      documentProblem(new File(["x"], "c.pdf", { type: "application/pdf" }))
    ).toBeNull()
    expect(
      documentProblem(new File(["x"], "c.png", { type: "image/png" }))
    ).toBe("Tiene que ser un PDF.")
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "c.pdf", {
      type: "application/pdf",
    })
    expect(documentProblem(big)).toBe("El PDF no puede superar 10 MB.")
  })
})
