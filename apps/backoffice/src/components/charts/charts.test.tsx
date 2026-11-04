import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { BarList } from "./bar-list"
import { DailyChart } from "./daily-chart"

describe("BarList", () => {
  it("muestra etiqueta y número de cada fila, sin depender de la barra", () => {
    render(
      <BarList
        title="Consultas por etapa"
        rows={[
          { key: "NEW", label: "Nueva", value: 4 },
          { key: "CONTACTED", label: "Contactada", value: 0 },
        ]}
      />
    )
    const items = within(
      screen.getByRole("region", { name: "Consultas por etapa" })
    ).getAllByRole("listitem")
    expect(items[0]).toHaveTextContent("Nueva")
    expect(items[0]).toHaveTextContent("4")
    expect(items[1]).toHaveTextContent("Contactada")
    expect(items[1]).toHaveTextContent("0")
  })

  it("sin datos explica que no hay nada en el período", () => {
    render(<BarList title="Por canal" rows={[]} />)
    expect(screen.getByText("Sin datos en el período.")).toBeInTheDocument()
  })
})

describe("DailyChart", () => {
  const daily = [
    { date: "2026-11-01", views: 3, inquiries: 0 },
    { date: "2026-11-02", views: 9, inquiries: 2 },
  ]

  it("cada gráfico tiene un resumen en texto con total y máximo", () => {
    render(<DailyChart daily={daily} />)
    expect(
      screen.getByRole("img", {
        name: "Vistas por día: 12 vistas en total, el máximo fue 9 el 02/11/2026.",
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("img", {
        name: "Consultas por día: 2 consultas en total, el máximo fue 2 el 02/11/2026.",
      })
    ).toBeInTheDocument()
  })

  it("ofrece la misma información como tabla", () => {
    render(<DailyChart daily={daily} />)
    const table = screen.getByRole("table", {
      name: "Vistas y consultas por día",
    })
    const rows = within(table).getAllByRole("row")
    expect(rows).toHaveLength(3)
    expect(rows[2]).toHaveTextContent("02/11/2026")
    expect(rows[2]).toHaveTextContent("9")
    expect(rows[2]).toHaveTextContent("2")
  })

  it("una serie en cero lo dice en vez de dibujar un gráfico vacío engañoso", () => {
    render(
      <DailyChart daily={[{ date: "2026-11-01", views: 0, inquiries: 0 }]} />
    )
    expect(
      screen.getByRole("img", {
        name: "Vistas por día: sin vistas en el período.",
      })
    ).toBeInTheDocument()
  })

  it("sin días no hay gráfico", () => {
    render(<DailyChart daily={[]} />)
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    expect(
      screen.getByText("No hay datos diarios para este período.")
    ).toBeInTheDocument()
  })
})
