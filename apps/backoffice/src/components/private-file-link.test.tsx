import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { PrivateFileLink } from "./private-file-link"

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }))

describe("PrivateFileLink", () => {
  let tab: { opener: unknown; location: { href: string }; close: () => void }

  beforeEach(() => {
    tab = { opener: {}, location: { href: "" }, close: vi.fn() }
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("con la URL fresca la abre sin volver a pedir el recurso", async () => {
    const refresh = vi.fn()
    render(
      <PrivateFileLink
        url="https://files.test/recibo.pdf"
        receivedAt={Date.now()}
        refresh={refresh}
      >
        Comprobante
      </PrivateFileLink>
    )

    await userEvent.click(screen.getByRole("button", { name: "Comprobante" }))

    await waitFor(() =>
      expect(tab.location.href).toBe("https://files.test/recibo.pdf")
    )
    expect(refresh).not.toHaveBeenCalled()
    expect(tab.opener).toBeNull()
  })

  it("con la URL por vencer pide el recurso de nuevo y abre la nueva", async () => {
    const refresh = vi.fn().mockResolvedValue("https://files.test/nuevo.pdf")
    render(
      <PrivateFileLink
        url="https://files.test/viejo.pdf"
        receivedAt={Date.now() - 10 * 60 * 1000}
        refresh={refresh}
      >
        Comprobante
      </PrivateFileLink>
    )

    await userEvent.click(screen.getByRole("button", { name: "Comprobante" }))

    await waitFor(() =>
      expect(tab.location.href).toBe("https://files.test/nuevo.pdf")
    )
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("no sigue una URL que no es http(s)", async () => {
    render(
      <PrivateFileLink
        url="javascript:alert(1)"
        receivedAt={Date.now()}
        refresh={vi.fn()}
      >
        Comprobante
      </PrivateFileLink>
    )

    await userEvent.click(screen.getByRole("button", { name: "Comprobante" }))

    await waitFor(() => expect(tab.close).toHaveBeenCalled())
    expect(tab.location.href).toBe("")
  })
})
