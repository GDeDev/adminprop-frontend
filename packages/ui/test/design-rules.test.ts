// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

/**
 * Reglas de ADMINPROP-UI.md que se pueden chequear leyendo el código. Sirven
 * sobre todo al instalar un componente nuevo de shadcn: si trae un
 * `hover:bg-accent`, este test lo marca.
 */
const componentsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/components"
)

const components = readdirSync(componentsDir)
  .filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"))
  .map((file) => ({
    file,
    source: readFileSync(path.join(componentsDir, file), "utf8"),
  }))

function offenders(pattern: RegExp) {
  return components
    .filter(({ source }) => pattern.test(source))
    .map(({ file }) => file)
}

describe("reglas del sistema de diseño", () => {
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

  it("ningún componente escribe un color hex", () => {
    expect(offenders(/#[0-9a-fA-F]{3,8}\b/)).toEqual([])
  })

  it("no usa blanco fijo para texto: sale de un token *-foreground", () => {
    expect(offenders(/\btext-white\b/)).toEqual([])
  })
})
