import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { MyNotificationPreferenceItem } from "@adminprop/shared-types"

import { PreferenceRow } from "./my-notifications"

const item: MyNotificationPreferenceItem = {
  type: "STATEMENT_PENDING",
  title: "Consolidado pendiente",
  emailEnabled: false,
  inAppEnabled: true,
  mandatory: false,
}

describe("PreferenceRow", () => {
  it("permite prender y apagar cada canal", async () => {
    const onToggle = vi.fn()
    render(<PreferenceRow item={item} saving={false} onToggle={onToggle} />)

    await userEvent.click(
      screen.getByRole("switch", { name: "Consolidado pendiente: email" })
    )
    expect(onToggle).toHaveBeenLastCalledWith("emailEnabled", true)

    await userEvent.click(
      screen.getByRole("switch", { name: "Consolidado pendiente: en la app" })
    )
    expect(onToggle).toHaveBeenLastCalledWith("inAppEnabled", false)
  })

  it("los obligatorios no se pueden apagar", () => {
    render(
      <PreferenceRow
        item={{ ...item, mandatory: true }}
        saving={false}
        onToggle={vi.fn()}
      />
    )
    for (const control of screen.getAllByRole("switch")) {
      expect(control).toBeDisabled()
    }
    expect(screen.getByText("Obligatorio")).toBeInTheDocument()
  })
})
