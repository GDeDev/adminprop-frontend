import path from "node:path"
import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

import { sharedTest } from "../../vitest.shared"

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: `${root}/src/$1` },
      {
        find: /^@adminprop\/ui\/(.*)$/,
        replacement: `${root}/../../packages/ui/src/$1`,
      },
    ],
  },
  test: {
    ...sharedTest,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
