import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { favoritesKey } from "@/lib/favorites"
import { makeSite, PROPERTY, ROUTE } from "@/test-fixtures"

import { FavoritesList } from "./favorites-list"

const site = makeSite()
site.content.contact.whatsapp = "5492215550000"

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe("FavoritesList", () => {
  it("sin favoritos muestra el estado vacío y no llama a la API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    render(<FavoritesList site={site} route={{ ...ROUTE, slug: "vacio" }} />)
    expect(
      await screen.findByText("Todavía no guardaste favoritos")
    ).toBeVisible()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("pide las propiedades al propio sitio y ofrece compartir por WhatsApp", async () => {
    window.localStorage.setItem(
      favoritesKey("demo"),
      JSON.stringify([PROPERTY.id])
    )
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: [PROPERTY] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    )
    render(<FavoritesList site={site} route={ROUTE} />)

    expect(await screen.findByText("1 favorito")).toBeVisible()
    // Mismo origen: la CSP solo permite connect-src 'self'.
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(
      `/_s/demo/api/favoritos?ids=${PROPERTY.id}`
    )
    const share = screen.getByRole("link", { name: /compartir por whatsapp/i })
    expect(share).toHaveAttribute(
      "href",
      expect.stringMatching(/^https:\/\/wa\.me\/\?text=/)
    )
    expect(share).toHaveAttribute("rel", "noopener noreferrer")
    const ask = screen.getByRole("link", { name: /consultar por estas/i })
    expect(ask).toHaveAttribute(
      "href",
      expect.stringContaining("wa.me/5492215550000")
    )
  })

  it("si la API falla lo dice sin romper la página", async () => {
    window.localStorage.setItem(
      favoritesKey("falla"),
      JSON.stringify([PROPERTY.id])
    )
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"))
    render(<FavoritesList site={site} route={{ ...ROUTE, slug: "falla" }} />)
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /no pudimos cargar tus favoritos/i
      )
    )
  })
})
