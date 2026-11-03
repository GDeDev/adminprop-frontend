import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PriceText } from "./price-text"

describe("PriceText", () => {
  it("muestra el precio publicado", () => {
    render(<PriceText price="450000.00" currency="ARS" />)
    expect(screen.getByText(/450\.000/)).toBeInTheDocument()
  })

  it("sin precio muestra «Consultar precio» como texto secundario", () => {
    render(<PriceText price={null} currency={null} />)
    expect(screen.getByText("Consultar precio")).toBeInTheDocument()
  })
})
