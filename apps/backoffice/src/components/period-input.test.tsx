import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PeriodInput } from "./period-input"

describe("PeriodInput", () => {
  it("muestra el mes y el año del período", () => {
    render(<PeriodInput value="2026-11" onChange={() => {}} />)

    expect(screen.getByRole("combobox", { name: "Mes" })).toHaveTextContent(
      "Noviembre"
    )
    expect(screen.getByRole("combobox", { name: "Año" })).toHaveTextContent(
      "2026"
    )
  })

  it("cambiar el mes devuelve un período AAAA-MM", async () => {
    const onChange = vi.fn()
    render(<PeriodInput value="2026-11" onChange={onChange} />)

    await userEvent.click(screen.getByRole("combobox", { name: "Mes" }))
    await userEvent.click(await screen.findByRole("option", { name: "Marzo" }))

    expect(onChange).toHaveBeenCalledWith("2026-03")
  })

  it("con prefijo nombra cada select por separado", () => {
    render(<PeriodInput value="2026-01" onChange={() => {}} label="Desde" />)

    expect(
      screen.getByRole("combobox", { name: "Desde: mes" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("combobox", { name: "Desde: año" })
    ).toBeInTheDocument()
  })
})
