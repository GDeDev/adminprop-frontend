import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CountBars } from "./count-bars"
import { DailyBarsChart } from "./daily-bars-chart"

describe("DailyBarsChart", () => {
  const data = [
    { date: "2026-11-01", value: 3 },
    { date: "2026-11-02", value: 0 },
    { date: "2026-11-03", value: 5 },
  ]

  it("describe la serie con texto y ofrece la tabla alternativa", () => {
    const { container } = render(
      <DailyBarsChart
        title="Vistas por día"
        unit="vistas"
        data={data}
        tone="chart-1"
      />
    )
    const chart = screen.getByRole("img", { name: /Vistas por día: 8 vistas/ })
    expect(chart).toBeInTheDocument()
    expect(screen.getByText("8 en total")).toBeInTheDocument()
    // Solo se dibujan los días con valor.
    expect(container.querySelectorAll("rect")).toHaveLength(2)
    const table = screen.getByRole("table", { hidden: true })
    expect(within(table).getAllByRole("row", { hidden: true })).toHaveLength(4)
  })

  it("sin datos no revienta", () => {
    const { container } = render(
      <DailyBarsChart
        title="Consultas"
        unit="consultas"
        data={[]}
        tone="chart-2"
      />
    )
    expect(container.querySelectorAll("rect")).toHaveLength(0)
    expect(screen.getByText("0 en total")).toBeInTheDocument()
  })
})

describe("CountBars", () => {
  it("escribe la cantidad de cada ítem", () => {
    render(
      <CountBars
        title="Por etapa"
        items={[
          { key: "a", label: "Nueva", value: 4 },
          { key: "b", label: "Perdida", value: 0 },
        ]}
      />
    )
    const items = screen.getAllByRole("listitem")
    expect(items[0]).toHaveTextContent("Nueva")
    expect(items[0]).toHaveTextContent("4")
    expect(items[1]).toHaveTextContent("0")
  })
})
