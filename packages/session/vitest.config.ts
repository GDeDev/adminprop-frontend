import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

import { sharedTest } from "../../vitest.shared"

export default defineConfig({
  plugins: [react()],
  test: {
    ...sharedTest,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
