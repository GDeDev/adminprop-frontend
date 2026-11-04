// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

/**
 * Reglas de ADMINPROP-UI-v2.md que se pueden chequear leyendo el código.
 * Sirven sobre todo al instalar un componente nuevo de shadcn: si trae un
 * `hover:bg-accent` o un `transition-all`, este test lo marca.
 */
const here = path.dirname(fileURLToPath(import.meta.url))
const componentsDir = path.resolve(here, "../src/components")
const stylesDir = path.resolve(here, "../src/styles")

const components = readdirSync(componentsDir)
  .filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"))
  .map((file) => ({
    file,
    source: readFileSync(path.join(componentsDir, file), "utf8"),
  }))

const v1 = readFileSync(path.join(stylesDir, "adminprop.css"), "utf8")
const v2 = readFileSync(path.join(stylesDir, "adminprop-v2.css"), "utf8")
const effects = readFileSync(
  path.join(stylesDir, "adminprop-v2-effects.css"),
  "utf8"
)

function offenders(pattern: RegExp) {
  return components
    .filter(({ source }) => pattern.test(source))
    .map(({ file }) => file)
}

describe("reglas del sistema de diseño (componentes)", () => {
  it("encuentra los componentes", () => {
    expect(components.length).toBeGreaterThan(20)
  })

  it("accent no se usa como superficie de hover, foco o selección (va muted)", () => {
    expect(
      offenders(
        /(hover|focus|focus-visible|data-\[[^\]]+\]|aria-\w+):bg-accent\b/
      )
    ).toEqual([])
    expect(offenders(/text-accent-foreground/)).toEqual([])
  })

  it("ningún componente escribe un color (hex, oklch, rgb, hsl)", () => {
    expect(offenders(/#[0-9a-fA-F]{3,8}\b/)).toEqual([])
    expect(offenders(/\b(oklch|oklab|rgba?|hsla?)\(/)).toEqual([])
  })

  it("no usa blanco ni negro fijos: sale de un token", () => {
    expect(offenders(/\btext-white\b/)).toEqual([])
    expect(offenders(/\bbg-(black|white)\b/)).toEqual([])
  })

  it("no usa transition-all: se anima solo lo que cambia", () => {
    expect(offenders(/\btransition-all\b/)).toEqual([])
  })

  it("no anima propiedades de layout", () => {
    expect(
      offenders(
        /transition-\[[^\]]*\b(width|height|top|left|right|bottom|margin|padding)\b/
      )
    ).toEqual([])
  })

  it("no usa animate-pulse: la carga es shimmer", () => {
    expect(offenders(/\banimate-pulse\b/)).toEqual([])
  })

  it("el blur de fondo no está en componentes que se repiten en listas", () => {
    const listLike = ["table.tsx", "card.tsx", "skeleton.tsx", "badge.tsx"]
    const withBlur = components
      .filter(({ file }) => listLike.includes(file))
      .filter(({ source }) => /backdrop-blur|\bglass\b/.test(source))
      .map(({ file }) => file)
    expect(withBlur).toEqual([])
  })

  it("los targets de los botones de ícono miden 44px en mobile", () => {
    const button = components.find(({ file }) => file === "button.tsx")!
    expect(button.source).toContain('icon: "size-11 md:size-9"')
    expect(button.source).toContain("h-11")
  })
})

describe("reglas del sistema de diseño (tokens v2)", () => {
  const names = (css: string) =>
    new Set([...css.matchAll(/^\s*--([\w-]+):/gm)].map((m) => m[1]!))

  it("v2 conserva todos los tokens de color de v1 (las apps no cambian)", () => {
    const colorTokens = [...names(v1)].filter(
      (name) =>
        !/^(radius|space|shadow)/.test(name) && !name.startsWith("font-")
    )
    const missing = colorTokens.filter((name) => !names(v2).has(name))
    expect(missing).toEqual([])
  })

  it("v2 define los mismos tokens para claro y oscuro", () => {
    const dark = v2.slice(v2.indexOf("\n.dark {"))
    const darkBlock = dark.slice(0, dark.indexOf("\n}"))
    const colorNames = [...v2.matchAll(/^ {2}--([\w-]+):\s*oklch\(/gm)].map(
      (m) => m[1]!
    )
    // Los tokens de marca, estados e IA tienen que tener versión oscura.
    const mustOverride = colorNames.filter((name) =>
      /^(background|foreground|card|popover|primary|secondary|muted|accent|destructive|success|warning|info|ai|border|input|sidebar)/.test(
        name
      )
    )
    const missing = mustOverride.filter(
      (name) => !darkBlock.includes(`--${name}:`)
    )
    expect(missing).toEqual([])
  })

  it("los colores de v2 están en OKLCH (ningún hex)", () => {
    expect(v2).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  it("el tema por inmobiliaria solo pisa primary: lo derivado usa color-mix", () => {
    expect(v2).toMatch(
      /--glow-primary:[^;]*color-mix\(in oklab, var\(--primary\)/
    )
    expect(effects).toMatch(/bg-primary-gradient[\s\S]*var\(--primary\)/)
  })
})

describe("reglas del sistema de diseño (movimiento)", () => {
  it("los keyframes solo animan transform y opacity", () => {
    const bodies = [
      ...effects.matchAll(/@keyframes [\w-]+ \{([\s\S]*?)\n {2}\}/g),
    ].map((m) => m[1]!)
    expect(bodies.length).toBeGreaterThanOrEqual(6)

    const allowed = new Set(["opacity", "transform"])
    const used = new Set<string>()
    for (const body of bodies) {
      for (const m of body.matchAll(/^\s*([a-z-]+):\s*[^;{]+;/gm)) {
        used.add(m[1]!)
      }
    }
    expect([...used].filter((p) => !allowed.has(p))).toEqual([])
  })

  it("todo movimiento tiene su versión con prefers-reduced-motion", () => {
    expect(effects).toContain("@media (prefers-reduced-motion: reduce)")
    for (const klass of [
      ".animate-fade-up",
      ".animate-shimmer",
      ".animate-sparkle",
      ".stagger > *",
      ".page-enter",
      ".shimmer::after",
      ".pressable",
    ]) {
      const reduced = effects.slice(
        effects.indexOf("@media (prefers-reduced-motion: reduce)")
      )
      expect(reduced, klass).toContain(klass)
    }
  })

  it("las duraciones del sistema son 120/200/320/500 ms", () => {
    for (const ms of ["120ms", "200ms", "320ms", "500ms"]) {
      expect(v2).toContain(ms)
    }
  })
})
