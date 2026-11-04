// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

/**
 * El lenguaje v2 también rige en las pantallas de las apps (no solo en
 * packages/ui). Estas reglas evitan que vuelvan las clases de v1.
 * `apps/sites` queda afuera: sus templates se tematizan por inmobiliaria.
 */
const here = path.dirname(fileURLToPath(import.meta.url))
const appsDir = path.resolve(here, "../../../apps")

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (name === "node_modules" || name === ".next") return []
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.tsx$/.test(name) && !/\.test\.tsx$/.test(name) ? [full] : []
  })
}

const files = ["backoffice", "portal"]
  .flatMap((app) => walk(path.join(appsDir, app, "src")))
  // La vitrina enseña las clases viejas a propósito.
  .filter((file) => !file.includes(`${path.sep}design-system${path.sep}`))
  .map((file) => ({
    file: path.relative(appsDir, file),
    lines: readFileSync(file, "utf8").split("\n"),
  }))

function offenders(test: (line: string) => boolean) {
  return files.flatMap(({ file, lines }) =>
    lines.flatMap((line, index) => (test(line) ? [`${file}:${index + 1}`] : []))
  )
}

describe("pantallas de las apps (lenguaje v2)", () => {
  it("encuentra las pantallas", () => {
    expect(files.length).toBeGreaterThan(100)
  })

  it("las cifras usan `num` (tabulares sin ligaduras), no `tabular-nums`", () => {
    expect(offenders((line) => /(?<![\w-])tabular-nums\b/.test(line))).toEqual(
      []
    )
  })

  it("los títulos y cifras display usan la escala con nombre", () => {
    expect(
      offenders(
        (line) =>
          /font-display/.test(line) &&
          /\btext-(base|lg|xl|2xl|3xl)\b/.test(line)
      )
    ).toEqual([])
  })

  it("los paneles hechos a mano tienen elevación (shadow-*)", () => {
    expect(
      offenders(
        (line) =>
          /rounded-xl border bg-card/.test(line) && !/shadow-/.test(line)
      )
    ).toEqual([])
  })

  it("sin transition-all ni animate-pulse (usar skeleton y transiciones acotadas)", () => {
    expect(
      offenders((line) => /\b(transition-all|animate-pulse)\b/.test(line))
    ).toEqual([])
  })

  it("sin colores escritos a mano en las clases", () => {
    expect(
      offenders((line) => /\b(bg|text|border)-\[#[0-9a-fA-F]{3,8}\]/.test(line))
    ).toEqual([])
  })
})
