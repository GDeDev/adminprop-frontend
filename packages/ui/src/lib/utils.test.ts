import { describe, expect, it } from "vitest"

import { cn } from "./utils"

describe("cn", () => {
  it("resuelve conflictos de Tailwind a favor de la última clase", () => {
    expect(cn("h-9 px-4", "h-11")).toBe("px-4 h-11")
  })

  it("no confunde la familia tipográfica con el peso", () => {
    // font-display (familia) y font-semibold (peso) conviven.
    expect(cn("font-display font-semibold")).toBe("font-display font-semibold")
  })

  it("trata los tokens de estado como colores", () => {
    expect(
      cn("bg-muted text-muted-foreground", "bg-success-soft text-success")
    ).toBe("bg-success-soft text-success")
  })
})
