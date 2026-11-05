import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { favoritesKey } from "@/lib/favorites"

import { FavoriteButton } from "./favorite-button"
import { useFavorites } from "./favorites-store"

const A = "11111111-1111-4111-8111-111111111111"
const B = "22222222-2222-4222-8222-222222222222"

function Count({ slug }: { slug: string }) {
  const { ids, persistent } = useFavorites(slug)
  return (
    <p data-testid="count">
      {ids.length}:{persistent ? "saved" : "memory"}
    </p>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe("FavoriteButton", () => {
  it("guarda y quita, con aria-pressed y el nombre de la propiedad", async () => {
    const user = userEvent.setup()
    render(<FavoriteButton slug="t1" propertyId={A} title="Casa en Tolosa" />)

    const button = screen.getByRole("button", {
      name: "Guardar Casa en Tolosa en favoritos",
    })
    expect(button).toHaveAttribute("aria-pressed", "false")
    await user.click(button)

    const pressed = screen.getByRole("button", {
      name: "Quitar Casa en Tolosa de favoritos",
    })
    expect(pressed).toHaveAttribute("aria-pressed", "true")
    expect(window.localStorage.getItem(favoritesKey("t1"))).toBe(
      JSON.stringify([A])
    )

    await user.click(pressed)
    expect(window.localStorage.getItem(favoritesKey("t1"))).toBe("[]")
  })

  it("los botones y contadores de la misma página comparten el estado", async () => {
    const user = userEvent.setup()
    render(
      <>
        <FavoriteButton slug="t2" propertyId={A} title="Una" />
        <FavoriteButton slug="t2" propertyId={B} title="Dos" />
        <Count slug="t2" />
      </>
    )
    await user.click(screen.getByRole("button", { name: /guardar una/i }))
    await user.click(screen.getByRole("button", { name: /guardar dos/i }))
    expect(screen.getByTestId("count")).toHaveTextContent("2:saved")
  })

  it("lee favoritos ya guardados e ignora basura en el storage", () => {
    window.localStorage.setItem(
      favoritesKey("t3"),
      JSON.stringify([A, "<script>", 7])
    )
    render(
      <>
        <FavoriteButton slug="t3" propertyId={A} title="Una" />
        <Count slug="t3" />
      </>
    )
    expect(screen.getByRole("button", { name: /quitar una/i })).toBeVisible()
    expect(screen.getByTestId("count")).toHaveTextContent("1:saved")
  })

  it("si localStorage lanza, sigue funcionando en memoria y lo avisa", async () => {
    const user = userEvent.setup()
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError")
    })
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError")
    })
    render(
      <>
        <FavoriteButton slug="t4" propertyId={A} title="Una" />
        <Count slug="t4" />
      </>
    )
    await user.click(screen.getByRole("button", { name: /guardar una/i }))
    expect(screen.getByRole("button", { name: /quitar una/i })).toBeVisible()
    expect(screen.getByTestId("count")).toHaveTextContent("1:memory")
  })

  it("con la lista llena no agrega y avisa", async () => {
    const user = userEvent.setup()
    const full = Array.from(
      { length: 30 },
      (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`
    )
    window.localStorage.setItem(favoritesKey("t5"), JSON.stringify(full))
    render(<FavoriteButton slug="t5" propertyId={A} title="Una" />)
    await user.click(screen.getByRole("button", { name: /guardar una/i }))
    expect(screen.getByRole("status")).toHaveTextContent(/máximo de favoritos/i)
    expect(
      screen.getByRole("button", { name: /guardar una/i })
    ).toHaveAttribute("aria-pressed", "false")
  })
})
