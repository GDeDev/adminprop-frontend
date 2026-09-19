import globals from "globals"

import { config } from "@adminprop/eslint-config/base"

/**
 * Solo para los archivos de configuración de la raíz y de
 * packages/eslint-config (corren en Node). Cada app y paquete tiene su
 * propio eslint.config.js.
 *
 * @type {import("eslint").Linter.Config}
 */
export default [
  ...config,
  { languageOptions: { globals: globals.node } },
  {
    ignores: [
      "apps/**",
      "packages/ui/**",
      "packages/mocks/**",
      "packages/shared-types/**",
    ],
  },
]
