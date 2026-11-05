import { describe, expect, it } from "vitest"

import {
  FAVORITES_LIMIT,
  favoritesKey,
  favoritesShareText,
  parseFavorites,
  parseIdsParam,
  serializeFavorites,
  toggleFavorite,
} from "./favorites"
import { whatsappShareLink } from "./whatsapp"

const A = "11111111-1111-4111-8111-111111111111"
const B = "22222222-2222-4222-8222-222222222222"

describe("favoritos", () => {
  it("la clave es por sitio", () => {
    expect(favoritesKey("oppido")).not.toBe(favoritesKey("otra"))
  })

  it("lee solo ids válidos, sin repetir, y tolera basura", () => {
    expect(parseFavorites(JSON.stringify([A, A.toUpperCase(), B]))).toEqual([
      A,
      B,
    ])
    expect(parseFavorites(JSON.stringify([A, "x", 3, null, "<img>"]))).toEqual([
      A,
    ])
    expect(parseFavorites("{no es json")).toEqual([])
    expect(parseFavorites('{"a":1}')).toEqual([])
    expect(parseFavorites(null)).toEqual([])
  })

  it("agrega primero, quita y respeta el tope", () => {
    expect(toggleFavorite([A], B)).toEqual({ ids: [B, A], full: false })
    expect(toggleFavorite([B, A], B)).toEqual({ ids: [A], full: false })
    const full = Array.from(
      { length: FAVORITES_LIMIT },
      (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`
    )
    expect(toggleFavorite(full, A)).toEqual({ ids: full, full: true })
    expect(parseFavorites(serializeFavorites([...full, A]))).toHaveLength(
      FAVORITES_LIMIT
    )
  })

  it("lee ?ids= de una lista compartida", () => {
    expect(parseIdsParam(`${A},${B},nada`)).toEqual([A, B])
    expect(parseIdsParam(undefined)).toEqual([])
  })

  it("el mensaje es texto plano con links https", () => {
    const text = favoritesShareText({
      siteName: "Oppido",
      items: [{ id: A, title: "Casa en Tolosa", price: "US$ 120.000" }],
      origin: "https://oppido.example.com",
      basePath: "",
      ids: [A],
    })
    expect(text).toContain("1. Casa en Tolosa - US$ 120.000")
    expect(text).toContain(`https://oppido.example.com/propiedades/${A}`)
    expect(text).toContain(`/favoritos?ids=${A}`)
    expect(text).not.toMatch(/[*_<>]/)
  })

  it("sin https no manda links", () => {
    const text = favoritesShareText({
      siteName: "Oppido",
      items: [{ id: A, title: "Casa", price: "$ 1" }],
      origin: "http://localhost:3003",
      basePath: "/_s/oppido",
      ids: [A],
    })
    expect(text).not.toContain("http")
  })
})

describe("whatsappShareLink", () => {
  it("sin número abre el selector de contactos", () => {
    expect(whatsappShareLink("Hola")).toBe("https://wa.me/?text=Hola")
  })

  it("sanea el número a dígitos", () => {
    expect(whatsappShareLink("Hola", "+54 9 221 555-0000")).toBe(
      "https://wa.me/5492215550000?text=Hola"
    )
  })

  it("ignora un número inválido (no arma una URL rara)", () => {
    expect(whatsappShareLink("Hola", "javascript:alert(1)")).toBe(
      "https://wa.me/?text=Hola"
    )
    expect(whatsappShareLink("Hola", "123")).toBe("https://wa.me/?text=Hola")
  })

  it("codifica el texto y no rompe con un emoji en el corte", () => {
    const url = whatsappShareLink("a&b=c\n" + "😀".repeat(2000))
    expect(url.startsWith("https://wa.me/?text=a%26b%3Dc%0A")).toBe(true)
    expect(() => decodeURIComponent(url.split("text=")[1] ?? "")).not.toThrow()
  })
})
