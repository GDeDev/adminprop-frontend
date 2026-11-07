import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PageSkeleton } from "./page-skeleton"

describe("PageSkeleton", () => {
  it("se anuncia como estado de carga", () => {
    render(<PageSkeleton />)
    expect(screen.getByRole("status").textContent).toContain("Cargando…")
  })
})
