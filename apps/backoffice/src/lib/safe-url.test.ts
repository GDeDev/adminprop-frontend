import { describe, expect, it } from "vitest"

import { safeHttpUrl } from "./safe-url"

describe("safeHttpUrl", () => {
  it("acepta http y https", () => {
    expect(safeHttpUrl("https://auth.example.com/x?y=1")).toBe(
      "https://auth.example.com/x?y=1"
    )
    expect(safeHttpUrl("http://localhost:3000/a")).toBe(
      "http://localhost:3000/a"
    )
  })

  it("rechaza otros esquemas, vacíos y basura", () => {
    for (const value of [
      "javascript:alert(1)",
      " javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      "data:text/html,<script>1</script>",
      "/relativa",
      "no es url",
      "",
      null,
      undefined,
    ]) {
      expect(safeHttpUrl(value)).toBeNull()
    }
  })
})
