import { describe, expect, it } from "vitest"

import type { SiteTheme } from "@adminprop/shared-types"

import { contrastRatio, onColor, themeStyle } from "./theme"

const THEME: SiteTheme = {
  primary: "#b6a28e",
  secondary: "#5F6F65",
  background: "#181C14",
  surface: "#3C3D37",
  text: "#F4F1EC",
  fontKey: "serif",
  radius: 8,
}

describe("theme", () => {
  it("calcula el contraste WCAG", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0)
    expect(contrastRatio("#777777", "#777777")).toBe(1)
  })

  it("elige blanco u oscuro según lo que se lee mejor", () => {
    expect(onColor("#181C14")).toBe("#FFFFFF")
    expect(onColor("#FFFFFF")).toBe("#111111")
    expect(onColor("#FFFF00")).toBe("#111111")
  })

  it("arma las variables CSS del tema", () => {
    const style = themeStyle(THEME) as Record<string, string>
    expect(style["--site-primary"]).toBe("#B6A28E")
    expect(style["--site-background"]).toBe("#181C14")
    expect(style["--site-radius"]).toBe("8px")
    expect(style["--site-font"]).toContain("serif")
  })

  it("nunca deja pasar texto libre a un atributo style", () => {
    const style = themeStyle({
      ...THEME,
      primary: "red; background: url(//evil)",
      text: "expression(alert(1))",
      fontKey: "}</style><script>",
      radius: 999,
    }) as Record<string, string>
    const joined = Object.values(style).join(" ")
    expect(joined).not.toMatch(/evil|expression|script|url\(/)
    expect(style["--site-radius"]).toBe("16px")
    expect(style["--site-font"]).toContain("ui-sans-serif")
  })
})
