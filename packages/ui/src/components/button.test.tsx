import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button, buttonVariants } from "./button"

describe("Button", () => {
  it("con loading queda bloqueado, anunciado como ocupado y con spinner", () => {
    render(<Button loading>Guardar</Button>)
    const button = screen.getByRole("button", { name: "Guardar" })
    expect(button.hasAttribute("disabled")).toBe(true)
    expect(button.getAttribute("aria-busy")).toBe("true")
    expect(button.querySelector("svg")).not.toBeNull()
  })

  it("sin loading no agrega estado de ocupado", () => {
    render(<Button>Guardar</Button>)
    const button = screen.getByRole("button", { name: "Guardar" })
    expect(button.hasAttribute("disabled")).toBe(false)
    expect(button.hasAttribute("aria-busy")).toBe(false)
  })

  it("todos los tamaños llegan a 44px de alto o de área táctil en mobile", () => {
    // Por debajo de md: o la altura propia es h-11/size-11, o un
    // pseudo-elemento agranda el área (xs). Desde md vuelven a ser compactos.
    for (const size of [
      "default",
      "sm",
      "lg",
      "icon",
      "icon-sm",
      "icon-lg",
    ] as const) {
      expect(buttonVariants({ size }), size).toMatch(/\b(h|size)-11\b/)
    }
    for (const size of ["xs", "icon-xs"] as const) {
      expect(buttonVariants({ size }), size).toContain("after:absolute")
    }
  })
})
