import { describe, expect, it } from "vitest"

import { countUpText, formatLike, parseTemplate } from "./count-up"

describe("parseTemplate", () => {
  it("lee un monto en formato es-AR", () => {
    expect(parseTemplate("$ 1.250.000,50")).toMatchObject({
      prefix: "$ ",
      suffix: "",
      value: 1250000.5,
      decimals: 2,
      thousands: ".",
      decimal: ",",
    })
  })

  it("distingue miles de decimales cuando hay un solo separador", () => {
    expect(parseTemplate("1.250")).toMatchObject({ value: 1250, decimals: 0 })
    expect(parseTemplate("12,5 %")).toMatchObject({
      value: 12.5,
      decimals: 1,
      suffix: " %",
    })
  })

  it("devuelve null si no hay número", () => {
    expect(parseTemplate("Sin datos")).toBeNull()
  })
})

describe("formatLike", () => {
  it("conserva prefijo, separadores y decimales", () => {
    const t = parseTemplate("$ 1.250.000,50")!
    expect(formatLike(t, 625000.25)).toBe("$ 625.000,25")
    expect(formatLike(t, 0)).toBe("$ 0,00")
  })
})

describe("countUpText", () => {
  it("al terminar devuelve el texto original exacto (no recalcula)", () => {
    for (const text of ["$ 1.250.000,50", "37", "98,5 %", "USD 1.200", "—"]) {
      expect(countUpText(text, 1)).toBe(text)
    }
  })

  it("empieza en cero y crece de forma monótona", () => {
    const text = "$ 450.000,00"
    expect(countUpText(text, 0)).toBe("$ 0,00")
    const values = [0.2, 0.5, 0.8].map((p) =>
      Number(
        countUpText(text, p)
          .replace(/[^\d,]/g, "")
          .replace(",", ".")
      )
    )
    expect(values[0]).toBeLessThan(values[1]!)
    expect(values[1]).toBeLessThan(values[2]!)
    expect(values[2]).toBeLessThan(450000)
  })

  it("un texto sin número no se anima", () => {
    expect(countUpText("Sin datos", 0.3)).toBe("Sin datos")
  })
})
