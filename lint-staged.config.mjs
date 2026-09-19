/**
 * @filename: lint-staged.config.mjs
 * @type {import('lint-staged').Configuration}
 *
 * Corre en el pre-commit (Husky) sobre los archivos staged: formatea, lintea
 * y corre los tests relacionados. Un commit con lint o tests en rojo no entra.
 */
import path from "node:path"

/** Workspaces con Vitest. */
const TEST_WORKSPACES = [
  "apps/backoffice",
  "apps/portal",
  "packages/ui",
  "packages/session",
]

const quote = (files) => files.map((f) => JSON.stringify(f)).join(" ")
const rel = (file) => path.relative(process.cwd(), file).replaceAll("\\", "/")

export default {
  "*.{ts,tsx,js,mjs,cjs}": (files) => {
    const commands = [
      `prettier --write ${quote(files)}`,
      // Cada workspace tiene su eslint.config.js: se busca desde el archivo.
      // --no-warn-ignored: un archivo ignorado a propósito (los tipos
      // generados) no cuenta como warning.
      `eslint --flag v10_config_lookup_from_file --fix --max-warnings=0 --no-warn-ignored ${quote(files)}`,
    ]

    // Tests relacionados: los del workspace tocado y, si el cambio está en
    // packages/ (compartido), también los de las apps que lo importan.
    const touchesShared = files.some((f) => rel(f).startsWith("packages/"))
    for (const workspace of TEST_WORKSPACES) {
      const own = files.some((f) => rel(f).startsWith(`${workspace}/`))
      if (own || touchesShared) {
        commands.push(
          `vitest related --run --passWithNoTests --root ${workspace} ${quote(files)}`
        )
      }
    }
    return commands
  },
  "*.{json,md,css,yml,yaml}": "prettier --write",
}
