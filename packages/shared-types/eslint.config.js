import { config } from "@adminprop/eslint-config/base"

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  // Generado por `npm run api:types` desde el OpenAPI de la API: no se edita.
  { ignores: ["src/generated/**"] },
]
