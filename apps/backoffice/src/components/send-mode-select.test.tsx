import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { StatementSendMode } from "@adminprop/shared-types"

import { SendModeSelect } from "./send-mode-select"

function Harness({
  context,
  onChange,
}: {
  context: "owner" | "close"
  onChange: (value: StatementSendMode) => void
}) {
  const [value, setValue] = React.useState<StatementSendMode>("SUMMARY")
  return (
    <SendModeSelect
      id="mode"
      label="Qué se envía"
      context={context}
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange(next)
      }}
    />
  )
}

describe("SendModeSelect", () => {
  it("explica qué se envía y cambia el texto con cada modo", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness context="owner" onChange={onChange} />)

    const trigger = screen.getByRole("combobox", { name: "Qué se envía" })
    expect(trigger).toHaveAccessibleDescription(/un solo email por mes/)

    await user.click(trigger)
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Solo el resumen",
      "Comprobantes individuales",
      "Ambos: resumen y comprobantes",
    ])
    await user.click(
      screen.getByRole("option", { name: "Comprobantes individuales" })
    )
    expect(onChange).toHaveBeenCalledWith("RECEIPTS")
    expect(trigger).toHaveAccessibleDescription(
      /No se le manda el email del consolidado/
    )
  })

  it("al cerrar avisa que los comprobantes ya enviados no se retiran", () => {
    render(<Harness context="close" onChange={vi.fn()} />)
    expect(
      screen.getByText(
        /ya salieron al confirmar las liquidaciones no se pueden retirar/
      )
    ).toBeVisible()
    expect(screen.getByText(/Los PDF se generan igual/)).toBeVisible()
  })
})
