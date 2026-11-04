import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import ts from "typescript"
import { describe, expect, it } from "vitest"

/**
 * Guardia de DT-12: los tipos del contrato HTTP salen del OpenAPI
 * (`generated/api.ts`), no se escriben a mano.
 *
 * Falla si alguien declara a mano (`interface` o `type X = { ... }`) un tipo
 * cuyo nombre coincide con un esquema generado (`X` o `XDto`). La solución es
 * un alias: `export type X = ApiSchemas["XDto"]`.
 *
 * Es un chequeo por nombre: no detecta un DTO escrito a mano con un nombre
 * distinto. Los tipos que hoy difieren del generado de verdad están en
 * `KNOWN_DIFFERENCES`, con el motivo; el detalle vive en
 * `docs/tecnica/shared-types-generados.md`.
 */
const SRC = join(import.meta.dirname)

/** Tipo a mano que coincide por nombre con un esquema generado, y por qué se queda. */
const KNOWN_DIFFERENCES: Record<string, string> = {
  AuditChange:
    "la API documenta before/after como object|null pero llevan cualquier JSON",
  ApiError:
    "el OpenAPI cierra `code` en errores de infraestructura y no puede expresar success:false",
  AuditEntryDetail:
    "extiende AuditEntry con AuditChange[], que se queda a mano (ver AuditChange)",
  ApiSuccess:
    "el sobre es genérico (`ApiSuccess<T>`); el generado trae `data: {}`",
  PortalRenterContract:
    "el OpenAPI declara string donde la API manda uniones cerradas (status, currency, ...)",
  PortalRenterAccount:
    "el OpenAPI declara string donde la API manda uniones cerradas (contract.status)",
  PortalOwnerProperty:
    "el OpenAPI declara string donde la API manda uniones cerradas (currency, status, ...)",
  PortalOwnerAccountProperty:
    "el OpenAPI declara string donde la API manda uniones cerradas (currency)",
  PortalOwnerAccount:
    "el OpenAPI declara string donde la API manda uniones cerradas (currency)",
}

const generatedSchemas = (): Set<string> => {
  const text = readFileSync(join(SRC, "generated/api.ts"), "utf8")
  const start = text.indexOf("  schemas: {")
  const names = [...text.slice(start).matchAll(/^ {4}([A-Za-z0-9]+): /gm)]
  return new Set(names.map((match) => match[1]!))
}

/** Tipos declarados a mano: interfaces y alias a un literal de objeto. */
const manualShapes = (file: string): string[] => {
  const source = ts.createSourceFile(
    file,
    readFileSync(join(SRC, file), "utf8"),
    ts.ScriptTarget.Latest,
    true
  )
  const names: string[] = []
  source.forEachChild((node) => {
    const exported = ts
      .getModifiers(node as ts.HasModifiers)
      ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    if (!exported) return
    if (ts.isInterfaceDeclaration(node)) names.push(node.name.text)
    else if (ts.isTypeAliasDeclaration(node)) {
      if (ts.isTypeLiteralNode(node.type)) names.push(node.name.text)
    }
  })
  return names
}

const sourceFiles = readdirSync(SRC).filter(
  (file) => file.endsWith(".ts") && !file.endsWith(".test.ts")
)

describe("shared-types: sin DTOs escritos a mano que ya existen generados", () => {
  const schemas = generatedSchemas()
  const matches = (name: string) =>
    schemas.has(name) || schemas.has(`${name}Dto`)

  const offenders = sourceFiles.flatMap((file) =>
    manualShapes(file)
      .filter((name) => matches(name) && !(name in KNOWN_DIFFERENCES))
      .map((name) => `${file}: ${name}`)
  )

  it("el generado se leyó (si no, el chequeo no prueba nada)", () => {
    expect(schemas.size).toBeGreaterThan(200)
    expect(schemas.has("PublicUserDto")).toBe(true)
  })

  it("no hay un tipo a mano con el nombre de un DTO generado", () => {
    // Si falla: reemplazalo por `export type X = ApiSchemas["XDto"]`. Si el
    // generado de verdad difiere, anotalo en KNOWN_DIFFERENCES con el motivo.
    expect(offenders).toEqual([])
  })

  it("KNOWN_DIFFERENCES no tiene entradas viejas", () => {
    const declared = new Set(sourceFiles.flatMap(manualShapes))
    const stale = Object.keys(KNOWN_DIFFERENCES).filter(
      (name) => !declared.has(name) || !matches(name)
    )
    expect(stale).toEqual([])
  })
})
