import { describe, expect, it } from "vitest"

import { isSameOrigin } from "./origin"

describe("isSameOrigin", () => {
  it("acepta el propio host, con o sin puerto", () => {
    expect(isSameOrigin("https://mi-inmo.sites.com", "mi-inmo.sites.com")).toBe(
      true
    )
    expect(isSameOrigin("http://localhost:3003", "localhost:3003")).toBe(true)
    expect(isSameOrigin("https://a.com", "a.com, proxy.interno")).toBe(true)
  })

  it("acepta un pedido sin Origin (no es un navegador) y sin Host", () => {
    expect(isSameOrigin(null, "a.com")).toBe(true)
    expect(isSameOrigin("https://a.com", null)).toBe(true)
  })

  it("rechaza otro origen", () => {
    expect(isSameOrigin("https://evil.test", "a.com")).toBe(false)
    expect(isSameOrigin("https://a.com.evil.test", "a.com")).toBe(false)
  })

  it("rechaza un Origin ilegible en vez de lanzar (null, basura)", () => {
    for (const origin of ["null", "", "no-es-url", "://", "https://"]) {
      expect(() => isSameOrigin(origin, "a.com")).not.toThrow()
      expect(isSameOrigin(origin, "a.com")).toBe(false)
    }
  })
})
