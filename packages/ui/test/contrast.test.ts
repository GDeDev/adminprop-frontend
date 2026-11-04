// @vitest-environment node
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { contrastRatio, parseColor } from "../src/lib/color"
import { tenantThemeStyle } from "../src/lib/tenant-theme"

/**
 * Contraste WCAG AA de los pares texto/fondo de los tokens v2, en claro y en
 * oscuro. Lee el CSS real: si alguien toca un token y rompe la accesibilidad,
 * falla acá.
 */
const stylesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/styles"
)
const css = readFileSync(path.join(stylesDir, "adminprop-v2.css"), "utf8")

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`\n${selector} {`)
  if (start < 0) throw new Error(`No encuentro ${selector}`)
  const open = css.indexOf("{", start)
  const close = css.indexOf("\n}", open)
  const body = css.slice(open + 1, close)
  const vars: Record<string, string> = {}
  for (const match of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    vars[match[1]!] = match[2]!.replace(/\s+/g, " ").trim()
  }
  return vars
}

type Mode = "light" | "dark"
const light = block(":root")
const dark = { ...light, ...block(".dark") }
const modes: Record<Mode, Record<string, string>> = { light, dark }

function resolve(mode: Mode, token: string): string {
  let value = modes[mode][token]
  if (value === undefined) throw new Error(`Falta el token --${token}`)
  for (let i = 0; i < 5; i++) {
    const ref = /^var\(--([\w-]+)\)$/.exec(value)
    if (!ref) return value
    value = modes[mode][ref[1]!]
    if (value === undefined) throw new Error(`Falta --${ref[1]}`)
  }
  return value
}

/** [texto, fondo, mínimo, para qué]. 4.5 texto normal, 3 texto grande / UI. */
const PAIRS: Array<[string, string, number, string]> = [
  ["foreground", "background", 4.5, "texto base"],
  ["foreground", "card", 4.5, "texto en card"],
  ["foreground", "popover", 4.5, "texto en popover"],
  ["foreground", "muted", 4.5, "texto sobre muted (hover)"],
  ["card-foreground", "card", 4.5, "card"],
  ["muted-foreground", "background", 4.5, "texto secundario"],
  ["muted-foreground", "card", 4.5, "texto secundario en card"],
  ["muted-foreground", "muted", 4.5, "texto secundario sobre muted"],
  ["muted-foreground", "surface-sunken", 4.5, "texto secundario hundido"],
  ["primary-foreground", "primary", 4.5, "botón primario"],
  ["primary", "background", 4.5, "link / texto primary"],
  ["primary", "primary-soft", 4.5, "texto primary sobre soft"],
  ["accent-foreground", "accent", 4.5, "botón accent"],
  ["destructive-foreground", "destructive", 4.5, "botón destructivo"],
  ["destructive", "destructive-soft", 4.5, "badge mora"],
  ["success-foreground", "success", 4.5, "botón/badge éxito"],
  ["success", "success-soft", 4.5, "badge disponible"],
  ["warning-foreground", "warning", 4.5, "badge warning sólido"],
  ["warning", "warning-soft", 4.5, "badge mantenimiento"],
  ["info", "info-soft", 4.5, "badge alquilada"],
  ["ai", "ai-soft", 4.5, "badge IA"],
  ["ai-foreground", "ai", 4.5, "botón IA"],
  ["ai", "card", 4.5, "texto IA en card"],
  ["destructive", "background", 4.5, "error en texto"],
  ["success", "background", 4.5, "éxito en texto"],
  ["muted-foreground", "background", 4.5, "placeholder"],
  ["sidebar-foreground", "sidebar", 4.5, "chrome: ítem"],
  ["sidebar-muted", "sidebar", 4.5, "chrome: ítem inactivo"],
  ["sidebar-foreground", "sidebar-border", 4.5, "chrome: ítem activo"],
  ["sidebar-muted", "sidebar-border", 4.5, "chrome: hover"],
  // Indicadores no textuales (WCAG 1.4.11): 3:1
  ["accent", "sidebar", 3, "chrome: ícono activo"],
  ["ring", "background", 3, "anillo de foco"],
  ["ring", "card", 3, "anillo de foco sobre card"],
  ["control", "card", 3, "borde de input/select sobre card"],
  ["control", "background", 3, "borde de input/select sobre el fondo"],
]

describe.each(["light", "dark"] as const)("contraste AA — %s", (mode) => {
  it.each(PAIRS)("%s sobre %s (≥ %s) — %s", (fg, bg, min) => {
    const ratio = contrastRatio(resolve(mode, fg), resolve(mode, bg))
    expect(
      ratio,
      `${fg} sobre ${bg} en ${mode} da ${ratio.toFixed(2)}`
    ).toBeGreaterThanOrEqual(min)
  })

  it("todos los colores del bloque se pueden interpretar", () => {
    for (const [name, value] of Object.entries(modes[mode])) {
      if (!/^(oklch|#)/.test(value)) continue
      expect(() => parseColor(value), name).not.toThrow()
    }
  })
})

describe("tema por inmobiliaria sobre v2", () => {
  const sampleTenants = ["#314c38", "#7a1f3d", "#f5c542", "#16304f", "#0f766e"]

  // El tenant pisa --primary y --primary-foreground; el resto de los tokens
  // v2 no depende de ellos. Lo que se verifica es el par que sí cambia.
  it.each(["light", "dark"] as const)(
    "el texto sobre el primary del tenant se lee en %s",
    (mode) => {
      for (const color of sampleTenants) {
        const style = tenantThemeStyle(color) as Record<string, string>
        const fgToken = /var\(--([\w-]+)\)/.exec(
          style["--primary-foreground"]!
        )![1]!
        const ratio = contrastRatio(resolve(mode, fgToken), color)
        expect(ratio, `${color} en ${mode}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  )

  it("barrido de tonos: ningún primary elegido por el tenant baja de 3.9:1", () => {
    // En la banda de luminosidad media ni el blanco ni el negro llegan a 4.5
    // (límite matemático ≈ 4.58 con extremos puros; con los tokens, ≈ 4.0).
    // El piso de 3.9 detecta regresiones; la recomendación de producto es
    // validar el color al guardarlo (ver docs/tecnica/design-v2.md, riesgos).
    let worst = Infinity
    for (let l = 0.2; l <= 0.9; l += 0.05) {
      for (let h = 0; h < 360; h += 30) {
        const primary = `oklch(${l.toFixed(2)} 0.12 ${h})`
        // tenantThemeStyle trabaja con hex: se convierte pasando por sRGB.
        const { linear } = parseColor(primary)
        const hex =
          "#" +
          linear
            .map((c) => {
              const g =
                c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055
              return Math.round(g * 255)
                .toString(16)
                .padStart(2, "0")
            })
            .join("")
        const style = tenantThemeStyle(hex) as Record<string, string>
        const fgToken = /var\(--([\w-]+)\)/.exec(
          style["--primary-foreground"]!
        )![1]!
        worst = Math.min(worst, contrastRatio(resolve("light", fgToken), hex))
      }
    }
    expect(worst).toBeGreaterThanOrEqual(3.9)
  })
})
