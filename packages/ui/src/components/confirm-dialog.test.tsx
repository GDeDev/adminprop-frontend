import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ConfirmDialog } from "./confirm-dialog"

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

describe("ConfirmDialog", () => {
  afterEach(() => vi.restoreAllMocks())

  it("muestra la pregunta y llama a onConfirm al confirmar", async () => {
    mockDesktop()
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="¿Eliminar al propietario?"
        description="Pierde el acceso al portal."
        confirmLabel="Eliminar"
        onConfirm={onConfirm}
      />
    )

    expect(
      screen.getByRole("heading", { name: "¿Eliminar al propietario?" })
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("Cancelar cierra sin confirmar", async () => {
    mockDesktop()
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="¿Reabrir el consolidado?"
        confirmLabel="Reabrir"
        destructive={false}
        onConfirm={onConfirm}
      />
    )

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("con pending deshabilita los dos botones", () => {
    mockDesktop()
    render(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="¿Eliminar?"
        confirmLabel="Eliminar"
        pending
        onConfirm={() => {}}
      />
    )

    expect(screen.getByRole("button", { name: "Eliminar" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled()
  })
})
