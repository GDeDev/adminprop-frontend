import { describe, expect, it } from "vitest"

import nextConfig from "../next.config"

async function policy(): Promise<string> {
  const rules = (await nextConfig.headers?.()) ?? []
  const general = rules[0]?.headers.find(
    (h) => h.key === "Content-Security-Policy"
  )
  return general?.value ?? ""
}

describe("CSP del sitio público", () => {
  it("el único iframe permitido es el mapa de OpenStreetMap", async () => {
    const csp = await policy()
    expect(csp).toContain("frame-src https://www.openstreetmap.org;")
    expect(csp).not.toMatch(/frame-src[^;]*\*/)
  })

  it("el resto sigue cerrado: nada de frame-ancestors abiertos ni connect-src externo", async () => {
    const csp = await policy()
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("connect-src 'self';")
    expect(csp).toContain("object-src 'none'")
  })
})

describe("HSTS del sitio público", () => {
  it("no incluye subdominios: los dominios propios no son nuestros", async () => {
    const rules = (await nextConfig.headers?.()) ?? []
    const hsts = rules[0]?.headers.find(
      (h) => h.key === "Strict-Transport-Security"
    )
    expect(hsts?.value).toBe("max-age=31536000")
  })
})
