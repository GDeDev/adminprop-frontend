import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { passwordRuleError, SecurityPanel } from "./security-panel"

function mockDesktop() {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query.includes("min-width"),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList
  )
}

afterEach(() => vi.restoreAllMocks())

describe("passwordRuleError", () => {
  it("aplica las reglas de la API", () => {
    expect(passwordRuleError("Corta1")).toMatch(/10 caracteres/)
    expect(passwordRuleError("TODASMAYUSCULAS1")).toMatch(/minúscula/)
    expect(passwordRuleError("todasminusculas1")).toMatch(/mayúscula/)
    expect(passwordRuleError("SinNumeroAlguno")).toMatch(/número/)
    expect(passwordRuleError("ClaveSegura123")).toBeNull()
  })
})

describe("SecurityPanel", () => {
  it("no envía si la contraseña nueva es débil o no coincide", async () => {
    mockDesktop()
    const onChangePassword = vi.fn().mockResolvedValue(null)
    const user = userEvent.setup()
    render(
      <SecurityPanel
        onChangePassword={onChangePassword}
        onLogoutAll={vi.fn()}
      />
    )

    await user.type(screen.getByLabelText("Contraseña actual"), "Actual12345")
    await user.type(screen.getByLabelText("Contraseña nueva"), "corta")
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }))
    expect(
      await screen.findByText("Tiene que tener al menos 10 caracteres.")
    ).toBeInTheDocument()

    await user.clear(screen.getByLabelText("Contraseña nueva"))
    await user.type(screen.getByLabelText("Contraseña nueva"), "ClaveSegura123")
    await user.type(screen.getByLabelText("Repetí la contraseña nueva"), "Otra")
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }))
    expect(
      await screen.findByText("Las contraseñas no coinciden.")
    ).toBeInTheDocument()
    expect(onChangePassword).not.toHaveBeenCalled()
  })

  it("cambia la contraseña y muestra el error de la API si falla", async () => {
    mockDesktop()
    const onChangePassword = vi
      .fn()
      .mockResolvedValue("La contraseña actual es incorrecta.")
    const user = userEvent.setup()
    render(
      <SecurityPanel
        onChangePassword={onChangePassword}
        onLogoutAll={vi.fn()}
      />
    )

    await user.type(screen.getByLabelText("Contraseña actual"), "Actual12345")
    await user.type(screen.getByLabelText("Contraseña nueva"), "ClaveSegura123")
    await user.type(
      screen.getByLabelText("Repetí la contraseña nueva"),
      "ClaveSegura123"
    )
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }))

    await waitFor(() =>
      expect(onChangePassword).toHaveBeenCalledWith({
        currentPassword: "Actual12345",
        newPassword: "ClaveSegura123",
      })
    )
    expect(
      await screen.findByText("La contraseña actual es incorrecta.")
    ).toBeInTheDocument()
  })

  it("pide confirmación antes de cerrar todas las sesiones", async () => {
    mockDesktop()
    const onLogoutAll = vi.fn().mockResolvedValue(null)
    const user = userEvent.setup()
    render(
      <SecurityPanel onChangePassword={vi.fn()} onLogoutAll={onLogoutAll} />
    )

    await user.click(
      screen.getByRole("button", { name: "Cerrar todas las sesiones" })
    )
    expect(onLogoutAll).not.toHaveBeenCalled()
    const dialog = await screen.findByRole("dialog")
    await user.click(
      within(dialog).getByRole("button", { name: "Cerrar todas las sesiones" })
    )
    await waitFor(() => expect(onLogoutAll).toHaveBeenCalledTimes(1))
  })
})
