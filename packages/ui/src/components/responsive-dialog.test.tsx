import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "./responsive-dialog"

function mockViewport({ desktop }: { desktop: boolean }) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: desktop && query.includes("min-width"),
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

function Example() {
  return (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger>Registrar pago</ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Registrar pago</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Cuota de junio
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("ResponsiveDialog", () => {
  it("en mobile abre un Drawer", async () => {
    mockViewport({ desktop: false })
    const user = userEvent.setup()
    render(<Example />)

    await user.click(screen.getByRole("button", { name: "Registrar pago" }))

    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveAttribute("data-slot", "drawer-content")
  })

  it("en desktop abre un Dialog", async () => {
    mockViewport({ desktop: true })
    const user = userEvent.setup()
    render(<Example />)

    await user.click(screen.getByRole("button", { name: "Registrar pago" }))

    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveAttribute("data-slot", "dialog-content")
  })
})
