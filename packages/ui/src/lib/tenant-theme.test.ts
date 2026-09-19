import { describe, expect, it } from "vitest"

import {
  isHexColor,
  prefersLightForeground,
  relativeLuminance,
  tenantThemeStyle,
} from "./tenant-theme"

describe("tenantThemeStyle", () => {
  it("pisa --primary con el color de la inmobiliaria", () => {
    expect(tenantThemeStyle("#314c38")).toEqual({
      "--primary": "#314c38",
      "--primary-foreground": "var(--sidebar-foreground)",
    })
  })

  it("usa texto oscuro sobre un primary claro", () => {
    expect(tenantThemeStyle("#f5c542")).toEqual({
      "--primary": "#f5c542",
      "--primary-foreground": "var(--sidebar)",
    })
  })

  it("acepta hex corto y con espacios alrededor", () => {
    expect(tenantThemeStyle(" #fff ")?.["--primary" as never]).toBe("#fff")
  })

  it.each([
    null,
    undefined,
    "",
    "red",
    "#12345",
    "#1234567",
    "url(x)",
    "#abc;}",
  ])("sin color válido (%s) deja el tema default", (value) => {
    expect(tenantThemeStyle(value)).toBeUndefined()
  })
})

describe("contraste", () => {
  it("calcula la luminancia WCAG en los extremos", () => {
    expect(relativeLuminance("#000000")).toBe(0)
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1)
  })

  it("elige texto claro sobre colores oscuros y oscuro sobre claros", () => {
    expect(prefersLightForeground("#16304f")).toBe(true)
    expect(prefersLightForeground("#a8323f")).toBe(true)
    expect(prefersLightForeground("#ffffff")).toBe(false)
    expect(prefersLightForeground("#e8e6df")).toBe(false)
  })

  it("valida hex de 3 y 6 dígitos", () => {
    expect(isHexColor("#abc")).toBe(true)
    expect(isHexColor("#AABBCC")).toBe(true)
    expect(isHexColor("#aabbccdd")).toBe(false)
  })
})
