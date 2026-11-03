import { afterEach, describe, expect, it, vi } from "vitest"

import { openInNewTab } from "./open-in-new-tab"

function fakeTab() {
  return {
    opener: "x" as unknown,
    close: vi.fn(),
    location: { href: "" },
  }
}

afterEach(() => vi.restoreAllMocks())

describe("openInNewTab", () => {
  it("abre la pestaña antes de pedir la URL y después le asigna el destino", async () => {
    const tab = fakeTab()
    const open = vi
      .spyOn(window, "open")
      .mockReturnValue(tab as unknown as Window)
    const order: string[] = []
    open.mockImplementation(() => {
      order.push("open")
      return tab as unknown as Window
    })

    const opened = await openInNewTab(async () => {
      order.push("resolve")
      return "https://res.cloudinary.com/a.pdf"
    })

    expect(opened).toBe(true)
    expect(order).toEqual(["open", "resolve"])
    expect(tab.opener).toBeNull()
    expect(tab.location.href).toBe("https://res.cloudinary.com/a.pdf")
    expect(tab.close).not.toHaveBeenCalled()
  })

  it("cierra la pestaña si la URL no es http(s) y no navega", async () => {
    const tab = fakeTab()
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window)

    const opened = await openInNewTab(async () => "javascript:alert(1)")

    expect(opened).toBe(false)
    expect(tab.close).toHaveBeenCalled()
    expect(tab.location.href).toBe("")
  })

  it("cierra la pestaña y propaga el error si falla el pedido", async () => {
    const tab = fakeTab()
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window)

    await expect(
      openInNewTab(async () => {
        throw new Error("boom")
      })
    ).rejects.toThrow("boom")
    expect(tab.close).toHaveBeenCalled()
  })

  it("si el navegador no deja abrir la pestaña, abre al final", async () => {
    const open = vi.spyOn(window, "open").mockReturnValueOnce(null)
    open.mockReturnValue(null)

    await openInNewTab(async () => "https://a.com/x.pdf")

    expect(open).toHaveBeenLastCalledWith(
      "https://a.com/x.pdf",
      "_blank",
      "noopener,noreferrer"
    )
  })
})
